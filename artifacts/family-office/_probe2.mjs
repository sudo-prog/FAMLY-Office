import { chromium } from 'playwright';
const BASE = 'http://127.0.0.1:4173';
const VW=390, PIN='123456';
const b = await chromium.launch({headless:true});
const u = await b.newContext({viewport:{width:VW,height:844},hasTouch:true,isMobile:true});
const up = await u.newPage();
await up.goto(BASE,{waitUntil:'domcontentloaded'}); await up.waitForTimeout(1500);
// dump any button labels to find hamburger
const labels = await up.$$eval('button', els => els.map(e=>e.getAttribute('aria-label')||e.textContent.trim().slice(0,15)));
console.log('buttons:', JSON.stringify(labels));
await u.close();
