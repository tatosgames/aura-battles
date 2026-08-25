import { describe, expect, it } from "vitest";
import { createRng, shuffle } from "@/engine/math/rng";
import { validateArenaConfig } from "@/engine/config/runtimeConfig";
import arenaConfig from "@/data/auraArena.json";
import { CARDS, cardOf } from "@/domain/auraBattle/rules/CardDefinition";
import { BEATS, beatenBy, canCounter, legalCounters, legalOpeners, MAX_CHAIN } from "@/domain/auraBattle/rules/CounterSystem";
import { applyFailure, applyOutcome, resolveChain, rollFailure } from "@/domain/auraBattle/rules/CardResolver";
import { applyFinalSteal, canDeclareFinal, legalFinalCounters, resolveFinalCounter } from "@/domain/auraBattle/rules/FinalMoveSystem";
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

describe("shipping card set", () => {
 it("ships exactly 25 cards, without retired cards", () => {
  expect(Object.keys(CARDS)).toHaveLength(25);
  expect(CARDS.check_phone).toBeUndefined();
  expect(CARDS.wrong_person).toBeUndefined();
 });
 it("gives every card an existing performance script and known poses", () => {
  for (const card of Object.values(CARDS)) expect(SCRIPTS[card.script], card.id).toBeDefined();
  for (const script of Object.values(SCRIPTS) as PerformanceScript[])
   for (const key of [...script.keys, ...(script.fail ?? [])]) if (key.pose) expect(POSES[key.pose as PoseId], key.pose).toBeDefined();
 });
 it("uses the documented 15-card decks and valid arena config", () => {
  expect(DECKS[0]).toHaveLength(15);
  expect(DECKS[1]).toHaveLength(15);
  DECKS.flat().forEach((card) => expect(CARDS[card], card).toBeDefined());
  expect(DECKS[0]).toContain("unplug_the_speaker");
  expect(DECKS[1]).toContain("take_the_throne");
  expect(validateArenaConfig(arenaConfig).spawns).toHaveLength(2);
 });
});

describe("one visual counter map", () => {
 it("has a complete, reciprocal four-category map", () => {
  expect(BEATS).toEqual({ COOL: "DEADPAN", DEADPAN: "CHAOS", CHAOS: "MEME", MEME: "COOL" });
  expect(beatenBy("COOL")).toBe("MEME");
  expect(beatenBy("DEADPAN")).toBe("COOL");
  expect(beatenBy("MEME")).toBe("CHAOS");
  expect(beatenBy("CHAOS")).toBe("DEADPAN");
 });
 it("lets every core card open and only its mapped category counter", () => {
  const [self] = fighters();
  self.hand = Object.values(CARDS).filter((card) => ["COOL", "DEADPAN", "MEME", "CHAOS"].includes(card.category)).map((card) => card.id);
  expect(legalOpeners(self)).toEqual(self.hand);
  expect(canCounter("no_reaction", "chair_entrance")).toBe(true);
  expect(canCounter("no_reaction", "main_character_walk")).toBe(false);
  expect(canCounter("slow_clap", "main_character_walk")).toBe(true);
  expect(canCounter("chair_entrance", "slow_clap")).toBe(true);
 });
 it("keeps chains bounded at three moves", () => {
  const [self] = fighters();
  self.hand = ["no_reaction", "slow_clap", "chair_entrance"];
  expect(legalCounters(self, chain([0, "chair_entrance"]))).toEqual(["no_reaction"]);
  expect(legalCounters(self, chain([0, "chair_entrance"], [1, "no_reaction"], [0, "slow_clap"]))).toHaveLength(0);
  expect(MAX_CHAIN).toBe(3);
 });
});

