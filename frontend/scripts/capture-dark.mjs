import { chromium } from 'playwright';

async function captureDark() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Landing dark
  await page.goto('http://localhost:3000/');
  await page.evaluate(() => {
    localStorage.setItem('nexusforge_theme', 'dark');
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'audit/after/dark_landing_1440px.png' });

  // Dashboard dark
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
    await page.goto('http://localhost:3000/dashboard');
  }
  await page.evaluate(() => {
    localStorage.setItem('nexusforge_theme', 'dark');
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'audit/after/dark_dashboard_1440px.png' });

  await browser.close();
  console.log('Dark screenshots captured successfully.');
}

captureDark().catch(err => {
  console.error(err);
  process.exit(1);
});
