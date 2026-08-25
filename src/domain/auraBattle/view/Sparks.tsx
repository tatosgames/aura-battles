import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { AdditiveBlending, type Points } from "three";
import type { SparkPool } from "./SparkPool";
export function Sparks({ pool }: { pool: SparkPool }) {
 const points = useRef<Points>(null);
 useFrame((_, delta) => {
  pool.update(Math.min(delta, 1 / 20));
  const node = points.current;
  if (!node) return;
  node.geometry.attributes.position.needsUpdate = true;
  node.geometry.attributes.color.needsUpdate = true;
 });
 return (
  <points ref={points} frustumCulled={false}>
   <bufferGeometry>
    <bufferAttribute attach="attributes-position" args={[pool.positions, 3]} />
    <bufferAttribute attach="attributes-color" args={[pool.colors, 3]} />
   </bufferGeometry>
   <pointsMaterial vertexColors size={.13} sizeAttenuation transparent depthWrite={false} blending={AdditiveBlending} />
  </points>
 );
}
