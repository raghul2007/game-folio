// Tiny static file server for local development and tests (no dependencies).
// Usage: node server.mjs [port]   ->  http://localhost:3000
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('./public', import.meta.url)));
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.pdf': 'application/pdf', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.txt': 'text/plain; charset=utf-8' };

export function makeServer() {
  return createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://x'); let p = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, '');
      let file = resolve(join(root, p || 'index.html'));
      if (!file.startsWith(root)) { res.writeHead(403).end('Forbidden'); return; }
      try { if ((await stat(file)).isDirectory()) file = join(file, 'index.html'); } catch { /* handled below */ }
      const data = await readFile(file);
      res.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream', 'cache-control': 'no-cache' });
      res.end(req.method === 'HEAD' ? undefined : data);
    } catch { res.writeHead(404, { 'content-type': 'text/plain' }).end('Not found'); }
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const port = Number(process.argv[2] || process.env.PORT || 3000);
  makeServer().listen(port, () => console.log(`RAGHULVERSE running at http://localhost:${port}`));
}
