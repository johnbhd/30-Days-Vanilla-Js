import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';

const repository = 'https://github.com/johnbhd/30-Days-Vanilla-Js/tree/main/';
export const encodePath = value => value.split('/').map(encodeURIComponent).join('/');
export const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);

function fallbackTitle(value) {
  return value.replace(/\.html$/i, '').replace(/[-_]+/g, ' ')
    .replace(/\b\p{L}/gu, char => char.toUpperCase());
}

export async function discoverProjects(root) {
  const projects = [];
  const warnings = [];
  const days = (await readdir(root, { withFileTypes: true }))
    .filter(item => item.isDirectory() && /^Day\s+[1-9]\d*$/i.test(item.name));

  async function add(dayFolder, entry, projectFolder, fallback) {
    const source = await readFile(path.join(root, entry), 'utf8');
    const title = load(source)('title').first().text().replace(/\s+/g, ' ').trim() || fallbackTitle(fallback);
    projects.push({
      day: Number(dayFolder.match(/\d+$/)[0]),
      title,
      entry,
      directory: projectFolder,
      id: createHash('sha256').update(entry).digest('hex').slice(0, 20),
      href: './' + encodePath(entry),
      repo: repository + encodePath(projectFolder),
    });
  }

  for (const day of days) {
    for (const item of await readdir(path.join(root, day.name), { withFileTypes: true })) {
      const relative = day.name + '/' + item.name;
      if (item.isFile() && /\.html$/i.test(item.name)) {
        await add(day.name, relative, day.name, item.name);
      } else if (item.isDirectory()) {
        const html = (await readdir(path.join(root, relative), { withFileTypes: true }))
          .filter(file => file.isFile() && /\.html$/i.test(file.name));
        const entry = html.find(file => file.name.toLowerCase() === 'index.html') || (html.length === 1 ? html[0] : null);
        if (entry) await add(day.name, relative + '/' + entry.name, relative, item.name);
        else if (html.length > 1) warnings.push(`Skipped ${relative}: multiple HTML files; add index.html to select the entry page.`);
      }
    }
  }

  projects.sort((a, b) => b.day - a.day || a.title.localeCompare(b.title, 'en') || a.entry.localeCompare(b.entry, 'en'));
  return { projects, warnings };
}

const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10"/></svg>';
const code = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18"/></svg>';

export function renderGallery(template, projects) {
  const days = [...new Set(projects.map(project => project.day))];
  const gallery = days.map(day => {
    const items = projects.filter(project => project.day === day);
    const cards = items.map(project => {
      const title = escapeHtml(project.title);
      return `<article class="project-card${project.preview ? '' : ' has-fallback'}" data-entry="${escapeHtml(project.entry)}">
        ${project.preview ? `<img class="project-preview" src="${escapeHtml(project.preview)}" alt="" loading="lazy" decoding="async" width="1280" height="720">` : '<div class="preview-fallback" aria-hidden="true"><span>JS</span></div>'}
        <div class="card-shade"></div>
        <div class="card-content">
          <span class="project-label">DAY ${String(day).padStart(2, '0')}</span>
          <h3>${title}</h3>
          <div class="card-links">
            <a class="view-link" href="${escapeHtml(project.href)}" target="_blank" rel="noopener noreferrer" aria-label="View ${title}">View project ${arrow}</a>
            <a class="repo-link" href="${escapeHtml(project.repo)}" target="_blank" rel="noopener noreferrer" aria-label="View source for ${title}">${code}<span>Repo</span></a>
          </div>
        </div>
      </article>`;
    }).join('\n');
    return `<section class="day-section" aria-labelledby="day-${day}">
      <div class="section-heading"><h2 id="day-${day}"><span class="day-marker"></span>Day ${String(day).padStart(2, '0')}</h2><span class="section-count">${items.length} ${items.length === 1 ? 'project' : 'projects'}</span><span class="section-rule"></span></div>
      <div class="project-grid">${cards}</div>
    </section>`;
  }).join('\n');

  return template.replaceAll('{{GALLERY}}', () => gallery || '<div class="empty-state"><h2>No projects yet</h2><p>Your next project starts with a Day folder.</p></div>')
    .replaceAll('{{PROJECT_COUNT}}', String(projects.length))
    .replaceAll('{{DAY_COUNT}}', String(days.length));
}
