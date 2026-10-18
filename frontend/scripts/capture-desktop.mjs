import { chromium } from 'playwright';

async function captureDesktop() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.setItem('nexora_logged_in', 'true');
    localStorage.setItem('nexora_auth_token', 'test_token');
    localStorage.setItem('nexusforge_theme', 'light');
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  });

  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'C:/Users/venka/.gemini/antigravity-ide/brain/1634e0a6-ef55-4058-9cb2-2dd233e6dd60/desktop_dashboard_light.png', fullPage: false });

  await browser.close();
  console.log('Desktop screenshot captured successfully!');
}

captureDesktop().catch(console.error);
