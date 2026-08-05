// Programmatic WCAG 2.2 AA contrast check against the real light-theme
// tokens in src/styles/index.css — axe-core's color-contrast rule is
// unreliable under jsdom (no real layout engine). Mirrors the method
// Sprint 3 first used for the success/warning badge tokens, then Sprint 8
// used to find and fix a real --color-secondary-foreground failure.
//
// Reads tokens from source rather than a hardcoded snapshot on purpose: an
// earlier version of this script hardcoded the token values inline, and
// that copy silently drifted out of sync with a later CSS fix (found
// 2026-08-05 while deciding whether to keep this script permanently — the
// hardcoded snapshot still said secondary-foreground: #FFFFFF, the
// pre-Sprint-8-fix value, which would have reported a false FAIL forever).
// Parsing the real file means this check can never again be stale in that
// specific way, while a run does still need the source file it's given.
const fs = require('fs');
const path = require('path');

const CSS_PATH = path.join(__dirname, 'src/styles/index.css');

function parseLightThemeTokens(cssSource) {
  const themeStart = cssSource.indexOf('@theme {');
  if (themeStart === -1) throw new Error('Could not find "@theme {" block in ' + CSS_PATH);
  const themeEnd = cssSource.indexOf('\n}', themeStart);
  if (themeEnd === -1) throw new Error('Could not find the closing "}" of the @theme block.');
  const themeBlock = cssSource.slice(themeStart, themeEnd);

  const tokens = {};
  const pattern = /--color-([\w-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/g;
  let match;
  while ((match = pattern.exec(themeBlock))) {
    tokens[match[1]] = match[2];
  }
  return tokens;
}

const tokens = parseLightThemeTokens(fs.readFileSync(CSS_PATH, 'utf8'));

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function relLuminance([r, g, b]) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(hex1, hex2) {
  const l1 = relLuminance(hexToRgb(hex1));
  const l2 = relLuminance(hexToRgb(hex2));
  const [lighter, darker] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (lighter + 0.05) / (darker + 0.05);
}

// Real foreground/background pairs actually used together in the UI
// (text/icon color, on the surface it's rendered against).
const pairs = [
  ['foreground', 'background', 4.5, 'body text on page background'],
  ['foreground', 'surface', 4.5, 'body text on Card/Surface'],
  ['card-foreground', 'card', 4.5, 'Card text'],
  ['muted-foreground', 'background', 4.5, 'secondary text on page background'],
  ['muted-foreground', 'surface', 4.5, 'secondary text on Card/Surface'],
  ['muted-foreground', 'muted', 4.5, 'text on Muted background (e.g. Skeleton/disabled areas)'],
  ['subtle-foreground', 'background', 3.0, 'placeholder/subtle text (large-text threshold, decorative use)'],
  ['primary-foreground', 'primary', 4.5, 'Button primary text'],
  ['secondary-foreground', 'secondary', 4.5, 'Button secondary / Badge success text'],
  ['accent-foreground', 'accent', 4.5, 'text on Accent background (active nav, selected state)'],
  ['success-foreground', 'success', 4.5, 'text on success Badge background'],
  ['warning-foreground', 'warning', 4.5, 'text on warning Badge background'],
  ['error-foreground', 'error', 4.5, 'text on error/destructive Button/Badge background'],
  ['foreground', 'accent', 4.5, 'body text if ever placed on Accent background'],
];

console.log('pair'.padEnd(45), 'ratio'.padEnd(8), 'threshold', 'result');
let anyFail = false;
for (const [fg, bg, threshold, label] of pairs) {
  if (!tokens[fg] || !tokens[bg]) {
    console.log(`${fg} on ${bg}`.padEnd(45), 'MISSING — token not found in @theme block');
    anyFail = true;
    continue;
  }
  const ratio = contrastRatio(tokens[fg], tokens[bg]);
  const pass = ratio >= threshold;
  if (!pass) anyFail = true;
  console.log(
    `${fg} on ${bg}`.padEnd(45),
    ratio.toFixed(2).padEnd(8),
    `>= ${threshold}`.padEnd(9),
    pass ? 'PASS' : 'FAIL — ' + label,
  );
}
console.log(anyFail ? '\nSome pairs FAIL AA.' : '\nAll checked pairs pass WCAG 2.2 AA.');
// Deliberately no process.exitCode here — this has never been a CI gate,
// just an on-demand diagnostic (e.g. subtle-foreground-on-background is a
// known, already-accepted sub-3.0 case for decorative/placeholder text, not
// something a hard failure should block on without a real product decision).
