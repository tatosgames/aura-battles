import { cardOf } from "./CardDefinition";
import type { ChainEntry, ComboId, FighterState } from "./BattleState";
export type ComboResult={id:ComboId;aura:number;hype:number;steal:number};
/**
 * Four named combos, recognised from the shape of the exchange rather than from a lookup table
 * the player would have to memorise. The UI announces them after the fact.
 */
export function detectCombo(chain:ChainEntry[],winner:FighterState,recoveredFromFail:boolean):ComboResult|null{
 const last=chain[chain.length-1];
 const winning=cardOf(last.card);
 if(recoveredFromFail&&winning.category==="RECOVERY")return {id:"ACCIDENTAL_CINEMA",aura:2,hype:1,steal:0};
 const answered=chain.length>=2?cardOf(chain[chain.length-2].card):null;
 if(answered){
  if(winning.category==="DEADPAN"&&answered.category==="CHAOS")return {id:"ZERO_REACTION",aura:2,hype:1,steal:1};
  if(winning.category==="MEME"&&answered.category==="COOL")return {id:"AURA_STEAL",aura:1,hype:1,steal:1};
 }
 if(winning.category==="COOL"&&winner.lastCategory==="COOL")return {id:"STYLE_STREAK",aura:1,hype:1,steal:0};
 return null;
}
