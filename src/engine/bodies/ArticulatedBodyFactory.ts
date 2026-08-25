/* eslint-disable @typescript-eslint/no-explicit-any */
import { getRapier } from "@/engine/physics/rapierRuntime";
import type { PhysicsRuntime } from "@/engine/physics/PhysicsRuntime";
export type Vec3=[number,number,number];
export type JointSpec=
 |{kind:"spherical";anchorParent?:Vec3;anchorSelf?:Vec3}
 |{kind:"revolute";axis:Vec3;anchorParent?:Vec3;anchorSelf?:Vec3;limits?:[number,number];motor?:{stiffness:number;damping:number}}
 |{kind:"fixed";anchorParent?:Vec3;anchorSelf?:Vec3};
export type PartDefinition<PartId extends string>={id:PartId;parent?:PartId;position:Vec3;shape:"box"|"sphere"|"capsule";size:Vec3;ballast?:boolean;joint?:JointSpec;density?:number;angularDamping?:number;linearDamping?:number;collisionGroups?:number;friction?:number;restitution?:number};
export type ArticulatedPart<PartId extends string>={body:any;collider:any;parent?:PartId;joint?:any;jointKind?:JointSpec["kind"]};
const vec=(value:Vec3)=>({x:value[0],y:value[1],z:value[2]});
const midpoint=(a:Vec3,b:Vec3):Vec3=>[(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2];
const offset=(from:Vec3,to:Vec3):Vec3=>[to[0]-from[0],to[1]-from[1],to[2]-from[2]];
export class ArticulatedBody<PartId extends string>{
 constructor(readonly parts:Map<PartId,ArticulatedPart<PartId>>){}
 dispose(runtime:PhysicsRuntime):void{this.parts.forEach((part)=>{if(part.joint)runtime.world.removeImpulseJoint(part.joint,false);});this.parts.forEach(({body,collider})=>{runtime.world.removeCollider(collider,true);runtime.world.removeRigidBody(body);});this.parts.clear();}
 removeSubtree(id:PartId,runtime:PhysicsRuntime):void{const children=[...this.parts.entries()].filter(([,part])=>part.parent===id).map(([child])=>child);children.forEach((child)=>this.removeSubtree(child,runtime));const part=this.parts.get(id);if(!part)return;if(part.joint)runtime.world.removeImpulseJoint(part.joint,true);runtime.world.removeCollider(part.collider,true);runtime.world.removeRigidBody(part.body);this.parts.delete(id);}
}
export class ArticulatedBodyFactory<PartId extends string>{
 constructor(private readonly runtime:PhysicsRuntime){}
 create(parts:readonly PartDefinition<PartId>[]):ArticulatedBody<PartId>{
  const rapier=getRapier();const output=new Map<PartId,ArticulatedPart<PartId>>();
  for(const part of parts){
   if(output.has(part.id))throw new Error(`Duplicate part: ${part.id}`);
   const descriptor=rapier.RigidBodyDesc.dynamic().setTranslation(...part.position);
   if(part.angularDamping!==undefined)descriptor.setAngularDamping(part.angularDamping);
   if(part.linearDamping!==undefined)descriptor.setLinearDamping(part.linearDamping);
   const body=this.runtime.world.createRigidBody(descriptor);
   const collider=part.shape==="box"?rapier.ColliderDesc.cuboid(...part.size):part.shape==="sphere"?rapier.ColliderDesc.ball(part.size[0]):rapier.ColliderDesc.capsule(part.size[1],part.size[0]);
   collider.setDensity(part.density??(part.ballast?3:1));
   if(part.collisionGroups!==undefined)collider.setCollisionGroups(part.collisionGroups);
   if(part.friction!==undefined)collider.setFriction(part.friction);
   if(part.restitution!==undefined)collider.setRestitution(part.restitution);
   output.set(part.id,{body,collider:this.runtime.world.createCollider(collider,body),parent:part.parent});
  }
  // Joints are a second pass so a definition may reference a parent declared after it.
  for(const part of parts){
   if(!part.joint||!part.parent)continue;
   const child=output.get(part.id);const parent=output.get(part.parent);
   if(!child||!parent)throw new Error(`Unknown joint parent: ${part.parent}`);
   const parentDefinition=parts.find((item)=>item.id===part.parent)!;
   const pivot=midpoint(parentDefinition.position,part.position);
   const anchorParent=part.joint.anchorParent??offset(parentDefinition.position,pivot);
   const anchorSelf=part.joint.anchorSelf??offset(part.position,pivot);
   const data=part.joint.kind==="spherical"?rapier.JointData.spherical(vec(anchorParent),vec(anchorSelf))
    :part.joint.kind==="fixed"?rapier.JointData.fixed(vec(anchorParent),{x:0,y:0,z:0,w:1},vec(anchorSelf),{x:0,y:0,z:0,w:1})
    :rapier.JointData.revolute(vec(anchorParent),vec(anchorSelf),vec(part.joint.axis));
   const joint=this.runtime.world.createImpulseJoint(data,parent.body,child.body,true) as any;
   joint.setContactsEnabled(false);
   if(part.joint.kind==="revolute"){
    if(part.joint.limits)joint.setLimits(part.joint.limits[0],part.joint.limits[1]);
    if(part.joint.motor)joint.configureMotorPosition(0,part.joint.motor.stiffness,part.joint.motor.damping);
   }
   child.joint=joint;child.jointKind=part.joint.kind;
  }
  return new ArticulatedBody(output);
 }
}
