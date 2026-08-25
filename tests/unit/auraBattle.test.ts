import { describe, expect, it } from "vitest";
import { createRng, shuffle } from "@/engine/math/rng";
import { validateArenaConfig } from "@/engine/config/runtimeConfig";
import arenaConfig from "@/data/auraArena.json";
import { CARDS, cardOf } from "@/domain/auraBattle/rules/CardDefinition";
import { canCounter, legalCounters, legalOpeners, MAX_CHAIN } from "@/domain/auraBattle/rules/CounterSystem";
import { applyFailure, applyOutcome, resolveChain, rollFailure } from "@/domain/auraBattle/rules/CardResolver";
import { detectCombo } from "@/domain/auraBattle/rules/ComboSystem";
import { applyFinalSteal, canDeclareFinal, isPerfectCounter, legalFinalCounters, resolveFinalCounter } from "@/domain/auraBattle/rules/FinalMoveSystem";
import { createFighter, DECKS, discard, refill } from "@/domain/auraBattle/rules/Deck";
import { AIController } from "@/domain/auraBattle/ai/AIController";
import { SCRIPTS, type PerformanceScript } from "@/domain/auraBattle/sim/performanceScripts";
import { POSES, type PoseId } from "@/domain/auraBattle/sim/poses";
import type { ChainEntry, FighterState } from "@/domain/auraBattle/rules/BattleState";

const fighters = (): [FighterState, FighterState] => {
 const rng = createRng(1);
 return [createFighter(0, rng), createFighter(1, rng)];
};
const chain = (...entries: [0 | 1, string, boolean?][]): ChainEntry[] =>
 entries.map(([side, card, failed]) => ({ side, card, failed: failed ?? false }));

describe("card data", () => {
 it("gives every card a pose script that exists", () => {
  for (const card of Object.values(CARDS)) expect(SCRIPTS[card.script], card.id).toBeDefined();
 });
 it("only references poses the ragdoll knows", () => {
  for (const script of Object.values(SCRIPTS) as PerformanceScript[])
   for (const key of [...script.keys, ...(script.fail ?? [])]) if (key.pose) expect(POSES[key.pose as PoseId], key.pose).toBeDefined();
 });
 it("builds both decks from real cards and gives each the other's perfect counter", () => {
  DECKS.forEach((deck) => deck.forEach((card) => expect(CARDS[card], card).toBeDefined()));
  expect(DECKS[0]).toContain("unplug_the_speaker");
  expect(DECKS[1]).toContain("take_the_throne");
  expect(isPerfectCounter("take_the_throne", "the_king_has_arrived")).toBe(true);
  expect(isPerfectCounter("take_the_throne", "last_dance")).toBe(false);
 });
 it("validates the shipped arena configuration", () => {
  expect(validateArenaConfig(arenaConfig).spawns).toHaveLength(2);
  expect(() => validateArenaConfig({ ...arenaConfig, stageRadius: 0 })).toThrow();
 });
});

describe("counters", () => {
 it("answers only the categories a card lists", () => {
  expect(canCounter("no_reaction", "chair_entrance")).toBe(true);
  expect(canCounter("no_reaction", "main_character_walk")).toBe(false);
  expect(canCounter("main_character_walk", "no_reaction")).toBe(false);
 });
 it("respects a card's guard", () => {
  expect(cardOf("mewing_stare").guard).toContain("MEME");
  expect(canCounter("slow_clap", "mewing_stare")).toBe(false);
  expect(canCounter("slow_clap", "main_character_walk")).toBe(true);
 });
 it("closes the chain at the maximum depth", () => {
  const [self] = fighters();
  self.hand = ["no_reaction", "slow_clap", "check_phone"];
  expect(legalCounters(self, chain([0, "chair_entrance"])).length).toBeGreaterThan(0);
  expect(legalCounters(self, chain([0, "chair_entrance"], [1, "no_reaction"], [0, "slow_clap"]))).toHaveLength(0);
  expect(legalCounters(self, [])).toHaveLength(0);
 });
 it("offers standalone openers first but never leaves a hand dead", () => {
  const [self] = fighters();
  self.hand = ["main_character_walk", "no_reaction"];
  expect(legalOpeners(self)).toEqual(["main_character_walk"]);
  self.hand = ["no_reaction", "slow_clap"];
  expect(legalOpeners(self)).toEqual(["no_reaction", "slow_clap"]);
  self.hand = ["unplug_the_speaker"];
  expect(legalOpeners(self)).toHaveLength(0);
 });
});

