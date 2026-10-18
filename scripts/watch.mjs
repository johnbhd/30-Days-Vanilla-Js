export function shouldWatch(relative) {
  const parts = relative.replaceAll('\\', '/').split('/');
  if (!relative) return true;
  if (parts.some(part => part.startsWith('.') || part === 'node_modules')) return false;
  if (/^Day\s+[1-9]\d*$/i.test(parts[0])) return true;
  if (parts[0] === 'public') return true;
  if (parts[0] === 'src') {
    if (parts.length === 1) return true;
    return ['css', 'templates', 'assets'].includes(parts[1]) && !(parts[1] === 'assets' && parts[2] === 'previews');
  }
  return false;
}

export function affectedEntries(projects, changes) {
  const entries = new Set();
  for (const rawChange of changes) {
    const change = rawChange.replaceAll('\\', '/');
    if (change.startsWith('src/templates/') || change.startsWith('src/css/')) continue;
    const parts = change.split('/');
    const isInsideProject = projects.some(project => project.directory !== parts[0]
      && (change === project.directory || change.startsWith(project.directory + '/')));
    for (const project of projects) {
      const day = project.entry.split('/')[0];
      const isShared = !/^Day\s+[1-9]\d*$/i.test(parts[0]);
      const isDayAsset = parts[0] === day && !isInsideProject;
      if (isShared || isDayAsset || change === project.directory || change.startsWith(project.directory + '/') || project.directory.startsWith(change + '/')) {
        entries.add(project.entry);
      }
    }
  }
  return entries;
}
