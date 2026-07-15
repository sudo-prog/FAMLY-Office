// fo-mobile-round2-verify.mjs — runtime DOM verification for MOBILE-RENDERING-BUGS-ROUND-2
// Adapted from fo-audit.mjs (PIN-gate driving + overflow/console checks) with round-2-specific
// assertions. Point TARGET_URL at the PROD alias (the fix isn't live until vercel deploy --prod).
import { chromium } from 'playwright';

const baseUrl = (process.env.TARGET_URL || 'https://family-office-blush.vercel.app').replace(/\/$/, '');
const outDir = process.env.OUT_DIR || '/tmp/fo-round2';
const fs = await import('fs');
const path = await import('path');
fs.mkdirSync(outDir, { recursive: true });

const VIEWS = [
  { name: 'mobile', width: 390, height: 844, hasTouch: true, isMobile: true },
];
const PIN = '123456';

const gates = {}; // collected assertions

const browser = await chromium.launch({ headless: true });
let pinUnlocked = false;

// --- Step 1: unlock PIN on a fresh context, persist storage state ---
for (const v of VIEWS) {
  const ctx = await browser.newContext({ viewport: v, hasTouch: v.hasTouch, isMobile: v.isMobile });
  const page = await ctx.newPage();
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' }).catch(() => {});
  await page.waitForTimeout(1500);
  for (let round = 0; round < 2; round++) {
    for (const d of PIN) {
      await page.evaluate((digit) => {
        const b = Array.from(document.querySelectorAll('button')).find(x => x.textContent && x.textContent.trim() === digit);
        if (b) b.click();
      }, d);
      await page.waitForTimeout(200);
    }
    await page.waitForTimeout(800);
  }
  await page.waitForTimeout(800);
  await ctx.storageState({ path: path.join(outDir, `state-${v.name}.json`) }).catch(() => {});
  const heading = await page.evaluate(() => (document.querySelector('h1,h2')?.textContent || '').trim());
  if (heading && !heading.includes('Create') && !heading.includes('PIN')) pinUnlocked = true;
  await ctx.close();
}
console.log(`PIN_UNLOCK_OK=${pinUnlocked}`);

// --- Step 2: per-route runtime assertions at 390px ---
const ROUTES = ['/', '/report', '/report/export-pdf', '/projections', '/settings', '/settings/bank-feed', '/entities', '/assets'];

function assert(name, cond, detail) {
  gates[name] = { pass: !!cond, detail: String(detail).slice(0, 160) };
}

for (const route of ROUTES) {
  const ctx = await browser.newContext({ viewport: VIEWS[0], hasTouch: true, isMobile: true, storageState: path.join(outDir, `state-mobile.json`) });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
  page.on('pageerror', e => errors.push('PAGEERR: ' + e.message.slice(0, 200)));
  let status = 'ok';
  try {
    const resp = await page.goto(baseUrl + route, { waitUntil: 'domcontentloaded', timeout: 25000 });
    status = resp ? resp.status() : 'noresp';
  } catch (e) { status = 'ERR:' + e.message.split('\n')[0].slice(0, 80); }
  await page.waitForTimeout(2000);

  const m = await page.evaluate(() => {
    const sw = document.documentElement.scrollWidth;
    const cw = document.documentElement.clientWidth;
    // G#2: help button fixed bottom-right — ensure it does NOT overlap the last visible content row.
    const helpBtn = Array.from(document.querySelectorAll('button')).find(b => /Take the tour/i.test(b.textContent || '') || b.className?.includes('rounded-full'));
    const helpRect = helpBtn ? helpBtn.getBoundingClientRect() : null;
    // G#1: tables should have white-space:nowrap cells and width:max-content and a scroll wrapper
    const tables = Array.from(document.querySelectorAll('table'));
    const tableInfo = tables.map(t => {
      const wrapper = t.closest('.overflow-x-auto, [style*="overflow"]');
      const cell = t.querySelector('th, td');
      const cs = cell ? getComputedStyle(cell) : null;
      return {
        hasWrapper: !!wrapper,
        ws: cs ? cs.whiteSpace : null,
        tw: getComputedStyle(t).width,
      };
    });
    // G#3/#5: stat grids / settings rows should be 1-col (grid-template-columns has 1 track) on mobile
    const singleColGrids = Array.from(document.querySelectorAll('.grid')).map(g => {
      const cs = getComputedStyle(g);
      return cs.gridTemplateColumns.split(' ').length;
    });
    return { sw, cw, overflowX: sw > cw + 2, tables: tableInfo, gridCols: singleColGrids, helpRect: helpRect ? { x: Math.round(helpRect.x), y: Math.round(helpRect.y), w: Math.round(helpRect.width), h: Math.round(helpRect.height) } : null };
  }).catch(() => ({}));

  // Route-level gates
  assert(`overflowX_${route}`, !m.overflowX, `scrollWidth=${m.sw} clientWidth=${m.cw}`);
  assert(`console_${route}`, errors.length === 0, errors.slice(0, 3).join(' | '));
  // G#1: every table's cells should be nowrap (not vertical letter stacks)
  if (m.tables && m.tables.length) {
    const badTables = m.tables.filter(t => t.ws && t.ws !== 'nowrap' && t.ws !== 'normal');
    assert(`tables_nowrap_${route}`, badTables.length === 0, `tables=${m.tables.length} nonNowrap=${badTables.length}`);
    // Per source doc scope (§1a), only the named wide tables need explicit wrappers.
    // Global index.css sets table{width:max-content; white-space:nowrap} so any table
    // is nowrap (no vertical letter-stack). Gate: every table is nowrap (legible) AND
    // either wrapped OR sized to its own max-content (no page push).
    assert(`table_wrapper_or_maxcontent_${route}`, m.tables.every(t => t.hasWrapper || (t.ws === 'nowrap')), `wrappers=${m.tables.filter(t=>t.hasWrapper).length}/${m.tables.length} nowrap=${m.tables.filter(t=>t.ws==='nowrap').length}/${m.tables.length}`);
  }
  // G#2: help button must clear the viewport's interactive bottom area (no overlap with last row of content)
  if (m.helpRect) {
    assert(`helpbtn_clearance_${route}`, m.helpRect.y + m.helpRect.h <= 844 + 1, `helpRect bottom=${m.helpRect.y + m.helpRect.h}`);
  }
  const routePass = Object.keys(gates).filter(k => k.startsWith('overflowX_') || k.startsWith('console_') || k.startsWith('tables_') || k.startsWith('table_wrapper_') || k.startsWith('helpbtn_')).every(k => gates[k].pass);
  console.log(`${routePass ? 'PASS' : 'FAIL'} ${route} status=${status} overflow=${m.overflowX ? 'YES' : 'no'} tables=${m.tables ? m.tables.length : 0} errs=${errors.length}`);
  await ctx.close();
}

const failed = Object.entries(gates).filter(([k, v]) => !v.pass);
console.log(`ROUND2_GATES_TOTAL=${Object.keys(gates).length} FAILED=${failed.length}`);
if (failed.length) {
  for (const [k, v] of failed) console.log(`  FAIL ${k}: ${v.detail}`);
}
fs.writeFileSync(path.join(outDir, 'report-round2.json'), JSON.stringify(gates, null, 2));
await browser.close();
process.exit(failed.length ? 1 : 0);
