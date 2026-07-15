// fo-screenshot.mjs — capture 390px screenshots of key routes (with PIN unlock) for visual review.
import { chromium } from 'playwright';
const baseUrl = (process.env.TARGET_URL || 'https://family-office-blush.vercel.app').replace(/\/$/, '');
const outDir = process.env.OUT_DIR || '/tmp/fo-shots';
import fs from 'fs';
fs.mkdirSync(outDir, { recursive: true });
const PIN = '123456';
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
const page = await ctx.newPage();
await page.goto(baseUrl, { waitUntil: 'domcontentloaded' }).catch(() => {});
await page.waitForTimeout(1500);
for (let round = 0; round < 2; round++) {
  for (const d of PIN) {
    await page.evaluate((digit) => { const b = Array.from(document.querySelectorAll('button')).find(x => x.textContent && x.textContent.trim() === digit); if (b) b.click(); }, d);
    await page.waitForTimeout(200);
  }
  await page.waitForTimeout(800);
}
await page.waitForTimeout(800);
const ROUTES = ['/', '/report', '/report/export-pdf', '/projections', '/settings'];
for (const r of ROUTES) {
  await page.goto(baseUrl + r, { waitUntil: 'domcontentloaded' }).catch(() => {});
  await page.waitForTimeout(2500);
  const file = path.join(outDir, `shot${r.replace(/\//g, '_') || '_root'}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`shot ${r} -> ${file}`);
}
await browser.close();
import path from 'path';
