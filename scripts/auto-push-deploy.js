const { execSync } = require('child_process');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Load environment variables if available
const envPath = path.join(__dirname, '..', 'backend', '.env');
let deployHook = process.env.RENDER_DEPLOY_HOOK_URL || process.env.RENDER_DEPLOY_HOOK;

if (!deployHook && fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/RENDER_DEPLOY_HOOK(?:_URL)?=["']?([^"'\r\n]+)["']?/);
  if (match) {
    deployHook = match[1].trim();
  }
}

const commitMsg = process.argv.slice(2).join(' ') || `update: platform enhancements [${new Date().toISOString().slice(0, 19).replace('T', ' ')}]`;

console.log('\n🚀 ═══════════════════════════════════════════════════════════════════');
console.log('   NEXORA AUTO-PUSH & DEPLOY PIPELINE');
console.log('═══════════════════════════════════════════════════════════════════════\n');

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

  // Trigger Render deploy hook if available
  if (deployHook) {
    console.log(`\n⚡ Triggering Render instant deploy webhook...`);
    const client = deployHook.startsWith('https') ? https : http;
    const req = client.get(deployHook, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        console.log(`🎉 Render deploy triggered! Status: ${res.statusCode}`);
      });
    });
    req.on('error', (e) => {
      console.log(`⚠️ Deploy hook ping: ${e.message}`);
    });
  } else {
    console.log('\n💡 Tip: To trigger instant deploys via webhook directly:');
    console.log('   1. In Render Dashboard -> Your Service -> Settings -> Deploy Hook');
    console.log('   2. Copy the Deploy Hook URL');
    console.log('   3. Add to backend/.env: RENDER_DEPLOY_HOOK_URL="https://api.render.com/deploy/srv-xxx?key=yyy"');
  }
} catch (error) {
  console.error('\n❌ Push failed:', error.message);
  process.exit(1);
}
