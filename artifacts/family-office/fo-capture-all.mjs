// fo-capture-all.mjs — capture ALL routes @390px + per-element overflow scan (the real "fits mobile" test)
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
const baseUrl = (process.env.TARGET_URL || 'https://family-office-blush.vercel.app').replace(/\/$/, '');
const outDir = process.env.OUT_DIR || '/tmp/fo-all';
fs.mkdirSync(outDir, { recursive: true });
const VW = 390; // iPhone viewport width
const PIN = '123456';
const ROUTES = ['/', '/admin/audit-log', '/admin/ocr', '/admin/users', '/assets', '/assets/prices',
  '/entities', '/estate', '/home-office', '/notifications', '/projections', '/projections/cash-flow',
  '/report', '/report/benchmarks', '/report/export-pdf', '/report/tax-year', '/research',
  '/research/watchlist', '/settings', '/settings/bank-feed', '/targets', '/tax-report',
  '/transactions', '/vault', '/white-label'];
const browser = await chromium.launch({ headless: true });

// unlock PIN once
const uctx = await browser.newContext({ viewport: { width: VW, height: 844 }, hasTouch: true, isMobile: true });
const up = await uctx.newPage();
await up.goto(baseUrl, { waitUntil: 'domcontentloaded' }).catch(() => {});
await up.waitForTimeout(1500);
for (let r = 0; r < 2; r++) { for (const d of PIN) { await up.evaluate(x => { const b = [...document.querySelectorAll('button')].find(b => b.textContent && b.textContent.trim() === x); if (b) b.click(); }, d); await up.waitForTimeout(200); } await up.waitForTimeout(800); }
await up.waitForTimeout(800);
await uctx.storageState({ path: path.join(outDir, 'state.json') }).catch(() => {});
const heading = await up.evaluate(() => (document.querySelector('h1,h2')?.textContent || '').trim());
console.log(`PIN_UNLOCK_OK=${heading && !heading.includes('PIN')}`);
await uctx.close();

const report = {};
for (const route of ROUTES) {
  const ctx = await browser.newContext({ viewport: { width: VW, height: 844 }, hasTouch: true, isMobile: true, storageState: path.join(outDir, 'state.json') });
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 120)); });
  page.on('pageerror', e => errs.push('PAGEERR: ' + e.message.slice(0, 120)));
  let status = 'ok';
  try { const resp = await page.goto(baseUrl + route, { waitUntil: 'domcontentloaded', timeout: 25000 }); status = resp ? resp.status() : 'noresp'; } catch (e) { status = 'ERR:' + e.message.split('\n')[0].slice(0, 60); }
  await page.waitForTimeout(2500);
  const file = path.join(outDir, `shot${route.replace(/\//g, '_') || '_root'}.png`);
  await page.screenshot({ path: file, fullPage: false });
  // PER-ELEMENT overflow: any element whose box extends past the 390 viewport (clipped or pushed off)
  const offenders = await page.evaluate((vw) => {
    const out = [];
    const walk = (el) => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        const right = r.right, left = r.left;
        if (right > vw + 1 || left < -1) {
          const txt = (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 50);
          const cls = (el.className && el.className.baseVal !== undefined ? el.className.baseVal : (typeof el.className === 'string' ? el.className : '')).toString().slice(0, 70);
          out.push({ tag: el.tagName.toLowerCase(), right: Math.round(right), left: Math.round(left), w: Math.round(r.width), cls, txt });
        }
      }
      for (const c of el.children) walk(c);
    };
    walk(document.body);
    // de-dup by rough signature, keep widest
    return out.sort((a, b) => b.right - a.right).slice(0, 40);
  }, VW).catch(() => []);
  report[route] = { status, shot: file, consoleErrors: errs.length, offenders: offenders.length, offendersList: offenders };
  console.log(`${route} status=${status} overflowElems=${offenders.length} errs=${errs.length}`);
  await ctx.close();
}
fs.writeFileSync(path.join(outDir, 'overflow-report.json'), JSON.stringify(report, null, 2));
const total = Object.values(report).reduce((s, r) => s + r.offenders, 0);
console.log(`TOTAL_ROUTES=${ROUTES.length} TOTAL_OVERFLOW_ELEMS=${total}`);
await browser.close();
