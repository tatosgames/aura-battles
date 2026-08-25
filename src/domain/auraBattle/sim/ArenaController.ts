/* eslint-disable @typescript-eslint/no-explicit-any */
import { getRapier } from "@/engine/physics/rapierRuntime";
import { PhysicsRuntime, type ContactNotice } from "@/engine/physics/PhysicsRuntime";
import { CollisionLayerRegistry } from "@/engine/physics/CollisionLayerRegistry";
import { validateArenaConfig, type ArenaConfig } from "@/engine/config/runtimeConfig";
import type { Vec3 } from "@/engine/bodies/ArticulatedBodyFactory";
import { PropSystem, type PropSnapshot } from "./PropSystem";
import { FIGHTER_FLOATS, RagdollController } from "./RagdollController";
import { PELVIS_HEIGHT, type FighterPartId } from "./fighterSkeleton";
export const MAX_PROPS=16;
export type BoundaryCatch={x:number;z:number;side:0|1};
/** How far past the visible lip a body may drift before the stage's force field catches it. */
const BOUNDARY_MARGIN=.6;
const BOUNDARY_SPRING=46;
const BOUNDARY_CAP=20;
/** Contact force above which an incidental knock earns a visible flinch, not just silence. */
const KNOCK_THRESHOLD=900;
const KNOCK_SCALE=4000;
export class ArenaController {
 readonly layers:CollisionLayerRegistry;
 readonly fighters:[RagdollController,RagdollController];
 readonly props:PropSystem;
 readonly transforms=new Float32Array(FIGHTER_FLOATS*2);
 readonly propTransforms=new Float32Array(MAX_PROPS*7);
 private impact=0;
 private boundaryCatch:BoundaryCatch|null=null;
 /** Maps a collider handle back to the fighter/part that owns it, built once at construction. */
 private readonly colliderOwners=new Map<number,{side:0|1;part:FighterPartId}>();
 private constructor(readonly physics:PhysicsRuntime,readonly config:ArenaConfig){
  this.layers=new CollisionLayerRegistry(config.layers);
  this.createStage();
  const groups=(side:0|1)=>this.layers.group([side===0?"fighterA":"fighterB"],["ground","prop",side===0?"fighterB":"fighterA"]);
  const spawn=(side:0|1):Vec3=>[config.spawns[side][0],PELVIS_HEIGHT,config.spawns[side][2]];
  const gravity=Math.abs(config.gravity[1]);
  this.fighters=[new RagdollController(physics,0,spawn(0),groups(0),gravity),new RagdollController(physics,1,spawn(1),groups(1),gravity)];
  this.props=new PropSystem(physics,this.layers.group(["prop"],["ground","fighterA","fighterB","prop"]));
  this.fighters.forEach((fighter,side)=>fighter.parts.forEach((part,id)=>this.colliderOwners.set(part.collider.handle,{side:side as 0|1,part:id})));
 }
 static async create(value:unknown):Promise<ArenaController>{
  const config=validateArenaConfig(value);
  const physics=await PhysicsRuntime.create({x:config.gravity[0],y:config.gravity[1],z:config.gravity[2]});
  return new ArenaController(physics,config);
 }
 private createStage():void{
  const rapier=getRapier();const anchor=this.physics.world.createRigidBody(rapier.RigidBodyDesc.fixed());
  const groups=this.layers.group(["ground"],["fighterA","fighterB","prop"]);
  const add=(descriptor:any)=>{descriptor.setCollisionGroups(groups).setFriction(.95);this.physics.world.createCollider(descriptor,anchor);};
  const radius=this.config.stageRadius;
  add(rapier.ColliderDesc.cuboid(radius,.5,radius).setTranslation(0,-.5,0));
  // A low lip keeps the comedy on stage without turning the arena into a box.
  for(const [x,z,sx,sz] of [[-radius,0,.3,radius],[radius,0,.3,radius],[0,-radius,radius,.3],[0,radius,radius,.3]] as const)
   add(rapier.ColliderDesc.cuboid(sx,.35,sz).setTranslation(x,.35,z));
 }
 /** Rebuilt every fixed step so presentation can read plain floats without touching Rapier. */
 syncTransforms():void{this.fighters.forEach((fighter,index)=>fighter.writeTransforms(this.transforms,index*FIGHTER_FLOATS));this.props.writeTransforms(this.propTransforms);}
 fixedUpdate(dt:number):void{
  this.fighters.forEach((fighter)=>fighter.fixedUpdate(dt));
  this.physics.step(dt);
  this.physics.drainContacts((notice:ContactNotice)=>{
   if(notice.force>this.impact)this.impact=notice.force;
   if(notice.force<=KNOCK_THRESHOLD)return;
   // An incidental bump (prop, fighter-on-fighter) now earns a small physical reaction instead of nothing.
   const strength=Math.min(1,notice.force/KNOCK_SCALE);
   const ownerA=this.colliderOwners.get(notice.colliderA);
   const ownerB=this.colliderOwners.get(notice.colliderB);
   if(ownerA)this.fighters[ownerA.side].flinch(strength);
   if(ownerB)this.fighters[ownerB.side].flinch(strength);
  });
  this.applyBoundaryContainment(dt);
  this.syncTransforms();
 }
 /**
  * A soft, physical force field: past the visible lip, a proportional impulse pulls a body back
  * toward centre. Fighters trigger the visible catch presentation reads via `takeBoundaryCatch`;
  * props are quietly contained the same way with no VFX attached.
  */
 private applyBoundaryContainment(dt:number):void{
  const limit=this.config.stageRadius+BOUNDARY_MARGIN;
  this.fighters.forEach((fighter,side)=>{
   const p=fighter.position();const distance=Math.hypot(p.x,p.z);
   if(distance<=limit)return;
   const push=Math.min((distance-limit)*BOUNDARY_SPRING,BOUNDARY_CAP)*dt;
   fighter.applyImpulse("pelvis",-p.x/distance*push,0,-p.z/distance*push);
   this.boundaryCatch={x:p.x,z:p.z,side:side as 0|1};
  });
  this.props.order().forEach(({id})=>{
   const position=this.props.positionOf(id);if(!position)return;
   const [x,,z]=position;const distance=Math.hypot(x,z);
   if(distance<=limit)return;
   const push=Math.min((distance-limit)*BOUNDARY_SPRING,BOUNDARY_CAP)*dt;
   this.props.nudge(id,-x/distance*push,0,-z/distance*push);
  });
 }
 /** Peak contact force since the last read, used purely to trigger presentation shake. */
 takeImpact():number{const value=this.impact;this.impact=0;return value;}
 /** The most recent fighter boundary catch since the last read, if any — one-shot, like `takeImpact`. */
 takeBoundaryCatch():BoundaryCatch|null{const value=this.boundaryCatch;this.boundaryCatch=null;return value;}
 propSnapshot():PropSnapshot[]{return this.props.snapshot();}
 reset():void{this.props.clear();this.fighters.forEach((fighter)=>fighter.reset());this.impact=0;this.boundaryCatch=null;this.syncTransforms();}
 dispose():void{this.props.clear();this.fighters.forEach((fighter)=>fighter.dispose());this.physics.dispose();}
}
