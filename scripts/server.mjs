import http from 'node:http';
import { createReadStream } from 'node:fs';
import { readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';

const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg',
  '.mp4': 'video/mp4', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
  '.apk': 'application/vnd.android.package-archive',
};

export function isPublicPath(relative) {
  const parts = relative.split('/');
  if (parts.some(part => part.startsWith('.') || part === 'node_modules')) return false;
  if (relative === 'index.html') return true;
  if (parts[0] === 'src') return ['css', 'assets'].includes(parts[1]);
  return /^Day\s+[1-9]\d*$/i.test(parts[0]) || ['public', 'Playground', 'tic-tac-toe', 'dump js create by chat'].includes(parts[0]);
}

export async function startServer(root, { port = 0, liveReload = false } = {}) {
  const absoluteRoot = await realpath(root);
  const listeners = new Set();
  const server = http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url, 'http://localhost');
      if (url.pathname === '/__gallery/events' && liveReload) {
        response.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
        response.write(': connected\n\n');
        listeners.add(response);
        request.on('close', () => listeners.delete(response));
        return;
      }
      if (!['GET', 'HEAD'].includes(request.method)) {
        response.writeHead(405).end();
        return;
      }
      const requested = decodeURIComponent(url.pathname).replaceAll('\\', '/');
      const relative = requested === '/' ? 'index.html' : requested.replace(/^\/+/, '');
      if (!isPublicPath(relative)) throw new Error('Not public');
      let target = path.resolve(absoluteRoot, relative);
      if (!target.startsWith(absoluteRoot + path.sep)) throw new Error('Outside root');
      let info = await stat(target);
      if (info.isDirectory()) {
        if (!url.pathname.endsWith('/')) {
          response.writeHead(308, { Location: url.pathname + '/' + url.search }).end();
          return;
        }
        target = path.join(target, 'index.html');
        info = await stat(target);
      }
      const resolved = await realpath(target);
      if (!resolved.startsWith(absoluteRoot + path.sep) || !info.isFile()) throw new Error('Outside root');
      const headers = { 'Content-Type': types[path.extname(target).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' };
      if (liveReload && relative === 'index.html') {
        const html = (await readFile(target, 'utf8')).replace('</body>', '<script>new EventSource("/__gallery/events").onmessage = () => location.reload();</script></body>');
        response.writeHead(200, headers).end(request.method === 'HEAD' ? undefined : html);
        return;
      }
      response.writeHead(200, { ...headers, 'Content-Length': info.size });
      if (request.method === 'HEAD') response.end();
      else createReadStream(target).on('error', () => response.destroy()).pipe(response);
    } catch {
      if (!response.headersSent) response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
      else response.destroy();
    }
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolve);
  });
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    reload() { for (const listener of listeners) listener.write('data: reload\n\n'); },
    close() {
      for (const listener of listeners) listener.end();
      return new Promise((resolve, reject) => {
        server.close(error => error ? reject(error) : resolve());
        server.closeAllConnections();
      });
    },
  };
}
