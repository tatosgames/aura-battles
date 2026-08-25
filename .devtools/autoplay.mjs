import { chromium } from "@playwright/test";
const seed = process.argv[2] ?? "7";
const budgetMs = Number(process.argv[3] ?? 90000);
const shotDir = process.argv[4];
const prefer = process.argv[5] ?? "first";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
await page.goto(`http://localhost:5173?fast=1&seed=${seed}`, { waitUntil: "load" });
await page.waitForFunction(() => window.__aura !== undefined, null, { timeout: 15000 });
const read = () => page.evaluate(() => {
  const s = window.__aura.bridge.getSnapshot();
  return { phase: s.phase, prompt: s.promptSide, turn: s.turn, options: s.options.length,
    a: s.fighters[0].aura, b: s.fighters[1].aura, ha: s.fighters[0].hype, hb: s.fighters[1].hype,
    winner: s.winner, props: s.propCount, final: s.canDeclareFinal,
    callout: s.callouts.length ? s.callouts[s.callouts.length - 1].text : "" };
});
const log = [];
const seen = new Set();
const started = Date.now();
let last = "";
while (Date.now() - started < budgetMs) {
  const state = await read();
  const key = `${state.turn}:${state.phase}:${state.prompt}`;
  if (key !== last) { last = key; log.push(`t${state.turn} ${state.phase} prompt=${state.prompt} aura=${state.a}/${state.b} hype=${state.ha}/${state.hb} props=${state.props} "${state.callout}"`); seen.add(state.phase); }
  if (state.winner !== null) break;
  if (state.prompt === 0) {
    if (state.final) { await page.locator("button.meter-final-ready").click().catch(() => {}); }
    else {
      const chaos = page.locator('.card-playable:has-text("CHAOS")');
      const card = (prefer === 'chaos' && await chaos.count()) ? chaos.first() : page.locator('.card-playable').first();
      if (await card.count()) await card.click().catch(() => {});
      else await page.locator('.ghost').click().catch(() => {});
    }
  }
  await page.waitForTimeout(120);
}
const final = await read();
if (shotDir) await page.screenshot({ path: `${shotDir}/final-${seed}.png` });
await browser.close();
console.log(log.join("\n"));
console.log("--- phases seen:", [...seen].join(","));
console.log("--- final:", JSON.stringify(final));
console.log("--- errors:", errors.length ? errors.slice(0, 5).join(" | ") : "none");
