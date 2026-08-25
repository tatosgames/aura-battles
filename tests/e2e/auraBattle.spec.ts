import { test, expect, type Page } from "@playwright/test";
/** Reads the live snapshot the app publishes, so assertions do not depend on animation timing. */
const snapshot = (page: Page) => page.evaluate(() => (window as unknown as { __aura: { bridge: { getSnapshot(): Record<string, unknown> } } }).__aura.bridge.getSnapshot());
const waitForPrompt = (page: Page) =>
 page.waitForFunction(() => {
  const state = (window as unknown as { __aura: { bridge: { getSnapshot(): { promptSide: number | null; winner: number | null } } } }).__aura.bridge.getSnapshot();
  return state.promptSide === 0 || state.winner !== null;
 }, null, { timeout: 60_000 });
async function boot(page: Page, query: string) {
 const errors: string[] = [];
 page.on("pageerror", (error) => errors.push(String(error)));
 page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
 await page.goto(`/?${query}`);
 await page.waitForFunction(() => (window as unknown as { __aura?: unknown }).__aura !== undefined, null, { timeout: 30_000 });
 return errors;
}
test("opens a duel, plays a card and moves the Aura meter", async ({ page }) => {
 const errors = await boot(page, "fast=1&seed=13");
 await expect(page.getByText("AURA BATTLES")).toBeVisible();
 await waitForPrompt(page);
 await expect(page.getByText("CHOOSE A MOVE")).toBeVisible();
 await expect(page.locator(".card-foot, .pile")).toHaveCount(0);
 await expect(page.locator("body")).not.toContainText("PROPS ON STAGE");
 await expect(page.locator("body")).not.toContainText("IN DECK");
 const before = await snapshot(page);
 expect((before.fighters as { aura: number }[])[0].aura).toBe(0);
 await page.locator(".card-playable").first().click();
 await page.waitForFunction(() => {
  const state = (window as unknown as { __aura: { bridge: { getSnapshot(): { promptSide: number | null } } } }).__aura.bridge.getSnapshot();
  return state.promptSide !== 0;
 });
 await expect(page.locator(".hand")).toHaveCount(0);
 await page.waitForFunction(() => {
  const state = (window as unknown as { __aura: { bridge: { getSnapshot(): { fighters: { aura: number }[] } } } }).__aura.bridge.getSnapshot();
  return state.fighters[0].aura > 0 || state.fighters[1].aura > 0;
 }, null, { timeout: 60_000 });
 expect(errors).toEqual([]);
});
test("keeps the R3F renderer alive through portrait and landscape resizes", async ({ page }) => {
 const errors = await boot(page, "fast=1&seed=13");
 await page.setViewportSize({ width: 390, height: 844 });
 await waitForPrompt(page);
 await expect(page.locator("canvas[data-testid=game-renderer]")).toBeVisible();
 await expect(page.locator(".meter-final")).toHaveCount(2);
 expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
 await page.setViewportSize({ width: 844, height: 390 });
 await expect(page.locator("canvas[data-testid=game-renderer]")).toBeVisible();
 await expect(page.locator(".meter-final")).toHaveCount(2);
 expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
 expect(errors).toEqual([]);
});
test("plays a warmed match through to a Final Move and a rematch", async ({ page }) => {
 test.setTimeout(240_000);
 const errors = await boot(page, "fast=1&warm=1&seed=13");
 const warmed = await snapshot(page);
 expect((warmed.fighters as { aura: number; hype: number }[]).every((fighter) => fighter.aura === 9 && fighter.hype === 3)).toBe(true);
 await expect(page.locator(".hype-pip.on").first()).toBeVisible();
 const deadline = Date.now() + 180_000;
 let sawFinal = false;
 while (Date.now() < deadline) {
  const state = await snapshot(page);
  if (state.phase === "FINAL_DECLARED" || state.phase === "FINAL_COUNTER" || state.phase === "FINAL_PERFORM") sawFinal = true;
  if (state.winner !== null) break;
  if (state.promptSide === 0) {
   if (state.canDeclareFinal) {
    const finalButton = page.locator("button.meter-final-ready");
    expect((await finalButton.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(47);
    await finalButton.click({ timeout: 5_000 }).catch(() => undefined);
   } else await page.locator(".card-playable").first().click({ timeout: 5_000 }).catch(() => undefined);
  }
  await page.waitForTimeout(150);
 }
 const ended = await snapshot(page);
 expect(sawFinal, "a Final Move should have been declared").toBe(true);
 expect(ended.winner, "the match should have produced a winner").not.toBeNull();
 await expect(page.getByRole("button", { name: "REMATCH" })).toBeVisible();
 await page.getByRole("button", { name: "REMATCH" }).click();
 await expect.poll(async () => (await snapshot(page)).winner).toBeNull();
 expect((await snapshot(page)).propCount).toBe(0);
 expect(errors).toEqual([]);
});
