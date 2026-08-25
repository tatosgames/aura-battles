import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Mesh } from "three";
import type { BoundaryPulse } from "./BoundaryPulse";
/** The stage's "force field" catching someone who strayed past the lip — a single reused ring. */
export function BoundaryRing({ pulse }: { pulse: BoundaryPulse }) {
 const ring = useRef<Mesh>(null);
 useFrame((_, delta) => {
  pulse.update(Math.min(delta, 1 / 20));
  const node = ring.current;
  if (!node) return;
  if (!pulse.active) { node.visible = false; return; }
  const [x, z] = pulse.position();
  const eased = 1 - (1 - pulse.progress) ** 3;
  node.visible = true;
  node.position.set(x, .04, z);
  const scale = .6 + eased * 2.2;
  node.scale.set(scale, scale, scale);
  const material = node.material as import("three").MeshBasicMaterial;
  material.opacity = (1 - pulse.progress) * .85;
 });
 return (
  <mesh ref={ring} rotation-x={-Math.PI / 2} visible={false}>
   <ringGeometry args={[.75, 1, 40]} />
   <meshBasicMaterial color="#fde047" transparent opacity={0} />
  </mesh>
 );
}
