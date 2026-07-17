import { chromium } from 'playwright';
const BASE='http://127.0.0.1:4173';
const VW=390, PIN='123456';
const b=await chromium.launch({headless:true});
const u=await b.newContext({viewport:{width:VW,height:844},hasTouch:true,isMobile:true});
const up=await u.newPage();
await up.goto(BASE,{waitUntil:'domcontentloaded'}); await up.waitForTimeout(1800);
for(let r=0;r<2;r++){for(const d of PIN){await up.evaluate(x=>{const btn=[...document.querySelectorAll('button')].find(b=>b.textContent&&b.textContent.trim()===x);if(btn)btn.click();},d);await up.waitForTimeout(150);}await up.waitForTimeout(900);}
await up.waitForTimeout(400);
const diag=await up.evaluate(()=>{
  const aside=document.querySelector('aside.fo-sidebar');
  return {hasAside:!!aside, totalA:document.querySelectorAll('a').length, totalButton:document.querySelectorAll('button').length,
    unlockedText: document.body.innerText.slice(0,60),
    pinLockPresent: !!document.querySelector('button[aria-label="Reset PIN"], input') };
});
console.log('diag:',JSON.stringify(diag));
// force open + measure nav
await up.evaluate(()=>{const a=document.querySelector('aside.fo-sidebar');if(a)a.classList.add('fo-open');});
await up.waitForTimeout(400);
const res=await up.evaluate(()=>{
  const links=[...document.querySelectorAll('aside a, aside button')];
  const bad=[];
  for(const e of links){const r=e.getBoundingClientRect();const cs=getComputedStyle(e);if(r.width>0&&r.height>0&&r.h<44)bad.push({tag:e.tagName.toLowerCase(),w:Math.round(r.width),h:Math.round(r.height),txt:(e.textContent||'').trim().slice(0,18)});}
  return {total:links.length,bad};
});
console.log('DRAWER:',res.total,'small:',res.bad.length);
for(const s of res.bad.slice(0,30))console.log('  ',s.tag,s.w+'x'+s.h,s.txt);
await b.close();
process.exit(0);
