import type { FighterPartId } from "./fighterSkeleton";
import type { PoseId } from "./poses";
/** Cues are presentation triggers only: camera, particles and audio listen, the rules never do. */
export type Cue="focus"|"impact"|"crowdPop"|"land"|"reveal"|"slowmo"|"fail";
export type Station="home"|"near"|"center"|"far";
export type Keyframe={
 t:number;
 pose?:PoseId;
 balance?:number;
 root?:Station;
 /** x is multiplied by the fighter's facing so a script reads the same for either side. */
 impulse?:{part:FighterPartId;x:number;y:number;z:number};
 torque?:{part:FighterPartId;x:number;y:number;z:number};
 spawnProp?:Station;
 yeetProp?:number;
 nudgeProp?:number;
 mirrorOpponent?:boolean;
 cue?:Cue;
};
export type PerformanceScript={duration:number;keys:Keyframe[];fail?:Keyframe[]};
const walk=(from:number,count:number,root?:Station):Keyframe[]=>
 Array.from({length:count},(_,index)=>({t:from+index*.3,pose:index%2?"WALK_B":"WALK_A",...(index===0&&root?{root}:{})} as Keyframe));
export const SCRIPTS={
 IDLE:{duration:.6,keys:[{t:0,pose:"IDLE",root:"home"}]},
 // COOL
 MAIN_CHARACTER_WALK:{duration:2.6,keys:[...walk(0,5,"near"),{t:1.5,pose:"STARE",cue:"focus"},{t:2.2,pose:"SUNGLASSES",cue:"crowdPop"}]},
 MEWING_STARE:{duration:2.2,keys:[{t:0,pose:"STARE",cue:"focus"},{t:1.3,pose:"STARE",cue:"crowdPop"}]},
 SUNGLASSES_ON:{duration:2.4,keys:[{t:0,pose:"POINT"},{t:.6,pose:"SUNGLASSES",cue:"focus"},{t:1.6,pose:"STARE",cue:"crowdPop"}]},
 SILENT_FLEX:{duration:2.6,keys:[{t:0,pose:"WINDUP"},{t:.5,pose:"FLEX",cue:"crowdPop"},{t:1.9,pose:"STARE"}]},
 VICTORY_POSE:{duration:2.4,keys:[{t:0,pose:"VICTORY",cue:"crowdPop"},{t:1.7,pose:"SUNGLASSES"}]},
 // DEADPAN — the comedy is that almost nothing happens.
 NO_REACTION:{duration:2.2,keys:[{t:0,pose:"STARE",balance:1,cue:"focus"},{t:1.6,pose:"STARE",cue:"crowdPop"}]},
 CHECK_PHONE:{duration:2.3,keys:[{t:0,pose:"PHONE",cue:"focus"},{t:1.7,pose:"PHONE",cue:"crowdPop"}]},
 LOOK_AWAY:{duration:2.2,keys:[{t:0,pose:"LOOK_AWAY",cue:"focus"},{t:1.6,pose:"ARMS_CROSSED"}]},
 WALK_AWAY:{duration:2.6,keys:[...walk(0,6,"far"),{t:2.0,pose:"ARMS_CROSSED",cue:"crowdPop"}]},
 ABSOLUTE_SILENCE:{duration:2.3,keys:[{t:0,pose:"ARMS_CROSSED",cue:"focus"},{t:1.7,pose:"STARE",cue:"crowdPop"}]},
 // MEME
 SLOW_CLAP:{duration:2.6,keys:[{t:0,pose:"CLAP_A",cue:"focus"},{t:.4,pose:"CLAP_B"},{t:.8,pose:"CLAP_A"},{t:1.2,pose:"CLAP_B"},{t:1.6,pose:"CLAP_A",cue:"crowdPop"},{t:2.1,pose:"SHRUG"}]},
 DO_IT_BETTER:{duration:2.8,keys:[{t:0,pose:"POINT",cue:"focus"},{t:.5,mirrorOpponent:true},{t:1.4,pose:"FLEX",cue:"crowdPop"},{t:2.2,pose:"VICTORY"}]},
 COPY_THAT:{duration:2.4,keys:[{t:0,pose:"SHRUG"},{t:.5,mirrorOpponent:true,cue:"focus"},{t:1.8,pose:"SHRUG",cue:"crowdPop"}]},
 WRONG_PERSON:{duration:2.6,keys:[{t:0,pose:"POINT",cue:"focus"},{t:.9,pose:"SLOW_TURN"},{t:1.7,pose:"SHRUG",cue:"crowdPop"}]},
 NPC_REACTION:{duration:2.4,keys:[{t:0,pose:"STARE",cue:"focus"},{t:.5,pose:"IDLE"},{t:.9,pose:"STARE"},{t:1.3,pose:"IDLE"},{t:1.7,pose:"STARE",cue:"crowdPop"}]},
 // CHAOS — props, impulses and a real chance of eating the floor.
 CHAIR_ENTRANCE:{duration:2.8,keys:[{t:0,pose:"GRAB",spawnProp:"near",cue:"reveal"},...walk(.5,3,"near"),{t:1.5,pose:"CART_PUSH",nudgeProp:3},{t:2.1,pose:"STARE",cue:"crowdPop"}],
  fail:[{t:1.4,balance:0,cue:"fail"},{t:1.45,impulse:{part:"torso",x:5,y:1,z:2}}]},
 CHAIR_YEET:{duration:2.8,keys:[{t:0,pose:"GRAB",cue:"focus"},{t:.6,pose:"WINDUP"},{t:1.1,pose:"THROW",yeetProp:13,cue:"impact"},{t:2.0,pose:"STARE",cue:"crowdPop"}],
  fail:[{t:1.1,pose:"THROW",yeetProp:5,balance:.05,cue:"fail"},{t:1.2,impulse:{part:"pelvis",x:-7,y:2,z:0}}]},
 BACKFLIP_ENTRANCE:{duration:3.0,keys:[{t:0,pose:"WINDUP",cue:"focus"},{t:.5,pose:"BACKFLIP_TUCK",impulse:{part:"pelvis",x:-2,y:15,z:0},torque:{part:"pelvis",x:0,y:0,z:9}},{t:1.6,pose:"RECOVER_STAND"},{t:2.1,pose:"VICTORY",cue:"land"},{t:2.6,pose:"SUNGLASSES",cue:"crowdPop"}],
  fail:[{t:1.5,pose:"KNOCKED",balance:0,cue:"fail"},{t:1.6,impulse:{part:"head",x:3,y:0,z:2}}]},
 TABLE_SLIDE:{duration:3.0,keys:[{t:0,pose:"WINDUP",spawnProp:"near",cue:"reveal"},{t:.7,pose:"WALK_A",root:"near"},{t:1.2,pose:"SLIDE",impulse:{part:"pelvis",x:11,y:5,z:0},cue:"impact"},{t:2.2,pose:"RECOVER_STAND"},{t:2.6,pose:"VICTORY",cue:"crowdPop"}],
  fail:[{t:1.6,pose:"KNOCKED",balance:0,cue:"fail"}]},
 SHOPPING_CART:{duration:3.0,keys:[{t:0,pose:"CART_PUSH",spawnProp:"home",cue:"reveal"},...walk(.6,3,"near"),{t:1.6,pose:"THROW",nudgeProp:9,cue:"impact"},{t:2.3,pose:"VICTORY",cue:"crowdPop"}],
  fail:[{t:1.7,pose:"KNOCKED",balance:0,cue:"fail"},{t:1.8,impulse:{part:"pelvis",x:6,y:3,z:1}}]},
 // RECOVERY — always lands, because the payoff is the point.
 MEANT_TO_DO_THAT:{duration:3.2,keys:[{t:0,pose:"KNOCKED",balance:0},{t:.7,pose:"RECOVER_STAND",balance:.8,cue:"focus"},{t:1.6,pose:"SUNGLASSES"},...walk(2.2,3,"far"),{t:3.0,pose:"ARMS_CROSSED",cue:"crowdPop"}]},
 WALK_IT_OFF:{duration:2.8,keys:[{t:0,pose:"RECOVER_STAND",balance:.8,cue:"focus"},...walk(.8,5,"far"),{t:2.4,pose:"ARMS_CROSSED",cue:"crowdPop"}]},
 STILL_COOL:{duration:2.6,keys:[{t:0,pose:"RECOVER_STAND",balance:.8},{t:.8,pose:"SUNGLASSES",cue:"focus"},{t:1.8,pose:"STARE",cue:"crowdPop"}]},
 // FINAL — long, staged and built entirely around the counter window that precedes it.
 THE_KING_HAS_ARRIVED:{duration:6.4,keys:[{t:0,pose:"STARE",spawnProp:"center",cue:"reveal"},{t:.8,pose:"POINT"},...walk(1.6,4,"center"),{t:3.0,pose:"SLOW_TURN",cue:"slowmo"},{t:4.0,pose:"BOW"},{t:4.8,pose:"THRONE_SIT",cue:"crowdPop"},{t:5.8,pose:"SUNGLASSES"}]},
 LAST_DANCE:{duration:6.4,keys:[{t:0,pose:"POINT",spawnProp:"center",cue:"reveal"},{t:1.0,pose:"DANCE_A"},{t:1.5,pose:"DANCE_B"},{t:2.0,pose:"DANCE_A"},{t:2.5,pose:"DANCE_B",cue:"slowmo"},{t:3.2,pose:"FLEX"},{t:4.0,pose:"BACKFLIP_TUCK",impulse:{part:"pelvis",x:0,y:14,z:0},torque:{part:"pelvis",x:0,y:0,z:8}},{t:5.0,pose:"VICTORY",cue:"crowdPop"}]},
 TAKE_THE_THRONE:{duration:3.2,keys:[{t:0,pose:"WALK_A",root:"center",cue:"focus"},{t:.4,pose:"WALK_B"},{t:.8,pose:"WALK_A"},{t:1.3,pose:"GRAB",nudgeProp:2},{t:1.9,pose:"THRONE_SIT",cue:"crowdPop"},{t:2.8,pose:"SUNGLASSES"}]},
 UNPLUG_THE_SPEAKER:{duration:3.0,keys:[{t:0,pose:"WALK_A",root:"center",cue:"focus"},{t:.4,pose:"WALK_B"},{t:.9,pose:"GRAB",nudgeProp:6,cue:"impact"},{t:1.7,pose:"ARMS_CROSSED",cue:"crowdPop"},{t:2.5,pose:"STARE"}]},
} as const satisfies Record<string,PerformanceScript>;
export type ScriptId=keyof typeof SCRIPTS;
