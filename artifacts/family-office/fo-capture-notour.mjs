// fo-capture-notour.mjs — unlock PIN + dismiss onboarding tour, then screenshot every route (no tour overlay)
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
const baseUrl = (process.env.TARGET_URL || 'https://family-office-blush.vercel.app').replace(/\/$/, '');
const outDir = process.env.OUT_DIR || '/tmp/fo-shots-clean';
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
// dismiss onboarding tour if present
await up.evaluate(() => { try { localStorage.setItem('fo-tour-done', '1'); sessionStorage.setItem('fo-tour-done', '1'); } catch (e) {} });
// click "Skip Tour" if visible
const skip = await up.$('button');
await up.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => /skip tour/i.test(x.textContent || '')); if (b) b.click(); }).catch(() => {});
await up.waitForTimeout(1500);
await uctx.storageState({ path: path.join(outDir, 'state.json') }).catch(() => {});
await uctx.close();

let done = 0;
for (const route of ROUTES) {
  const ctx = await browser.newContext({ viewport: { width: VW, height: 844 }, hasTouch: true, isMobile: true, storageState: path.join(outDir, 'state.json') });
  const page = await ctx.newPage();
  try { await page.goto(baseUrl + route, { waitUntil: 'domcontentloaded', timeout: 25000 }); await page.waitForTimeout(2800); } catch (e) { await page.waitForTimeout(1500); }
  // ensure tour dismissed on this page too
  await page.evaluate(() => { try { localStorage.setItem('fo-tour-done', '1'); } catch (e) {} });
  await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => /skip tour/i.test(x.textContent || '')); if (b) b.click(); }).catch(() => {});
  await page.waitForTimeout(1200);
  const file = path.join(outDir, `shot${route.replace(/\//g, '_') || '_root'}.png`);
  await page.screenshot({ path: file, fullPage: false });
  done++;
  await ctx.close();
}
console.log(`CAPTURED ${done} routes (tour dismissed) -> ${outDir}`);
await browser.close();
