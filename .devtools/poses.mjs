import { chromium } from "@playwright/test";
const out=process.argv[2];
const names=process.argv[3].split(",");
const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:1280,height:800}});
const errors=[];page.on("pageerror",(e)=>errors.push(String(e)));
await page.goto("http://localhost:5173",{waitUntil:"load"});
await page.waitForTimeout(1500);
for(const name of names){
 await page.getByRole("button",{name,exact:true}).first().click();
 await page.waitForTimeout(1600);
 await page.screenshot({path:`${out}/${name}.png`,clip:{x:250,y:300,width:800,height:380}});
}
await browser.close();
console.log(errors.length?errors.join("\n"):"clean");
