import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServer } from './server.mjs';
import { discoverProjects } from './gallery.mjs';
import { launchBrowser } from './browser.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const site = path.join(root, 'dist');
const { projects } = await discoverProjects(root);
const server = await startServer(site);
const browser = await launchBrowser();
const output = path.join(root, 'output', 'playwright');
await mkdir(output, { recursive: true });
try {
  for (const [name, width, height] of [['desktop', 1440, 1000], ['tablet', 768, 1024], ['mobile', 375, 812]]) {
    const context = await browser.newContext({ viewport: { width, height }, javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(server.url, { waitUntil: 'load' });
    assert.equal(await page.locator('.project-card').count(), projects.length);
    assert.equal(await page.locator('.day-section').count(), new Set(projects.map(project => project.day)).size);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${name} must not scroll horizontally`);
    const columns = await page.locator('.project-grid').first().evaluate(element => getComputedStyle(element).gridTemplateColumns.split(' ').length);
    assert.equal(columns, width >= 1100 ? 3 : width >= 640 ? 2 : 1);
    for (const image of await page.locator('.project-preview').all()) {
      await image.scrollIntoViewIfNeeded();
      await image.evaluate(element => element.decode());
      assert.ok(await image.evaluate(element => element.naturalWidth > 0));
    }
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: path.join(output, `gallery-${name}.jpg`), type: 'jpeg', quality: 85, fullPage: true });
    await page.screenshot({ path: path.join(output, `gallery-${name}-top.jpg`), type: 'jpeg', quality: 85 });
    await page.keyboard.press('Tab');
    assert.equal(await page.locator('.skip-link').evaluate(element => element === document.activeElement), true);
    const links = await page.locator('.view-link').evaluateAll(elements => elements.map(element => element.href));
    for (const href of links) assert.equal((await fetch(href, { method: 'HEAD' })).status, 200, href);
    console.log(`[verify] ${name}: ${projects.length} cards, ${columns} columns, images and links work without JavaScript.`);
    await context.close();
  }
} finally {
  await browser.close();
  await server.close();
}
