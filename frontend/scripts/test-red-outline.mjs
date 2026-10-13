import { chromium } from 'playwright';
import path from 'path';

async function test() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const outline = await page.evaluate(() => {
    const b = document.body;
    const s = window.getComputedStyle(b);
    return {
      outlineColor: s.outlineColor,
      outlineStyle: s.outlineStyle,
      outlineWidth: s.outlineWidth
    };
  });
  console.log('Computed outline on body:', outline);
  await page.screenshot({ path: path.resolve(process.cwd(), 'audit/test_red_outline.png') });
  await browser.close();
}

test().catch(console.error);
