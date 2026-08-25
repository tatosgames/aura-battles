import type { CardDefinition } from "../rules/CardDefinition";
import type { ArenaController } from "./ArenaController";
import type { RagdollController } from "./RagdollController";
import { SCRIPTS, type Cue, type Keyframe, type PerformanceScript, type Station } from "./performanceScripts";
export type CueSink=(cue:Cue,side:0|1)=>void;
/**
 * Turns a decided card result into a physical performance. It never asks the simulation what
 * happened: when the rules say a move blew up, the fail branch is what gets played.
 */
export class MoveDirector {
 private script:PerformanceScript|null=null;
 private card:CardDefinition|null=null;
 private keys:Keyframe[]=[];
 private index=0;
 private elapsed=0;
 private duration=0;
 constructor(private readonly arena:ArenaController,readonly side:0|1,private readonly onCue:CueSink){}
 get active():boolean{return this.script!==null;}
 get remaining():number{return this.script?Math.max(0,this.duration-this.elapsed):0;}
 private get self():RagdollController{return this.arena.fighters[this.side];}
 private get opponent():RagdollController{return this.arena.fighters[this.side===0?1:0];}
 play(card:CardDefinition,failed:boolean):void{
  const script=SCRIPTS[card.script] as PerformanceScript;
  const failAt=failed&&script.fail?script.fail[0].t:Infinity;
  // Everything the script would have done after the moment it goes wrong is simply dropped.
  this.keys=[...script.keys.filter((key)=>key.t<failAt),...(failed&&script.fail?script.fail:[])].sort((a,b)=>a.t-b.t);
  this.script=script;this.card=card;this.index=0;this.elapsed=0;
  this.duration=failed&&script.fail?Math.max(failAt+1.6,script.fail[script.fail.length-1].t+1.4):script.duration;
 }
 stop():void{this.script=null;this.card=null;this.keys=[];this.index=0;}
 /** Returns true on the step the performance finishes. */
 fixedUpdate(dt:number):boolean{
  if(!this.script)return false;
  this.elapsed+=dt;
  while(this.index<this.keys.length&&this.keys[this.index].t<=this.elapsed)this.apply(this.keys[this.index++]);
  if(this.elapsed>=this.duration){this.stop();return true;}
  return false;
 }
 private station(station:Station):[number,number]{
  const home=this.self.homePosition();const facing=this.self.facing();
  if(station==="home")return [home[0],home[2]];
  if(station==="center")return [facing*.9,0];
  if(station==="near")return [home[0]+facing*1.5,home[2]];
  return [home[0]-facing*1.1,home[2]];
 }
 private apply(key:Keyframe):void{
  const facing=this.self.facing();
  if(key.pose)this.self.setPose(key.pose);
  if(key.mirrorOpponent)this.self.setPose(this.opponent.currentPose);
  if(key.balance!==undefined)this.self.setBalance(key.balance);
  if(key.root){const [x,z]=this.station(key.root);this.self.setRootTarget(x,z);}
  if(key.impulse)this.self.applyImpulse(key.impulse.part,key.impulse.x*facing,key.impulse.y,key.impulse.z);
  if(key.torque)this.self.applyTorqueImpulse(key.torque.part,key.torque.x,key.torque.y,key.torque.z*facing);
  if(key.spawnProp&&this.card?.spawnsProp){
   const [x,z]=this.station(key.spawnProp);
   this.arena.props.spawn(this.card.spawnsProp,[x,this.arena.config.propDrop[1],z],facing>0?0:Math.PI);
  }
  if(key.yeetProp!==undefined)this.throwProp(key.yeetProp,true);
  if(key.nudgeProp!==undefined)this.throwProp(key.nudgeProp,false);
  if(key.cue)this.onCue(key.cue,this.side);
 }
 /** Props a card needs are conjured if missing, so a card is never dead in hand. */
 private throwProp(power:number,towardOpponent:boolean):void{
  const kind=this.card?.requiresProp??this.card?.spawnsProp;
  if(!kind)return;
  const position=this.self.position();
  let id=this.arena.props.nearest(kind,position.x,position.z);
  if(!id)id=this.arena.props.spawn(kind,[position.x+this.self.facing()*.8,this.arena.config.propDrop[1],position.z],0);
  const source=this.arena.props.positionOf(id)!;
  const target=towardOpponent?this.opponent.position():{x:source[0]+this.self.facing()*3,y:1.4,z:source[2]};
  this.arena.props.yeet(id,target.x-source[0],Math.max(.6,target.y-source[1]+.9),target.z-source[2],power);
 }
}
