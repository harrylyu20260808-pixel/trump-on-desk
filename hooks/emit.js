// Hook callback staged into <userData>/hooks/emit.js. Invoked by Claude Code /
// Cursor with the payload on stdin. Reads the local port from sibling port.json
// and forwards the event to our Electron event server.
'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const agent = process.argv[2] || 'unknown';

let body = '';
process.stdin.on('data', (c) => { body += c; });
process.stdin.on('end', () => {
  try {
    const portFile = path.join(__dirname, '..', 'port.json');
    const { port } = JSON.parse(fs.readFileSync(portFile, 'utf8'));
    let payload = {};
    try { payload = JSON.parse(body || '{}'); } catch (_) { payload = { raw: body }; }
    payload.agent = agent;
    const req = http.request({ host: '127.0.0.1', port, path: '/event', method: 'POST', timeout: 2000 }, (res) => res.resume());
    req.on('error', () => process.exit(0));
    req.on('timeout', () => req.destroy());
    req.end(JSON.stringify(payload));
  } catch (_) {
    process.exit(0);
  }
});
