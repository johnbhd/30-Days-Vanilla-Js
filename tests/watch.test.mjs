import assert from 'node:assert/strict';
import test from 'node:test';

const watcher = await import('../scripts/watch.mjs').catch(error => {
  if (error.code !== 'ERR_MODULE_NOT_FOUND') throw error;
  return {};
});

test('project assets invalidate their own preview and shared Day assets invalidate that Day', () => {
  assert.equal(typeof watcher.affectedEntries, 'function', 'watch invalidation must exist');
  const projects = [
    { day: 1, directory: 'Day 1/game', entry: 'Day 1/game/index.html' },
    { day: 1, directory: 'Day 1/tool', entry: 'Day 1/tool/index.html' },
    { day: 2, directory: 'Day 2', entry: 'Day 2/geo.html' },
  ];
  assert.deepEqual([...watcher.affectedEntries(projects, ['Day 1/game/main.js'])], ['Day 1/game/index.html']);
  assert.deepEqual([...watcher.affectedEntries(projects, ['Day 1/shared.png'])], ['Day 1/game/index.html', 'Day 1/tool/index.html']);
  assert.deepEqual([...watcher.affectedEntries(projects, ['Day 1/assets/common.css'])], ['Day 1/game/index.html', 'Day 1/tool/index.html']);
  assert.deepEqual([...watcher.affectedEntries(projects, ['src/templates/home.html'])], []);
  assert.deepEqual([...watcher.affectedEntries(projects, ['Day 2/geo.html'])], ['Day 2/geo.html']);
});

test('watcher ignores generated outputs but notices future Days and project assets', () => {
  assert.equal(typeof watcher.shouldWatch, 'function');
  for (const name of ['Day 30/new-game', 'Day 30/new-game/level.js', 'src/templates/home.html', 'src/css/gallery.css']) {
    assert.ok(watcher.shouldWatch(name), name);
  }
  for (const name of ['node_modules/a', '.cache/browser', 'dist/Day 1/a.html', 'index.html', 'index.html.tmp', 'src/assets/previews/a.jpg', 'Day 1/game/node_modules/a']) {
    assert.equal(watcher.shouldWatch(name), false, name);
  }
});
