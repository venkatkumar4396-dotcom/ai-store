import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const outDir = path.resolve(process.cwd(), 'audit/after');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const viewports = [
  { width: 375, height: 812, name: '375px' },
  { width: 768, height: 1024, name: '768px' },
  { width: 1440, height: 900, name: '1440px' }
];

const routes = [
  { name: 'landing', url: 'http://localhost:3000/' },
  { name: 'dashboard', url: 'http://localhost:3000/dashboard' },
  { name: 'stock-intelligence', url: 'http://localhost:3000/stock-intelligence' },
  { name: 'whatsapp', url: 'http://localhost:3000/whatsapp' },
  { name: 'billing', url: 'http://localhost:3000/billing' },
  { name: 'settings', url: 'http://localhost:3000/settings' }
];

async function captureAfterScreenshots() {
  const browser = await chromium.launch({ headless: true });

  for (const vp of viewports) {
    console.log(`\nCapturing at ${vp.name}...`);
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();

    // Authenticate and set light theme
    await page.goto('http://localhost:3000/login');
    try {
      await page.click('text=Autofill Demo Credentials');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard', { timeout: 8000 });
    } catch {
      await page.evaluate(() => {
        localStorage.setItem('nexora_logged_in', 'true');
        localStorage.setItem('nexora_auth_token', 'test_token');
      });
    }

    await page.evaluate(() => {
      localStorage.setItem('nexusforge_theme', 'light');
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    });

    for (const r of routes) {
      console.log(`  Capturing ${r.name} (${vp.name})...`);
      await page.goto(r.url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.evaluate(() => {
        localStorage.setItem('nexusforge_theme', 'light');
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      });
      await page.waitForTimeout(1200);

      const filePath = path.join(outDir, `${r.name}_${vp.name}.png`);
      await page.screenshot({ path: filePath, fullPage: false });

      // Special case: Autocomplete open on stock-intelligence at 1440px
      if (r.name === 'stock-intelligence' && vp.name === '1440px') {
        try {
          const input = page.locator('input[placeholder*="Search by company"]');
          await input.fill('Apple');
          await page.waitForTimeout(600);
          const autoPath = path.join(outDir, `stock-intelligence_autocomplete_${vp.name}.png`);
          await page.screenshot({ path: autoPath, fullPage: false });
          console.log(`  Captured stock-intelligence autocomplete (${vp.name})`);
        } catch (e) {
          console.error('Failed to capture autocomplete:', e);
        }
      }
    }

    await context.close();
  }

  await browser.close();
  console.log('\nAll after screenshots saved to ./audit/after/');
}

captureAfterScreenshots().catch(err => {
  console.error(err);
  process.exit(1);
});
