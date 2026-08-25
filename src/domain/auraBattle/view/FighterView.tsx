import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type ReactElement } from "react";
import type { Group, Object3D } from "three";
import { FIGHTER_PARTS, type FighterPartId } from "../sim/fighterSkeleton";
import { FIGHTER_FLOATS } from "../sim/RagdollController";
type Piece={geometry:ReactElement;material:"skin"|"shirt"|"pants"};
const PIECES:Record<FighterPartId,Piece>={
 pelvis:{geometry:<capsuleGeometry args={[.24,.24,4,12]}/>,material:"pants"},
 torso:{geometry:<capsuleGeometry args={[.3,.4,6,16]}/>,material:"shirt"},
 head:{geometry:<sphereGeometry args={[.27,20,16]}/>,material:"skin"},
 upperArmL:{geometry:<capsuleGeometry args={[.1,.32,4,12]}/>,material:"shirt"},
 lowerArmL:{geometry:<capsuleGeometry args={[.09,.32,4,12]}/>,material:"skin"},
 upperArmR:{geometry:<capsuleGeometry args={[.1,.32,4,12]}/>,material:"shirt"},
 lowerArmR:{geometry:<capsuleGeometry args={[.09,.32,4,12]}/>,material:"skin"},
 upperLegL:{geometry:<capsuleGeometry args={[.13,.36,4,12]}/>,material:"pants"},
 lowerLegL:{geometry:<capsuleGeometry args={[.115,.36,4,12]}/>,material:"pants"},
 upperLegR:{geometry:<capsuleGeometry args={[.13,.36,4,12]}/>,material:"pants"},
 lowerLegR:{geometry:<capsuleGeometry args={[.115,.36,4,12]}/>,material:"pants"},
};
export type FighterPalette={skin:string;shirt:string;pants:string;accent:string};
export const PALETTES:[FighterPalette,FighterPalette]=[
 {skin:"#f3c9a0",shirt:"#2f6fed",pants:"#1d2740",accent:"#7dd3fc"},
 {skin:"#c98f63",shirt:"#e0452f",pants:"#2c1a1a",accent:"#fca5a5"},
];
export function FighterView({side,transforms,palette}:{side:0|1;transforms:Float32Array;palette:FighterPalette}){
 const refs=useRef<(Object3D|null)[]>([]);
 const root=useRef<Group>(null);
 const base=useMemo(()=>side*FIGHTER_FLOATS,[side]);
 useFrame(()=>{
  for(let index=0;index<FIGHTER_PARTS.length;index++){
   const object=refs.current[index];if(!object)continue;
   const offset=base+index*7;
   object.position.set(transforms[offset],transforms[offset+1],transforms[offset+2]);
   object.quaternion.set(transforms[offset+3],transforms[offset+4],transforms[offset+5],transforms[offset+6]);
  }
 });
 return <group ref={root}>{FIGHTER_PARTS.map((id,index)=>(
  <mesh key={id} ref={(node)=>{refs.current[index]=node;}} castShadow receiveShadow>
   {PIECES[id].geometry}
   <meshStandardMaterial color={palette[PIECES[id].material]} roughness={.55} metalness={.05}/>
   {id==="head"&&<>
    <mesh position={[.23,.07,.11]}><sphereGeometry args={[.055,10,8]}/><meshStandardMaterial color="#12151c"/></mesh>
    <mesh position={[.23,.07,-.11]}><sphereGeometry args={[.055,10,8]}/><meshStandardMaterial color="#12151c"/></mesh>
    <mesh position={[0,.22,0]}><sphereGeometry args={[.2,12,10]}/><meshStandardMaterial color={palette.pants} roughness={.8}/></mesh>
   </>}
  </mesh>
 ))}</group>;
}
