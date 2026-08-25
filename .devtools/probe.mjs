import { chromium } from "@playwright/test";
const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:1280,height:800}});
page.on("pageerror",(e)=>console.log("ERR",String(e)));
await page.goto("http://localhost:5173",{waitUntil:"load"});
await page.waitForTimeout(1500);
await page.getByRole("button",{name:"FLEX",exact:true}).first().click();
await page.waitForTimeout(2000);
console.log(await page.evaluate(()=>{
 const f=window.__arena.fighters[0];
 const q=f.part("upperArmL").rotation();
 const t=f.part("upperArmL").translation();
 const s=f.part("upperArmL").angvel();
 return JSON.stringify({pose:f.currentPose,quat:[q.x,q.y,q.z,q.w].map(v=>+v.toFixed(3)),pos:[t.x,t.y,t.z].map(v=>+v.toFixed(3)),spin:[s.x,s.y,s.z].map(v=>+v.toFixed(2)),
  euler:f.rotations?[...f.rotations.entries()].filter(([k])=>k==="upperArmL").map(([,v])=>v.map(n=>+n.toFixed(2))):"private",
  target:f.targetRotations?[...f.targetRotations.entries()].filter(([k])=>k==="upperArmL").map(([,v])=>v):"private"});
}));
await browser.close();
