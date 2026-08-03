// fo-verify-mobile.cjs — canonical §2 per-element mobile gate (MOBILE-UI-STANDARD)
// Runs against the LIVE prod url at 390x844. PIN 123456.
// Gate asserts: docOverflow<=2 AND realOff===0 AND consoleErrs===0 AND smallTaps===0
import { chromium } from 'playwright';
import fs from 'fs';

const BASE = (process.env.TARGET_URL || 'https://family-office-superpowerstudio.vercel.app').replace(/\/$/, '');
const VW = 390, PIN = process.env.PIN || '123456';
const ROUTES = [
  '/', '/assets', '/transactions', '/vault', '/entities', '/entities/:id',
  '/report', '/projections', '/home-office', '/research', '/tax-report',
  '/report/tax-year', '/entities/:id/tax', '/admin/audit-log', '/notifications',
  '/settings/bank-feed', '/projections/cash-flow', '/targets', '/report/benchmarks',
  '/research/watchlist', '/assets/prices', '/estate', '/white-label',
  '/admin/ocr', '/admin/users', '/report/export-pdf', '/settings'
].map(r => r.replace(':id', '1'));

const browser = await chromium.launch({ headless: true });

// Unlock PIN once, persist storageState
const u = await browser.newContext({ viewport: { width: VW, height: 844 }, hasTouch: true, isMobile: true });
const up = await u.newPage();
await up.goto(BASE, { waitUntil: 'domcontentloaded' }).catch(() => {});
await up.waitForTimeout(1500);
for (let r = 0; r < 2; r++) {
  for (const d of PIN) {
    await up.evaluate((x) => {
      const b = [...document.querySelectorAll('button')].find(b => b.textContent && b.textContent.trim() === x);
      if (b) b.click();
    }, d);
    await up.waitForTimeout(200);
  }
  await up.waitForTimeout(800);
}
await up.waitForTimeout(800);
await u.storageState({ path: 'state.json' });
await u.close();

const gates = {};
for (const route of ROUTES) {
  const ctx = await browser.newContext({ viewport: { width: VW, height: 844 }, hasTouch: true, isMobile: true, storageState: 'state.json' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', e => errs.push('PE:' + e.message));
  try { await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 25000 }); } catch (e) {}
  await page.waitForTimeout(2500); // SSE/AI: NO networkidle

  const res = await page.evaluate((vw) => {
    const docOverflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    const inScroll = (el) => {
      let p = el.parentElement;
      while (p) {
        const cs = getComputedStyle(p);
        if ((cs.overflowX === 'auto' || cs.overflowX === 'scroll' || cs.overflowX === 'hidden') && p.getBoundingClientRect().width <= vw + 1) return true;
        p = p.parentElement;
      }
      return false;
    };
    const off = [];
    const walk = (el) => {
      const cs = getComputedStyle(el);
      const pos = cs.position;
      if (pos === 'fixed' || pos === 'absolute' || pos === 'sticky') {
        for (const c of el.children) walk(c);
        return;
      }
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && el.offsetParent !== null && r.right > vw + 1 && !inScroll(el)) {
        off.push({ tag: el.tagName.toLowerCase(), right: Math.round(r.right) });
      }
      for (const c of el.children) walk(c);
    };
    walk(document.body);
    const taps = [...document.querySelectorAll('button,a,[role=button]')]
      .map(e => { const r = e.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; })
      .filter(t => t.h > 0);
    const smallTaps = taps.filter(t => t.w < 44 || t.h < 44).length;
    return { docOverflow, realOff: off.length, offList: off.slice(0, 10), totalTaps: taps.length, smallTaps };
  }, VW);
  gates[route] = { ...res, consoleErrs: errs.length };
  await ctx.close();
}

const bad = Object.entries(gates).filter(([_, g]) => g.realOff > 0 || g.docOverflow > 2 || g.consoleErrs > 0 || g.smallTaps > 0);
fs.writeFileSync('verify-report.json', JSON.stringify(gates, null, 2));
console.log(`ROUTES=${ROUTES.length} FAILING=${bad.length}`);
for (const [k, v] of bad) console.log(`  FAIL ${k}: realOff=${v.realOff} docOverflow=${v.docOverflow} smallTaps=${v.smallTaps} consoleErrs=${v.consoleErrs} offList=${JSON.stringify(v.offList)}`);
process.exit(bad.length ? 1 : 0);
