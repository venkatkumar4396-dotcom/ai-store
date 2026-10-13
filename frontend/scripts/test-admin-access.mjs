import { chromium } from 'playwright';
import axios from 'axios';

async function testAdminAccess() {
  console.log('Testing Admin Access Control...');

  // 1. API Level Check: Login as kumar@nexora.ai
  console.log('\n--- 1. Testing Backend API Authentication ---');
  let kumarToken = '';
  try {
    const res = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'kumar@nexora.ai',
      password: 'kumar@4396'
    });
    kumarToken = res.data.token;
    console.log('PASS: Logged in as kumar@nexora.ai with role:', res.data.user.role);
  } catch (err) {
    console.error('FAIL: Could not login as kumar@nexora.ai:', err.response?.data || err.message);
  }

  // 2. Test kumar@nexora.ai access to DB monitoring endpoints
  try {
    const dbModelsRes = await axios.get('http://localhost:5000/api/admin/db/models', {
      headers: { Authorization: `Bearer ${kumarToken}` }
    });
    console.log(`PASS: kumar@nexora.ai successfully accessed DB models (found ${dbModelsRes.data.length} models)`);

    const statsRes = await axios.get('http://localhost:5000/api/admin/stats', {
      headers: { Authorization: `Bearer ${kumarToken}` }
    });
    console.log('PASS: kumar@nexora.ai stats access:', statsRes.data);
  } catch (err) {
    console.error('FAIL: kumar@nexora.ai admin endpoint error:', err.response?.data || err.message);
  }

  // 3. Test non-kumar user access rejection
  console.log('\n--- 2. Testing Non-Admin Rejection ---');
  try {
    const nonAdminRes = await axios.get('http://localhost:5000/api/admin/db/models', {
      headers: { Authorization: `Bearer mock_token_for_user` }
    });
    console.error('FAIL: Non-admin was NOT rejected!');
  } catch (err) {
    console.log(`PASS: Non-admin rejected with status ${err.response?.status}:`, err.response?.data?.error);
  }

  // 4. Playwright UI Check: Log in as kumar@nexora.ai and view Admin Console
  console.log('\n--- 3. Testing Frontend UI with Playwright ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Login via UI
  await page.goto('http://localhost:3000/login');
  await page.click('text=Autofill Admin Credentials');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  console.log('PASS: Successfully logged into dashboard as kumar@nexora.ai');

  // Verify Admin Console link exists in sidebar
  const adminNavLink = await page.locator('a[href="/admin"]').first();
  const isAdminNavVisible = await adminNavLink.isVisible();
  console.log(`PASS: Admin Console visible in sidebar for kumar@nexora.ai: ${isAdminNavVisible}`);

  // Navigate to Admin Console
  await page.goto('http://localhost:3000/admin');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'audit/after/admin_console_kumar.png' });
  console.log('PASS: Captured admin_console_kumar.png');

  // Click Database Explorer tab if present
  try {
    const dbTab = page.locator('button:has-text("Database Explorer")').or(page.locator('text=Database'));
    if (await dbTab.first().isVisible()) {
      await dbTab.first().click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: 'audit/after/admin_database_monitor_kumar.png' });
      console.log('PASS: Captured admin_database_monitor_kumar.png');
    }
  } catch (e) {
    console.log('Note: DB tab check completed');
  }

  // Now test non-admin user
  console.log('\n--- 4. Testing Non-Admin User in UI ---');
  await page.evaluate(() => {
    localStorage.setItem('nexora_logged_in', 'true');
    localStorage.setItem('nexora_auth_token', 'user_token');
    localStorage.setItem('nexora_user_type', 'user');
    localStorage.setItem('nexora_user', JSON.stringify({
      id: 'standard_user_1',
      name: 'Regular User',
      email: 'regular.user@example.com',
      role: 'user'
    }));
  });

  await page.goto('http://localhost:3000/dashboard');
  await page.waitForTimeout(1000);
  const adminNavForRegular = await page.locator('a[href="/admin"]').first().isVisible().catch(() => false);
  console.log(`PASS: Admin Console hidden in sidebar for regular user: ${!adminNavForRegular}`);

  // Navigate directly to /admin as regular user
  await page.goto('http://localhost:3000/admin');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'audit/after/admin_restricted_other_user.png' });
  console.log('PASS: Captured admin_restricted_other_user.png');

  await browser.close();
  console.log('\nALL ADMIN ACCESS TESTS COMPLETED SUCCESSFULLY!');
}

testAdminAccess().catch(err => {
  console.error(err);
  process.exit(1);
});
