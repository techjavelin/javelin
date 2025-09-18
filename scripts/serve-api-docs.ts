#!/usr/bin/env tsx
/**
 * Simple static server for API docs with watch-friendly caching headers disabled.
 * Serves files from docs/api (expects index.html already generated).
 */
import { createServer } from 'http';
import { stat, readFile } from 'fs/promises';
import { createReadStream } from 'fs';
import { extname, join, resolve } from 'path';

const DOCS_DIR = resolve(process.cwd(), 'docs/api');
const PORT = Number(process.env.API_DOCS_PORT || 4607);

const MIME: Record<string,string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function send(res: any, status: number, headers: Record<string,string>, body?: string | Buffer) {
  res.writeHead(status, { 'Cache-Control': 'no-store', ...headers });
  if (body) res.end(body); else res.end();
}

createServer(async (req, res) => {
  try {
    let urlPath = decodeURIComponent(req.url || '/');
    if (urlPath === '/' || urlPath === '') urlPath = '/index.html';
    // prevent directory traversal
    if (urlPath.includes('..')) { send(res, 400, {}, 'Bad path'); return; }
    const fsPath = join(DOCS_DIR, urlPath);
    const st = await stat(fsPath).catch(() => undefined);
    if (!st || !st.isFile()) { send(res, 404, {}, 'Not found'); return; }
    const type = MIME[extname(fsPath)] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
    createReadStream(fsPath).pipe(res);
  } catch (err: any) {
    send(res, 500, {}, err?.message || 'Internal error');
  }
}).listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API docs server running: http://localhost:${PORT}`);
});
