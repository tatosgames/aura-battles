import { cardOf, type CardId } from "./CardDefinition";
import type { ChainEntry, FighterState } from "./BattleState";
export const MAX_CHAIN=3;
/**
 * A card may answer another when it lists that category and the target does not guard against it.
 * Countering is the whole game, so legality is checked here and nowhere else.
 */
export function canCounter(candidate:CardId,target:CardId):boolean{
 const answer=cardOf(candidate),incoming=cardOf(target);
 if(answer.counters.length===0)return false;
 if(!answer.counters.includes(incoming.category))return false;
 if(incoming.guard.includes(answer.category))return false;
 return true;
}
export function legalCounters(fighter:FighterState,chain:ChainEntry[]):CardId[]{
 if(chain.length===0||chain.length>=MAX_CHAIN)return [];
 const target=chain[chain.length-1].card;
 return fighter.hand.filter((card)=>canCounter(card,target));
}
/**
 * Openers prefer cards that stand on their own. Reactive cards stay playable only when the hand
 * holds nothing else, so a turn is never dead but a counter is never wasted for no reason either.
 */
export function legalOpeners(fighter:FighterState):CardId[]{
 const playable=fighter.hand.filter((card)=>!cardOf(card).counters.includes("FINAL"));
 const standalone=playable.filter((card)=>cardOf(card).counters.length===0);
 return standalone.length>0?standalone:playable;
}