describe("resolution", () => {
 it("hands the moment to the last unanswered card", () => {
  const state = fighters();
  const outcome = resolveChain(chain([0, "main_character_walk"]), state);
  expect(outcome.winner).toBe(0);
  expect(outcome.auraGain).toBe(2);
  expect(outcome.wasCounter).toBe(false);
 });
 it("pays a counter more than the card it answers", () => {
  const state = fighters();
  const opener = resolveChain(chain([0, "chair_entrance"]), state).auraGain;
  const answered = resolveChain(chain([0, "chair_entrance"], [1, "no_reaction"]), state);
  expect(answered.winner).toBe(1);
  expect(answered.combo).toBe("ZERO_REACTION");
  expect(answered.auraGain).toBeGreaterThan(opener);
  expect(answered.auraSteal).toBeGreaterThan(0);
 });
 it("names the meme combo when ridicule answers a pose", () => {
  const state = fighters();
  expect(resolveChain(chain([0, "main_character_walk"], [1, "slow_clap"]), state).combo).toBe("AURA_STEAL");
 });
 it("rewards a rescued failure above a safe performance", () => {
  const state = fighters();
  const safe = resolveChain(chain([0, "mewing_stare"]), state).auraGain;
  const rescued = resolveChain(chain([0, "meant_to_do_that"]), state, true);
  expect(rescued.combo).toBe("ACCIDENTAL_CINEMA");
  expect(rescued.auraGain).toBeGreaterThan(safe);
 });
 it("scores nothing for a card the rules already blew up", () => {
  const state = fighters();
  const outcome = resolveChain(chain([0, "backflip_entrance", true]), state);
  expect(outcome.failed).toBe(true);
  expect(outcome.auraGain).toBe(0);
  applyFailure(state, outcome);
  expect(state[1].aura).toBe(1);
  expect(state[0].aura).toBe(0);
 });
 it("keeps aura and hype inside their meters", () => {
  const state = fighters();
  state[0].aura = 9; state[0].hype = 3; state[1].aura = 1; state[1].hype = 0;
  applyOutcome(state, { winner: 0, card: "chair_yeet", auraGain: 5, auraSteal: 4, hypeGain: 2, hypeSteal: 2, combo: null, failed: false, wasCounter: true });
  expect(state[0].aura).toBe(10);
  expect(state[0].hype).toBe(3);
  expect(state[1].aura).toBe(0);
  expect(state[1].hype).toBe(0);
 });
 it("remembers the category just played so streaks and punishes can see it", () => {
  const state = fighters();
  applyOutcome(state, resolveChain(chain([0, "main_character_walk"]), state));
  expect(state[0].lastCategory).toBe("COOL");
  expect(detectCombo(chain([0, "victory_pose"]), state[0], false)?.id).toBe("STYLE_STREAK");
 });
 it("carries an empower rider onto the next matching card", () => {
  const state = fighters();
  applyOutcome(state, resolveChain(chain([0, "sunglasses_on"]), state));
  expect(state[0].empower).toEqual({ category: "COOL", aura: 1 });
  const boosted = resolveChain(chain([0, "mewing_stare"]), state);
  expect(boosted.auraGain).toBe(cardOf("mewing_stare").aura + 1 + 1);
 });
});

