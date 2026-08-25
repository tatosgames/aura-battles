import type { Rng } from "@/engine/math/rng";
import { cardOf, type CardId } from "./CardDefinition";
import { clampAura } from "./AuraSystem";
import { clampHype } from "./HypeSystem";
import { AURA_TO_WIN } from "./AuraSystem";
import { HYPE_TO_WIN } from "./HypeSystem";
import type { FighterState } from "./BattleState";
/** A desperate answer that is not *the* answer still gets a real, seeded chance. */
export const DESPERATE_COUNTER_CHANCE=.3;
export const canDeclareFinal=(fighter:FighterState):boolean=>fighter.aura>=AURA_TO_WIN&&fighter.hype>=HYPE_TO_WIN;
export const isPerfectCounter=(card:CardId,finalMove:CardId):boolean=>cardOf(card).finalCounterFor===finalMove;
/** Anything composed or ridiculous may be thrown at a Final Move; only one card is guaranteed. */
export function legalFinalCounters(defender:FighterState,finalMove:CardId):CardId[]{
 return defender.hand.filter((card)=>{
  if(isPerfectCounter(card,finalMove))return true;
  const category=cardOf(card).category;
  return category==="DEADPAN"||category==="MEME";
 });
}
export type FinalResult={stolen:boolean;perfect:boolean};
export function resolveFinalCounter(card:CardId,finalMove:CardId,rng:Rng):FinalResult{
 if(isPerfectCounter(card,finalMove))return {stolen:true,perfect:true};
 return {stolen:rng.chance(DESPERATE_COUNTER_CHANCE),perfect:false};
}
/** A stolen Final Move must not simply end the match: it has to swing it. */
export function applyFinalSteal(attacker:FighterState,defender:FighterState,perfect:boolean):void{
 attacker.aura=clampAura(attacker.aura-(perfect?6:3));
 attacker.hype=0;
 defender.aura=clampAura(defender.aura+(perfect?3:2));
 defender.hype=clampHype(defender.hype+(perfect?2:1));
}
