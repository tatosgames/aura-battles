import type { Rng } from "@/engine/math/rng";
import { cardOf, type CardId } from "../rules/CardDefinition";
import type { ChainEntry, FighterState } from "../rules/BattleState";
import { legalCounters, legalOpeners } from "../rules/CounterSystem";
import { canDeclareFinal, legalFinalCounters } from "../rules/FinalMoveSystem";

/** Weighted heuristics only. REDD should feel confident, not clairvoyant. */
const MISTAKE_RATE = .15;

function scoreOpener(card: CardId, self: FighterState, opponent: FighterState): number {
 const definition = cardOf(card);
 let score = definition.aura * 1.6 + definition.hype * 1.1;
 if (definition.rider?.kind === "OPENING") score += definition.rider.aura;
 if (definition.rider?.kind === "AHEAD" && self.aura > opponent.aura) score += definition.rider.aura + definition.rider.hype;
 if (definition.rider?.kind === "LINK") score += .8;
 // Gamble when behind, play safer when ahead.
 const riskWeight = self.aura < opponent.aura ? 2.4 : 4.2;
 score -= definition.failChance * riskWeight;
 if (self.hype >= 2 && definition.hype > 0) score += .8;
 return score;
}

function scoreCounter(card: CardId, self: FighterState): number {
 const definition = cardOf(card);
 let score = definition.aura * 1.5 + definition.hype * 1.1 + 2.4; // Every legal counter steals +1 Aura.
 if (definition.rider?.kind === "COUNTER_DRAIN_HYPE") score += definition.rider.hype * 1.2;
 if (definition.rider?.kind === "REPEAT" && self.repeatedCategory) score += definition.rider.aura;
 score -= definition.failChance * 2.5;
 if (self.hand.length <= 1) score -= 1.2;
 return score;
}

const bestOf = (options: CardId[], score: (card: CardId) => number, rng: Rng): CardId => {
 if (rng.chance(MISTAKE_RATE)) return rng.pick(options);
 return options.reduce((best, card) => score(card) + rng.next() * .7 > score(best) ? card : best, options[0]);
};
export class AIController {
 constructor(private readonly rng: Rng) {}
 chooseOpener(self: FighterState, opponent: FighterState): CardId | "final" | null {
  if (canDeclareFinal(self)) return "final";
  const options = legalOpeners(self);
  return options.length === 0 ? self.hand[0] ?? null : bestOf(options, (card) => scoreOpener(card, self, opponent), this.rng);
 }
 chooseCounter(self: FighterState, chain: ChainEntry[]): CardId | null {
  const options = legalCounters(self, chain);
  if (options.length === 0) return null;
  const choice = bestOf(options, (card) => scoreCounter(card, self), this.rng);
  return scoreCounter(choice, self) < 3 && this.rng.chance(.35) ? null : choice;
 }
 chooseFinalCounter(self: FighterState, finalMove: CardId): CardId | null {
  const options = legalFinalCounters(self, finalMove);
  return options.length === 0 ? null : options[0];
 }
 /** A little hesitation reads as a decision being made. */
 thinkDelay(): number { return .55 + this.rng.next() * .7; }
}
