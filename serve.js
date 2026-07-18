/*
 * Minimal zero-dependency static file server for local preview.
 * Supports HTTP range requests (nice-to-have for video) and correct MIME
 * types for the asset types this project uses.
 *
 * Usage: node serve.js [port]   (defaults to 5173)
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.argv[2]) || 5173;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mp4': 'video/mp4',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURIComponent(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.normalize(path.join(ROOT, reqPath));

  // Prevent escaping the project root.
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Not found: ' + reqPath);
    }

    const ext = path.extname(filePath).toLowerCase();
    const type = MIME[ext] || 'application/octet-stream';
    const range = req.headers.range;

    if (range) {
      const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
      const start = parseInt(startStr, 10);
      const end = endStr ? parseInt(endStr, 10) : stat.size - 1;
      const chunkSize = end - start + 1;
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': type,
        'Cache-Control': 'no-cache',
      });
      fs.createReadStream(filePath, { start, end }).pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': stat.size,
        'Content-Type': type,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-cache',
      });
      fs.createReadStream(filePath).pipe(res);
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n  Onyx scroll site running at http://localhost:${PORT}\n`);
});
