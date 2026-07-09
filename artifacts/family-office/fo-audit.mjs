import { chromium } from 'playwright';

const baseUrl = process.env.TARGET_URL || 'http://localhost:5180';
const outDir = process.env.OUT_DIR || '/tmp/fo-audit';
const fs = await import('fs');
const path = await import('path');
fs.mkdirSync(outDir, { recursive: true });

// Real routes from src/App.tsx (nested Switch)
const ROUTES = [
  '/', '/assets', '/transactions', '/vault', '/entities', '/report',
  '/projections', '/home-office', '/research', '/tax-report', '/estate',
  '/targets', '/report/benchmarks', '/research/watchlist', '/assets/prices',
  '/settings', '/notifications', '/white-label', '/admin/users', '/admin/audit-log',
  '/settings/bank-feed', '/projections/cash-flow', '/report/tax-year', '/entities/1',
  '/admin/ocr', '/vault/ocr', '/report/export-pdf', '/entities/1/tax'
];

const VIEWS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1440, height: 900 },
];

const PIN = '123456';
const browser = await chromium.launch({ headless: true });
const report = {};
let pinUnlocked = false;

// Step 1: unlock PIN on a fresh context and persist storage state
for (const v of VIEWS) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.setViewportSize({ width: v.width, height: v.height });
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' }).catch(() => {});
  await page.waitForTimeout(1500);
  // Drive on-screen digit buttons to set PIN 123456 (setup then confirm)
  for (let round = 0; round < 2; round++) {
    for (const d of PIN) {
      const clicked = await page.evaluate((digit) => {
        const btns = Array.from(document.querySelectorAll('button'));
        const b = btns.find(x => x.textContent && x.textContent.trim() === digit);
        if (b) { b.click(); return true; }
        return false;
      }, d);
      await page.waitForTimeout(200);
    }
    await page.waitForTimeout(800);
  }
  await page.waitForTimeout(800);
  await ctx.storageState({ path: path.join(outDir, `state-${v.name}.json`) }).catch(() => {});
  // Verify unlock worked
  const heading = await page.evaluate(() => (document.querySelector('h1,h2')?.textContent||'').trim());
  console.log(`PIN setup ${v.name}: heading after = "${heading}"`);
  if (heading && !heading.includes('Create') && !heading.includes('PIN')) pinUnlocked = true;
  await ctx.close();
}
console.log(`PIN_UNLOCK_OK=${pinUnlocked}`);

// Step 2: audit each route with unlocked state, per-view
let failures = 0;
for (const route of ROUTES) {
  report[route] = {};
  for (const v of VIEWS) {
    const ctx = await browser.newContext({ storageState: path.join(outDir, `state-${v.name}.json`) });
    const page = await ctx.newPage();
    await page.setViewportSize({ width: v.width, height: v.height });
    const errors = [];
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
    page.on('pageerror', e => errors.push('PAGEERR: ' + e.message.slice(0, 200)));
    let status = 'ok';
    try {
      const resp = await page.goto(baseUrl.replace(/\/$/, '') + route, { waitUntil: 'networkidle', timeout: 25000 });
      status = resp ? resp.status() : 'noresp';
    } catch (e) { status = 'ERR:' + e.message.split('\n')[0].slice(0, 80); }
    await page.waitForTimeout(1800);
    const m = await page.evaluate(() => {
      const bodyText = document.body.innerText.replace(/\s+/g, ' ').trim();
      return {
        sw: document.documentElement.scrollWidth,
        cw: document.documentElement.clientWidth,
        overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
        h1: (document.querySelector('h1,h2')?.textContent || '').slice(0, 60).trim(),
        rows: document.querySelectorAll('tbody tr').length,
        tables: document.querySelectorAll('table').length,
        nestedThead: document.querySelectorAll('thead thead').length,
        errText: bodyText.includes('Widget unavailable') || bodyText.includes('Application error') || bodyText.includes('Something went wrong'),
        len: bodyText.length,
        pinScreen: bodyText.includes('Create Your PIN') || bodyText.includes('Enter your PIN'),
      };
    }).catch(() => ({}));
    const pass = m.h1 && m.len > 120 && errors.length === 0 && !m.errText && m.nestedThead === 0 && !m.pinScreen;
    if (!pass) failures++;
    report[route][v.name] = { status, overflowX: !!m.overflowX, heading: m.h1 || '', rows: m.rows, tables: m.tables, nestedThead: m.nestedThead, len: m.len, pinScreen: !!m.pinScreen, errors: errors.slice(0, 4) };
    console.log(`${pass ? 'PASS' : 'FAIL'} ${v.name} ${route} status=${status} h="${m.h1}" rows=${m.rows} errs=${errors.length} nestedThead=${m.nestedThead} pin=${m.pinScreen}`);
    await ctx.close();
  }
}

fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));
console.log(`FO_AUDIT_DONE failures=${failures}`);
await browser.close();
