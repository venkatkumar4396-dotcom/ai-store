const { execSync } = require('child_process');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Load environment variables from backend/.env and root .env
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

      // Check for backend hook
      const backendMatch = content.match(/RENDER_BACKEND_DEPLOY_HOOK(?:_URL)?=["']?([^"'\r\n]+)["']?/);
      if (backendMatch && !hooks.some(h => h.url === backendMatch[1].trim())) {
        hooks.push({ name: 'Backend Service', url: backendMatch[1].trim() });
      }

      // Check for frontend hook
      const frontendMatch = content.match(/RENDER_FRONTEND_DEPLOY_HOOK(?:_URL)?=["']?([^"'\r\n]+)["']?/);
      if (frontendMatch && !hooks.some(h => h.url === frontendMatch[1].trim())) {
        hooks.push({ name: 'Frontend Service', url: frontendMatch[1].trim() });
      }

      // Check for generic hook
      const genericMatch = content.match(/RENDER_DEPLOY_HOOK(?:_URL)?=["']?([^"'\r\n]+)["']?/);
      if (genericMatch) {
        const rawUrls = genericMatch[1].trim().split(',');
        rawUrls.forEach((u, i) => {
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

const commitMsg = process.argv.slice(2).join(' ') || `update: platform enhancements [${new Date().toISOString().slice(0, 19).replace('T', ' ')}]`;

console.log('\n🚀 ═══════════════════════════════════════════════════════════════════');
console.log('   NEXORA AUTO-PUSH & DUAL DEPLOY PIPELINE (BACKEND + FRONTEND)');
console.log('═══════════════════════════════════════════════════════════════════════\n');

async function run() {
  try {
    console.log('📦 [1/3] Staging modified files (git add .)...');
    execSync('git add .', { stdio: 'inherit' });

    console.log(`\n💬 [2/3] Committing changes ("${commitMsg}")...`);
    try {
      execSync(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`, { stdio: 'inherit' });
    } catch (err) {
      console.log('ℹ️  No new file changes to commit (working tree clean).');
    }

    console.log('\n🌐 [3/3] Pushing to GitHub (git push origin main)...');
    execSync('git push origin main', { stdio: 'inherit' });
    console.log('\n✅ Git push completed successfully!');

    // Trigger deploy hooks
    const hooks = getDeployHooks();

    if (hooks.length > 0) {
      console.log(`\n⚡ Triggering instant deployment for ${hooks.length} configured service(s)...`);
      const results = await Promise.all(hooks.map(triggerHook));

      results.forEach((res) => {
        if (res.ok) {
          console.log(`   🎉 \x1b[32m${res.name}\x1b[0m: Deploy started successfully (HTTP ${res.statusCode})`);
        } else {
          console.log(`   ⚠️  \x1b[33m${res.name}\x1b[0m: Trigger response ${res.statusCode || res.error}`);
        }
      });
    } else {
      console.log('\n💡 Tip: To auto-trigger instant deploys for BOTH frontend and backend:');
      console.log('   1. In Render Dashboard -> Frontend Service -> Settings -> Copy Deploy Hook');
      console.log('   2. In Render Dashboard -> Backend Service -> Settings -> Copy Deploy Hook');
      console.log('   3. Add to backend/.env:');
      console.log('      RENDER_BACKEND_DEPLOY_HOOK="https://api.render.com/deploy/srv-backend?key=..."');
      console.log('      RENDER_FRONTEND_DEPLOY_HOOK="https://api.render.com/deploy/srv-frontend?key=..."');
    }
  } catch (error) {
    console.error('\n❌ Push failed:', error.message);
    process.exit(1);
  }
}

run();
