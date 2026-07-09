import { chromium } from 'playwright';
const baseUrl = 'http://localhost:5173';
const outDir = '/tmp/fo-audit2';
const fs = await import('fs');
const path = await import('path');
const PIN='123456';
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();

async function unlock() {
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' }).catch(()=>{});
  await page.waitForTimeout(1500);
  for (const d of PIN) {
    await page.evaluate((digit)=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent&&x.textContent.trim()===digit);if(b)b.click();}, d).catch(()=>{});
    await page.waitForTimeout(250);
  }
  await page.waitForTimeout(1200);
}
await unlock();

const ROUTES = ['/','/assets','/transactions','/vault','/entities','/report','/projections','/home-office','/research','/tax-report','/estate','/targets','/report/benchmarks','/research/watchlist','/assets/prices','/settings','/notifications','/white-label','/admin/users','/admin/audit-log','/settings/bank-feed','/projections/cash-flow'];
const report = {};
for (const route of ROUTES) {
  const url = baseUrl.replace(/\/$/,'')+route;
  try { await page.goto(url,{waitUntil:'domcontentloaded',timeout:15000}); } catch(e){ report[route]={error:String(e).slice(0,100)}; continue; }
  await page.waitForTimeout(1500);
  const a = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const out = { offscreen:0, offscreenSamples:[], tiny:0, hscroll:0, nav:false, tableOverflow:false, cards:0, unstyledCards:0 };
    document.querySelectorAll('*').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width>0 && r.right > vw+1.5) { out.offscreen++; if(out.offscreenSamples.length<4) out.offscreenSamples.push(el.tagName+'.'+String(el.className||'').slice(0,30)); }
      if ((el.tagName==='BUTTON'||el.tagName==='A') && r.width>0 && (r.height<36||r.width<36)) out.tiny++;
    });
    document.querySelectorAll('div,section,main,ul').forEach(el=>{ if(el.scrollWidth>el.clientWidth+2 && el.clientWidth>0) out.hscroll++; });
    out.nav = !!document.querySelector('nav,header,[role="navigation"],aside');
    document.querySelectorAll('table').forEach(t=>{ if(t.scrollWidth>vw+2) out.tableOverflow=true; });
    document.querySelectorAll('.card,[class*="card"]').forEach(el=>{ const cs=getComputedStyle(el); out.cards++; if(cs.backgroundColor==='rgba(0, 0, 0, 0)'||cs.backgroundColor==='transparent') out.unstyledCards++; });
    return out;
  }).catch(e=>({error:String(e).slice(0,120)}));
  report[route]=a;
}
fs.writeFileSync(path.join(outDir,'layout.json'), JSON.stringify(report,null,2));
const issues=Object.entries(report).filter(([r,a])=>a.offscreen>0||a.tiny>0||a.tableOverflow||a.unstyledCards>0);
console.log('LAYOUT_DONE routes='+Object.keys(report).length+' withIssues='+issues.length);
issues.forEach(([r,a])=>console.log(' ',r,'offscreen='+a.offscreen,'tiny='+a.tiny,'tableOverflow='+a.tableOverflow,'unstyledCards='+a.unstyledCards, a.offscreenSamples?.slice(0,3)));
await browser.close();
