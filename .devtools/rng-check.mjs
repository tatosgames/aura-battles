import { chromium } from "@playwright/test";
const browser = await chromium.launch();
async function playToEnd(seed, prefer) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(`http://localhost:5173?fast=1&seed=${seed}`, { waitUntil: "load" });
  await page.waitForFunction(() => window.__aura !== undefined, null, { timeout: 20000 });
  const deadline = Date.now() + 60000;
  const log = [];
  while (Date.now() < deadline) {
    const s = await page.evaluate(() => { const x = window.__aura.bridge.getSnapshot(); return { phase: x.phase, prompt: x.promptSide, final: x.canDeclareFinal, winner: x.winner, a: x.fighters[0].aura, b: x.fighters[1].aura, chain: x.chain.map(c=>c.card).join(",") }; });
    if (s.winner !== null) { log.push(`WINNER ${s.winner} a=${s.a} b=${s.b}`); break; }
    if (s.prompt === 0) {
      if (s.final) await page.locator(".primary.final").click().catch(() => {});
      else {
        const chaos = page.locator(`.card-playable:has-text("${prefer}")`);
        const card = (await chaos.count()) ? chaos.first() : page.locator(".card-playable").first();
        if (await card.count()) { const label = await card.textContent().catch(()=> ""); log.push(`play ${label?.slice(0,40)}`); await card.click().catch(() => {}); }
      }
    }
    await page.waitForTimeout(120);
  }
  await page.close();
  return { log, errors };
}
const seedArg = process.argv[2] ?? "13";
const runA = await playToEnd(seedArg, "CHAOS");
const runB = await playToEnd(seedArg, "CHAOS");
console.log("--- run A tail ---", runA.log.slice(-3));
console.log("--- run B tail ---", runB.log.slice(-3));
console.log("SAME OUTCOME:", runA.log[runA.log.length-1] === runB.log[runB.log.length-1]);
console.log("errors:", [...runA.errors, ...runB.errors].length ? "SOME" : "none");
await browser.close();
