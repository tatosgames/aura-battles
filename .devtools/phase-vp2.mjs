import { chromium } from "@playwright/test";
const [,,width,height,url,target,out,delay="900",prefer="first"] = process.argv;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Number(width), height: Number(height) } });
await page.goto(url, { waitUntil: "load" });
await page.waitForFunction(() => window.__aura !== undefined, null, { timeout: 20000 });
const deadline = Date.now() + 120000;
while (Date.now() < deadline) {
  const s = await page.evaluate(() => { const x = window.__aura.bridge.getSnapshot(); return { phase: x.phase, prompt: x.promptSide, final: x.canDeclareFinal, winner: x.winner }; });
  if (s.phase === target && (s.prompt === 0 || s.prompt === null)) { await page.waitForTimeout(Number(delay)); break; }
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
await page.screenshot({ path: out });
await browser.close();
console.log(JSON.stringify({ overflow }));
