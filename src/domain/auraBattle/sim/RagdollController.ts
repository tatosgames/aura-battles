/* eslint-disable @typescript-eslint/no-explicit-any */
import type { PhysicsRuntime } from "@/engine/physics/PhysicsRuntime";
import { ArticulatedBodyFactory, type ArticulatedBody, type Vec3 } from "@/engine/bodies/ArticulatedBodyFactory";
import { createFighterParts, FIGHTER_PARTS, PELVIS_HEIGHT, type FighterPartId } from "./fighterSkeleton";
import { POSES, type Euler, type Pose, type PoseId } from "./poses";
import { quatFromEuler, quatMul, rotationTowards, rotateVector, type Quat } from "./quat";
/** Parts whose orientation is driven by pose-tracking torque. Elbows and knees are left to their joint motors. */
const DRIVEN:FighterPartId[]=["pelvis","torso","head","upperArmL","upperArmR","upperLegL","upperLegR"];
/** Angle-to-angular-velocity gain (1/s) and servo time constant (s) per driven part. */
const RATE:Record<string,number>={pelvis:11,torso:12,head:13,upperArmL:14,upperArmR:14,upperLegL:12,upperLegR:12};
// head/upperArm* run a slightly longer time constant than pelvis/torso on purpose: those two must
// stay razor-tight (they encode "standing" vs "failing"), everything else earns a touch of overshoot.
const TAU:Record<string,number>={pelvis:.035,torso:.035,head:.05,upperArmL:.042,upperArmR:.042,upperLegL:.035,upperLegR:.035};
const MAX_SPIN=16;
const clamp=(value:number,limit:number):number=>value<-limit?-limit:value>limit?limit:value;
const ZERO:Euler=[0,0,0];
const approach=(current:number,target:number,rate:number,dt:number):number=>current+(target-current)*Math.min(1,rate*dt);
/**
 * Fixed (never random) low-frequency sway per driven part, distinct phase per part so nothing moves
 * in lockstep. This is what keeps a held pose from reading as a statue — it needs no seed because it
 * is cosmetic secondary motion, not a decision the rules or a replay ever depend on.
 */
