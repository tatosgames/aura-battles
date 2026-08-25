import type { PropKind } from "../sim/PropSystem";
import type { ScriptId } from "../sim/performanceScripts";
export type CardCategory="COOL"|"DEADPAN"|"MEME"|"CHAOS"|"RECOVERY"|"FINAL";
export type CardId=string;
/** Conditional riders. Deliberately a closed set: a card must stay readable at a glance. */
export type Bonus=
 |{when:"afterCategory";category:CardCategory;aura:number}
 |{when:"ahead";aura:number;hype:number}
 |{when:"noCounterLastTurn";aura:number}
 |{when:"empowerNext";category:CardCategory;aura:number}
 |{when:"repeatPunish";aura:number}
 |{when:"mirrorOpponent"};
export type CardDefinition={
 id:CardId;
 name:string;
 category:CardCategory;
 aura:number;            // gained by the owner when this card takes the moment
 hype:number;            // hype gained when it takes the moment
 steal:number;           // aura torn off the opponent when it takes the moment
 stealHype:number;       // hype torn off the opponent when it takes the moment
 counters:CardCategory[];// categories this card may legally answer; empty means it can only open
 guard:CardCategory[];   // categories that may not answer this card
 blurb:string;           // one short line, never a paragraph
 script:ScriptId;
 failChance:number;      // rolled by the domain, never discovered by the simulation
 bonus?:Bonus;
 requiresProp?:PropKind;
 spawnsProp?:PropKind;
 finalCounterFor?:CardId;// the one card that steals this Final Move outright
};
const card=(definition:Partial<CardDefinition>&Pick<CardDefinition,"id"|"name"|"category"|"blurb"|"script">):CardDefinition=>
 ({aura:1,hype:0,steal:0,stealHype:0,counters:[],guard:[],failChance:0,...definition});
