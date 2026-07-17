import { chromium } from 'playwright';
const BASE='http://127.0.0.1:4173';
const VW=390, PIN='123456';
const b=await chromium.launch({headless:true});
const u=await b.newContext({viewport:{width:VW,height:844},hasTouch:true,isMobile:true});
const up=await u.newPage();
await up.goto(BASE,{waitUntil:'domcontentloaded'}); await up.waitForTimeout(1800);
for(let r=0;r<2;r++){for(const d of PIN){await up.evaluate(x=>{const btn=[...document.querySelectorAll('button')].find(b=>b.textContent&&b.textContent.trim()===x);if(btn)btn.click();},d);await up.waitForTimeout(150);}await up.waitForTimeout(900);}
await up.waitForTimeout(500);
// find hamburger (md:hidden)
const hb=await up.$('button[aria-label="Open navigation menu"]');
if(hb){await hb.click();await up.waitForTimeout(900);console.log('clicked hamburger');}
else console.log('NO HAMBURGER via aria-label');
const res=await up.evaluate(()=>{
  const els=[...document.querySelectorAll('a,button,[role=button]')];
  const small=[];
  for(const e of els){
    const r=e.getBoundingClientRect();
    const cs=getComputedStyle(e);
    if(r.width>0&&r.height>0&&r.right<=391&&r.h<44){
      small.push({tag:e.tagName.toLowerCase(),w:Math.round(r.width),h:Math.round(r.height),disp:cs.display,cls:(e.className||'').toString().slice(0,55),txt:(e.textContent||'').trim().slice(0,18)});
    }
  }
  return {total:els.length,small};
});
console.log('MENU-OPEN smallTap(<44h)=',res.small.length,'of',res.total);
for(const s of res.small.slice(0,40))console.log('  ',s.tag,s.w+'x'+s.h,'disp='+s.disp,s.txt,'|',s.cls);
await b.close();
process.exit(0);
