import { chromium } from "@playwright/test";
const [,,seed,dir]=process.argv;
const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:1280,height:800}});
const errors=[];page.on("pageerror",(e)=>errors.push(String(e)));
await page.goto(`http://localhost:5173?warm=1&seed=${seed}`,{waitUntil:"load"});
await page.waitForFunction(()=>window.__aura!==undefined,null,{timeout:20000});
const shots=[];
const deadline=Date.now()+180000;
while(Date.now()<deadline){
 const s=await page.evaluate(()=>{const x=window.__aura.bridge.getSnapshot();return {phase:x.phase,prompt:x.promptSide,final:x.canDeclareFinal,winner:x.winner,c:x.callouts.slice(-1).map(k=>k.text)[0]||""};});
 if(!shots.includes(s.phase)&&["FINAL_DECLARED","FINAL_COUNTER","FINAL_PERFORM","MATCH_OVER"].includes(s.phase)){
  shots.push(s.phase);
  await page.waitForTimeout(s.phase==="FINAL_PERFORM"?2200:600);
  await page.screenshot({path:`${dir}/finale-${s.phase}.png`});
  console.log(s.phase,s.c);
 }
 if(s.winner!==null)break;
 if(s.prompt===0){
  if(s.final)await page.locator(".primary.final").click().catch(()=>{});
  else{const c=page.locator(".card-live").first();if(await c.count())await c.click().catch(()=>{});}
 }
 await page.waitForTimeout(140);
}
await browser.close();
console.log("errors:",errors.length?errors.slice(0,3):"none");
