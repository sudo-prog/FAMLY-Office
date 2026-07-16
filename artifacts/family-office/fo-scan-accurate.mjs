// fo-scan-accurate.mjs — measure REAL breakage: page-level overflow + offenders NOT inside a scroll container
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
const baseUrl = (process.env.TARGET_URL || 'https://family-office-blush.vercel.app').replace(/\/$/, '');
const outDir = process.env.OUT_DIR || '/tmp/fo-all3';
fs.mkdirSync(outDir, { recursive: true });
const VW = 390;
const PIN = '123456';
const ROUTES = ['/', '/admin/audit-log', '/admin/ocr', '/admin/users', '/assets', '/assets/prices',
  '/entities', '/estate', '/home-office', '/notifications', '/projections', '/projections/cash-flow',
  '/report', '/report/benchmarks', '/report/export-pdf', '/report/tax-year', '/research',
  '/research/watchlist', '/settings', '/settings/bank-feed', '/targets', '/tax-report',
  '/transactions', '/vault', '/white-label'];
const browser = await chromium.launch({ headless: true });
const uctx = await browser.newContext({ viewport: { width: VW, height: 844 }, hasTouch: true, isMobile: true });
const up = await uctx.newPage();
await up.goto(baseUrl, { waitUntil: 'domcontentloaded' }).catch(() => {});
await up.waitForTimeout(1500);
for (let r = 0; r < 2; r++) { for (const d of PIN) { await up.evaluate(x => { const b = [...document.querySelectorAll('button')].find(b => b.textContent && b.textContent.trim() === x); if (b) b.click(); }, d); await up.waitForTimeout(200); } await up.waitForTimeout(800); }
await up.waitForTimeout(800);
await uctx.storageState({ path: path.join(outDir, 'state.json') }).catch(() => {});
await uctx.close();

const report = {};
for (const route of ROUTES) {
  const ctx = await browser.newContext({ viewport: { width: VW, height: 844 }, hasTouch: true, isMobile: true, storageState: path.join(outDir, 'state.json') });
  const page = await ctx.newPage();
  try { await page.goto(baseUrl + route, { waitUntil: 'domcontentloaded', timeout: 25000 }); await page.waitForTimeout(2500); } catch (e) { await page.waitForTimeout(1500); }
  const res = await page.evaluate((vw) => {
    const docOverflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    // real offenders: in-flow, past viewport, NOT inside any overflow-x scroll/clip ancestor
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
      if (pos === 'fixed' || pos === 'absolute' || pos === 'sticky') { for (const c of el.children) walk(c); return; }
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && el.offsetParent !== null && r.right > vw + 1) {
        if (!inScroll(el)) {
          off.push({ tag: el.tagName.toLowerCase(), right: Math.round(r.right), w: Math.round(r.width), cls: (typeof el.className === 'string' ? el.className : '').toString().slice(0, 70), txt: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40) });
        }
      }
      for (const c of el.children) walk(c);
    };
    walk(document.body);
    return { docOverflow, realOffenders: off.sort((a, b) => b.right - a.right).slice(0, 20) };
  }, VW).catch(() => ({ docOverflow: -1, realOffenders: [] }));
  report[route] = { docOverflowX: res.docOverflow, realOffenders: res.realOffenders.length, list: res.realOffenders };
  console.log(`${route} PAGE_overflowX=${res.docOverflow} REAL_offenders=${res.realOffenders.length}`);
  await ctx.close();
}
fs.writeFileSync(path.join(outDir, 'accurate-report.json'), JSON.stringify(report, null, 2));
const total = Object.values(report).reduce((s, r) => s + r.realOffenders, 0);
const pageBad = Object.entries(report).filter(([_, r]) => r.docOverflowX > 2).map(([k]) => k);
console.log(`TOTAL_REAL_OFFENDERS=${total}  ROUTES_WITH_PAGE_OVERFLOW=${pageBad.length} ${pageBad}`);
await browser.close();
