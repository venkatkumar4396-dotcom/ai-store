import { chromium } from 'playwright';

const routes = [
  { name: 'landing', url: 'http://localhost:3000/' },
  { name: 'dashboard', url: 'http://localhost:3000/dashboard' },
  { name: 'stock-intelligence', url: 'http://localhost:3000/stock-intelligence' },
  { name: 'whatsapp', url: 'http://localhost:3000/whatsapp' },
  { name: 'billing', url: 'http://localhost:3000/billing' },
  { name: 'settings', url: 'http://localhost:3000/settings' }
];

async function runContrastTest() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Ensure light mode & auth
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

  const failures = [];

  for (const r of routes) {
    await page.goto(r.url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.evaluate(() => {
      localStorage.setItem('nexusforge_theme', 'light');
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    });
    await page.waitForTimeout(1000);

    const issues = await page.evaluate((routeName) => {
      const cvs = document.createElement('canvas');
      cvs.width = 1;
      cvs.height = 1;
      const ctx = cvs.getContext('2d');

      function normalizeToRgba(colorStr) {
        if (!colorStr || colorStr === 'transparent' || colorStr === 'inherit') {
          return { r: 0, g: 0, b: 0, a: 0 };
        }
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = '#000000';
        ctx.fillStyle = colorStr;
        ctx.fillRect(0, 0, 1, 1);
        const data = ctx.getImageData(0, 0, 1, 1).data;
        return { r: data[0], g: data[1], b: data[2], a: data[3] / 255 };
      }

      function composite(fg, bg) {
        const a = fg.a + bg.a * (1 - fg.a);
        if (a === 0) return { r: 255, g: 255, b: 255, a: 0 };
        return {
          r: Math.round((fg.r * fg.a + bg.r * bg.a * (1 - fg.a)) / a),
          g: Math.round((fg.g * fg.a + bg.g * bg.a * (1 - fg.a)) / a),
          b: Math.round((fg.b * fg.a + bg.b * bg.a * (1 - fg.a)) / a),
          a: a
        };
      }

      function getEffectiveBg(el) {
        let current = el;
        let color = { r: 255, g: 255, b: 255, a: 1 };
        const stack = [];
        while (current && current !== document.documentElement) {
          const style = window.getComputedStyle(current);
          let bg = normalizeToRgba(style.backgroundColor);
          const clip = style.webkitBackgroundClip || style.backgroundClip;
          const isTextClip = clip === 'text' || clip === '-webkit-text';
          if (!isTextClip && bg.a === 0 && style.backgroundImage && style.backgroundImage.includes('gradient')) {
            const m = style.backgroundImage.match(/(?:rgb|rgba|lab|oklch)\([^)]+\)/);
            if (m) {
              const gradBg = normalizeToRgba(m[0]);
              if (gradBg.a > 0) bg = gradBg;
            }
          }
          if (bg.a > 0) {
            stack.unshift(bg);
          }
          current = current.parentElement;
        }
        for (const bg of stack) {
          color = composite(bg, color);
        }
        return color;
      }

      function luminance(c) {
        const a = [c.r, c.g, c.b].map((v) => {
          v /= 255;
          return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
      }

      function contrastRatio(fg, bg) {
        const l1 = luminance(fg);
        const l2 = luminance(bg);
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);
        return (lighter + 0.05) / (darker + 0.05);
      }

      const found = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node;

      while ((node = walker.nextNode())) {
        const text = node.nodeValue.trim();
        if (!text || text.length < 2) continue;

        const parent = node.parentElement;
        if (!parent) continue;

        const style = window.getComputedStyle(parent);
        if (style.display === 'none' || style.visibility === 'hidden') continue;

        let p = parent;
        let isHidden = false;
        let totalOpacity = 1;
        while (p && p !== document.body) {
          const ps = window.getComputedStyle(p);
          if (ps.display === 'none' || ps.visibility === 'hidden') {
            isHidden = true;
            break;
          }
          const rect = p.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) {
            isHidden = true;
            break;
          }
          totalOpacity *= parseFloat(ps.opacity || '1');
          p = p.parentElement;
        }
        if (isHidden) continue;

        const textFill = style.webkitTextFillColor;
        const bgClip = style.webkitBackgroundClip || style.backgroundClip;
        const bgImage = style.backgroundImage;

        let fg = normalizeToRgba(style.color);
        if (
          (textFill === 'transparent' || textFill === 'rgba(0, 0, 0, 0)' || fg.a === 0) &&
          (bgClip === 'text' || bgClip === '-webkit-text') &&
          bgImage && bgImage.includes('gradient')
        ) {
          const m = bgImage.match(/(?:rgb|rgba|lab|oklch)\([^)]+\)/);
          fg = m ? normalizeToRgba(m[0]) : { r: 55, g: 48, b: 163, a: 1 };
        }

        const effBg = getEffectiveBg(parent);
        const ratio = contrastRatio(fg, effBg);

        const fontSize = parseFloat(style.fontSize);
        const fontWeight = parseInt(style.fontWeight) || 400;
        const isLarge = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
        const threshold = isLarge ? 3.0 : 4.5;

        // Fail if contrast < threshold OR text color equals its background
        if (ratio < threshold || (fg.r === effBg.r && fg.g === effBg.g && fg.b === effBg.b)) {
          found.push({
            route: routeName,
            text: text.slice(0, 30),
            ratio: ratio.toFixed(2),
            threshold: threshold
          });
        }
      }

      return found;
    }, r.name);

    if (issues.length > 0) {
      failures.push(...issues);
    }
  }

  await browser.close();

  if (failures.length > 0) {
    console.error(`FAILED: ${failures.length} contrast violations found in dev contrast test:`);
    console.error(failures);
    process.exit(1);
  } else {
    console.log(`PASSED: Dev contrast test passed with 0 violations across all routes.`);
  }
}

runContrastTest().catch(err => {
  console.error(err);
  process.exit(1);
});
