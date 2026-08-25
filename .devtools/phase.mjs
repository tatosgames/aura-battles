import { chromium } from "@playwright/test";
const [,,seed,target,out,delay="900"]=process.argv;
const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:1280,height:800}});
const errors=[];page.on("pageerror",(e)=>errors.push(String(e)));
await page.goto(`http://localhost:5173?seed=${seed}`,{waitUntil:"load"});
await page.waitForFunction(()=>window.__aura!==undefined,null,{timeout:20000});
const deadline=Date.now()+120000;
while(Date.now()<deadline){
 const s=await page.evaluate(()=>{const x=window.__aura.bridge.getSnapshot();return {phase:x.phase,prompt:x.promptSide,final:x.canDeclareFinal,winner:x.winner};});
 if(s.phase===target&&s.prompt===0){await page.waitForTimeout(Number(delay));await page.screenshot({path:out});break;}
 if(s.winner!==null)break;
 if(s.prompt===0&&s.phase!==target){
  if(s.final)await page.locator("button.meter-final-ready").click().catch(()=>{});
  else{const c=page.locator(".card-playable").first();if(await c.count())await c.click().catch(()=>{});}
 }
 await page.waitForTimeout(130);
}
await browser.close();
console.log(errors.length?errors.slice(0,3).join(" | "):"clean");
