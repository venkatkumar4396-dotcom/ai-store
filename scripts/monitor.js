const http = require('http');
const https = require('https');
const { PrismaClient } = require('@prisma/client');

const BACKEND_URL = process.env.BACKEND_URL || 'https://ai-store-87n2.onrender.com';
const LOCAL_URL = 'http://localhost:5000';

let prisma;
try {
  prisma = new PrismaClient();
} catch (e) {
  // Prisma will connect if DATABASE_URL is in env
}

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
  bgBlue: '\x1b[44m',
  bgDark: '\x1b[40m',
};

async function fetchTelemetry(baseUrl) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const url = `${baseUrl}/health`;
    const client = url.startsWith('https') ? https : http;

    const req = client.get(url, { timeout: 8000 }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        const latency = Date.now() - startTime;
        try {
          const json = JSON.parse(data);
          resolve({ ok: res.statusCode === 200, latency, data: json, statusCode: res.statusCode });
        } catch {
          resolve({ ok: res.statusCode === 200, latency, data: {}, statusCode: res.statusCode });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ ok: false, error: err.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, error: 'Request Timeout' });
    });
  });
}

async function getLiveDbEvents() {
  if (!prisma) return null;
  try {
    const [userCount, agentLogs, activityLogs, recentUsers] = await Promise.all([
      prisma.user.count(),
      prisma.agentActivityLog.findMany({
        take: 8,
        orderBy: { timestamp: 'desc' },
        include: { user: { select: { name: true, email: true, role: true } } },
      }),
      prisma.activityLog.findMany({
        take: 5,
        orderBy: { timestamp: 'desc' },
        include: { user: { select: { name: true, email: true } } },
      }),
      prisma.user.findMany({
        take: 4,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      }),
    ]);

    return { userCount, agentLogs, activityLogs, recentUsers };
  } catch (err) {
    return null;
  }
}

function clearScreen() {
  process.stdout.write('\x1b[2J\x1b[0;0H');
}

async function renderDashboard() {
  const timestamp = new Date().toLocaleTimeString();
  const dateStr = new Date().toLocaleDateString();

  const [prodHealth, localHealth, dbData] = await Promise.all([
    fetchTelemetry(BACKEND_URL),
    fetchTelemetry(LOCAL_URL),
    getLiveDbEvents(),
  ]);

  clearScreen();

  console.log(`${colors.bright}${colors.cyan}══════════════════════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`  ${colors.bright}${colors.magenta}🔮 NEXORA AI OS — REAL-TIME TERMINAL CONTROL & USER MONITOR${colors.reset}       ${colors.dim}[${dateStr} ${timestamp}]${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}══════════════════════════════════════════════════════════════════════════════════════${colors.reset}`);

  // System Health Status Bar
  console.log(`\n ${colors.bright}SYSTEM CLUSTER HEALTH:${colors.reset}`);
  const prodStatus = prodHealth.ok
    ? `${colors.green}● ONLINE (${prodHealth.latency}ms)${colors.reset}`
    : `${colors.red}● OFFLINE / SLEEPING (${prodHealth.error || prodHealth.statusCode})${colors.reset}`;
  console.log(`   🌐 Production Cloud (${BACKEND_URL}): ${prodStatus}`);

  const localStatus = localHealth.ok
    ? `${colors.green}● RUNNING (${localHealth.latency}ms)${colors.reset}`
    : `${colors.yellow}○ NOT RUNNING (Run 'npm run dev' to start local)${colors.reset}`;
  console.log(`   💻 Local Dev Host  (${LOCAL_URL}): ${localStatus}`);

  if (dbData) {
    console.log(`\n ${colors.bright}PLATFORM TOTALS:${colors.reset}`);
    console.log(`   👥 Total Registered Users: ${colors.bright}${colors.green}${dbData.userCount}${colors.reset}`);

    // Recent registered users
    console.log(`\n ${colors.bright}LATEST SIGNUPS:${colors.reset}`);
    dbData.recentUsers.forEach((u) => {
      const time = new Date(u.createdAt).toLocaleTimeString();
      const roleBadge = u.role === 'admin' ? `${colors.yellow}[ADMIN]${colors.reset}` : `${colors.dim}[USER]${colors.reset}`;
      console.log(`   • ${colors.cyan}${u.name}${colors.reset} <${u.email}> ${roleBadge} ${colors.dim}at ${time}${colors.reset}`);
    });

    // Real-time live AI Agent activity stream
    console.log(`\n ${colors.bright}LIVE USER & AGENT ACTIVITY STREAM:${colors.reset}`);
    if (dbData.agentLogs.length === 0 && dbData.activityLogs.length === 0) {
      console.log(`   ${colors.dim}No actions recorded yet. Waiting for incoming events...${colors.reset}`);
    } else {
      dbData.agentLogs.forEach((log) => {
        const time = new Date(log.timestamp).toLocaleTimeString();
        const agentColor = colors.magenta;
        const statusColor = log.status === 'success' ? colors.green : colors.yellow;
        const userName = log.user ? log.user.name : 'Anonymous';
        console.log(
          `   ${colors.dim}[${time}]${colors.reset} ${agentColor}[${log.agentId.toUpperCase()}]${colors.reset} ${colors.bright}${log.action}${colors.reset} by ${colors.cyan}${userName}${colors.reset} → ${statusColor}${log.status}${colors.reset}`
        );
        if (log.description) {
          console.log(`     ${colors.dim}↳ ${log.description.slice(0, 90)}${log.description.length > 90 ? '...' : ''}${colors.reset}`);
        }
      });
    }
  } else {
    console.log(`\n ${colors.dim}Note: Direct DB connection optional. Web Admin Panel is live at: ${colors.cyan}${BACKEND_URL}/api/admin${colors.reset}`);
  }

  console.log(`\n${colors.dim}──────────────────────────────────────────────────────────────────────────────────────${colors.reset}`);
  console.log(` ${colors.bright}Mobile Admin Dashboard:${colors.reset} Open ${colors.cyan}https://ai-store-87n2.onrender.com/admin${colors.reset} on phone browser.`);
  console.log(` ${colors.dim}Refreshing every 3 seconds... Press Ctrl+C to exit.${colors.reset}\n`);
}

// Run initial render then loop
renderDashboard();
setInterval(renderDashboard, 3000);
