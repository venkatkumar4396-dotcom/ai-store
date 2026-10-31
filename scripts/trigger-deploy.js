const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

function getDeployHooks() {
  const hooks = [];
  const envFiles = [
    path.join(__dirname, '..', 'backend', '.env'),
    path.join(__dirname, '..', '.env'),
    path.join(__dirname, '..', 'frontend', '.env.local')
  ];

  envFiles.forEach((file) => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');

      const backendMatch = content.match(/RENDER_BACKEND_DEPLOY_HOOK(?:_URL)?=["']?([^"'\r\n]+)["']?/);
      if (backendMatch && !hooks.some(h => h.url === backendMatch[1].trim())) {
        hooks.push({ name: 'Backend Service', url: backendMatch[1].trim() });
      }

      const frontendMatch = content.match(/RENDER_FRONTEND_DEPLOY_HOOK(?:_URL)?=["']?([^"'\r\n]+)["']?/);
      if (frontendMatch && !hooks.some(h => h.url === frontendMatch[1].trim())) {
        hooks.push({ name: 'Frontend Service', url: frontendMatch[1].trim() });
      }

      const genericMatch = content.match(/RENDER_DEPLOY_HOOK(?:_URL)?=["']?([^"'\r\n]+)["']?/);
      if (genericMatch) {
        const rawUrls = genericMatch[1].trim().split(',');
        rawUrls.forEach((u) => {
          const cleanUrl = u.trim();
          if (cleanUrl && !hooks.some(h => h.url === cleanUrl)) {
            hooks.push({ name: `Render Service ${hooks.length + 1}`, url: cleanUrl });
          }
        });
      }
    }
  });

  return hooks;
}

function triggerHook(hook) {
  return new Promise((resolve) => {
    try {
      const urlObj = new URL(hook.url);
      const client = urlObj.protocol === 'http:' ? http : https;
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'http:' ? 80 : 443),
        path: urlObj.pathname + urlObj.search,
        method: 'POST',
        headers: {
          'Content-Length': 0,
          'User-Agent': 'Nexora-Deploy-Script/1.0'
        }
      };

      const req = client.request(options, (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          resolve({ name: hook.name, ok: res.statusCode >= 200 && res.statusCode < 300, statusCode: res.statusCode });
        });
      });

      req.on('error', (err) => {
        resolve({ name: hook.name, ok: false, error: err.message });
      });

      req.setTimeout(20000, () => {
        req.destroy();
        resolve({ name: hook.name, ok: false, error: 'Timeout (20s)' });
      });

      req.end();
    } catch (e) {
      resolve({ name: hook.name, ok: false, error: e.message });
    }
  });
}

async function run() {
  console.log('\n🚀 Triggering Render Deployments for Frontend & Backend...\n');
  const hooks = getDeployHooks();

  if (hooks.length === 0) {
    console.error('❌ No deploy hooks found in .env or backend/.env');
    process.exit(1);
  }

  const results = await Promise.all(hooks.map(triggerHook));
  results.forEach((res) => {
    if (res.ok) {
      console.log(`   🎉 \x1b[32m${res.name}\x1b[0m: Deploy started successfully (HTTP ${res.statusCode})`);
    } else {
      console.log(`   ⚠️  \x1b[33m${res.name}\x1b[0m: Trigger response ${res.statusCode || res.error}`);
    }
  });
  console.log('\n✅ All deployment triggers sent!');
}

run();
