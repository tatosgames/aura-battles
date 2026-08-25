import { cardOf, type CardId } from "./CardDefinition";
import { clampAura } from "./AuraSystem";
import { clampHype } from "./HypeSystem";
import { AURA_TO_WIN } from "./AuraSystem";
import { HYPE_TO_WIN } from "./HypeSystem";
import type { FighterState } from "./BattleState";

export const canDeclareFinal = (fighter: FighterState): boolean => fighter.aura >= AURA_TO_WIN && fighter.hype >= HYPE_TO_WIN;
export const isPerfectCounter = (card: CardId, finalMove: CardId): boolean => cardOf(card).finalCounterFor === finalMove;
/** A Final is a clean read: only the card with its crown badge can steal it. */
export function legalFinalCounters(defender: FighterState, finalMove: CardId): CardId[] {
 return defender.hand.filter((card) => isPerfectCounter(card, finalMove));
}
export type FinalResult = { stolen: boolean; perfect: true };
export function resolveFinalCounter(card: CardId, finalMove: CardId): FinalResult {
 if (!isPerfectCounter(card, finalMove)) throw new Error("Only a perfect Final Counter may resolve.");
 return { stolen: true, perfect: true };
}
export function applyFinalSteal(attacker: FighterState, defender: FighterState): void {
 attacker.aura = clampAura(attacker.aura - 6);
 attacker.hype = 0;
 defender.aura = clampAura(defender.aura + 3);
 defender.hype = clampHype(defender.hype + 2);
}
