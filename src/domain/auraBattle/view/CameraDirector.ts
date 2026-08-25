import { Vector3, type PerspectiveCamera } from "three";
import { FIGHTER_FLOATS } from "../sim/RagdollController";
export type ShotId="DUEL"|"FOCUS"|"COUNTER_SNAP"|"IMPACT"|"SLOWMO_ORBIT"|"FINAL"|"REVERSAL"|"WIN";
type Shot={offset:[number,number,number];look:[number,number,number];fov:number;follow:"midpoint"|"subject";ease:number};
/** Offsets are expressed along the duel axis so a shot reads identically for either fighter. */
const SHOTS:Record<ShotId,Shot>={
 DUEL:{offset:[0,3.4,9.6],look:[0,1.5,0],fov:44,follow:"midpoint",ease:1.6},
 FOCUS:{offset:[2.2,2.4,5.2],look:[0,1.3,0],fov:38,follow:"subject",ease:2.6},
 COUNTER_SNAP:{offset:[1.4,1.1,3.4],look:[0,1.35,0],fov:32,follow:"subject",ease:16},
 IMPACT:{offset:[1.0,2.0,4.0],look:[0,1.2,0],fov:30,follow:"subject",ease:9},
 SLOWMO_ORBIT:{offset:[4.6,2.2,4.6],look:[0,1.4,0],fov:36,follow:"midpoint",ease:1.1},
 FINAL:{offset:[3.2,1.4,6.4],look:[0,1.6,0],fov:50,follow:"subject",ease:1.3},
 REVERSAL:{offset:[1.6,.7,3.6],look:[0,1.5,0],fov:34,follow:"subject",ease:12},
 WIN:{offset:[0,2.6,6.2],look:[0,1.4,0],fov:42,follow:"midpoint",ease:2},
};
const scratch=new Vector3();
export class CameraDirector {
 private shot:ShotId="DUEL"; private subject:0|1=0; private shakeAmount=0; private orbit=0;
 private readonly position=new Vector3(0,3.4,9.6); private readonly target=new Vector3(0,1.5,0); private fov=44;
 set(shot:ShotId,subject:0|1=this.subject):void{this.shot=shot;this.subject=subject;}
 shake(amount:number):void{this.shakeAmount=Math.min(1.2,this.shakeAmount+amount);}
 reset():void{this.shot="DUEL";this.shakeAmount=0;this.orbit=0;}
 update(dt:number,camera:PerspectiveCamera,transforms:Float32Array,elapsed:number):void{
  const shot=SHOTS[this.shot];
  const subjectX=transforms[this.subject*FIGHTER_FLOATS],subjectY=transforms[this.subject*FIGHTER_FLOATS+1],subjectZ=transforms[this.subject*FIGHTER_FLOATS+2];
  const otherX=transforms[(1-this.subject)*FIGHTER_FLOATS];
  const anchorX=shot.follow==="subject"?subjectX:(subjectX+otherX)/2;
  const anchorY=shot.follow==="subject"?Math.max(.6,subjectY):1.1;
  const anchorZ=shot.follow==="subject"?subjectZ:0;
  // Push the camera toward whichever side the subject is on so the opponent stays framed.
  const sign=this.subject===0?-1:1;
  this.orbit=this.shot==="SLOWMO_ORBIT"?this.orbit+dt*.55:this.orbit*.94;
  const swing=Math.sin(this.orbit)*2.2;
  const desiredX=anchorX+shot.offset[0]*sign+swing;
  const desiredY=anchorY+shot.offset[1];
  const desiredZ=anchorZ+shot.offset[2]-Math.abs(swing)*.35;
  const ease=Math.min(1,shot.ease*dt);
  this.position.lerp(scratch.set(desiredX,desiredY,desiredZ),ease);
  this.target.lerp(scratch.set(anchorX+shot.look[0],anchorY*.5+shot.look[1],anchorZ+shot.look[2]),Math.min(1,shot.ease*1.4*dt));
  this.fov+=(shot.fov-this.fov)*ease;
  this.shakeAmount=Math.max(0,this.shakeAmount-dt*2.2);
  const jitter=this.shakeAmount*this.shakeAmount*.55;
  camera.position.set(this.position.x+Math.sin(elapsed*57)*jitter,this.position.y+Math.sin(elapsed*71)*jitter,this.position.z+Math.sin(elapsed*43)*jitter);
  camera.lookAt(this.target);
  if(Math.abs(camera.fov-this.fov)>.01){camera.fov=this.fov;camera.updateProjectionMatrix();}
 }
}
