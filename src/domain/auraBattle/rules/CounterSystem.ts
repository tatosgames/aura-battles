import { cardOf, type CardCategory, type CardId, type CoreCategory } from "./CardDefinition";
import type { ChainEntry, FighterState } from "./BattleState";

export const MAX_CHAIN = 3;

/** One rule to learn: play the category that beats the incoming category. */
export const BEATS: Record<CoreCategory, CoreCategory> = {
 COOL: "DEADPAN",
 DEADPAN: "CHAOS",
 CHAOS: "MEME",
 MEME: "COOL",
};

export const isCoreCategory = (category: CardCategory): category is CoreCategory => category in BEATS;
export const beatenBy = (category: CardCategory): CoreCategory | null => {
 if (!isCoreCategory(category)) return null;
 return (Object.keys(BEATS) as CoreCategory[]).find((candidate) => BEATS[candidate] === category) ?? null;
};
export const beats = (candidate: CardCategory, target: CardCategory): boolean => isCoreCategory(candidate) && isCoreCategory(target) && BEATS[candidate] === target;

export function canCounter(candidate: CardId, target: CardId): boolean {
 return beats(cardOf(candidate).category, cardOf(target).category);
}
export function legalCounters(fighter: FighterState, chain: ChainEntry[]): CardId[] {
 if (chain.length === 0 || chain.length >= MAX_CHAIN) return [];
 const target = chain[chain.length - 1].card;
 return fighter.hand.filter((card) => canCounter(card, target));
}
/** Every core card can open. Recovery and Final cards have their own dedicated windows. */
export function legalOpeners(fighter: FighterState): CardId[] {
 return fighter.hand.filter((card) => isCoreCategory(cardOf(card).category));
}