describe("resolution", () => {
 it("pays a legal counter with printed values, +1 Aura, and -1 Aura to its target", () => {
  const state = fighters();
  state[0].aura = 5; state[0].hype = 2;
  const outcome = resolveChain(chain([0, "chair_entrance"], [1, "look_away"]), state);
  expect(outcome).toMatchObject({ winner: 1, auraGain: cardOf("look_away").aura + 1, auraLoss: 1, hypeLoss: 1, wasCounter: true });
  applyOutcome(state, outcome);
  expect(state[1].aura).toBe(cardOf("look_away").aura + 1);
  expect(state[0].aura).toBe(4);
  expect(state[0].hype).toBe(1);
 });
 it("makes risk and recovery explicit, with Accidental Cinema as the only named combo", () => {
  const state = fighters();
  const failed = resolveChain(chain([0, "backflip_entrance", true]), state);
  expect(failed).toMatchObject({ failed: true, auraGain: 0, hypeGain: 0 });
  applyFailure(state, failed);
  expect(state[1].aura).toBe(1);
  const recovered = resolveChain(chain([0, "meant_to_do_that"]), state, true);
  expect(recovered).toMatchObject({ combo: "ACCIDENTAL_CINEMA", auraGain: cardOf("meant_to_do_that").aura + 2, hypeGain: cardOf("meant_to_do_that").hype + 1 });
 });
 it("applies only visible riders and clamps both meters", () => {
  const state = fighters();
  applyOutcome(state, resolveChain(chain([0, "sunglasses_on"]), state));
  expect(state[0].link).toEqual({ category: "COOL", aura: 1 });
  expect(resolveChain(chain([0, "mewing_stare"]), state).auraGain).toBe(cardOf("mewing_stare").aura + 1);
  state[0].aura = 9; state[0].hype = 3;
  applyOutcome(state, { winner: 0, card: "chair_yeet", auraGain: 5, auraLoss: 0, hypeGain: 2, hypeLoss: 0, combo: null, failed: false, wasCounter: false });
  expect(state[0].aura).toBe(10);
  expect(state[0].hype).toBe(3);
 });
});

describe("Final Move", () => {
 it("needs both meters and exposes only the exact crown counter", () => {
  const [, defender] = fighters();
  defender.hand = ["take_the_throne", "no_reaction", "slow_clap"];
  expect(canDeclareFinal({ ...defender, aura: 10, hype: 3 })).toBe(true);
  expect(legalFinalCounters(defender, "the_king_has_arrived")).toEqual(["take_the_throne"]);
  expect(() => resolveFinalCounter("no_reaction", "last_dance")).toThrow();
  expect(resolveFinalCounter("take_the_throne", "the_king_has_arrived")).toEqual({ stolen: true, perfect: true });
 });
 it("makes a perfect Final counter deterministic", () => {
  const state = fighters();
  state[0].aura = 10; state[0].hype = 3; state[1].aura = 4; state[1].hype = 1;
  applyFinalSteal(state[0], state[1]);
  expect(state[0]).toMatchObject({ aura: 4, hype: 0 });
  expect(state[1]).toMatchObject({ aura: 7, hype: 3 });
 });
});

describe("deck, determinism, and AI legality", () => {
 it("deals three, refills, and reshuffles only when needed", () => {
  const rng = createRng(11);
  const fighter = createFighter(0, rng);
  expect(fighter.hand).toHaveLength(3);
  discard(fighter, fighter.hand[0]); refill(fighter, rng);
  expect(fighter.hand).toHaveLength(3);
  fighter.discard = [...fighter.deck]; fighter.deck = []; fighter.hand = [];
  refill(fighter, rng);
  expect(fighter.hand).toHaveLength(3);
 });
 it("replays shuffles and failures from a seed", () => {
  const draw = (seed: number) => { const rng = createRng(seed); return `${shuffle([1, 2, 3, 4], rng)}|${Array.from({ length: 5 }, () => rollFailure(.45, rng))}`; };
  expect(draw(42)).toBe(draw(42));
  expect(draw(42)).not.toBe(draw(43));
 });
 it("never lets AI choose an illegal opener, counter, or Final counter", () => {
  for (let seed = 1; seed <= 40; seed++) {
   const state = fighters(); const ai = new AIController(createRng(seed));
   const opener = ai.chooseOpener(state[1], state[0]);
   if (opener && opener !== "final") expect(legalOpeners(state[1])).toContain(opener);
   const response = ai.chooseCounter(state[1], chain([0, "chair_entrance"]));
   if (response) expect(legalCounters(state[1], chain([0, "chair_entrance"]))).toContain(response);
  }
 });
});
