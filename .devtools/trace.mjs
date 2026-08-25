import { chromium } from "@playwright/test";
const names=process.argv[2].split(",");
const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:1280,height:800}});
page.on("pageerror",(e)=>console.log("PAGEERROR",String(e)));
page.on("console",(m)=>{if(m.type()==="error")console.log("CONSOLE",m.text());});
await page.goto("http://localhost:5173",{waitUntil:"load"});
await page.waitForTimeout(1500);
const read=async(label)=>console.log(label,await page.evaluate(()=>{
 const a=window.__arena;const t=a.transforms;
 const p=(s)=>[t[s*77],t[s*77+1],t[s*77+2]].map(v=>+v.toFixed(2));
 return JSON.stringify({A:p(0),B:p(1),upA:+a.fighters[0].uprightness().toFixed(2)});
}));
await read("start");
for(const name of names){
 await page.getByRole("button",{name,exact:true}).first().click();
 await page.waitForTimeout(1600);
 await read(name);
}
await browser.close();
