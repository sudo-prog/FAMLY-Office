import { chromium } from 'playwright';
const baseUrl = 'http://localhost:5173';
const outDir = '/tmp/fo-audit2';
const fs = await import('fs');
const path = await import('path');
fs.mkdirSync(outDir, { recursive: true });

const ROUTES = ['/','/assets','/transactions','/vault','/entities','/report','/projections','/home-office','/research','/tax-report','/estate','/targets','/report/benchmarks','/research/watchlist','/assets/prices','/settings','/notifications','/white-label','/admin/users','/admin/audit-log','/settings/bank-feed','/projections/cash-flow'];
const VIEWS = [{name:'mobile',w:390,h:844},{name:'desktop',w:1440,h:900}];
const PIN='123456';
const browser = await chromium.launch({ headless: true });
const report = {};

// unlock once, persist storage state
for (const v of VIEWS) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.setViewportSize({ width: v.w, height: v.h });
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' }).catch(()=>{});
  await page.waitForTimeout(1200);
  for (const d of PIN) {
    await page.evaluate((digit)=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent&&x.textContent.trim()===digit);if(b)b.click();}, d);
    await page.waitForTimeout(200);
  }
  await page.waitForTimeout(1000);
  await ctx.storageState({ path: path.join(outDir, `state-${v.name}.json`) }).catch(()=>{});
  await ctx.close();
}

for (const route of ROUTES) {
  report[route] = {};
  for (const v of VIEWS) {
    const ctx = await browser.newContext({ storageState: path.join(outDir, `state-${v.name}.json`) });
    const page = await ctx.newPage();
    await page.setViewportSize({ width: v.w, height: v.h });
    const errs = [];
    page.on('console', m => { if (m.type()==='error') errs.push(m.text().slice(0,160)); });
    page.on('pageerror', e => errs.push('PE:'+e.message.slice(0,160)));
    const url = baseUrl.replace(/\/$/,'')+route;
    let status='ok';
    try { const r = await page.goto(url,{waitUntil:'domcontentloaded',timeout:15000}); status=r?r.status():'nr'; } catch(e){ status='ERR:'+e.message.split('\n')[0].slice(0,60); }
    await page.waitForTimeout(1500);
    const out = path.join(outDir, `${v.name}${route.replace(/\//g,'_')||'_root'}.png`);
    await page.screenshot({ path: out, fullPage: false }).catch(()=>{});
    const m = await page.evaluate(()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth,ov:document.documentElement.scrollWidth>document.documentElement.clientWidth+1,h1:(document.querySelector('h1')?.textContent||'').slice(0,50)})).catch(()=>({}));
    // count visible interactive elements that overflow right edge
    report[route][v.name] = { status, overflowX:!!m.ov, h1:m.h1||'', sw:m.sw, cw:m.cw, errs:errs.slice(0,5) };
    await ctx.close();
  }
}
fs.writeFileSync(path.join(outDir,'report.json'), JSON.stringify(report,null,2));
console.log('FO_AUDIT2_DONE routes='+ROUTES.length);
await browser.close();
