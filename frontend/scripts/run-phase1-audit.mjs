import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const routes = [
  { name: 'landing', url: 'http://localhost:3000/' },
  { name: 'dashboard', url: 'http://localhost:3000/dashboard' },
  { name: 'stock-intelligence', url: 'http://localhost:3000/stock-intelligence', hasAutocomplete: true },
  { name: 'whatsapp', url: 'http://localhost:3000/whatsapp' },
  { name: 'billing', url: 'http://localhost:3000/billing' },
  { name: 'settings', url: 'http://localhost:3000/settings' }
];

async function runAudit() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  const page = await context.newPage();

  // Log in
  console.log('Logging in for audit session...');
  await page.goto('http://localhost:3000/login');
  try {
    await page.click('text=Autofill Demo Credentials');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 8000 });
  } catch (err) {
    console.log('Using direct auth fallback...');
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

  const allViolations = [];

  for (const r of routes) {
    console.log(`Auditing ${r.name}...`);
    await page.goto(r.url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    });
    await page.waitForTimeout(2500);

    if (r.hasAutocomplete) {
      const input = await page.$('input[placeholder*="Search"]');
      if (input) {
        await input.fill('AAPL');
        await page.waitForTimeout(1000);
      }
    }

    const violations = await page.evaluate((routeName) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      function normalizeToRgba(colorStr) {
        if (!colorStr || colorStr === 'transparent' || colorStr === 'inherit') {
          return { r: 0, g: 0, b: 0, a: 0 };
        }
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = '#000000'; // reset
        ctx.fillStyle = colorStr;
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
        return { r, g, b, a: a / 255 };
      }

      function composite(fg, bg) {
        const a = fg.a + bg.a * (1 - fg.a);
        if (a === 0) return { r: 255, g: 255, b: 255, a: 1 };
        return {
          r: Math.round((fg.r * fg.a + bg.r * bg.a * (1 - fg.a)) / a),
          g: Math.round((fg.g * fg.a + bg.g * bg.a * (1 - fg.a)) / a),
          b: Math.round((fg.b * fg.a + bg.b * bg.a * (1 - fg.a)) / a),
          a: a
        };
      }

      function getEffectiveBg(el) {
        let current = el;
        let color = { r: 255, g: 255, b: 255, a: 1 }; // default page light bg
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

      function getUniqueSelector(el) {
        if (el.id) return `#${el.id}`;
        let path = [];
        let curr = el;
        while (curr && curr.nodeType === Node.ELEMENT_NODE && curr !== document.body) {
          let selector = curr.nodeName.toLowerCase();
          if (curr.className && typeof curr.className === 'string') {
            const cls = curr.className.trim().split(/\s+/).slice(0, 2).join('.');
            if (cls) selector += `.${cls}`;
          }
          path.unshift(selector);
          if (path.length > 3) break;
          curr = curr.parentElement;
        }
        return path.join(' > ');
      }

      const results = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node;

      while ((node = walker.nextNode())) {
        const text = node.nodeValue.trim();
        if (!text || text.length < 2) continue;

        const parent = node.parentElement;
        if (!parent) continue;

        const style = window.getComputedStyle(parent);
        if (style.display === 'none' || style.visibility === 'hidden') continue;

        // Ancestor visibility and clip check
        let isHidden = false;
        let totalOpacity = 1;
        let p = parent;
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
        const requiredRatio = isLarge ? 3.0 : 4.5;


        let reason = null;

        // (b) -webkit-text-fill-color transparent without bg-clip: text
        if (
          (textFill === 'transparent' || textFill === 'rgba(0, 0, 0, 0)') &&
          bgClip !== 'text' &&
          bgClip !== '-webkit-text'
        ) {
          reason = 'transparent text-fill without bg-clip: text';
        } else if (
          (textFill === 'transparent' || textFill === 'rgba(0, 0, 0, 0)') &&
          (!bgImage || bgImage === 'none')
        ) {
          reason = 'transparent text-fill with no background image';
        } else if (totalOpacity < 0.6) {
          reason = `low opacity (${totalOpacity.toFixed(2)})`;
        } else if (ratio < requiredRatio) {
          reason = `low contrast ratio (${ratio.toFixed(2)}:1 < ${requiredRatio}:1)`;
        }

        if (reason) {
          results.push({
            route: routeName,
            text: text.slice(0, 40),
            selector: getUniqueSelector(parent),
            color: style.color,
            textFill: textFill,
            effectiveBg: `rgb(${effBg.r}, ${effBg.g}, ${effBg.b})`,
            ratio: ratio.toFixed(2),
            opacity: totalOpacity.toFixed(2),
            fontSize: `${fontSize}px`,
            reason: reason
          });
        }
      }

      return results;
    }, r.name);

    allViolations.push(...violations);
  }

  await browser.close();

  fs.writeFileSync(
    path.resolve(process.cwd(), 'audit/phase1_violations.json'),
    JSON.stringify(allViolations, null, 2)
  );

  console.log(`\n================ AUDIT RESULTS ================`);
  console.log(`Total text contrast/visibility violations detected: ${allViolations.length}\n`);

  const grouped = {};
  for (const v of allViolations) {
    const key = v.reason.split('(')[0].trim();
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(v);
  }

  for (const [cause, items] of Object.entries(grouped)) {
    console.log(`--- [Root Cause: ${cause}] (${items.length} occurrences) ---`);
    for (const item of items.slice(0, 10)) {
      console.log(
        `  [${item.route}] "${item.text}" | color: ${item.color} on ${item.effectiveBg} (ratio: ${item.ratio}:1) | selector: ${item.selector}`
      );
    }
    if (items.length > 10) {
      console.log(`  ... and ${items.length - 10} more`);
    }
  }
}

runAudit().catch(err => {
  console.error(err);
  process.exit(1);
});
