import { chromium } from "@playwright/test";
const [,,url,out,waitMs="2500",clicks=""]=process.argv;
const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:1280,height:800},deviceScaleFactor:1});
const errors=[];
page.on("console",(m)=>{if(m.type()==="error")errors.push(m.text());});
page.on("pageerror",(e)=>errors.push(String(e)));
await page.goto(url,{waitUntil:"load"});
await page.waitForTimeout(1200);
for(const step of clicks.split("|").filter(Boolean)){
 const [name,delay="700"]=step.split(":");
 await page.getByRole("button",{name,exact:true}).first().click();
 await page.waitForTimeout(Number(delay));
}
await page.waitForTimeout(Number(waitMs));
const probe=await page.evaluate(()=>{
 const arena=window.__arena; if(!arena) return null;
 const t=arena.transforms;
 const read=(side,part)=>{const base=side*77+part*7;return [t[base],t[base+1],t[base+2]].map((v)=>Number(v.toFixed(2)));};
 return {pelvisA:read(0,0),torsoA:read(0,1),headA:read(0,2),props:arena.props.count(),upA:Number(arena.fighters[0].uprightness().toFixed(2)),downA:arena.fighters[0].isDown()};
});
await page.screenshot({path:out});
await browser.close();
console.log(JSON.stringify({probe,errors}));
