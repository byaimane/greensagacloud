import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

function ouagxPushSyncPlugin(): Plugin {
  const storePath = path.resolve(__dirname, 'server', 'live-app-config.json');

  const ensureDir = () => {
    fs.mkdirSync(path.dirname(storePath), { recursive: true });
  };

  return {
    name: 'ouagx-push-sync-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url) return next();

        // Force exact Android APK MIME & download filename so browsers never rename to .zip
        if (req.url.includes('/downloads/GreenSAGA-v2.6.0.apk') && req.method === 'GET') {
          const candidates = [
            path.resolve(__dirname, 'public', 'downloads', 'GreenSAGA-v2.6.0.apk'),
            path.resolve(__dirname, 'releases', 'GreenSAGA-com.ouagx.myapp-release.apk'),
          ];
          const apkPath = candidates.find((p) => fs.existsSync(p));
          if (apkPath) {
            const stat = fs.statSync(apkPath);
            res.setHeader('Content-Type', 'application/vnd.android.package-archive');
            res.setHeader('Content-Disposition', 'attachment; filename="GreenSAGA-v2.6.0.apk"');
            res.setHeader('Content-Length', String(stat.size));
            res.setHeader('Cache-Control', 'no-cache');
            fs.createReadStream(apkPath).pipe(res);
            return;
          }
        }

        if (req.url.startsWith('/api/app-config') || req.url.startsWith('/api/push-update')) {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
          if (req.method === 'OPTIONS') {
            res.statusCode = 204;
            res.end();
            return;
          }
        }

        if (req.url.startsWith('/api/app-config') && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          if (fs.existsSync(storePath)) {
            res.end(fs.readFileSync(storePath, 'utf-8'));
          } else {
            res.end(JSON.stringify({ bundle: null }));
          }
          return;
        }

        if (req.url.startsWith('/api/push-update') && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk.toString();
          });
          req.on('end', () => {
            try {
              const parsed = JSON.parse(body);
              ensureDir();
              fs.writeFileSync(storePath, JSON.stringify(parsed, null, 2), 'utf-8');
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({ ok: true, revision: parsed.revision, pushedAt: parsed.pushedAt }));
            } catch {
              res.statusCode = 400;
              res.end(JSON.stringify({ ok: false, error: 'Invalid JSON' }));
            }
          });
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), ouagxPushSyncPlugin()],
  server: {
    host: true,
    port: 5173,
  },
});
