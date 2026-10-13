/**
 * WCAG AA Color Contrast Verification Script
 * Validates text-to-background contrast ratios for light theme according to WCAG 2.1 specs.
 * Body text requires >= 4.5:1
 * Large text (>= 18pt or >= 14pt bold) requires >= 3:1
 */

function parseHex(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  const num = parseInt(hex, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function getLuminance([r, g, b]) {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrast(hex1, hex2) {
  const lum1 = getLuminance(parseHex(hex1));
  const lum2 = getLuminance(parseHex(hex2));
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

const surfaces = {
  white: '#FFFFFF',
  surfaceSubtle: '#F8FAFC',
  softIndigo: '#EEF2FF',
  tabInactive: '#F1F5F9',
  badgeGreen: '#DCFCE7',
  badgeAmber: '#FEF3C7',
  badgeRed: '#FEE2E2',
};

const textTokens = {
  '--text-strong (#0F172A)': '#0F172A',
  '--text-body (#334155)': '#334155',
  '--text-muted (#475569)': '#475569',
  '--primary (#4F46E5)': '#4F46E5',
  '--primary-hover (#4338CA)': '#4338CA',
  'badgeTextGreen (#166534)': '#166534',
  'badgeTextAmber (#92400E)': '#92400E',
  'badgeTextRed (#B91C1C)': '#B91C1C',
  'badgeTextIndigo (#3730A3)': '#3730A3',
};

console.log('=== WCAG AA LIGHT THEME CONTRAST AUDIT ===\n');
let violations = 0;

for (const [bgName, bgHex] of Object.entries(surfaces)) {
  console.log(`Surface: ${bgName} (${bgHex})`);
  for (const [textName, textHex] of Object.entries(textTokens)) {
    const ratio = getContrast(textHex, bgHex);
    const passesAA = ratio >= 4.5;
    const passesLarge = ratio >= 3.0;

    // Only test relevant pairings (e.g. badge text on badge bg, general text on surfaces)
    const isBadgeMatch =
      (bgName === 'badgeGreen' && textName.includes('Green')) ||
      (bgName === 'badgeAmber' && textName.includes('Amber')) ||
      (bgName === 'badgeRed' && textName.includes('Red')) ||
      (bgName === 'softIndigo' && (textName.includes('Indigo') || textName.includes('strong') || textName.includes('body'))) ||
      (!bgName.startsWith('badge') && !textName.startsWith('badge'));

    if (isBadgeMatch) {
      const status = passesAA ? '✅ PASS' : (passesLarge ? '⚠️ LARGE ONLY' : '❌ FAIL');
      console.log(`  ${status} | ${textName.padEnd(28)} on ${bgName.padEnd(14)} -> ${ratio.toFixed(2)}:1`);
      if (!passesLarge) violations++;
    }
  }
  console.log('');
}

console.log(`Audit finished with ${violations} contrast violation(s).`);
if (violations > 0) process.exit(1);
