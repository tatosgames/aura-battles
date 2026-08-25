import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import type { PerspectiveCamera, PointLight } from "three";
import type { ArenaController } from "../sim/ArenaController";
import type { PropKind } from "../sim/PropSystem";
import { FighterView, PALETTES } from "./FighterView";
import { PropsView } from "./PropsView";
import { Crowd } from "./Crowd";
import { Sparks } from "./Sparks";
import type { SparkPool } from "./SparkPool";
import type { CameraDirector } from "./CameraDirector";
export function ArenaScene({arena,director,propOrder,excitement,sparks,debug=false}:{arena:ArenaController;director:CameraDirector;propOrder:{id:string;kind:PropKind}[];excitement:{current:number};sparks:SparkPool;debug?:boolean}){
 const camera=useThree((state)=>state.camera) as PerspectiveCamera;
 const scene=useThree((state)=>state.scene);
 useEffect(()=>()=>arena.physics.updateDebug(scene,false),[arena,scene]);
 const radius=arena.config.stageRadius;
 const spotA=useRef<PointLight>(null);const spotB=useRef<PointLight>(null);
 const rim=useMemo(()=>Array.from({length:28},(_,index)=>{const angle=(index/28)*Math.PI*2;return [Math.cos(angle)*(radius+.15),Math.sin(angle)*(radius+.15)] as const;}),[radius]);
 useFrame((state,delta)=>{
  arena.physics.updateDebug(scene,debug);
  director.update(Math.min(delta,1/20),camera,arena.transforms,state.clock.elapsedTime);
  const pulse=.6+excitement.current*1.6;
  if(spotA.current)spotA.current.intensity=28*pulse;
  if(spotB.current)spotB.current.intensity=22*pulse;
 });
 return <>
  <color attach="background" args={["#0a0d16"]}/>
  <fog attach="fog" args={["#0a0d16",16,42]}/>
  <ambientLight intensity={.7} color="#8fa3c8"/>
  <hemisphereLight args={["#4d6ea8","#161c2b",.9]}/>
  <directionalLight position={[6,12,7]} intensity={1.4} castShadow shadow-mapSize={[1024,1024]}>
   <orthographicCamera attach="shadow-camera" args={[-12,12,12,-12,.5,40]}/>
  </directionalLight>
  <pointLight ref={spotA} position={[-5,7,3]} color="#5b8cff" distance={30} decay={2}/>
  <pointLight ref={spotB} position={[5,7,-3]} color="#ff5b7a" distance={30} decay={2}/>
  <mesh position={[0,-.5,0]} receiveShadow>
   <cylinderGeometry args={[radius,radius+.4,1,48]}/>
   <meshStandardMaterial color="#171d2b" roughness={.85}/>
  </mesh>
  <mesh position={[0,.002,0]} rotation-x={-Math.PI/2} receiveShadow>
   <circleGeometry args={[radius-.1,48]}/>
   <meshStandardMaterial color="#232c40" roughness={.7}/>
  </mesh>
  {rim.map(([x,z],index)=>(
   <mesh key={index} position={[x,.1,z]}>
    <sphereGeometry args={[.11,8,6]}/>
    <meshBasicMaterial color={index%2?"#7dd3fc":"#fca5a5"}/>
   </mesh>
  ))}
  <mesh position={[0,-1.2,0]} rotation-x={-Math.PI/2} receiveShadow>
   <circleGeometry args={[26,48]}/>
   <meshStandardMaterial color="#0d1220" roughness={1}/>
  </mesh>
  <Crowd excitement={excitement}/>
  <FighterView side={0} transforms={arena.transforms} palette={PALETTES[0]}/>
  <FighterView side={1} transforms={arena.transforms} palette={PALETTES[1]}/>
  <PropsView order={propOrder} transforms={arena.propTransforms}/>
  <Sparks pool={sparks}/>
 </>;
}
