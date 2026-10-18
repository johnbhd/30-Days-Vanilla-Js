import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import test from 'node:test';
import { startDevelopment } from '../scripts/dev.mjs';

test('live development updates titles, screenshots, future Days, and removed projects', { timeout: 60000 }, async t => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'gallery-watch-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, 'src/templates'), { recursive: true });
  await mkdir(path.join(root, 'Day 1/game'), { recursive: true });
  await writeFile(path.join(root, 'src/templates/home.html'), '<body>{{GALLERY}} {{PROJECT_COUNT}} {{DAY_COUNT}}</body>');
  const entry = path.join(root, 'Day 1/game/index.html');
  await writeFile(entry, '<title>Before</title><body style="background:green">Before</body>');
  const dev = await startDevelopment(root, { port: 0 });
  t.after(() => dev.close());
  assert.match(await readFile(path.join(root, 'index.html'), 'utf8'), /Before/);
  const previews = path.join(root, 'src/assets/previews');
  const { readdir } = await import('node:fs/promises');
  assert.equal((await readdir(previews)).length, 1, 'initial preview must be captured');
  const initial = await readFile(path.join(previews, (await readdir(previews))[0]));

  async function waitFor(check) {
    const deadline = Date.now() + 15000;
    while (Date.now() < deadline) {
      if (await check()) return;
      await delay(150);
    }
    assert.fail('Development rebuild did not finish within 15 seconds');
  }

  await writeFile(entry, '<title>After</title><body style="background:blue">After</body>');
  await waitFor(async () => (await readFile(path.join(root, 'index.html'), 'utf8')).includes('After'));
  const updated = await readFile(path.join(previews, (await readdir(previews))[0]));
  assert.notDeepEqual(updated, initial, 'visual changes must update the screenshot');

  await mkdir(path.join(root, 'Day 30/new-game'), { recursive: true });
  await writeFile(path.join(root, 'Day 30/new-game/index.html'), '<title>Future project</title>');
  await waitFor(async () => (await readFile(path.join(root, 'index.html'), 'utf8')).includes('Future project'));
  await rm(path.join(root, 'Day 30'), { recursive: true });
  await waitFor(async () => !(await readFile(path.join(root, 'index.html'), 'utf8')).includes('Future project'));
  assert.equal((await readdir(previews)).filter(name => name.endsWith('.jpg')).length, 1);
  assert.equal((await fetch(dev.url)).status, 200);
});
