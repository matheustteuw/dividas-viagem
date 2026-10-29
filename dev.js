// Servidor local sem conta Vercel: node dev.js -> http://localhost:3000
const http = require('http');
const fs = require('fs');
const api = require('./api/payments.js');

http.createServer((req, res) => {
  if (!req.url.startsWith('/api/payments')) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.end(fs.readFileSync(__dirname + '/index.html'));
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
