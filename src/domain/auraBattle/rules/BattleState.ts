import type { CardCategory, CardId } from "./CardDefinition";
export type Side=0|1;
export type Phase="INTRO"|"CHOOSE"|"COUNTER"|"RESOLVE"|"PERFORM"|"FAIL"|"RECOVER"|"SCORE"|"FINAL_DECLARED"|"FINAL_COUNTER"|"FINAL_PERFORM"|"MATCH_OVER";
/** `failed` is rolled the instant a card is played, so the performance and the rules never disagree. */
export type ChainEntry={side:Side;card:CardId;failed:boolean};
export type ComboId="STYLE_STREAK"|"ZERO_REACTION"|"AURA_STEAL"|"ACCIDENTAL_CINEMA";
export type FighterState={
 side:Side;
 name:string;
 aura:number;
 hype:number;
 hand:CardId[];
 deck:CardId[];
 discard:CardId[];
 recoveries:CardId[];
 finalMove:CardId;
 lastCategory:CardCategory|null;
 repeatedCategory:boolean;   // played the same category twice running, which NPC Reaction punishes
 counteredLastTurn:boolean;  // Absolute Silence rewards holding back
 empower:{category:CardCategory;aura:number}|null;
};
export type Outcome={
 winner:Side;
 card:CardId;
 auraGain:number;
 auraSteal:number;
 hypeGain:number;
 hypeSteal:number;
 combo:ComboId|null;
 failed:boolean;
 wasCounter:boolean;
};
export const COMBO_LABEL:Record<ComboId,string>={STYLE_STREAK:"STYLE STREAK",ZERO_REACTION:"ZERO REACTION",AURA_STEAL:"AURA STEAL",ACCIDENTAL_CINEMA:"ACCIDENTAL CINEMA"};
