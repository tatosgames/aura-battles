import { chromium } from "@playwright/test";
const [,,width,height,out,steps="1",label=""] = process.argv;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Number(width), height: Number(height) } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
await page.goto("http://localhost:5173?fast=1&seed=13", { waitUntil: "load" });
await page.waitForFunction(() => window.__aura !== undefined, null, { timeout: 20000 });
await page.waitForTimeout(1200);
for (let i = 0; i < Number(steps); i++) {
  await page.waitForFunction(() => {
    const s = window.__aura.bridge.getSnapshot();
    return s.promptSide === 0;
  }, null, { timeout: 30000 }).catch(() => {});
  const card = page.locator(".card-playable").first();
  if (await card.count()) await card.click().catch(() => {});
  await page.waitForTimeout(900);
}
const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
const smallTargets = await page.evaluate(() => {
  const els = [...document.querySelectorAll("button")];
  return els.filter((el) => {
    const r = el.getBoundingClientRect();
    return r.height > 0 && r.height < 47;
  }).map((el) => `${el.className}:${Math.round(el.getBoundingClientRect().height)}px`);
});
await page.screenshot({ path: out });
await browser.close();
console.log(label, JSON.stringify({ overflow, smallTargets, errors: errors.length ? errors.slice(0,3) : "none" }));
