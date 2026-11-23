import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORE_PATH = path.join(__dirname, 'live-app-config.json');
const PORT = Number(process.env.PORT || 5174);

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url?.startsWith('/api/app-config') && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    if (fs.existsSync(STORE_PATH)) {
      res.end(fs.readFileSync(STORE_PATH, 'utf-8'));
    } else {
      res.end(JSON.stringify({ bundle: null }));
    }
    return;
  }

  if (req.url?.startsWith('/api/push-update') && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => (body += c.toString()));
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body);
        fs.writeFileSync(STORE_PATH, JSON.stringify(parsed, null, 2), 'utf-8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, revision: parsed.revision }));
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`OUAGX Push Sync Server listening on http://0.0.0.0:${PORT}`);
});
