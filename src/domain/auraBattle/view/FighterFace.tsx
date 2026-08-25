import { useMemo, type MutableRefObject } from "react";
import { MathUtils, Quaternion, Vector3, type Group, type Mesh } from "three";
import type { FighterPalette } from "./FighterView";
import type { FighterFaceFrame } from "./FighterFaceAnimator";

const HEAD_RADIUS = 0.27;
const EYE_LATERAL = 0.102;
const EYE_VERTICAL = 0.067;
const BROW_LATERAL = 0.11;
const BROW_VERTICAL = 0.145;
const MOUTH_VERTICAL = -0.09;

export interface FighterFaceRefs {
 eyes: [Mesh | null, Mesh | null];
 pupils: [Mesh | null, Mesh | null];
 brows: [Mesh | null, Mesh | null];
 crosses: [Mesh | null, Mesh | null, Mesh | null, Mesh | null];
 mouth: Mesh | null;
 root: Group | null;
}

export const createFighterFaceRefs = (): FighterFaceRefs => ({ eyes: [null, null], pupils: [null, null], brows: [null, null], crosses: [null, null, null, null], mouth: null, root: null });

export function FighterFace({ refs, palette }: { refs: MutableRefObject<FighterFaceRefs>; palette: FighterPalette }) {
 const materials = useMemo(() => ({
  eyeWhite: { color: "#fff7e8" },
  pupil: { color: "#151b2a" },
  brow: { color: palette.accent },
  mouth: { color: "#4a1d2b" },
  cross: { color: "#f9d5df" },
 }), [palette.accent]);
 return <group ref={(node) => { refs.current.root = node; }} name="aura-fighter-face">
  {([-1, 1] as const).map((side, index) => {
   const eyeX = surfaceX(EYE_LATERAL * side, EYE_VERTICAL, 0.005);
   const browX = surfaceX(BROW_LATERAL * side, BROW_VERTICAL, 0.008);
   return <group key={side}>
    <mesh ref={(node) => { refs.current.eyes[index] = node; }} position={[eyeX, EYE_VERTICAL, EYE_LATERAL * side]} renderOrder={3} castShadow={false}>
     <sphereGeometry args={[1, 12, 8]}/><meshBasicMaterial {...materials.eyeWhite} toneMapped={false}/>
    </mesh>
    <mesh ref={(node) => { refs.current.pupils[index] = node; }} position={[eyeX + 0.01, EYE_VERTICAL, EYE_LATERAL * side]} renderOrder={4} castShadow={false}>
     <sphereGeometry args={[1, 10, 8]}/><meshBasicMaterial {...materials.pupil} toneMapped={false}/>
    </mesh>
    <mesh ref={(node) => { refs.current.brows[index] = node; }} position={[browX, BROW_VERTICAL, BROW_LATERAL * side]} rotation={[side * 0.35, 0, 0]} renderOrder={4} castShadow={false}>
     <boxGeometry args={[1, 1, 1]}/><meshBasicMaterial {...materials.brow} toneMapped={false}/>
    </mesh>
    {([-1, 1] as const).map((tilt, tiltIndex) => <mesh key={tilt} ref={(node) => { refs.current.crosses[index * 2 + tiltIndex] = node; }} position={[eyeX + 0.014, EYE_VERTICAL, EYE_LATERAL * side]} rotation={[tilt * Math.PI / 4, 0, 0]} visible={false} renderOrder={5} castShadow={false}>
     <boxGeometry args={[1, 1, 1]}/><meshBasicMaterial {...materials.cross} toneMapped={false}/>
    </mesh>)}
   </group>;
  })}
  <mesh ref={(node) => { refs.current.mouth = node; }} position={[surfaceX(0, MOUTH_VERTICAL, 0.008), MOUTH_VERTICAL, 0]} renderOrder={3} castShadow={false}>
   <boxGeometry args={[1, 1, 1]}/><meshBasicMaterial {...materials.mouth} toneMapped={false}/>
  </mesh>
 </group>;
}

export function applyFighterFaceFrame(refs: FighterFaceRefs, frame: FighterFaceFrame): void {
 for (let index = 0; index < 2; index++) {
  const side = index === 0 ? -1 : 1;
  const eye = refs.eyes[index];
  if (eye) {
   eye.scale.set(0.018, 0.041 * frame.eyeOpen, 0.037 * frame.eyeWide);
   eye.visible = !frame.xEyes;
  }
  const pupil = refs.pupils[index];
  if (pupil) {
   const vertical = EYE_VERTICAL + frame.pupilVertical;
   const lateral = EYE_LATERAL * side + frame.pupilLateral;
   pupil.position.set(surfaceX(lateral, vertical, 0.016), vertical, lateral);
   pupil.scale.set(0.014, 0.025 * frame.eyeOpen, 0.022);
   pupil.visible = !frame.xEyes;
  }
  const brow = refs.brows[index];
  if (brow) {
   brow.position.y = BROW_VERTICAL + frame.browLift;
   brow.rotation.x = side * (0.35 + frame.browTilt);
   brow.scale.set(0.014, 0.014, 0.074);
  }
 }
 for (const cross of refs.crosses) {
  if (!cross) continue;
  cross.scale.set(0.014, 0.014, 0.072);
  cross.visible = frame.xEyes;
 }
 if (refs.mouth) {
  refs.mouth.scale.set(0.014, 0.028 * frame.mouthOpen, 0.098 * frame.mouthWide);
 }
}

function surfaceX(lateral: number, vertical: number, margin: number): number {
 const radius = HEAD_RADIUS + margin;
 return Math.sqrt(Math.max(0.0001, radius * radius - lateral * lateral - vertical * vertical));
}

const FACE_CAMERA_BIAS = 1;
const FACE_MAX_SWIVEL = 2.6;
const localCamera = new Vector3();
const inverseHead = new Quaternion();

/** Keeps both fighters readable from the active shot without affecting their physical head pose. */
export function biasFighterFaceTowardCamera(refs: FighterFaceRefs, headPosition: Vector3, headQuaternion: Quaternion, cameraPosition: Vector3): void {
 const root = refs.root;
 if (!root) return;
 inverseHead.copy(headQuaternion).invert();
 localCamera.subVectors(cameraPosition, headPosition).applyQuaternion(inverseHead).setY(0);
 if (localCamera.lengthSq() < 0.0001) return;
 localCamera.normalize();
 root.rotation.y = MathUtils.clamp(-Math.atan2(localCamera.z, localCamera.x) * FACE_CAMERA_BIAS, -FACE_MAX_SWIVEL, FACE_MAX_SWIVEL);
}
