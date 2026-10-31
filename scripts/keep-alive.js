const https = require('https');
const http = require('http');

const TARGETS = [
  { name: 'Backend API', url: 'https://ai-store-87n2.onrender.com/health' },
  { name: 'Frontend', url: 'https://ai-store-1-fev4.onrender.com' },
];

const INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

function ping(target) {
  return new Promise((resolve) => {
    const client = target.url.startsWith('https') ? https : http;
    const start = Date.now();

    const req = client.get(target.url, (res) => {
      let data = '';
      res.on('data', (d) => (data += d));
      res.on('end', () => {
        const ms = Date.now() - start;
        const ts = new Date().toISOString().slice(0, 19).replace('T', ' ');
        if (res.statusCode >= 200 && res.statusCode < 400) {
          console.log(`[${ts}] ✅ ${target.name}: HTTP ${res.statusCode} (${ms}ms)`);
        } else {
          console.log(`[${ts}] ⚠️  ${target.name}: HTTP ${res.statusCode} (${ms}ms)`);
        }
        resolve();
      });
    });

    req.on('error', (err) => {
      const ts = new Date().toISOString().slice(0, 19).replace('T', ' ');
      console.log(`[${ts}] ❌ ${target.name}: ${err.message}`);
      resolve();
    });

    req.setTimeout(30000, () => {
      req.destroy();
      const ts = new Date().toISOString().slice(0, 19).replace('T', ' ');
      console.log(`[${ts}] ⏱️  ${target.name}: Timeout (30s) — likely cold-starting`);
      resolve();
    });
  });
}

async function run() {
  console.log('🏓 Nexora Keep-Alive Monitor');
  console.log(`   Pinging ${TARGETS.length} service(s) every ${INTERVAL_MS / 60000} minutes\n`);

  // Initial ping
  for (const t of TARGETS) await ping(t);

  // Recurring pings
  setInterval(async () => {
    for (const t of TARGETS) await ping(t);
  }, INTERVAL_MS);
}

run();

