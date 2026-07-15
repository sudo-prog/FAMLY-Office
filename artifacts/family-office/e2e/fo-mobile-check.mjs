import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const BASE = process.env.BASE || 'https://family-office-blush.vercel.app';
const SHOT = process.env.SCREENSHOT_DIR || '/tmp/fo-mobile-shots';
mkdirSync(SHOT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const consoleErrors = [];
page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', e => consoleErrors.push('PAGEERROR: ' + e.message));

const report = [];
const routes = ['/', '/dashboard', '/assets', '/vault', '/ledger'];
for (const r of routes) {
  const url = BASE + r;
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
  } catch (e) { report.push({ route: r, gotoError: String(e).slice(0,120) }); continue; }
  await page.waitForTimeout(800);
  // find touch-invisible primary actions: opacity 0 + group-hover (no md) and interactive
  const audit = await page.evaluate(() => {
    const out = [];
    const els = document.querySelectorAll('button,a,[role="button"],input,[onclick]');
    els.forEach(el => {
      const cs = getComputedStyle(el);
      const cls = (el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className) || '';
      if (cs.opacity === '0' && /group-hover/.test(cls) && !/md:opacity-0/.test(cls)) {
        out.push({ tag: el.tagName, cls: String(cls).slice(0,120), pe: cs.pointerEvents });
      }
    });
    // also check horizontal overflow (classic mobile breakage)
    const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    return { hidden: out, overflowX: overflow };
  });
  await page.screenshot({ path: `${SHOT}/fo-${r.replace(/\//g,'_')||'root'}.png`, fullPage: false });
  report.push({ route: r, consoleErrors: consoleErrors.slice(0,5), audit });
}
console.log(JSON.stringify(report, null, 2));
await browser.close();