const SWAY:Record<string,{axis:0|1|2;phase:number}>={
 pelvis:{axis:2,phase:.4},torso:{axis:0,phase:1.7},head:{axis:1,phase:2.6},
 upperArmL:{axis:2,phase:.9},upperArmR:{axis:2,phase:3.3},upperLegL:{axis:0,phase:4.1},upperLegR:{axis:0,phase:5.8},
};
const SWAY_AMPLITUDE=.05;
const swayOffset=(id:string,elapsed:number):number=>{
 const {phase}=SWAY[id];
 return (Math.sin((elapsed+phase)*3.8)+Math.sin((elapsed+phase)*10.6)*.5)*SWAY_AMPLITUDE;
};
export type FighterSide=0|1;
export class RagdollController {
 private readonly body:ArticulatedBody<FighterPartId>;
 private readonly rotations=new Map<FighterPartId,[number,number,number]>();
 private readonly targetRotations=new Map<FighterPartId,Euler>();
 private elbows:[number,number]=[.35,.35]; private targetElbows:[number,number]=[.35,.35];
 private knees:[number,number]=[-.12,-.12]; private targetKnees:[number,number]=[-.12,-.12];
 private balance=.95; private targetBalance=.95;
 private stiffness=1; private targetStiffness=1;
 private lift=0; private targetLift=0;
 private blendRate=7;
 private elapsed=0;
 private rootTarget:[number,number];
 private readonly yaw:Quat;
 private poseId:PoseId="IDLE";
 private readonly totalMass:number;
 constructor(private readonly runtime:PhysicsRuntime,readonly side:FighterSide,private home:Vec3,collisionGroups:number,private readonly gravity=14.5){
  this.body=new ArticulatedBodyFactory<FighterPartId>(runtime).create(createFighterParts(home,collisionGroups));
  this.yaw=quatFromEuler(0,side===0?0:Math.PI,0);
  this.rootTarget=[home[0],home[2]];
  this.totalMass=[...this.body.parts.values()].reduce((sum,part)=>sum+part.body.mass(),0);
  FIGHTER_PARTS.forEach((id)=>{this.rotations.set(id,[0,0,0]);this.targetRotations.set(id,ZERO);});
  this.setPose("IDLE",1);
 }
 get parts(){return this.body.parts;}
 get currentPose():PoseId{return this.poseId;}
 part(id:FighterPartId):any{return this.body.parts.get(id)!.body;}
 setPose(id:PoseId,blendRate=7):void{
  const pose:Pose=POSES[id];this.poseId=id;this.blendRate=blendRate;
  FIGHTER_PARTS.forEach((part)=>this.targetRotations.set(part,pose.rotations[part]??ZERO));
  this.targetElbows=pose.elbows??[.35,.35];this.targetKnees=pose.knees??[-.12,-.12];
  this.targetBalance=pose.balance;this.targetStiffness=pose.stiffness;this.targetLift=pose.lift??0;
 }
 /** Scripts override balance directly: this is the single knob that turns a performance into a pratfall. */
 setBalance(value:number):void{this.targetBalance=value;}
 setRootTarget(x:number,z:number):void{this.rootTarget=[x,z];}
 homePosition():Vec3{return this.home;}
 facing():number{return this.side===0?1:-1;}
 position():{x:number;y:number;z:number}{return this.part("pelvis").translation();}
 headPosition():{x:number;y:number;z:number}{return this.part("head").translation();}
 applyImpulse(id:FighterPartId,x:number,y:number,z:number):void{this.part(id).applyImpulse({x,y,z},true);}
 applyTorqueImpulse(id:FighterPartId,x:number,y:number,z:number):void{this.part(id).applyTorqueImpulse({x,y,z},true);}
 /**
  * A bounded, one-shot reaction to an incidental knock — not a scripted move. The axis comes from the
  * pelvis's current velocity (a real jolt has a direction); when nothing is moving yet it falls back
  * to a small fixed nod so an incidental bump is never silently absorbed. No randomness needed either
  * way, which keeps this reaction fully deterministic for a given seed.
  */
 flinch(strength:number):void{
  const amount=clamp(strength,1)*2.6;
  const velocity=this.part("pelvis").linvel();
  const planarSpeed=Math.hypot(velocity.x,velocity.z);
  // Cross the horizontal velocity with "up" so the jolt reads as a sideways whip, not a spin in place.
  const axis=planarSpeed>.3?{x:-velocity.z/planarSpeed,y:0,z:velocity.x/planarSpeed}:{x:1,y:0,z:0};
  for(const id of ["head","upperArmL","upperArmR"] as FighterPartId[])
   this.part(id).applyTorqueImpulse({x:axis.x*amount,y:axis.y*amount,z:axis.z*amount},true);
 }
 isDown():boolean{const up=rotateVector(this.part("torso").rotation(),{x:0,y:1,z:0});return this.position().y<PELVIS_HEIGHT*.55||up.y<.35;}
 uprightness():number{return Math.max(0,rotateVector(this.part("torso").rotation(),{x:0,y:1,z:0}).y);}
 fixedUpdate(dt:number):void{
  this.elapsed+=dt;
  this.balance=approach(this.balance,this.targetBalance,this.blendRate,dt);
  this.stiffness=approach(this.stiffness,this.targetStiffness,this.blendRate,dt);
  this.lift=approach(this.lift,this.targetLift,this.blendRate,dt);
  for(let index=0;index<2;index++){
   this.elbows[index]=approach(this.elbows[index],this.targetElbows[index],this.blendRate,dt);
   this.knees[index]=approach(this.knees[index],this.targetKnees[index],this.blendRate,dt);
  }
  const authority=this.stiffness*(.25+.75*this.balance);
  // A downed fighter (low balance) already gets all its motion from real physics; adding sway on
  // top of that would fight the fall instead of selling it, so it fades out with balance.
  const swayStrength=this.stiffness*Math.min(1,Math.max(.15,this.balance));
  for(const id of DRIVEN){
   const current=this.rotations.get(id)!,target=this.targetRotations.get(id)!;
   for(let axis=0;axis<3;axis++)current[axis]=approach(current[axis],target[axis],this.blendRate,dt);
   const part=this.body.parts.get(id)!.body;
   const swayed:Euler=[current[0],current[1],current[2]];
   swayed[SWAY[id].axis]+=swayOffset(id,this.elapsed)*swayStrength;
   const desired=quatMul(this.yaw,quatFromEuler(swayed[0],swayed[1],swayed[2]));
   const error=rotationTowards(part.rotation(),desired);
   const spin=part.angvel();const inertia=part.principalInertia();
   // Servo on angular velocity and scale by real inertia: torque tuned against mass alone detonates the ragdoll.
   const scale=Math.max(inertia.x,inertia.y,inertia.z)*Math.min(1,dt/TAU[id])*authority;
   const rate=RATE[id];
   // A hard cap keeps a bad pose target from ever pumping energy into the solver.
   const cap=scale*MAX_SPIN*1.5;
   part.applyTorqueImpulse({x:clamp((clamp(error.x*rate,MAX_SPIN)-spin.x)*scale,cap),y:clamp((clamp(error.y*rate,MAX_SPIN)-spin.y)*scale,cap),z:clamp((clamp(error.z*rate,MAX_SPIN)-spin.z)*scale,cap)},true);
  }
  this.carryWeight(dt);
  this.driveMotor("lowerArmL",this.elbows[0]);this.driveMotor("lowerArmR",this.elbows[1]);
  this.driveMotor("lowerLegL",this.knees[0]);this.driveMotor("lowerLegR",this.knees[1]);
  this.supportPelvis(dt);
 }
 /**
  * While braced, a fighter carries almost none of its own weight, so a pose holds exactly as authored.
  * Letting `balance` fall hands the weight back and the whole body sags, buckles and drops.
  */
 private carryWeight(dt:number):void{
  const support=this.balance*.92;
  if(support<=.01)return;
  for(const id of FIGHTER_PARTS){
   const body=this.body.parts.get(id)!.body;
   body.applyImpulse({x:0,y:body.mass()*this.gravity*support*dt,z:0},true);
  }
 }
 /** The legs are decoration: a pelvis spring scaled by `balance` stands in for real bipedal support. */
 private supportPelvis(dt:number):void{
  if(this.balance<=.01)return;
  const pelvis=this.part("pelvis");const position=pelvis.translation();const velocity=pelvis.linvel();
  const standY=this.home[1];const carry=this.totalMass*this.balance*dt;
  const vertical=clamp(90*(standY-position.y),26)-11*velocity.y;
  const horizontalX=clamp(26*(this.rootTarget[0]-position.x),7)-7*velocity.x;
  const horizontalZ=clamp(26*(this.rootTarget[1]-position.z),7)-7*velocity.z;
  pelvis.applyImpulse({x:horizontalX*carry,y:(vertical+this.lift*11)*carry,z:horizontalZ*carry},true);
 }
 private driveMotor(id:FighterPartId,target:number):void{
  const joint=this.body.parts.get(id)?.joint;
  if(joint)joint.configureMotorPosition(target,id.startsWith("lowerLeg")?26:18,id.startsWith("lowerLeg")?3.4:2.6);
 }
 /** Seven floats per part: translation then rotation, in FIGHTER_PARTS order. */
 writeTransforms(out:Float32Array,offset:number):void{
  FIGHTER_PARTS.forEach((id,index)=>{
   const body=this.body.parts.get(id)!.body;const p=body.translation(),q=body.rotation();const base=offset+index*7;
   out[base]=p.x;out[base+1]=p.y;out[base+2]=p.z;out[base+3]=q.x;out[base+4]=q.y;out[base+5]=q.z;out[base+6]=q.w;
  });
 }
 reset():void{
  FIGHTER_PARTS.forEach((id)=>{
   const body=this.body.parts.get(id)!.body;
   body.setLinvel({x:0,y:0,z:0},true);body.setAngvel({x:0,y:0,z:0},true);
   body.setRotation({x:this.yaw.x,y:this.yaw.y,z:this.yaw.z,w:this.yaw.w},true);
  });
  const parts=createFighterParts(this.home,0);
  parts.forEach((definition)=>{
   const local:Vec3=[definition.position[0]-this.home[0],definition.position[1]-this.home[1],definition.position[2]-this.home[2]];
   const rotated=rotateVector(this.yaw,{x:local[0],y:local[1],z:local[2]});
   this.body.parts.get(definition.id)!.body.setTranslation({x:this.home[0]+rotated.x,y:this.home[1]+rotated.y,z:this.home[2]+rotated.z},true);
  });
  this.rootTarget=[this.home[0],this.home[2]];
  FIGHTER_PARTS.forEach((id)=>this.rotations.set(id,[0,0,0]));
  this.balance=.95;this.stiffness=1;this.lift=0;this.elapsed=0;
  this.setPose("IDLE",1);
 }
 dispose():void{this.body.dispose(this.runtime);}
}
export const FIGHTER_FLOATS=FIGHTER_PARTS.length*7;
