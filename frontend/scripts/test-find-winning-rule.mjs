import { chromium } from 'playwright';

async function test() {
  const b = await chromium.launch({ headless: true });
  const c = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await c.newPage();
  await p.goto('http://localhost:3000/login');
  await p.click('text=Autofill Demo Credentials');
  await p.click('button[type="submit"]');
  await p.waitForURL('**/dashboard');
  await p.waitForSelector('aside', { timeout: 15000 });

  const asideBg = await p.evaluate(() => {
    const el = document.querySelector('aside');
    return el ? window.getComputedStyle(el).backgroundColor : 'none';
  });

  console.log('aside computed backgroundColor:', asideBg);
  await b.close();
}

test().catch(console.error);
