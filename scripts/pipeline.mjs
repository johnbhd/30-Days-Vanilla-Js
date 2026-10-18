import { mkdir, readFile, writeFile, readdir, rm, cp, access, rename } from 'node:fs/promises';
import path from 'node:path';
import { launchBrowser } from './browser.mjs';
import { discoverProjects, encodePath, renderGallery } from './gallery.mjs';
import { isPublicPath } from './server.mjs';

export async function capturePreviews({ root, baseUrl, projects, previousProjects = [], changedEntries = null }) {
  const directory = path.join(root, 'src', 'assets', 'previews');
  await mkdir(directory, { recursive: true });
  const browser = await launchBrowser();
  const old = new Map(previousProjects.map(project => [project.entry, project]));
  const result = { projects: [], successes: 0, reused: 0, failures: [] };
  let cursor = 0;
  async function capture(project) {
    const previous = old.get(project.entry);
    if (changedEntries && !changedEntries.has(project.entry) && previous?.preview) {
      try {
        await access(path.join(root, 'src/assets/previews', project.id + '.jpg'));
        result.reused++;
        return { ...project, preview: previous.preview };
      } catch { /* A removed preview is captured again. */ }
    }
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    let timer;
    try {
      const page = await context.newPage();
      page.on('dialog', dialog => dialog.dismiss());
      const target = path.join(directory, project.id + '.jpg');
      const temporary = target + '.tmp';
      const work = async () => {
        const response = await page.goto(baseUrl + '/' + encodePath(project.entry), { waitUntil: 'domcontentloaded', timeout: 15000 });
        if (!response?.ok()) throw new Error(`HTTP ${response?.status() ?? 'navigation failed'}`);
        await page.evaluate(async () => {
          await Promise.race([
            Promise.all([
              document.fonts.ready,
              ...[...document.images].map(image => image.complete ? Promise.resolve() : new Promise(resolve => {
                image.addEventListener('load', resolve, { once: true });
                image.addEventListener('error', resolve, { once: true });
              })),
            ]),
            new Promise(resolve => setTimeout(resolve, 5000)),
          ]);
        });
        await page.waitForTimeout(1500);
        await page.screenshot({ path: temporary, type: 'jpeg', quality: 75, fullPage: false, timeout: 15000 });
        await rename(temporary, target);
      };
      await Promise.race([work(), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Capture exceeded 25 seconds')), 25000); })]);
      result.successes++;
      return { ...project, preview: './src/assets/previews/' + project.id + '.jpg' };
    } catch (error) {
      result.failures.push({ entry: project.entry, error: error.message });
      return { ...project };
    } finally {
      clearTimeout(timer);
      await context.close();
      await rm(path.join(directory, project.id + '.jpg.tmp'), { force: true });
    }
  }
  const captured = new Array(projects.length);
  try {
    await Promise.all(Array.from({ length: Math.min(2, projects.length) }, async () => {
      while (cursor < projects.length) {
        const index = cursor++;
        captured[index] = await capture(projects[index]);
      }
    }));
    result.projects = captured;
    const keep = new Set(captured.filter(project => project.preview).map(project => project.id + '.jpg'));
    for (const item of await readdir(directory, { withFileTypes: true })) {
      if (item.isFile() && item.name.endsWith('.jpg') && !keep.has(item.name)) await rm(path.join(directory, item.name));
    }
    return result;
  } finally {
    await browser.close();
  }
}

export async function generateGallery({ root, baseUrl, previousProjects, changedEntries }) {
  const { projects, warnings } = await discoverProjects(root);
  const previews = await capturePreviews({ root, baseUrl, projects, previousProjects, changedEntries });
  const template = await readFile(path.join(root, 'src/templates/home.html'), 'utf8');
  const html = renderGallery(template, previews.projects);
  const target = path.join(root, 'index.html');
  await writeFile(target + '.tmp', html);
  await rename(target + '.tmp', target);
  for (const warning of warnings) console.warn('[gallery] ' + warning);
  for (const failure of previews.failures) console.warn(`[preview] ${failure.entry}: ${failure.error}`);
  console.log(`[gallery] ${projects.length} projects / ${new Set(projects.map(project => project.day)).size} days; ${previews.successes} captured, ${previews.reused} reused, ${previews.failures.length} fallbacks, ${warnings.length} skipped.`);
  return { ...previews, warnings };
}

export async function packageSite(root) {
  const absoluteRoot = path.resolve(root);
  const output = path.join(absoluteRoot, 'dist');
  if (path.dirname(output) !== absoluteRoot) throw new Error('Output must be inside the project');
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  for (const item of await readdir(absoluteRoot, { withFileTypes: true })) {
    if (item.isSymbolicLink()) continue;
    const topLevel = item.name;
    if (topLevel !== 'src' && !isPublicPath(topLevel)) continue;
    await cp(path.join(absoluteRoot, topLevel), path.join(output, topLevel), {
      recursive: true,
      filter(source) {
        const relative = path.relative(absoluteRoot, source).split(path.sep).join('/');
        if (relative.split('/').some(part => part.startsWith('.') || part === 'node_modules')) return false;
        if (relative === 'src') return true;
        return isPublicPath(relative);
      },
    });
  }
  console.log('[gallery] Static site assembled in dist/.');
}
