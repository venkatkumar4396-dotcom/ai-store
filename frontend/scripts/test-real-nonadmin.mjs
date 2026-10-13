import { chromium } from 'playwright';
import axios from 'axios';

async function testRealNonAdmin() {
  console.log('Testing Real Non-Admin Account...');

  // 1. Create or login as a regular user
  const regularEmail = 'standard.user@nexora.ai';
  const regularPassword = 'StandardUser!123';

  let regularToken = '';
  try {
    const regRes = await axios.post('http://localhost:5000/api/auth/register', {
      email: regularEmail,
      name: 'Standard User',
      password: regularPassword
    });
    regularToken = regRes.data.token;
    console.log('Registered standard user with role:', regRes.data.user.role);
  } catch (err) {
    // If user already exists, login
    try {
      const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
        email: regularEmail,
        password: regularPassword
      });
      regularToken = loginRes.data.token;
      console.log('Logged in existing standard user with role:', loginRes.data.user.role);
    } catch (lErr) {
      console.error('Login error:', lErr.response?.data || lErr.message);
    }
  }

  // 2. Open Playwright and log in as standard user
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Set the valid JWT and user info
  await page.goto('http://localhost:3000/login');
  await page.evaluate(({ token, email }) => {
    localStorage.setItem('nexora_logged_in', 'true');
    localStorage.setItem('nexora_auth_token', token);
    localStorage.setItem('nexora_user_type', 'user');
    localStorage.setItem('nexora_user', JSON.stringify({
      id: 'reg_usr_1',
      name: 'Standard User',
      email: email,
      role: 'user'
    }));
  }, { token: regularToken, email: regularEmail });

  // 3. Visit Dashboard - verify Admin Console is NOT in sidebar
  await page.goto('http://localhost:3000/dashboard');
  await page.waitForTimeout(1500);
  const adminLinksCount = await page.locator('a[href="/admin"]').count();
  console.log(`Admin Console links in sidebar for standard user: ${adminLinksCount} (Expected: 0)`);
  await page.screenshot({ path: 'audit/after/dashboard_standard_user_no_admin_link.png' });
  console.log('Captured dashboard_standard_user_no_admin_link.png');

  // 4. Try navigating directly to /admin as standard user
  await page.goto('http://localhost:3000/admin');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'audit/after/admin_access_denied_card.png' });
  console.log('Captured admin_access_denied_card.png');

  await browser.close();
  console.log('Real non-admin test completed.');
}

testRealNonAdmin().catch(console.error);
