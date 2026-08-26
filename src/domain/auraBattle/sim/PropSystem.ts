/* eslint-disable @typescript-eslint/no-explicit-any */
import { getRapier } from "@/engine/physics/rapierRuntime";
import type { PhysicsRuntime } from "@/engine/physics/PhysicsRuntime";
export const PROP_KINDS=["chair","table","boombox","throne","cart"] as const;
export type PropKind=(typeof PROP_KINDS)[number];
export type PropSnapshot={id:string;kind:PropKind;position:[number,number,number];rotation:[number,number,number,number]};
type Piece={half:[number,number,number];offset:[number,number,number]};
/** Each prop is one rigid body carrying a couple of boxes: enough silhouette, no compound-shape bookkeeping. */
export const PROP_SHAPES:Record<PropKind,Piece[]>={
 chair:[{half:[.28,.05,.28],offset:[0,.42,0]},{half:[.05,.35,.28],offset:[-.25,.8,0]},{half:[.05,.22,.05],offset:[.2,.2,.2]},{half:[.05,.22,.05],offset:[.2,.2,-.2]}],
 table:[{half:[.8,.06,.5],offset:[0,.7,0]},{half:[.07,.35,.07],offset:[-.68,.35,-.4]},{half:[.07,.35,.07],offset:[.68,.35,-.4]},{half:[.07,.35,.07],offset:[-.68,.35,.4]},{half:[.07,.35,.07],offset:[.68,.35,.4]}],
 boombox:[{half:[.55,.28,.2],offset:[0,.28,0]},{half:[.12,.12,.05],offset:[-.28,.28,.22]},{half:[.12,.12,.05],offset:[.28,.28,.22]}],
 throne:[{half:[.45,.08,.45],offset:[0,.55,0]},{half:[.08,.75,.45],offset:[-.4,1.2,0]},{half:[.08,.28,.08],offset:[.35,.28,.35]},{half:[.08,.28,.08],offset:[.35,.28,-.35]},{half:[.08,.28,.08],offset:[-.35,.28,.35]}],
 cart:[{half:[.42,.05,.3],offset:[0,.35,0]},{half:[.05,.3,.3],offset:[-.4,.62,0]},{half:[.42,.3,.05],offset:[0,.62,.28]},{half:[.42,.3,.05],offset:[0,.62,-.28]},{half:[.05,.3,.3],offset:[.4,.62,0]}],
};
export const PROP_DENSITY:Record<PropKind,number>={chair:.6,table:.5,boombox:.9,throne:.8,cart:.45};
export class PropSystem {
 private readonly props=new Map<string,{kind:PropKind;body:any;colliders:any[]}>();
 private next=1;
 /** Bumped whenever the prop set changes so presentation rebuilds its meshes only then. */
 revision=0;
 constructor(private readonly runtime:PhysicsRuntime,private readonly collisionGroups:number){}
 spawn(kind:PropKind,position:[number,number,number],yaw=0):string{
  const rapier=getRapier();const id=`${kind}-${this.next++}`;
  const half=Math.sin(yaw/2);
  const body=this.runtime.world.createRigidBody(rapier.RigidBodyDesc.dynamic().setTranslation(...position).setRotation({x:0,y:half,z:0,w:Math.cos(yaw/2)}).setLinearDamping(.25).setAngularDamping(.4));
  const colliders=PROP_SHAPES[kind].map((piece)=>{
   const descriptor=rapier.ColliderDesc.cuboid(...piece.half).setTranslation(...piece.offset).setDensity(PROP_DENSITY[kind]).setFriction(.7).setRestitution(.15);
   descriptor.setCollisionGroups(this.collisionGroups).setActiveEvents(rapier.ActiveEvents.CONTACT_FORCE_EVENTS);
   return this.runtime.world.createCollider(descriptor,body);
  });
  this.props.set(id,{kind,body,colliders});this.revision++;
  return id;
 }
 has(kind:PropKind):boolean{return [...this.props.values()].some((prop)=>prop.kind===kind);}
 count():number{return this.props.size;}
 nearest(kind:PropKind,x:number,z:number):string|undefined{
  let best:string|undefined,bestDistance=Infinity;
  this.props.forEach((prop,id)=>{if(prop.kind!==kind)return;const p=prop.body.translation();const distance=(p.x-x)**2+(p.z-z)**2;if(distance<bestDistance){bestDistance=distance;best=id;}});
  return best;
 }
 positionOf(id:string):[number,number,number]|undefined{const prop=this.props.get(id);if(!prop)return undefined;const p=prop.body.translation();return [p.x,p.y,p.z];}
 horizontalVelocityOf(id:string):[number,number]|undefined{const prop=this.props.get(id);if(!prop)return undefined;const v=prop.body.linvel();return [v.x,v.z];}
 /** Overwrites x/z velocity directly, leaving the fall/bounce (y) untouched — the stage's containment wall. */
 setHorizontalVelocity(id:string,x:number,z:number):void{const prop=this.props.get(id);if(!prop)return;const v=prop.body.linvel();prop.body.setLinvel({x,y:v.y,z},true);}
 /** Throw a prop. Direction is normalised here so a card never has to reason about magnitudes. */
 yeet(id:string,dx:number,dy:number,dz:number,power:number):void{
  const prop=this.props.get(id);if(!prop)return;
  const length=Math.hypot(dx,dy,dz)||1;const mass=prop.body.mass();
  prop.body.applyImpulse({x:dx/length*power*mass,y:dy/length*power*mass,z:dz/length*power*mass},true);
  prop.body.applyTorqueImpulse({x:power*.06*mass,y:power*.04*mass,z:power*.08*mass},true);
 }
 nudge(id:string,x:number,y:number,z:number):void{const prop=this.props.get(id);if(!prop)return;prop.body.applyImpulse({x:x*prop.body.mass(),y:y*prop.body.mass(),z:z*prop.body.mass()},true);}
 order():{id:string;kind:PropKind}[]{return [...this.props.entries()].map(([id,prop])=>({id,kind:prop.kind}));}
 writeTransforms(out:Float32Array):void{
  let index=0;
  this.props.forEach((prop)=>{const base=index*7;if(base+7>out.length)return;const p=prop.body.translation(),q=prop.body.rotation();out[base]=p.x;out[base+1]=p.y;out[base+2]=p.z;out[base+3]=q.x;out[base+4]=q.y;out[base+5]=q.z;out[base+6]=q.w;index++;});
 }
 snapshot():PropSnapshot[]{
  return [...this.props.entries()].map(([id,prop])=>{const p=prop.body.translation(),q=prop.body.rotation();return {id,kind:prop.kind,position:[p.x,p.y,p.z],rotation:[q.x,q.y,q.z,q.w]};});
 }
 clear():void{
  this.props.forEach((prop)=>{prop.colliders.forEach((collider)=>this.runtime.world.removeCollider(collider,false));this.runtime.world.removeRigidBody(prop.body);});
  this.props.clear();this.next=1;this.revision++;
 }
}
