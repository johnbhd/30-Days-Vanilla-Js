import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const gallery = await import('../scripts/gallery.mjs').catch(error => {
  if (error.code !== 'ERR_MODULE_NOT_FOUND') throw error;
  return {};
});

async function fixture(t, files) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'js-gallery-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const [name, content] of Object.entries(files)) {
    const target = path.join(root, name);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, content);
  }
  return root;
}

test('discovers entry pages once, includes loose HTML, and sorts Days numerically', async t => {
  assert.equal(typeof gallery.discoverProjects, 'function', 'project discovery must exist');
  const root = await fixture(t, {
    'Day 2/calculator simple/cal.html': '<title>Calculator &amp; Numbers</title>',
    'Day 9/z-game/index.html': '<title>Zulu</title>',
    'Day 9/z-game/pages/level.html': '<title>Internal level</title>',
    'Day 9/alpha/index.html': '<title> Alpha\n Game </title>',
    'Day 9/alpha/help.html': '<title>Help</title>',
    'Day 10/geo.html': '<title>Geo</title>',
    'Day 30/empty-title/index.html': '<title> </title>',
    'Day 30/ambiguous/a.html': '<title>A</title>',
    'Day 30/ambiguous/b.html': '<title>B</title>',
    'Day 30/no-html/readme.txt': 'Not an entry',
    'Playground/index.html': '<title>Excluded</title>',
    'Day abc/index.html': '<title>Excluded</title>',
  });
  const { projects, warnings } = await gallery.discoverProjects(root);
  assert.deepEqual(projects.map(p => [p.day, p.title, p.entry]), [
    [30, 'Empty Title', 'Day 30/empty-title/index.html'],
    [10, 'Geo', 'Day 10/geo.html'],
    [9, 'Alpha Game', 'Day 9/alpha/index.html'],
    [9, 'Zulu', 'Day 9/z-game/index.html'],
    [2, 'Calculator & Numbers', 'Day 2/calculator simple/cal.html'],
  ]);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /Day 30\/ambiguous/);
  assert.equal(projects.at(-1).href, './Day%202/calculator%20simple/cal.html');
  assert.equal(projects.at(-1).repo, 'https://github.com/johnbhd/30-Days-Vanilla-Js/tree/main/Day%202/calculator%20simple');
});

test('renders escaped titles and complete accessible links without a JSON fetch', () => {
  assert.equal(typeof gallery.renderGallery, 'function', 'gallery rendering must exist');
  const template = '<title>Gallery</title><main>{{GALLERY}}</main><p>{{PROJECT_COUNT}} projects / {{DAY_COUNT}} days</p>';
  const html = gallery.renderGallery(template, [{
    day: 1, title: '<script>alert("x")</script> & friends', entry: 'Day 1/a/index.html',
    href: './Day%201/a/index.html', repo: 'https://github.com/example/a',
    preview: './src/assets/previews/a.jpg',
  }]);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>|\{\{|project\.json/);
  assert.match(html, /1 projects \/ 1 days/);
  assert.match(html, /href="\.\/Day%201\/a\/index.html"/);
  assert.match(html, /loading="lazy"/);
  assert.match(html, /rel="noopener noreferrer"/);
});

test('renders an empty gallery with a readable message', () => {
  assert.equal(typeof gallery.renderGallery, 'function');
  const html = gallery.renderGallery('{{GALLERY}} {{PROJECT_COUNT}} {{DAY_COUNT}}', []);
  assert.match(html, /No projects yet/);
  assert.doesNotMatch(html, /<article/);
});

