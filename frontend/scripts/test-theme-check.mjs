import { chromium } from 'playwright';

async function test() {
  const b = await chromium.launch({ headless: true });
  const c = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await c.newPage();
  await p.goto('http://localhost:3000/login');
  await p.click('text=Autofill Demo Credentials');
  await p.click('button[type="submit"]');
  await p.waitForURL('**/dashboard');
  const cls = await p.evaluate(() => document.documentElement.className);
  console.log('Class on documentElement on /dashboard:', cls);
  const theme = await p.evaluate(() => localStorage.getItem('nexusforge_theme'));
  console.log('Theme in localStorage:', theme);
  const upgradeColor = await p.evaluate(() => {
    const el = Array.from(document.querySelectorAll('span')).find(s => s.textContent === 'Upgrade to Pro');
    if (!el) return 'not found';
    const s = window.getComputedStyle(el);
    return { color: s.color, cls: el.className };
  });
  console.log('Upgrade to Pro computed style:', upgradeColor);
  await b.close();
}

test().catch(console.error);
