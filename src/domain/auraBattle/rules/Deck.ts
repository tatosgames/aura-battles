import { shuffle, type Rng } from "@/engine/math/rng";
import type { CardId } from "./CardDefinition";
import type { FighterState, Side } from "./BattleState";
export const HAND_SIZE=3;
/** Fixed decks. Each one carries the single perfect counter to the *other* fighter's Final Move. */
export const DECKS:[CardId[],CardId[]]=[
 ["main_character_walk","mewing_stare","sunglasses_on","silent_flex","victory_pose",
  "no_reaction","check_phone","look_away","walk_away",
  "slow_clap","do_it_better","npc_reaction",
  "chair_entrance","chair_yeet","backflip_entrance",
  "unplug_the_speaker"],
 ["main_character_walk","mewing_stare","silent_flex","victory_pose",
  "no_reaction","absolute_silence","walk_away","look_away",
  "slow_clap","copy_that","wrong_person","npc_reaction",
  "table_slide","shopping_cart","chair_entrance",
  "take_the_throne"],
];
export const FINAL_MOVES:[CardId,CardId]=["the_king_has_arrived","last_dance"];
export const RECOVERY_PILE:CardId[]=["meant_to_do_that","walk_it_off","still_cool"];
export const FIGHTER_NAMES:[string,string]=["BLU","REDD"];
export function createFighter(side:Side,rng:Rng):FighterState{
 const deck=shuffle(DECKS[side],rng);
 return {side,name:FIGHTER_NAMES[side],aura:0,hype:0,hand:deck.splice(0,HAND_SIZE),deck,discard:[],
  recoveries:[...RECOVERY_PILE],finalMove:FINAL_MOVES[side],lastCategory:null,repeatedCategory:false,counteredLastTurn:false,empower:null};
}
/** Draw back up to three, reshuffling the discard pile when the deck runs dry. */
export function refill(fighter:FighterState,rng:Rng):void{
 while(fighter.hand.length<HAND_SIZE){
  if(fighter.deck.length===0){
   if(fighter.discard.length===0)return;
   fighter.deck=shuffle(fighter.discard,rng);fighter.discard=[];
  }
  fighter.hand.push(fighter.deck.shift()!);
 }
}
export function discard(fighter:FighterState,card:CardId):void{
 const index=fighter.hand.indexOf(card);
 if(index>=0)fighter.hand.splice(index,1);
 fighter.discard.push(card);
}
