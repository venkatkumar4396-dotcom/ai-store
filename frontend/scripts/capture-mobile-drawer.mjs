import { chromium } from 'playwright';

async function captureMobileNav() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    isMobile: true,
    hasTouch: true
  });
  const page = await context.newPage();

  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.setItem('nexora_logged_in', 'true');
    localStorage.setItem('nexora_auth_token', 'test_token');
    localStorage.setItem('nexusforge_theme', 'light');
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  });

  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  // Click hamburger button
  await page.click('button[aria-label="Open navigation menu"]');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'C:/Users/venka/.gemini/antigravity-ide/brain/1634e0a6-ef55-4058-9cb2-2dd233e6dd60/mobile_nav_drawer_light.png', fullPage: false });

  await browser.close();
  console.log('Mobile nav drawer screenshot captured successfully!');
}

captureMobileNav().catch(console.error);
