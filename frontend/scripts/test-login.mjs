import { chromium } from 'playwright';

async function test() {
  const b = await chromium.launch({ headless: true });
  const c = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await c.newPage();
  await p.goto('http://localhost:3000/login');
  await p.click('text=Autofill Demo Credentials');
  await p.click('button[type="submit"]');
  await p.waitForTimeout(4000);
  console.log('After submit URL:', p.url());
  const ls = await p.evaluate(() => ({
    loggedIn: localStorage.getItem('nexora_logged_in'),
    token: localStorage.getItem('nexora_auth_token') ? 'present' : 'none',
    user: localStorage.getItem('nexora_user')
  }));
  console.log('LocalStorage state:', ls);
  await b.close();
}

test().catch(console.error);
