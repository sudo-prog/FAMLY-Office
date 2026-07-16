// fo-scan-inflow.mjs — find ONLY in-flow content that exceeds the 390 viewport (excludes off-canvas fixed/absolute drawers)
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
const baseUrl = (process.env.TARGET_URL || 'https://family-office-blush.vercel.app').replace(/\/$/, '');
const outDir = process.env.OUT_DIR || '/tmp/fo-all';
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
  try { const resp = await page.goto(baseUrl + route, { waitUntil: 'domcontentloaded', timeout: 25000 }); await page.waitForTimeout(2500); } catch (e) { await page.waitForTimeout(1500); }
  const offenders = await page.evaluate((vw) => {
    const out = [];
    const inFlow = (el) => {
      const pos = getComputedStyle(el).position;
      return pos !== 'fixed' && pos !== 'absolute' && pos !== 'sticky';
    };
    const walk = (el) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && inFlow(el) && el.offsetParent !== null) {
        if (r.right > vw + 1) {
          const txt = (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 50);
          const cls = (typeof el.className === 'string' ? el.className : '').toString().slice(0, 80);
          out.push({ tag: el.tagName.toLowerCase(), right: Math.round(r.right), w: Math.round(r.width), cls, txt });
        }
      }
      for (const c of el.children) walk(c);
    };
    walk(document.body);
    return out.sort((a, b) => b.right - a.right).slice(0, 30);
  }, VW).catch(() => []);
  report[route] = { inflowOffenders: offenders.length, list: offenders };
  console.log(`${route} INFLOW_overflow=${offenders.length}`);
  await ctx.close();
}
fs.writeFileSync(path.join(outDir, 'inflow-report.json'), JSON.stringify(report, null, 2));
const total = Object.values(report).reduce((s, r) => s + r.inflowOffenders, 0);
console.log(`TOTAL_INFLOW_OVERFLOW=${total}`);
await browser.close();
