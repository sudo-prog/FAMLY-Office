import { chromium } from 'playwright';
const baseUrl = 'http://localhost:5173';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const logs = [];
page.on('console', m => logs.push(m.type() + ': ' + m.text().slice(0, 200)));
page.on('pageerror', e => logs.push('PAGEERR: ' + e.message.slice(0, 200)));
await page.goto(baseUrl + '/assets', { waitUntil: 'networkidle' }).catch(e => logs.push('NAV:'+e.message));
await page.waitForTimeout(3000);
// Evaluate what the API returns and what the component sees
const probe = await page.evaluate(async () => {
  try {
    const r = await fetch('/api/assets');
    const t = await r.text();
    let parsed; try { parsed = JSON.parse(t); } catch(e) { parsed = t; }
    return {
      status: r.status,
      type: Array.isArray(parsed) ? 'array' : typeof parsed,
      sample: Array.isArray(parsed) ? ('len='+parsed.length) : (typeof parsed === 'object' ? Object.keys(parsed).slice(0,8) : String(parsed).slice(0,100)),
      rawHead: t.slice(0, 200),
    };
  } catch (e) { return { error: String(e) }; }
});
console.log('PROBE:', JSON.stringify(probe, null, 2));
console.log('LOGS:'); logs.slice(0, 20).forEach(l => console.log('  ' + l));
await browser.close();
