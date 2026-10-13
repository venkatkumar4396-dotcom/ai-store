import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const routes = [
  { name: 'landing', url: 'http://localhost:3000/' },
  { name: 'dashboard', url: 'http://localhost:3000/dashboard' },
  { name: 'stock-intelligence', url: 'http://localhost:3000/stock-intelligence' },
  { name: 'whatsapp', url: 'http://localhost:3000/whatsapp' },
  { name: 'billing', url: 'http://localhost:3000/billing' },
  { name: 'settings', url: 'http://localhost:3000/settings' },
  { name: 'ai-playground', url: 'http://localhost:3000/ai-playground' },
  { name: 'document-agent', url: 'http://localhost:3000/document-agent' }
];

const outDir = path.resolve(process.cwd(), 'audit/before');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  const page = await context.newPage();

  // Log in first to get genuine JWT session
  console.log('Logging in with demo credentials...');
  await page.goto('http://localhost:3000/login');
  await page.click('text=Autofill Demo Credentials');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  console.log('Logged in successfully!');

  // Set theme to light
  await page.evaluate(() => {
    localStorage.setItem('nexusforge_theme', 'light');
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  });

  for (const r of routes) {
    console.log(`Navigating to ${r.name} (${r.url})...`);
    try {
      await page.goto(r.url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.evaluate(() => {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
        localStorage.setItem('nexusforge_theme', 'light');
      });
      await page.waitForTimeout(2500);

      // If stock intelligence, let's also trigger the search autocomplete dropdown to capture baseline
      if (r.name === 'stock-intelligence') {
        const input = await page.$('input[placeholder*="Search"]');
        if (input) {
          await input.fill('AAPL');
          await page.waitForTimeout(1000);
          await page.screenshot({ path: path.join(outDir, 'stock-intelligence_autocomplete_1440px.png') });
        }
      }

      const filePath = path.join(outDir, `${r.name}_1440px.png`);
      await page.screenshot({ path: filePath, fullPage: true });
      console.log(`Saved baseline screenshot: ${filePath} (Actual URL: ${page.url()})`);
    } catch (e) {
      console.error(`Failed ${r.name}:`, e.message);
    }
  }

  await browser.close();
  console.log('Phase 0 baseline capture completed.');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
