import { execFileSync } from 'node:child_process';
import { once } from 'node:events';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, join, sep, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const types = {
  '.avif': 'image/avif',
  '.css': 'text/css',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.mjs': 'text/javascript',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2'
};
const project = fileURLToPath(new URL('../../', import.meta.url));
const prefix = '/AuditorES/';

export async function preview() {
  const temp = await mkdtemp(join(tmpdir(), 'auditores-browser-'));
  const root = join(temp, 'site');
  const server = createServer(async (req, res) => {
    try {
      const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      if (!path.startsWith(prefix)) return res.writeHead(404).end();
      const relative = path.slice(prefix.length) + (path.endsWith('/') ? 'index.html' : '');
      const file = resolve(root, relative);
      if (!file.startsWith(root + sep)) return res.writeHead(404).end();
      const content = await readFile(file);
      res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' }).end(content);
    } catch {
      res.writeHead(404).end();
    }
  });

  try {
    execFileSync('bash', ['scripts/build-pages.sh', root], { cwd: project });
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
  } catch (error) {
    server.close();
    await rm(temp, { recursive: true, force: true });
    throw error;
  }

  return {
    url: `http://127.0.0.1:${server.address().port}${prefix}`,
    async close() {
      const closed = once(server, 'close');
      server.close();
      await closed;
      await rm(temp, { recursive: true, force: true });
    }
  };
}
