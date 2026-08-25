import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Color, InstancedMesh, MathUtils, Object3D } from "three";
const COUNT=180;
const dummy=new Object3D();
/** Purely decorative: the crowd bobs harder the more excited the match gets. */
export function Crowd({excitement}:{excitement:{current:number}}){
 const mesh=useRef<InstancedMesh>(null);
 const seats=useMemo(()=>Array.from({length:COUNT},(_,index)=>{
  const ring=index%3;const angle=(index/COUNT)*Math.PI*2+ring*.11;const radius=10.8+ring*1.9;
  return {x:Math.cos(angle)*radius,z:Math.sin(angle)*radius,y:.6+ring*.7,phase:index*1.7,scale:.8+((index*37)%13)/26};
 }),[]);
 const colors=useMemo(()=>{
  const array=new Float32Array(COUNT*3);const color=new Color();
  seats.forEach((_,index)=>{color.setHSL(((index*47)%360)/360,.42,.36);array[index*3]=color.r;array[index*3+1]=color.g;array[index*3+2]=color.b;});
  return array;
 },[seats]);
 useFrame(({clock})=>{
  const node=mesh.current;if(!node)return;
  const time=clock.elapsedTime;const energy=MathUtils.clamp(excitement.current,0,1);
  seats.forEach((seat,index)=>{
   dummy.position.set(seat.x,seat.y+Math.abs(Math.sin(time*(2+energy*5)+seat.phase))*(.06+energy*.5),seat.z);
   dummy.rotation.set(0,Math.atan2(-seat.x,-seat.z),Math.sin(time*3+seat.phase)*energy*.35);
   dummy.scale.setScalar(seat.scale);
   dummy.updateMatrix();node.setMatrixAt(index,dummy.matrix);
  });
  node.instanceMatrix.needsUpdate=true;
 });
 return <instancedMesh ref={mesh} args={[undefined,undefined,COUNT]} frustumCulled={false}>
  <capsuleGeometry args={[.24,.44,4,8]}>
   <instancedBufferAttribute attach="attributes-color" args={[colors,3]}/>
  </capsuleGeometry>
  <meshStandardMaterial vertexColors roughness={.9}/>
 </instancedMesh>;
}
