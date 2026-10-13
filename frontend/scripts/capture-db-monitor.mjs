import { chromium } from 'playwright';

async function captureDbMonitor() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Login as kumar@nexora.ai
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="email"]', 'kumar@nexora.ai');
  await page.fill('input[type="password"]', 'kumar@4396');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 10000 });

  // Go to admin page
  await page.goto('http://localhost:3000/admin');
  await page.waitForTimeout(2000);

  // Switch to DB Explorer tab
  const dbTrigger = page.locator('button[value="db"]').or(page.locator('text=DB Explorer'));
  await dbTrigger.first().click();
  await page.waitForTimeout(2500);

  await page.screenshot({ path: 'audit/after/kumar_database_monitor_active.png' });
  console.log('Captured kumar_database_monitor_active.png successfully');

  await browser.close();
}

captureDbMonitor().catch(console.error);
