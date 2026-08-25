import { chromium } from "@playwright/test";
const [,,seed,out,clicks="2",settle="900"]=process.argv;
const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:1280,height:800}});
const errors=[];page.on("pageerror",(e)=>errors.push(String(e)));
page.on("console",(m)=>{if(m.type()==="error")errors.push(m.text());});
await page.goto(`http://localhost:5173?seed=${seed}`,{waitUntil:"load"});
await page.waitForFunction(()=>window.__aura!==undefined,null,{timeout:15000});
for(let i=0;i<Number(clicks);i++){
 await page.waitForFunction(()=>window.__aura.bridge.getSnapshot().promptSide===0,null,{timeout:30000}).catch(()=>{});
 const card=page.locator(".card-playable").first();
 if(await card.count())await card.click().catch(()=>{});
 await page.waitForTimeout(Number(settle));
}
await page.screenshot({path:out});
const s=await page.evaluate(()=>{const x=window.__aura.bridge.getSnapshot();return {phase:x.phase,a:x.fighters[0].aura,b:x.fighters[1].aura,callout:x.callouts.map(c=>c.text).slice(-2)};});
await browser.close();
console.log(JSON.stringify(s),errors.length?errors.slice(0,3):"clean");