describe("final moves", () => {
 it("needs both meters full", () => {
  const [self] = fighters();
  self.aura = 10; self.hype = 2;
  expect(canDeclareFinal(self)).toBe(false);
  self.hype = 3;
  expect(canDeclareFinal(self)).toBe(true);
 });
 it("offers composed or ridiculous answers, and the one that always works", () => {
  const [, defender] = fighters();
  defender.hand = ["take_the_throne", "main_character_walk", "no_reaction"];
  const options = legalFinalCounters(defender, "the_king_has_arrived");
  expect(options).toContain("take_the_throne");
  expect(options).toContain("no_reaction");
  expect(options).not.toContain("main_character_walk");
 });
 it("always steals with the perfect counter and swings the match instead of ending it", () => {
  const rng = createRng(3);
  expect(resolveFinalCounter("take_the_throne", "the_king_has_arrived", rng)).toEqual({ stolen: true, perfect: true });
  const state = fighters();
  state[0].aura = 10; state[0].hype = 3; state[1].aura = 4; state[1].hype = 1;
  applyFinalSteal(state[0], state[1], true);
  expect(state[0].aura).toBe(4);
  expect(state[0].hype).toBe(0);
  expect(state[1].aura).toBe(7);
  expect(state[1].hype).toBe(3);
 });
 it("gives a desperate answer a real but seeded chance", () => {
  const attempts = Array.from({ length: 200 }, (_, index) => resolveFinalCounter("no_reaction", "last_dance", createRng(index + 1)));
  const stolen = attempts.filter((result) => result.stolen).length;
  expect(stolen).toBeGreaterThan(20);
  expect(stolen).toBeLessThan(140);
  expect(attempts.every((result) => !result.perfect)).toBe(true);
 });
});

describe("deck", () => {
 it("deals three and refills back to three", () => {
  const rng = createRng(11);
  const fighter = createFighter(0, rng);
  expect(fighter.hand).toHaveLength(3);
  discard(fighter, fighter.hand[0]);
  expect(fighter.hand).toHaveLength(2);
  refill(fighter, rng);
  expect(fighter.hand).toHaveLength(3);
  expect(fighter.discard).toHaveLength(1);
 });
 it("reshuffles the discard pile when the deck runs out", () => {
  const rng = createRng(12);
  const fighter = createFighter(0, rng);
  fighter.discard = [...fighter.deck];
  fighter.deck = [];
  fighter.hand = [];
  refill(fighter, rng);
  expect(fighter.hand).toHaveLength(3);
 });
 it("stops refilling instead of looping when nothing is left", () => {
  const rng = createRng(13);
  const fighter = createFighter(0, rng);
  fighter.deck = []; fighter.discard = []; fighter.hand = [];
  refill(fighter, rng);
  expect(fighter.hand).toHaveLength(0);
 });
});

describe("determinism", () => {
 it("replays identical rolls and shuffles from a seed", () => {
  const draw = (seed: number) => {
   const rng = createRng(seed);
   return [shuffle([1, 2, 3, 4, 5, 6], rng).join(""), Array.from({ length: 6 }, () => rollFailure(.45, rng)).join("")].join("|");
  };
  expect(draw(42)).toBe(draw(42));
  expect(draw(42)).not.toBe(draw(43));
 });
 it("never rolls a failure for a card that cannot fail", () => {
  const rng = createRng(5);
  expect(Array.from({ length: 100 }, () => rollFailure(0, rng)).some(Boolean)).toBe(false);
 });
});

describe("ai", () => {
 it("only ever picks a card it is allowed to play", () => {
  for (let seed = 1; seed <= 40; seed++) {
   const rng = createRng(seed);
   const state = fighters();
   const ai = new AIController(rng);
   const opener = ai.chooseOpener(state[1], state[0]);
   if (opener && opener !== "final") expect(legalOpeners(state[1])).toContain(opener);
   const answer = ai.chooseCounter(state[1], chain([0, "chair_entrance"]));
   if (answer) expect(legalCounters(state[1], chain([0, "chair_entrance"]))).toContain(answer);
  }
 });
 it("goes for the win the moment both meters are full", () => {
  const state = fighters();
  state[1].aura = 10; state[1].hype = 3;
  expect(new AIController(createRng(9)).chooseOpener(state[1], state[0])).toBe("final");
 });
 it("takes the guaranteed steal when it is holding it", () => {
  const state = fighters();
  state[1].hand = ["take_the_throne", "no_reaction", "slow_clap"];
  expect(new AIController(createRng(4)).chooseFinalCounter(state[1], "the_king_has_arrived")).toBe("take_the_throne");
 });
 it("keeps counter chains bounded by refusing to answer past the cap", () => {
  const state = fighters();
  const full = chain([0, "chair_entrance"], [1, "no_reaction"], [0, "slow_clap"]);
  expect(full).toHaveLength(MAX_CHAIN);
  expect(new AIController(createRng(2)).chooseCounter(state[1], full)).toBeNull();
 });
});
