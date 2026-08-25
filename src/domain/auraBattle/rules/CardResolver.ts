import type { Rng } from "@/engine/math/rng";
import { cardOf } from "./CardDefinition";
import { clampAura } from "./AuraSystem";
import { clampHype } from "./HypeSystem";
import { detectCombo } from "./ComboSystem";
import type { ChainEntry, FighterState, Outcome } from "./BattleState";
/**
 * Walk the chain from the back: the last card nobody answered takes the moment.
 * The failure roll happens here, before a single body has moved, so the simulation can only ever
 * dramatise a result the rules already decided.
 */
export function rollFailure(failChance:number,rng:Rng):boolean{return failChance>0&&rng.chance(failChance);}
export function resolveChain(chain:ChainEntry[],fighters:[FighterState,FighterState],recoveredFromFail=false):Outcome{
 const last=chain[chain.length-1];
 const card=cardOf(last.card);
 const winner=fighters[last.side],loser=fighters[last.side===0?1:0];
 const wasCounter=chain.length>1;
 if(last.failed)return {winner:last.side,card:last.card,auraGain:0,auraSteal:0,hypeGain:0,hypeSteal:0,combo:null,failed:true,wasCounter};
 let aura=card.aura;
 let hype=card.hype;
 let steal=card.steal;
 // Responses are worth more than raw numbers: that is the whole reason to hold a card back.
 if(wasCounter)aura+=1;
 switch(card.bonus?.when){
  case "afterCategory":if(winner.lastCategory===card.bonus.category)aura+=card.bonus.aura;break;
  case "ahead":if(winner.aura>loser.aura){aura+=card.bonus.aura;hype+=card.bonus.hype;}break;
  case "noCounterLastTurn":if(!winner.counteredLastTurn)aura+=card.bonus.aura;break;
  case "repeatPunish":if(loser.repeatedCategory)aura+=card.bonus.aura;break;
  default:break;
 }
 if(winner.empower&&winner.empower.category===card.category)aura+=winner.empower.aura;
 const combo=detectCombo(chain,winner,recoveredFromFail);
 if(combo){aura+=combo.aura;hype+=combo.hype;steal+=combo.steal;}
 return {winner:last.side,card:last.card,auraGain:aura,auraSteal:steal,hypeGain:hype,hypeSteal:card.stealHype,combo:combo?.id??null,failed:false,wasCounter};
}
export function applyOutcome(fighters:[FighterState,FighterState],outcome:Outcome):void{
 const winner=fighters[outcome.winner],loser=fighters[outcome.winner===0?1:0];
 const card=cardOf(outcome.card);
 winner.aura=clampAura(winner.aura+outcome.auraGain);
 winner.hype=clampHype(winner.hype+outcome.hypeGain);
 loser.aura=clampAura(loser.aura-outcome.auraSteal);
 loser.hype=clampHype(loser.hype-outcome.hypeSteal);
 winner.repeatedCategory=winner.lastCategory===card.category;
 winner.lastCategory=card.category;
 winner.empower=card.bonus?.when==="empowerNext"?{category:card.bonus.category,aura:card.bonus.aura}:null;
}
/** A blown performance hands the moment straight to the opponent unless a Recovery rescues it. */
export function applyFailure(fighters:[FighterState,FighterState],outcome:Outcome):void{
 const failer=fighters[outcome.winner],opponent=fighters[outcome.winner===0?1:0];
 const card=cardOf(outcome.card);
 failer.hype=clampHype(failer.hype-1);
 failer.repeatedCategory=failer.lastCategory===card.category;
 failer.lastCategory=card.category;
 failer.empower=null;
 opponent.aura=clampAura(opponent.aura+1);
}
