import type { Rng } from "@/engine/math/rng";
import { cardOf, type CoreCategory } from "./CardDefinition";
import { clampAura } from "./AuraSystem";
import { clampHype } from "./HypeSystem";
import { detectCombo } from "./ComboSystem";
import type { ChainEntry, FighterState, Outcome } from "./BattleState";

export function rollFailure(failChance: number, rng: Rng): boolean { return failChance > 0 && rng.chance(failChance); }

/** The last unanswered card takes the moment. All scoring modifiers are explicit card riders. */
export function resolveChain(chain: ChainEntry[], fighters: [FighterState, FighterState], recoveredFromFail = false): Outcome {
 const last = chain[chain.length - 1];
 const card = cardOf(last.card);
 const winner = fighters[last.side], loser = fighters[last.side === 0 ? 1 : 0];
 const wasCounter = chain.length > 1;
 if (last.failed) return { winner: last.side, card: last.card, auraGain: 0, auraLoss: 0, hypeGain: 0, hypeLoss: 0, combo: null, failed: true, wasCounter };

 let aura = card.aura;
 let hype = card.hype;
 let hypeLoss = 0;
 if (wasCounter) aura += 1;
 if (winner.link?.category === card.category) aura += winner.link.aura;

 switch (card.rider?.kind) {
  case "AFTER": if (winner.lastCategory === card.rider.category) aura += card.rider.aura; break;
  case "AHEAD": if (winner.aura > loser.aura) { aura += card.rider.aura; hype += card.rider.hype; } break;
  case "OPENING": if (!wasCounter) aura += card.rider.aura; break;
  case "COUNTER_DRAIN_HYPE": if (wasCounter) hypeLoss += card.rider.hype; break;
  case "REPEAT": if (loser.repeatedCategory) aura += card.rider.aura; break;
  default: break;
 }

 const combo = detectCombo(chain, recoveredFromFail);
 if (combo === "ACCIDENTAL_CINEMA") { aura += 2; hype += 1; }
 return { winner: last.side, card: last.card, auraGain: aura, auraLoss: wasCounter ? 1 : 0, hypeGain: hype, hypeLoss, combo, failed: false, wasCounter };
}

export function applyOutcome(fighters: [FighterState, FighterState], outcome: Outcome): void {
 const winner = fighters[outcome.winner], loser = fighters[outcome.winner === 0 ? 1 : 0];
 const card = cardOf(outcome.card);
 winner.aura = clampAura(winner.aura + outcome.auraGain);
 winner.hype = clampHype(winner.hype + outcome.hypeGain);
 loser.aura = clampAura(loser.aura - outcome.auraLoss);
 loser.hype = clampHype(loser.hype - outcome.hypeLoss);
 winner.repeatedCategory = winner.lastCategory === card.category;
 winner.lastCategory = card.category;
 winner.link = card.rider?.kind === "LINK" ? { category: card.rider.category, aura: card.rider.aura } : null;
}

/** A visibly risky CHAOS card gives the other fighter one Aura and opens Recovery. */
export function applyFailure(fighters: [FighterState, FighterState], outcome: Outcome): void {
 const failer = fighters[outcome.winner], opponent = fighters[outcome.winner === 0 ? 1 : 0];
 const card = cardOf(outcome.card);
 failer.hype = clampHype(failer.hype - 1);
 failer.repeatedCategory = failer.lastCategory === card.category;
 failer.lastCategory = card.category;
 failer.link = null;
 opponent.aura = clampAura(opponent.aura + 1);
}

/** Keeps UI previews and tests on the same category contract as the resolver. */
export const categoryOf = (card: ChainEntry): CoreCategory | null => {
 const category = cardOf(card.card).category;
 return category === "COOL" || category === "DEADPAN" || category === "MEME" || category === "CHAOS" ? category : null;
};
