// Servidor local sem conta Vercel: node dev.js -> http://localhost:3000
const http = require('http');
const fs = require('fs');
const path = require('path');
const MIME = { '.html': 'text/html; charset=utf-8', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
const api = require('./api/payments.js');

http.createServer((req, res) => {
  if (!req.url.startsWith('/api/payments')) {
    const name = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html';
    const file = path.join(__dirname, name);
    // só serve arquivos de dentro da pasta (bloqueia ../) e fora de api/
    if (!file.startsWith(__dirname + path.sep) || name.startsWith('api') || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.statusCode = 404;
      return res.end('not found');
    }
    res.setHeader('Content-Type', MIME[path.extname(file)] || 'application/octet-stream');
    return res.end(fs.readFileSync(file));
  }
  let raw = '';
  req.on('data', (c) => (raw += c));
  req.on('end', () => {
    req.body = raw ? JSON.parse(raw) : {};
    res.status = (c) => ((res.statusCode = c), res);
    res.json = (o) => (res.setHeader('Content-Type', 'application/json'), res.end(JSON.stringify(o)));
    api(req, res);
  });
}).listen(3000, () => console.log('http://localhost:3000'));
