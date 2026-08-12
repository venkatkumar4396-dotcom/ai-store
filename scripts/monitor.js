const http = require('http');
const https = require('https');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000/health';

console.log('\n===================================================');
console.log('   NexusForge Terminal Backend Monitor');
console.log(`   Target URL: ${BACKEND_URL}`);
console.log('===================================================\n');

function checkHealth() {
  const startTime = Date.now();
  const client = BACKEND_URL.startsWith('https') ? https : http;

  client.get(BACKEND_URL, (res) => {
    let data = '';
    res.on('data', (chunk) => (data += chunk));
    res.on('end', () => {
      const latency = Date.now() - startTime;
      const timestamp = new Date().toLocaleTimeString();

      if (res.statusCode === 200) {
        try {
          const json = JSON.parse(data);
          console.log(`[${timestamp}] \x1b[32mSUCCESS (${res.statusCode})\x1b[0m | Latency: \x1b[36m${latency}ms\x1b[0m | Status: ${json.status || 'ok'}`);
        } catch {
          console.log(`[${timestamp}] \x1b[32mSUCCESS (${res.statusCode})\x1b[0m | Latency: \x1b[36m${latency}ms\x1b[0m`);
        }
      } else {
        console.log(`[${timestamp}] \x1b[33mWARNING (${res.statusCode})\x1b[0m | Latency: ${latency}ms`);
      }
    });
  }).on('error', (err) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] \x1b[31mOFFLINE / WAITING\x1b[0m | ${err.message}`);
    console.log(`                \x1b[90mTip: Run 'npm run dev' to start local server, or set BACKEND_URL="https://your-app.onrender.com/health"\x1b[0m`);
  });
}

// Initial check + repeat every 5 seconds
checkHealth();
setInterval(checkHealth, 5000);