export const CARDS:Record<CardId,CardDefinition>=Object.fromEntries([
 // COOL — confidence and main-character energy. Steady, combos with itself, punished by MEME.
 card({id:"main_character_walk",name:"Main Character Walk",category:"COOL",aura:2,hype:1,blurb:"Own the room. +2 Aura.",script:"MAIN_CHARACTER_WALK"}),
 card({id:"mewing_stare",name:"Mewing Stare",category:"COOL",aura:1,hype:1,guard:["MEME"],blurb:"Jaw locked. Memes bounce off.",script:"MEWING_STARE"}),
 card({id:"sunglasses_on",name:"Sunglasses On",category:"COOL",aura:1,hype:1,bonus:{when:"empowerNext",category:"COOL",aura:1},blurb:"Next COOL hits harder.",script:"SUNGLASSES_ON"}),
 card({id:"silent_flex",name:"Silent Flex",category:"COOL",aura:1,hype:1,bonus:{when:"afterCategory",category:"DEADPAN",aura:2},blurb:"+2 more after a DEADPAN.",script:"SILENT_FLEX"}),
 card({id:"victory_pose",name:"Victory Pose",category:"COOL",aura:2,hype:0,bonus:{when:"ahead",aura:1,hype:1},blurb:"Bonus while you are ahead.",script:"VICTORY_POSE"}),
 // DEADPAN — composure. The answer to spectacle.
 card({id:"no_reaction",name:"No Reaction",category:"DEADPAN",aura:2,hype:1,steal:1,counters:["CHAOS","MEME"],blurb:"Counter CHAOS or MEME. Steal 1 Aura.",script:"NO_REACTION"}),
 card({id:"check_phone",name:"Check Phone",category:"DEADPAN",aura:2,hype:1,counters:["CHAOS","COOL"],blurb:"Counter CHAOS or COOL.",script:"CHECK_PHONE"}),
 card({id:"look_away",name:"Look Away",category:"DEADPAN",aura:1,hype:1,stealHype:1,counters:["COOL","CHAOS"],blurb:"Counter COOL or CHAOS. Burn 1 Hype.",script:"LOOK_AWAY"}),
 card({id:"walk_away",name:"Walk Away",category:"DEADPAN",aura:1,hype:0,stealHype:2,counters:["COOL","MEME","CHAOS"],blurb:"Counter COOL, MEME or CHAOS. Burn 2 Hype.",script:"WALK_AWAY"}),
 card({id:"absolute_silence",name:"Absolute Silence",category:"DEADPAN",aura:1,hype:1,counters:["MEME","CHAOS"],bonus:{when:"noCounterLastTurn",aura:2},blurb:"Counter MEME or CHAOS. +2 if you passed last turn.",script:"ABSOLUTE_SILENCE"}),
 // MEME — ridicule. The answer to composure and posing.
 card({id:"slow_clap",name:"Slow Clap",category:"MEME",aura:2,hype:1,stealHype:1,counters:["COOL"],blurb:"Counter COOL. Burn 1 Hype.",script:"SLOW_CLAP"}),
 card({id:"do_it_better",name:"Do It Better",category:"MEME",aura:2,hype:1,steal:1,counters:["COOL","CHAOS"],bonus:{when:"mirrorOpponent"},blurb:"Counter COOL or CHAOS. Copy it and steal 1 Aura.",script:"DO_IT_BETTER"}),
 card({id:"copy_that",name:"Copy That",category:"MEME",aura:1,hype:1,counters:["COOL","DEADPAN","CHAOS"],bonus:{when:"mirrorOpponent"},blurb:"Counter COOL, DEADPAN or CHAOS. Copy it.",script:"COPY_THAT"}),
 card({id:"wrong_person",name:"Wrong Person",category:"MEME",aura:2,hype:1,steal:1,counters:["COOL","DEADPAN"],blurb:"Counter COOL or DEADPAN. Steal 1 Aura.",script:"WRONG_PERSON"}),
 card({id:"npc_reaction",name:"NPC Reaction",category:"MEME",aura:1,hype:1,counters:["COOL","DEADPAN","CHAOS"],bonus:{when:"repeatPunish",aura:2},blurb:"Counter COOL, DEADPAN or CHAOS. +2 against repeats.",script:"NPC_REACTION"}),
 // CHAOS — spectacle. Biggest numbers, real risk, leaves props behind.
 card({id:"chair_entrance",name:"Chair Entrance",category:"CHAOS",aura:2,hype:1,blurb:"Arrive with a chair.",script:"CHAIR_ENTRANCE",spawnsProp:"chair",failChance:.2}),
 card({id:"chair_yeet",name:"Chair Yeet",category:"CHAOS",aura:3,hype:1,steal:1,blurb:"Throw the chair. Loudly.",script:"CHAIR_YEET",requiresProp:"chair",failChance:.3}),
 card({id:"backflip_entrance",name:"Backflip Entrance",category:"CHAOS",aura:4,hype:1,blurb:"High risk. High Aura.",script:"BACKFLIP_ENTRANCE",failChance:.45}),
 card({id:"table_slide",name:"Table Slide",category:"CHAOS",aura:3,hype:1,blurb:"Slide across the table.",script:"TABLE_SLIDE",spawnsProp:"table",failChance:.35}),
 card({id:"shopping_cart",name:"Shopping Cart Entrance",category:"CHAOS",aura:3,hype:2,blurb:"Wheels. No brakes.",script:"SHOPPING_CART",spawnsProp:"cart",failChance:.4}),
 // RECOVERY — held outside the deck and offered only after a FAIL.
 card({id:"meant_to_do_that",name:"Meant To Do That",category:"RECOVERY",aura:3,hype:1,blurb:"Turn the fall into the plan.",script:"MEANT_TO_DO_THAT"}),
 card({id:"walk_it_off",name:"Walk It Off",category:"RECOVERY",aura:2,hype:1,steal:1,blurb:"Stand. Leave. Say nothing.",script:"WALK_IT_OFF"}),
 card({id:"still_cool",name:"Still Cool",category:"RECOVERY",aura:2,hype:2,blurb:"Adjust the sunglasses.",script:"STILL_COOL"}),
 // FINAL — one per fighter, always visible, answered by exactly one perfect counter.
 card({id:"the_king_has_arrived",name:"The King Has Arrived",category:"FINAL",aura:0,hype:0,blurb:"A throne. Silence. The end.",script:"THE_KING_HAS_ARRIVED",spawnsProp:"throne"}),
 card({id:"last_dance",name:"Last Dance",category:"FINAL",aura:0,hype:0,blurb:"Drop the beat. Drop them.",script:"LAST_DANCE",spawnsProp:"boombox"}),
 card({id:"take_the_throne",name:"Take The Throne",category:"MEME",aura:3,hype:1,steal:2,counters:["FINAL"],finalCounterFor:"the_king_has_arrived",blurb:"Perfect counter to The King Has Arrived.",script:"TAKE_THE_THRONE"}),
 card({id:"unplug_the_speaker",name:"Unplug The Speaker",category:"DEADPAN",aura:3,hype:1,steal:2,counters:["FINAL"],finalCounterFor:"last_dance",blurb:"Perfect counter to Last Dance.",script:"UNPLUG_THE_SPEAKER"}),
].map((definition)=>[definition.id,definition]));
export const cardOf=(id:CardId):CardDefinition=>{const definition=CARDS[id];if(!definition)throw new Error(`Unknown card: ${id}`);return definition;};
