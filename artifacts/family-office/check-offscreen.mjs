import { chromium } from 'playwright';
const baseUrl = 'http://localhost:5173';
const PIN='123456';
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
await page.goto(baseUrl, { waitUntil: 'domcontentloaded' }).catch(()=>{});
await page.waitForTimeout(1500);
for (const d of PIN) { await page.evaluate((digit)=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent&&x.textContent.trim()===digit);if(b)b.click();}, d).catch(()=>{}); await page.waitForTimeout(250); }
await page.waitForTimeout(1200);
// Inspect the offscreen elements on dashboard
const info = await page.evaluate(() => {
  const vw = document.documentElement.clientWidth;
  const buckets = {};
  const samples = [];
  document.querySelectorAll('*').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width>0 && r.right > vw+1.5) {
      // classify by visibility/transform
      const cs = getComputedStyle(el);
      const key = (cs.display==='none'?'display:none':(cs.visibility==='hidden'?'hidden':(cs.transform!=='none'?'transformed':(cs.position==='fixed'?'fixed':(cs.opacity==='0'?'opacity0':'visible')))));
      buckets[key]=(buckets[key]||0)+1;
      if (samples.length<8) samples.push(el.tagName+'.'+String(el.className||'').slice(0,40)+' ['+key+']');
    }
  });
  const docOverflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
  return { vw, docOverflow, buckets, samples, scrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
