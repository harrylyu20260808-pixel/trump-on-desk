// Loopback HTTP server that AI tool hooks POST to. Writes chosen port to
// <userData>/port.json so hooks/emit.js can reach us without a fixed port.
'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

function start({ userData, onEvent }) {
  const server = http.createServer((req, res) => {
    if (req.method !== 'POST' || req.url !== '/event') {
      res.writeHead(404); return res.end();
    }
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > 64 * 1024) req.destroy(); });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        onEvent(payload);
      } catch (_) { /* ignore bad payloads */ }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('{"ok":true}');
    });
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      fs.mkdirSync(userData, { recursive: true });
      fs.writeFileSync(path.join(userData, 'port.json'), JSON.stringify({ port, ts: Date.now() }));
      resolve({ server, port });
    });
  });
}

module.exports = { start };
