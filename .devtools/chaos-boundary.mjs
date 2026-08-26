import { chromium } from "@playwright/test";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto("http://localhost:5173?fast=1&seed=13", { waitUntil: "load" });
await page.waitForFunction(() => window.__aura !== undefined, null, { timeout: 20000 });
await page.evaluate(() => { window.__ringFired = 0; const orig = window.__aura.arena.takeBoundaryCatch.bind(window.__aura.arena); window.__aura.arena.takeBoundaryCatch = () => { const v = orig(); if (v) window.__ringFired++; return v; }; });
const deadline = Date.now() + 55000;
while (Date.now() < deadline) {
  const s = await page.evaluate(() => window.__aura.bridge.getSnapshot());
  if (s.winner !== null) break;
  if (s.promptSide === 0) {
    if (s.canDeclareFinal) await page.locator(".primary.final").click().catch(() => {});
    else {
      const chaos = page.locator('.card-playable:has-text("CHAOS")');
      const card = (await chaos.count()) ? chaos.first() : page.locator(".card-playable").first();
      if (await card.count()) await card.click().catch(() => {});
    }
  }
  await page.waitForTimeout(90);
}
const fired = await page.evaluate(() => window.__ringFired);
console.log("boundary catches fired during real play:", fired);
console.log("errors:", errors.length ? errors.slice(0, 3) : "none");
await browser.close();
