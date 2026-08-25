import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import { PROP_SHAPES, type PropKind } from "../sim/PropSystem";
const COLORS:Record<PropKind,string>={chair:"#b4712f",table:"#8a5a2b",boombox:"#20242c",throne:"#d4af37",cart:"#9aa5b1"};
export function PropsView({order,transforms}:{order:{id:string;kind:PropKind}[];transforms:Float32Array}){
 const refs=useRef<(Group|null)[]>([]);
 useFrame(()=>{
  for(let index=0;index<order.length;index++){
   const group=refs.current[index];if(!group)continue;
   const offset=index*7;
   group.position.set(transforms[offset],transforms[offset+1],transforms[offset+2]);
   group.quaternion.set(transforms[offset+3],transforms[offset+4],transforms[offset+5],transforms[offset+6]);
  }
 });
 return <>{order.map((prop,index)=>(
  <group key={prop.id} ref={(node)=>{refs.current[index]=node;}}>
   {PROP_SHAPES[prop.kind].map((piece,pieceIndex)=>(
    <mesh key={pieceIndex} position={piece.offset} castShadow receiveShadow>
     <boxGeometry args={[piece.half[0]*2,piece.half[1]*2,piece.half[2]*2]}/>
     <meshStandardMaterial color={COLORS[prop.kind]} roughness={.6} metalness={prop.kind==="throne"?.6:.1}/>
    </mesh>
   ))}
  </group>
 ))}</>;
}
