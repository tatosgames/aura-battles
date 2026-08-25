import { chromium } from "@playwright/test";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto("http://localhost:5173?seed=5", { waitUntil: "load" });
await page.waitForFunction(() => window.__aura !== undefined, null, { timeout: 20000 });
await page.waitForTimeout(2500);
console.log(await page.evaluate(() => {
  const b = window.__aura;
  const runs = [];
  for (let pass = 0; pass < 5; pass++) {
    const start = performance.now();
    for (let i = 0; i < 120; i++) b.fixedUpdate(1 / 60);
    runs.push((performance.now() - start) / 120);
  }
  runs.sort((a, z) => a - z);
  return `simulation step median ${runs[2].toFixed(3)} ms (budget 16.7 ms) · props ${b.arena.props.count()}`;
}));
await browser.close();
