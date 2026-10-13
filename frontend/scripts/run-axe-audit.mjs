import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const routes = [
  { name: 'landing', url: 'http://localhost:3000/' },
  { name: 'dashboard', url: 'http://localhost:3000/dashboard' },
  { name: 'stock-intelligence', url: 'http://localhost:3000/stock-intelligence' },
  { name: 'whatsapp', url: 'http://localhost:3000/whatsapp' },
  { name: 'billing', url: 'http://localhost:3000/billing' },
  { name: 'settings', url: 'http://localhost:3000/settings' }
];

async function runAxeAudit() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Log in
  console.log('Authenticating session...');
  await page.goto('http://localhost:3000/login');
  try {
    await page.click('text=Autofill Demo Credentials');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 8000 });
  } catch (err) {
    await page.evaluate(() => {
      localStorage.setItem('nexora_logged_in', 'true');
      localStorage.setItem('nexora_auth_token', 'test_token');
      localStorage.setItem('nexusforge_theme', 'light');
    });
    await page.goto('http://localhost:3000/dashboard');
  }

  await page.evaluate(() => {
    localStorage.setItem('nexusforge_theme', 'light');
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  });

  let totalViolations = 0;

  for (const r of routes) {
    console.log(`Running axe-core color-contrast audit on ${r.name}...`);
    await page.goto(r.url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.evaluate(() => {
      localStorage.setItem('nexusforge_theme', 'light');
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    });
    await page.waitForTimeout(1000);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['color-contrast'])
      .analyze();

    const violations = accessibilityScanResults.violations;
    console.log(`[${r.name}] color-contrast violations: ${violations.length}`);
    if (violations.length > 0) {
      totalViolations += violations.length;
      for (const v of violations) {
        console.log(`  Rule: ${v.id} - ${v.help}`);
        for (const node of v.nodes) {
          console.log(`    Target: ${node.target.join(' ')}`);
          console.log(`    Failure: ${node.failureSummary}`);
        }
      }
    }
  }

  await browser.close();
  console.log(`\n================ AXE AUDIT SUMMARY ================`);
  console.log(`Total axe color-contrast violations: ${totalViolations}`);
  if (totalViolations === 0) {
    console.log(`SUCCESS: 0 color-contrast violations across all routes!`);
  } else {
    process.exit(1);
  }
}

runAxeAudit().catch(err => {
  console.error(err);
  process.exit(1);
});
