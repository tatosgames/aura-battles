/* eslint-disable @typescript-eslint/no-explicit-any */
import { getRapier } from "@/engine/physics/rapierRuntime";
import { PhysicsRuntime, type ContactNotice } from "@/engine/physics/PhysicsRuntime";
import { CollisionLayerRegistry } from "@/engine/physics/CollisionLayerRegistry";
import { validateArenaConfig, type ArenaConfig } from "@/engine/config/runtimeConfig";
import type { Vec3 } from "@/engine/bodies/ArticulatedBodyFactory";
import { PropSystem, type PropSnapshot } from "./PropSystem";
import { FIGHTER_FLOATS, RagdollController } from "./RagdollController";
import { PELVIS_HEIGHT } from "./fighterSkeleton";
export const MAX_PROPS=16;
export class ArenaController {
 readonly layers:CollisionLayerRegistry;
 readonly fighters:[RagdollController,RagdollController];
 readonly props:PropSystem;
 readonly transforms=new Float32Array(FIGHTER_FLOATS*2);
 readonly propTransforms=new Float32Array(MAX_PROPS*7);
 private impact=0;
 private constructor(readonly physics:PhysicsRuntime,readonly config:ArenaConfig){
  this.layers=new CollisionLayerRegistry(config.layers);
  this.createStage();
  const groups=(side:0|1)=>this.layers.group([side===0?"fighterA":"fighterB"],["ground","prop",side===0?"fighterB":"fighterA"]);
  const spawn=(side:0|1):Vec3=>[config.spawns[side][0],PELVIS_HEIGHT,config.spawns[side][2]];
  const gravity=Math.abs(config.gravity[1]);
  this.fighters=[new RagdollController(physics,0,spawn(0),groups(0),gravity),new RagdollController(physics,1,spawn(1),groups(1),gravity)];
  this.props=new PropSystem(physics,this.layers.group(["prop"],["ground","fighterA","fighterB","prop"]));
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
  this.physics.drainContacts((notice:ContactNotice)=>{if(notice.force>this.impact)this.impact=notice.force;});
  this.syncTransforms();
 }
 /** Peak contact force since the last read, used purely to trigger presentation shake. */
 takeImpact():number{const value=this.impact;this.impact=0;return value;}
 propSnapshot():PropSnapshot[]{return this.props.snapshot();}
 reset():void{this.props.clear();this.fighters.forEach((fighter)=>fighter.reset());this.impact=0;this.syncTransforms();}
 dispose():void{this.props.clear();this.fighters.forEach((fighter)=>fighter.dispose());this.physics.dispose();}
}
