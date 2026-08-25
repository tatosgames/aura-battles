import { chromium } from "@playwright/test";
const [,,width,height,seed,target,out,delay="900",prefer="first"] = process.argv;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Number(width), height: Number(height) } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto(`http://localhost:5173?seed=${seed}`, { waitUntil: "load" });
await page.waitForFunction(() => window.__aura !== undefined, null, { timeout: 20000 });
const deadline = Date.now() + 120000;
while (Date.now() < deadline) {
  const s = await page.evaluate(() => { const x = window.__aura.bridge.getSnapshot(); return { phase: x.phase, prompt: x.promptSide, final: x.canDeclareFinal, winner: x.winner }; });
  if (s.phase === target && s.prompt === 0) { await page.waitForTimeout(Number(delay)); break; }
  if (s.winner !== null) break;
  if (s.prompt === 0 && s.phase !== target) {
    if (s.final) await page.locator(".primary.final").click().catch(() => {});
    else {
      const chaos = page.locator('.card-live:has-text("CHAOS")');
      const card = (prefer === "chaos" && await chaos.count()) ? chaos.first() : page.locator(".card-live").first();
      if (await card.count()) await card.click().catch(() => {});
      else await page.locator(".ghost").click().catch(() => {});
    }
  }
  await page.waitForTimeout(130);
}
const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
const smallTargets = await page.evaluate(() => [...document.querySelectorAll("button")].filter((el) => { const r = el.getBoundingClientRect(); return r.height > 0 && r.height < 47; }).map((el) => `${el.className}:${Math.round(el.getBoundingClientRect().height)}px`));
await page.screenshot({ path: out });
await browser.close();
console.log(JSON.stringify({ overflow, smallTargets, errors: errors.length ? errors.slice(0,3) : "none" }));
