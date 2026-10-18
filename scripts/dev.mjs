import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { mkdir } from 'node:fs/promises';
import { watch } from 'chokidar';
import { startServer } from './server.mjs';
import { discoverProjects } from './gallery.mjs';
import { generateGallery } from './pipeline.mjs';
import { affectedEntries, shouldWatch } from './watch.mjs';

export async function startDevelopment(root, { port = 3000 } = {}) {
  // Create generated directories before watching, so their creation isn't a source change.
  await mkdir(path.join(root, 'src/assets/previews'), { recursive: true });
  const server = await startServer(root, { port, liveReload: true });
  let previousProjects = [];
  let timer;
  let running;
  let stopped = false;
  const pending = new Set();
  const watcher = watch(root, {
    ignoreInitial: true,
    ignored: filename => !shouldWatch(path.relative(root, filename).split(path.sep).join('/')),
    awaitWriteFinish: { stabilityThreshold: 150, pollInterval: 50 },
  });

  async function rebuild(initial = false) {
    if (running) return running;
    running = (async () => {
      do {
        const changes = [...pending];
        pending.clear();
        const { projects } = await discoverProjects(root);
        const result = await generateGallery({ root, baseUrl: server.url, previousProjects,
          changedEntries: initial ? null : affectedEntries(projects, changes) });
        previousProjects = result.projects;
        initial = false;
        server.reload();
      } while (pending.size && !stopped);
    })();
    try { await running; }
    finally { running = undefined; }
  }

  watcher.on('all', (_, filename) => {
    if (stopped) return;
    pending.add(path.relative(root, filename).split(path.sep).join('/'));
    clearTimeout(timer);
    timer = setTimeout(() => rebuild().catch(error => console.error('[gallery] Rebuild failed: ' + error.message)), 500);
  });
  const ready = new Promise((resolve, reject) => { watcher.once('ready', resolve); watcher.once('error', reject); });
  try {
    await ready;
    await rebuild(true);
  } catch (error) {
    await watcher.close();
    await server.close();
    throw error;
  }
  console.log(`[gallery] Open ${server.url} — watching Day folders for changes.`);
  return {
    url: server.url,
    async close() {
      stopped = true;
      clearTimeout(timer);
      await watcher.close();
      await running;
      await server.close();
    },
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const dev = await startDevelopment(root, { port: Number(process.env.PORT || 3000) });
  const stop = () => dev.close().then(() => process.exit(0));
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
}
