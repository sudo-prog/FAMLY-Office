// Post-build CSS color downleveler for Family Office.
// Tailwind v4.3.1 emits oklab/oklch + color-mix for ALL color output.
// Many mobile browsers (pre-2023 Safari/Chrome) reject oklab/oklch/color-mix,
// so theme colours silently fail to render. This pass converts every modern
// color function in the built CSS to the universally-supported rgb()/rgba()
// (comma) form, resolving var(--color-*) via the :root map.
//
// Usage: node scripts/downlevel-colors.mjs   (run after `vite build`)
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const to255 = (x) => Math.round(clamp01(x) * 255);
function gammaEncode(x) { return x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055; }
function oklabToRgb(L, a, b) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ * l_ * l_, m = m_ * m_ * m_, s = s_ * s_ * s_;
  const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bch = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;
  return [gammaEncode(r), gammaEncode(g), gammaEncode(bch)].map(to255);
}
function oklchToRgb(L, C, H) { const h = (H * Math.PI) / 180; return oklabToRgb(L, C * Math.cos(h), C * Math.sin(h)); }
function hslToRgb(h, s, l) {
  s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; } else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; } else if (h < 300) { r = x; b = c; } else { r = c; b = x; }
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}
const pct = (v) => (v.endsWith('%') ? parseFloat(v) / 100 : parseFloat(v));

