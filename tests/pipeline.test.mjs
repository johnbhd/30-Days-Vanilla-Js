import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, access } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createServer } from 'node:http';

const serverModule = await import('../scripts/server.mjs').catch(error => {
  if (error.code !== 'ERR_MODULE_NOT_FOUND') throw error;
  return {};
});
const pipeline = await import('../scripts/pipeline.mjs').catch(error => {
  if (error.code !== 'ERR_MODULE_NOT_FOUND') throw error;
  return {};
});
const { chromium } = await import('playwright');

async function fixture(t, files) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'gallery-pipeline-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const [name, content] of Object.entries(files)) {
    const target = path.join(root, name);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, content);
  }
  return root;
}

test('serves encoded project paths and modules while blocking private build files', async t => {
  assert.equal(typeof serverModule.startServer, 'function', 'preview HTTP server must exist');
  const root = await fixture(t, {
    'index.html': '<body>Gallery</body>',
    'Day 1/my game/index.html': '<title>Game</title>',
    'Day 1/my game/app.js': 'export const value = 42;',
    '.git/config': 'private',
    'scripts/private.mjs': 'private',
    'src/templates/home.html': 'private template',
  });
  const server = await serverModule.startServer(root);
  t.after(() => server.close());
  const response = await fetch(server.url + '/Day%201/my%20game/index.html');
  assert.equal(response.status, 200);
  assert.equal(await response.text(), '<title>Game</title>');
  const js = await fetch(server.url + '/Day%201/my%20game/app.js');
  assert.match(js.headers.get('content-type'), /javascript/);
  for (const name of ['/.git/config', '/scripts/private.mjs', '/src/templates/home.html', '/Day%201/%2e%2e%2f.git/config']) {
    assert.equal((await fetch(server.url + name)).status, 404, name);
  }
});

test('successful capture produces a real JPEG while a failed page receives a fallback', async t => {
  assert.equal(typeof pipeline.capturePreviews, 'function', 'automated preview capture must exist');
  assert.equal(typeof serverModule.startServer, 'function');
  const root = await fixture(t, {
    'Day 1/hello/index.html': '<body style="background:#126652;color:white"><h1>Hello screenshot</h1></body>',
  });
  const server = await serverModule.startServer(root);
  t.after(() => server.close());
  const projects = [
    { id: 'hello', entry: 'Day 1/hello/index.html', title: 'Hello' },
    { id: 'missing', entry: 'Day 1/missing/index.html', title: 'Missing' },
  ];
  const result = await pipeline.capturePreviews({ root, baseUrl: server.url, projects });
  assert.equal(result.successes, 1);
  assert.equal(result.failures.length, 1);
  assert.ok(result.projects[0].preview.endsWith('/hello.jpg'));
  assert.equal(result.projects[1].preview, undefined);
  const jpeg = await readFile(path.join(root, 'src/assets/previews/hello.jpg'));
  assert.deepEqual([...jpeg.subarray(0, 3)], [255, 216, 255]);
  assert.ok(jpeg.length > 2000);
});

test('single-process Chromium captures every project without sharing browser contexts', async t => {
  // Reproduce the former shared-context crash even if single-process mode is enabled.
  t.mock.method(chromium, 'launch', async options => {
    const browserServer = await chromium.launchServer({
      ...options,
      args: [...(options.args ?? []), '--single-process'],
    });
    const browser = await chromium.connect(browserServer.wsEndpoint());
    // A broken shared browser can hang in newPage before capture's timeout starts.
    const watchdog = setTimeout(() => browserServer.kill().catch(() => {}), 15000);
    browser.on('disconnected', () => {
      clearTimeout(watchdog);
      browserServer.kill().catch(() => {});
    });
    t.after(() => browserServer.kill());
    return browser;
  });
  const root = await fixture(t, {
    'Day 1/first/index.html': '<h1>First preview</h1>',
    'Day 1/second/index.html': '<h1>Second preview</h1>',
    'Day 1/third/index.html': '<h1>Third preview</h1>',
  });
  const server = await serverModule.startServer(root);
  t.after(() => server.close());
  const projects = ['first', 'second', 'third'].map(id => ({
    id, entry: `Day 1/${id}/index.html`, title: id,
  }));
  const result = await pipeline.capturePreviews({ root, baseUrl: server.url, projects });
  assert.equal(result.successes, 3, JSON.stringify(result.failures));
  assert.equal(result.failures.length, 0);
  for (const project of result.projects) {
    assert.ok(project.preview);
    const jpeg = await readFile(path.join(root, 'src/assets/previews', project.id + '.jpg'));
    assert.deepEqual([...jpeg.subarray(0, 3)], [255, 216, 255]);
  }
});

test('a deployment with missing previews fails before replacing the homepage', async t => {
  const root = await fixture(t, {
    'index.html': 'Existing homepage',
    'Day 1/game/index.html': '<title>Game</title>',
    'src/templates/home.html': 'Gallery template',
  });
  const server = createServer((request, response) => {
    response.writeHead(404);
    response.end('Not found');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  await assert.rejects(pipeline.generateGallery({
    root,
    baseUrl: `http://127.0.0.1:${server.address().port}`,
    requirePreviews: true,
  }), /preview.*failed/i);
  assert.equal(await readFile(path.join(root, 'index.html'), 'utf8'), 'Existing homepage');
});

test('packaging preserves public URLs and excludes development files', async t => {
  assert.equal(typeof pipeline.packageSite, 'function', 'deployment packaging must exist');
  const root = await fixture(t, {
    'index.html': 'Gallery',
    'src/css/gallery.css': 'body{}',
    'src/templates/home.html': 'Do not publish template',
    'Day 1/game/index.html': 'Game',
    'Day 1/game/images/sprite.png': 'Sprite',
    'public/download/CalConverter.apk': 'APK',
    'Playground/example.html': 'Other project',
    'tic-tac-toe/index.html': 'Other game',
    'dump js create by chat/a.html': 'Other example',
    'scripts/build.mjs': 'Do not publish',
    'node_modules/private.js': 'Do not publish',
    '.cache/private.txt': 'Do not publish',
    'Day 1/game/node_modules/private.js': 'Do not publish',
  });
  await pipeline.packageSite(root);
  assert.equal(await readFile(path.join(root, 'dist/Day 1/game/images/sprite.png'), 'utf8'), 'Sprite');
  assert.equal(await readFile(path.join(root, 'dist/public/download/CalConverter.apk'), 'utf8'), 'APK');
  assert.equal(await readFile(path.join(root, 'dist/Playground/example.html'), 'utf8'), 'Other project');
  for (const name of ['scripts', 'node_modules', '.cache', 'src/templates', 'Day 1/game/node_modules']) {
    await assert.rejects(access(path.join(root, 'dist', name)), { code: 'ENOENT' });
  }
});
