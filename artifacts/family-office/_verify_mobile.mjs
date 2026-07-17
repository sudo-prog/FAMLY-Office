// _verify_mobile.cjs — universal per-element mobile gate (MOBILE-UI-STANDARD.md §2)
import { chromium } from 'playwright';
import fs from 'fs';

const BASE = (process.env.TARGET_URL || 'http://localhost:4173').replace(/\/$/, '');
const VW = 390, PIN = process.env.PIN || '123456';

// ALL routes from artifacts/family-office/src/App.tsx router
const ROUTES = [
  '/', '/assets', '/transactions', '/vault', '/entities', '/entities/1',
  '/report', '/projections', '/home-office', '/research', '/tax-report',
  '/report/tax-year', '/entities/1/tax', '/admin/audit-log', '/notifications',
  '/settings/bank-feed', '/projections/cash-flow', '/targets', '/report/benchmarks',
  '/research/watchlist', '/assets/prices', '/estate', '/white-label', '/admin/ocr',
  '/admin/users', '/report/export-pdf', '/settings'
];

const browser = await chromium.launch({ headless: true });

// --- unlock auth/PIN once, persist storageState ---
async function unlockOnce() {
  const u = await browser.newContext({ viewport: { width: VW, height: 844 }, hasTouch: true, isMobile: true });
  const up = await u.newPage();
  await up.goto(BASE, { waitUntil: 'domcontentloaded' });
  await up.waitForTimeout(1500);
  // dismiss onboarding/help/tour if present
  for (let t = 0; t < 3; t++) {
    const skip = await up.$('[data-tour-skip], button:has-text("Skip"), button:has-text("Skip tour"), button:has-text("Close"), button:has-text("Got it")');
    if (skip) { try { await skip.click({ timeout: 1000 }); } catch {} }
    await up.waitForTimeout(300);
  }
  for (let r = 0; r < 2; r++) {
    for (const d of PIN) {
      await up.evaluate((x) => {
        const b = [...document.querySelectorAll('button')].find(b => b.textContent && b.textContent.trim() === x);
        if (b) b.click();
      }, d);
      await up.waitForTimeout(150);
    }
    await up.waitForTimeout(900);
  }
  await up.waitForTimeout(800);
  await u.storageState({ path: 'state.json' });
  await u.close();
}

// sessionStorage gate: re-inject fo-unlocked on each context
await unlockOnce();

const gates = {};
let totalSmall = 0, totalReal = 0, totalConsole = 0, totalDoc = 0;
for (const route of ROUTES) {
  const ctx = await browser.newContext({ viewport: { width: VW, height: 844 }, hasTouch: true, isMobile: true, storageState: 'state.json' });
  const page = await ctx.newPage();
  // re-inject sessionStorage unlock (storageState only persists localStorage)
  await page.addInitScript(() => { try { sessionStorage.setItem('fo-unlocked', '1'); } catch {} });
  const errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', e => errs.push('PE:' + e.message));
  try { await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 25000 }); } catch (e) {}
  await page.waitForTimeout(2500); // SSE/AI: NO networkidle

  const res = await page.evaluate((vw) => {
    const docOverflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    const inScroll = el => {
      let p = el.parentElement;
      while (p) {
        const cs = getComputedStyle(p);
        if ((cs.overflowX === 'auto' || cs.overflowX === 'scroll' || cs.overflowX === 'hidden') && p.getBoundingClientRect().width <= vw + 1) return true;
        p = p.parentElement;
      }
      return false;
    };
    const off = [];
    const walk = el => {
      const cs = getComputedStyle(el);
      const pos = cs.position;
      if (pos === 'fixed' || pos === 'absolute' || pos === 'sticky') { for (const c of el.children) walk(c); return; }
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && el.offsetParent !== null && r.right > vw + 1 && !inScroll(el))
        off.push({ tag: el.tagName.toLowerCase(), right: Math.round(r.right) });
      for (const c of el.children) walk(c);
    };
    walk(document.body);
    const taps = [...document.querySelectorAll('button,a,[role=button]')].map(e => {
      const r = e.getBoundingClientRect();
      // capture inline vs block status to catch ignored min-height on inline <a>
      const cs = getComputedStyle(e);
      return { w: Math.round(r.width), h: Math.round(r.height), display: cs.display, tag: e.tagName.toLowerCase(),
               cls: (e.className && e.className.toString().slice(0, 60)) || '', href: e.getAttribute('href') || '' };
    }).filter(t => t.h > 0);
    const smallTaps = taps.filter(t => t.w < 44 || t.h < 44).map(t => ({ w: t.w, h: t.h, display: t.display, tag: t.tag, cls: t.cls, href: t.href }));
    return { docOverflow, realOff: off.length, offList: off.slice(0, 10), totalTaps: taps.length, smallTaps };
  }, VW);
  gates[route] = { ...res, consoleErrs: errs.length, errSamples: errs.slice(0, 4) };
  totalSmall += res.smallTaps.length; totalReal += res.realOff; totalConsole += errs.length; totalDoc += Math.max(0, res.docOverflow - 2);
  await ctx.close();
}

const bad = Object.entries(gates).filter(([_, g]) => g.realOff > 0 || g.docOverflow > 2 || g.consoleErrs > 0 || g.smallTaps.length > 0);
fs.writeFileSync('verify-report.json', JSON.stringify(gates, null, 2));

// Print a compact failure summary
console.log('=== ROUTE SUMMARY ===');
for (const [route, g] of Object.entries(gates)) {
  const flags = [];
  if (g.realOff > 0) flags.push(`OFF=${g.realOff}`);
  if (g.docOverflow > 2) flags.push(`DOC=${g.docOverflow}`);
  if (g.consoleErrs > 0) flags.push(`CON=${g.consoleErrs}`);
  if (g.smallTaps.length > 0) flags.push(`TAP=${g.smallTaps.length}`);
  console.log(`${flags.length ? 'FAIL' : 'ok  '} ${route.padEnd(28)} ${flags.join(' ')}`);
  if (g.smallTaps.length > 0) {
    for (const t of g.smallTaps.slice(0, 8)) console.log(`       small: ${t.tag} ${t.w}x${t.h} disp=${t.display} ${t.cls} ${t.href}`);
  }
  if (g.consoleErrs > 0) console.log(`       errs: ${g.errSamples.join(' | ')}`);
}
console.log(`\nROUTES=${ROUTES.length} FAILING=${bad.length} totalSmall=${totalSmall} totalReal=${totalReal} totalConsole=${totalConsole} totalDocOverflow=${totalDoc}`);
await browser.close();
process.exit(bad.length ? 1 : 0);