function parseColor(tok, varMap) {
  tok = tok.trim();
  if (tok.startsWith('var(')) {
    const name = tok.slice(4, -1).trim();
    return varMap[name] ? { rgb: varMap[name].rgb, alpha: varMap[name].alpha } : null;
  }
  if (tok === 'transparent') return { rgb: [0, 0, 0], alpha: 0, transparent: true };
  if (tok.toLowerCase() === 'currentcolor') return { rgb: [0, 0, 0], alpha: 1, current: true };
  let m;
  if ((m = tok.match(/^oklab\(([\d.%+-]+)\s+([\d.%+-]+)\s+([\d.%+-]+)(?:\s*\/\s*([\d.]+%?))?\)$/)))
    return { rgb: oklabToRgb(pct(m[1]), pct(m[2]), pct(m[3])), alpha: m[4] ? pct(m[4]) : 1 };
  if ((m = tok.match(/^oklch\(([\d.%+-]+)\s+([\d.%+-]+)\s+([\d.%+-]+)(?:\s*\/\s*([\d.]+%?))?\)$/)))
    return { rgb: oklchToRgb(pct(m[1]), pct(m[2]), pct(m[3])), alpha: m[4] ? pct(m[4]) : 1 };
  if ((m = tok.match(/^#([0-9a-f]{3,8})$/i))) {
    const hex = m[1]; let r, g, b, a = 1;
    if (hex.length === 3) { r = parseInt(hex[0] + hex[0], 16); g = parseInt(hex[1] + hex[1], 16); b = parseInt(hex[2] + hex[2], 16); }
    else if (hex.length === 6) { r = parseInt(hex.slice(0, 2), 16); g = parseInt(hex.slice(2, 4), 16); b = parseInt(hex.slice(4, 6), 16); }
    else if (hex.length === 8) { r = parseInt(hex.slice(0, 2), 16); g = parseInt(hex.slice(2, 4), 16); b = parseInt(hex.slice(4, 6), 16); a = parseInt(hex.slice(6, 8), 16) / 255; }
    else if (hex.length === 4) { r = parseInt(hex[0] + hex[0], 16); g = parseInt(hex[1] + hex[1], 16); b = parseInt(hex[2] + hex[2], 16); a = parseInt(hex.slice(3, 4) + hex.slice(3, 4), 16) / 255; }
    return { rgb: [r, g, b], alpha: a };
  }
  if ((m = tok.match(/^hsl\(var\((--[\w-]+)\)(?:\s*\/\s*([\d.]+%?))?\)$/))) {
    const v = varMap[m[1]];
    if (v) return { rgb: v.rgb, alpha: m[2] ? pct(m[2]) : v.alpha };
  }
  if ((m = tok.match(/^rgba?\(([^)]*)\)$/))) {
    const p = m[1].split(',').map((s) => s.trim());
    if (p.length >= 3) return { rgb: [+p[0], +p[1], +p[2]], alpha: p[3] !== undefined ? pct(p[3]) : 1 };
  }
  if ((m = tok.match(/^hsl\(([\d.\s%]+)\)$/))) {
    const p = m[1].split(/\s+/).map((s) => s.replace('%', '').trim());
    return { rgb: hslToRgb(+p[0], +p[1], +p[2]), alpha: 1 };
  }
  return null;
}

function fmt(c) {
  const [r, g, b] = c.rgb;
  return c.alpha >= 1 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${+c.alpha.toFixed(3)})`;
}

const distDir = 'dist/assets';
const files = readdirSync(distDir).filter((f) => f.endsWith('.css'));
let totalFixed = 0;

for (const file of files) {
  const path = join(distDir, file);
  let css = readFileSync(path, 'utf8');

  // 1. Build var(--color-*)/--chart-*/--primary etc. map from :root defs.
  //    Captures oklab/oklch/hex AND plain HSL triplets (e.g. --primary: 145 33% 27%).
  const varMap = {};
  const defRe = /(--[\w-]+)\s*:\s*(oklab\([^)]*\)|oklch\([^)]*\)|#[0-9a-f]{3,8})\s*;/g;
  let dm;
  while ((dm = defRe.exec(css))) {
    const parsed = parseColor(dm[2], varMap);
    if (parsed) varMap[dm[1]] = parsed;
  }
  // Plain HSL triplet defs: --primary: 145 33% 27%;  --background: 44 50% 91%;
  const hslDefRe = /(--[\w-]+)\s*:\s*([\d.]+%?)\s+([\d.]+%?)\s+([\d.]+%?)\s*;/g;
  let hm;
  while ((hm = hslDefRe.exec(css))) {
    const name = hm[1];
    if (varMap[name]) continue; // already captured as modern func
    const rgb = hslToRgb(parseFloat(hm[2]), parseFloat(hm[3]), parseFloat(hm[4]));
    varMap[name] = { rgb, alpha: 1 };
  }

  // 2. Convert color-mix(in oklab, A p%, B) -> rgba().  (Run BEFORE any
  //    standalone oklab replace, since all oklab literals live inside color-mix.)
  //    Tailwind v4 form: color-mix(in oklab, <color> <pct>%, <color|transparent>)
  //    where <color> is var(--x) / hsl(var(--x)) / rgba(...) / currentColor.
  //    A plain regex (no paren-depth counting) handles every real case; we loop
  //    a few passes so nested color-mix(in oklab, color-mix(...)) resolves
  //    outside-in (inner becomes rgba(...) after pass 1, then matches pass 2).
  const COLOR = '(?:transparent|currentcolor|var\\(--[\\w-]+\\)|hsl\\(var\\(--[\\w-]+\\)\\)|rgba?\\([^)]*\\))';
  const cmRe = new RegExp(`color-mix\\(in oklab,\\s*(${COLOR})\\s*([\\d.]+|var\\(--[\\w-]+\\))?%?\\s*,\\s*(${COLOR})\\s*\\)`, 'g');
  let passes = 0;
  while (passes < 6 && /color-mix\(in oklab,/.test(css)) {
    passes++;
    css = css.replace(cmRe, (full, aRaw, pctRaw, bRaw) => {
      const a = parseColor(aRaw, varMap);
      const b = parseColor(bRaw, varMap);
      if (!a || !b) return full;
      if (a.current || b.current) { totalFixed++; return 'currentColor'; }
      // Percentage may be a literal (e.g. 10) or a CSS var (e.g. var(--tw-shadow-alpha)).
      const p = pctRaw && !pctRaw.startsWith('var(') ? parseFloat(pctRaw) / 100 : null;
      let out;
      if (b.transparent) {
        out = { rgb: a.rgb, alpha: p !== null ? (a.alpha ?? 1) * p : (a.alpha ?? 1) };
        if (pctRaw && pctRaw.startsWith('var(')) out.alphaVar = pctRaw; // keep var as alpha
      } else if (a.transparent) {
        out = { rgb: b.rgb, alpha: p !== null ? (b.alpha ?? 1) * (1 - p) : (b.alpha ?? 1) };
        if (pctRaw && pctRaw.startsWith('var(')) out.alphaVar = `calc(1 - ${pctRaw})`;
      } else {
        out = {
          rgb: [a.rgb[0] * (p ?? 1) + b.rgb[0] * (1 - (p ?? 1)), a.rgb[1] * (p ?? 1) + b.rgb[1] * (1 - (p ?? 1)), a.rgb[2] * (p ?? 1) + b.rgb[2] * (1 - (p ?? 1))],
          alpha: (a.alpha ?? 1) * (p ?? 1) + (b.alpha ?? 1) * (1 - (p ?? 1)),
        };
      }
      totalFixed++;
      const [r, g, bch] = out.rgb;
      return out.alphaVar
        ? `rgba(${r},${g},${bch}, ${out.alphaVar})`
        : (out.alpha >= 1 ? `rgb(${r},${g},${bch})` : `rgba(${r},${g},${bch},${+out.alpha.toFixed(3)})`);
    });
  }

  // 3. Any remaining standalone oklab/oklch literals (defensive).
  css = css.replace(/oklab\([^)]*\)/g, (m) => { const p = parseColor(m, varMap); if (p) { totalFixed++; return fmt(p); } return m; });
  css = css.replace(/oklch\([^)]*\)/g, (m) => { const p = parseColor(m, varMap); if (p) { totalFixed++; return fmt(p); } return m; });

  // 5. Unwrap @supports (color:color-mix(in lab,red,red)) guards. Tailwind v4
  //    emits global base styles (placeholder colour, textarea resize, webkit
  //    resets) inside this guard. After downleveling actual colours to rgba(),
  //    old browsers lacking color-mix would skip the @supports block and LOSE
  //    those base styles. Remove the guard (keep inner content) via brace match.
  const supRe = /@supports \(color:color-mix\(in lab,red,red\)\)\{/g;
  let sm;
  while ((sm = supRe.exec(css))) {
    const open = sm.index;
    let depth = 0, j = open + sm[0].length - 1; // at the '{' of the guard
    for (; j < css.length; j++) {
      if (css[j] === '{') depth++;
      else if (css[j] === '}') { depth--; if (depth === 0) break; }
    }
    // css[open .. j] = "@supports(...) { ... }"; keep inner [open+len .. j]
    const innerStart = open + sm[0].length;
    css = css.slice(0, open) + css.slice(innerStart, j) + css.slice(j + 1);
    supRe.lastIndex = 0; // re-scan from start after splice
  }

  writeFileSync(path, css);
  console.log(`${file}: oklab=${(css.match(/oklab/g) || []).length} oklch=${(css.match(/oklch/g) || []).length} color-mix=${(css.match(/color-mix/g) || []).length} rgba=${(css.match(/rgba?\(/g) || []).length}`);
  const remaining = css.match(/color-mix\(in oklab[^]*?\)/g) || [];
  if (remaining.length) {
    console.log('  remaining sample:', remaining.slice(0, 3));
    console.log('  varMap has --border?', !!varMap['--border'], '| --primary?', !!varMap['--primary'], '| --color-black?', !!varMap['--color-black']);
  }
}
console.log('TOTAL color functions downleveled:', totalFixed);
