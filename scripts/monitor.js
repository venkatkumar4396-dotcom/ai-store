const http = require('http');
const https = require('https');
const { PrismaClient } = require('@prisma/client');

const BACKEND_URL = process.env.BACKEND_URL || 'https://ai-store-87n2.onrender.com';
const LOCAL_URL = 'http://localhost:5000';

let prisma;
try {
  prisma = new PrismaClient();
} catch (e) {
  // Prisma instance fallback
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
};

function getTime() {
  return new Date().toLocaleTimeString();
}

async function fetchStatus(url) {
  return new Promise((resolve) => {
    const start = Date.now();
    const client = url.startsWith('https') ? https : http;
    const req = client.get(`${url}/health`, { timeout: 5000 }, (res) => {
      resolve({ ok: res.statusCode === 200, ms: Date.now() - start, code: res.statusCode });
    });
    req.on('error', () => resolve({ ok: false, ms: 0 }));
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, ms: 0 }); });
  });
}

// Track seen IDs to only print NEW events as a clean single-line stream
const seenLogIds = new Set();
let isFirstRun = true;

async function printLiveStream() {
  if (!prisma) return;

  try {
    const [userCount, recentLogs, recentActivities, users] = await Promise.all([
      prisma.user.count(),
      prisma.agentActivityLog.findMany({
        take: 10,
        orderBy: { timestamp: 'desc' },
        include: { user: { select: { name: true, email: true, role: true } } },
      }),
      prisma.activityLog.findMany({
        take: 10,
        orderBy: { timestamp: 'desc' },
        include: { user: { select: { name: true, email: true } } },
      }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, role: true },
      }),
    ]);

    if (isFirstRun) {
      isFirstRun = false;
      console.log(`\n${colors.bright}${colors.cyan}══════════════════════════════════════════════════════════════════${colors.reset}`);
      console.log(`  ${colors.bright}${colors.magenta}🔮 NEXORA AI — LIVE ACTIVITY & USER EVENT MONITOR${colors.reset}`);
      console.log(`${colors.cyan}══════════════════════════════════════════════════════════════════${colors.reset}`);
      console.log(` ${colors.dim}Target Cloud:${colors.reset} ${colors.cyan}${BACKEND_URL}${colors.reset}`);
      console.log(` ${colors.dim}Active Registered Users:${colors.reset} ${colors.green}${userCount}${colors.reset}`);
      users.forEach(u => {
        const role = u.role === 'admin' ? `${colors.yellow}[ADMIN]${colors.reset}` : `${colors.dim}[USER]${colors.reset}`;
        console.log(`   👤 ${colors.cyan}${u.name}${colors.reset} <${u.email}> ${role}`);
      });
      console.log(`\n ${colors.bright}--- LIVE EVENT STREAM (Listening for new actions...) ---${colors.reset}\n`);

      // Seed seen IDs from initial batch
      recentLogs.forEach(l => seenLogIds.add(`agent_${l.id}`));
      recentActivities.forEach(a => seenLogIds.add(`act_${a.id}`));

      // Print the most recent 3 items cleanly
      const initialLogs = recentLogs.slice(0, 3).reverse();
      initialLogs.forEach(log => {
        const t = new Date(log.timestamp).toLocaleTimeString();
        const user = log.user?.name || log.user?.email || 'Guest';
        console.log(`[${t}] ${colors.magenta}[${log.agentId}]${colors.reset} ${log.action} | User: ${colors.cyan}${user}${colors.reset} (${colors.green}${log.status}${colors.reset})`);
      });
      return;
    }

    // Process new agent activity logs
    for (const log of recentLogs.reverse()) {
      const key = `agent_${log.id}`;
      if (!seenLogIds.has(key)) {
        seenLogIds.add(key);
        const t = new Date(log.timestamp).toLocaleTimeString();
        const user = log.user?.name || log.user?.email || 'Guest';
        const role = log.user?.role === 'admin' ? `${colors.yellow}[ADMIN]${colors.reset}` : '';
        console.log(`[${t}] ${colors.magenta}[${log.agentId.toUpperCase()}]${colors.reset} ${colors.bright}${log.action}${colors.reset} | User: ${colors.cyan}${user}${colors.reset} ${role} -> ${colors.green}${log.status}${colors.reset}`);
        if (log.description) {
          console.log(`        ↳ ${colors.dim}${log.description.slice(0, 80)}${colors.reset}`);
        }
      }
    }

    // Process new user activity logs
    for (const act of recentActivities.reverse()) {
      const key = `act_${act.id}`;
      if (!seenLogIds.has(key)) {
        seenLogIds.add(key);
        const t = new Date(act.timestamp).toLocaleTimeString();
        const user = act.user?.name || act.user?.email || 'System';
        console.log(`[${t}] ${colors.yellow}[USER ACTION]${colors.reset} ${act.action} | User: ${colors.cyan}${user}${colors.reset}`);
      }
    }
  } catch (err) {
    // Database busy or silent retry
  }
}

// Heartbeat summary every 30 seconds
async function printHeartbeat() {
  const [cloud, local] = await Promise.all([fetchStatus(BACKEND_URL), fetchStatus(LOCAL_URL)]);
  const cloudStr = cloud.ok ? `${colors.green}ONLINE (${cloud.ms}ms)${colors.reset}` : `${colors.red}OFFLINE${colors.reset}`;
  const localStr = local.ok ? `${colors.green}RUNNING (${local.ms}ms)${colors.reset}` : `${colors.dim}OFFLINE${colors.reset}`;
  console.log(`[${getTime()}] ${colors.blue}[SYSTEM HEARTBEAT]${colors.reset} Cloud: ${cloudStr} | Local: ${localStr}`);
}

// Start live monitoring
printLiveStream();
setInterval(printLiveStream, 2000);
setInterval(printHeartbeat, 30000);
