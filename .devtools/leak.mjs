import { chromium } from "@playwright/test";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto("http://localhost:5173?fast=1&seed=13", { waitUntil: "load" });
await page.waitForFunction(() => window.__aura !== undefined, null, { timeout: 20000 });
const count = () => page.evaluate(() => {
  const w = window.__aura.arena.physics.world;
  return { bodies: w.bodies.len(), colliders: w.colliders.len(), joints: w.impulseJoints.len(), props: window.__aura.arena.props.count() };
});
console.log("fresh   ", JSON.stringify(await count()));
for (let round = 0; round < 3; round++) {
  const deadline = Date.now() + 22000;
  while (Date.now() < deadline) {
    const s = await page.evaluate(() => window.__aura.bridge.getSnapshot());
    if (s.promptSide === 0) {
      const chaos = page.locator('.card-live:has-text("CHAOS")');
      const card = (await chaos.count()) ? chaos.first() : page.locator(".card-live").first();
      if (await card.count()) await card.click().catch(() => {});
    }
    await page.waitForTimeout(130);
  }
  console.log(`played ${round}`, JSON.stringify(await count()));
  await page.evaluate(() => window.__aura.restart());
  await page.waitForTimeout(600);
  console.log(`restart ${round}`, JSON.stringify(await count()));
}
await browser.close();
console.log("errors:", errors.length ? errors.slice(0, 3) : "none");
