import type { PartDefinition, Vec3 } from "@/engine/bodies/ArticulatedBodyFactory";
export const FIGHTER_PARTS=["pelvis","torso","head","upperArmL","lowerArmL","upperArmR","lowerArmR","upperLegL","lowerLegL","upperLegR","lowerLegR"] as const;
export type FighterPartId=(typeof FIGHTER_PARTS)[number];
/** Pelvis height that puts the feet on a stage whose surface sits at y=0. */
export const PELVIS_HEIGHT=1.15;
const HINGE:Vec3=[0,0,1];
const add=(origin:Vec3,local:Vec3):Vec3=>[origin[0]+local[0],origin[1]+local[1],origin[2]+local[2]];
/** Local part centres, measured from the pelvis. Chunky proportions read better than human ones. */
const LAYOUT:Record<FighterPartId,Vec3>={pelvis:[0,0,0],torso:[0,.5,0],head:[0,1.04,0],upperArmL:[0,.47,.42],lowerArmL:[0,.05,.42],upperArmR:[0,.47,-.42],lowerArmR:[0,.05,-.42],upperLegL:[0,-.38,.17],lowerLegL:[0,-.86,.17],upperLegR:[0,-.38,-.17],lowerLegR:[0,-.86,-.17]};
export function createFighterParts(origin:Vec3,collisionGroups:number):PartDefinition<FighterPartId>[]{
 const at=(id:FighterPartId)=>add(origin,LAYOUT[id]);
 const limb=(id:FighterPartId,parent:FighterPartId,radius:number,half:number,density:number,joint:PartDefinition<FighterPartId>["joint"]):PartDefinition<FighterPartId>=>
  ({id,parent,position:at(id),shape:"capsule",size:[radius,half,0],density,angularDamping:3,linearDamping:.35,collisionGroups,friction:.9,joint});
 return [
  {id:"pelvis",position:at("pelvis"),shape:"capsule",size:[.24,.12,0],density:3.2,angularDamping:3,linearDamping:.4,collisionGroups,friction:.9},
  limb("torso","pelvis",.3,.2,2.4,{kind:"spherical"}),
  // A heavy head is the whole comedy engine: it makes every loss of balance topple theatrically.
  {id:"head",parent:"torso",position:at("head"),shape:"sphere",size:[.27,0,0],density:2.2,angularDamping:3,linearDamping:.35,collisionGroups,friction:.6,joint:{kind:"spherical"}},
  limb("upperArmL","torso",.1,.16,.8,{kind:"spherical",anchorParent:[0,.18,.42],anchorSelf:[0,.21,0]}),
  limb("lowerArmL","upperArmL",.09,.16,.7,{kind:"revolute",axis:HINGE,anchorParent:[0,-.21,0],anchorSelf:[0,.21,0],limits:[0,2.3],motor:{stiffness:14,damping:2.2}}),
  limb("upperArmR","torso",.1,.16,.8,{kind:"spherical",anchorParent:[0,.18,-.42],anchorSelf:[0,.21,0]}),
  limb("lowerArmR","upperArmR",.09,.16,.7,{kind:"revolute",axis:HINGE,anchorParent:[0,-.21,0],anchorSelf:[0,.21,0],limits:[0,2.3],motor:{stiffness:14,damping:2.2}}),
  limb("upperLegL","pelvis",.13,.18,1.3,{kind:"spherical",anchorParent:[0,-.16,.17],anchorSelf:[0,.22,0]}),
  limb("lowerLegL","upperLegL",.115,.18,1.1,{kind:"revolute",axis:HINGE,anchorParent:[0,-.24,0],anchorSelf:[0,.24,0],limits:[-2.3,0],motor:{stiffness:18,damping:2.6}}),
  limb("upperLegR","pelvis",.13,.18,1.3,{kind:"spherical",anchorParent:[0,-.16,-.17],anchorSelf:[0,.22,0]}),
  limb("lowerLegR","upperLegR",.115,.18,1.1,{kind:"revolute",axis:HINGE,anchorParent:[0,-.24,0],anchorSelf:[0,.24,0],limits:[-2.3,0],motor:{stiffness:18,damping:2.6}}),
 ];
}
