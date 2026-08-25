import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type ReactElement } from "react";
import { Vector3, type Group, type Object3D } from "three";
import type { Phase, Side } from "../rules/BattleState";
import { FIGHTER_PARTS, type FighterPartId } from "../sim/fighterSkeleton";
import { FIGHTER_FLOATS } from "../sim/RagdollController";
import type { FaceReactionDirector } from "./FaceReactionDirector";
import { applyFighterFaceFrame, biasFighterFaceTowardCamera, createFighterFaceRefs, FighterFace } from "./FighterFace";
import { FighterFaceAnimator, type FinalFaceExpression } from "./FighterFaceAnimator";
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
type FighterPresentationState={activeSide:Side;phase:Phase;winner:Side|null};
const HEAD_INDEX=FIGHTER_PARTS.indexOf("head");
const FOCUSED_PHASES:readonly Phase[]=["CHOOSE","PERFORM","FINAL_DECLARED","FINAL_PERFORM"];
export function FighterView({side,transforms,palette,presentation,faceReactions}:{side:Side;transforms:Float32Array;palette:FighterPalette;presentation:FighterPresentationState;faceReactions:FaceReactionDirector}){
 const refs=useRef<(Object3D|null)[]>([]);
 const root=useRef<Group>(null);
 const base=useMemo(()=>side*FIGHTER_FLOATS,[side]);
 const faceRefs=useRef(createFighterFaceRefs());
 const faceAnimator=useMemo(()=>new FighterFaceAnimator(side===0 ? 0.37 : 5.11),[side]);
 const gazeTarget=useRef(new Vector3());
 useFrame((state,delta)=>{
  for(let index=0;index<FIGHTER_PARTS.length;index++){
   const object=refs.current[index];if(!object)continue;
   const offset=base+index*7;
   object.position.set(transforms[offset],transforms[offset+1],transforms[offset+2]);
   object.quaternion.set(transforms[offset+3],transforms[offset+4],transforms[offset+5],transforms[offset+6]);
  }
  const head=refs.current[HEAD_INDEX];
  if(!head)return;
  const opponentBase=(side===0?1:0)*FIGHTER_FLOATS+HEAD_INDEX*7;
  gazeTarget.current.set(transforms[opponentBase],transforms[opponentBase+1],transforms[opponentBase+2]);
  const reaction=faceReactions.read(side);
  const focused=(FOCUSED_PHASES.includes(presentation.phase)&&presentation.activeSide===side) ? 0.38 : 0;
  biasFighterFaceTowardCamera(faceRefs.current,head.position,head.quaternion,state.camera.position);
  applyFighterFaceFrame(faceRefs.current,faceAnimator.update(delta,{
   headPosition:head.position,headQuaternion:head.quaternion,gazeTargetPosition:gazeTarget.current,
   focus:Math.max(reaction.focus,focused),impact:reaction.impact,dizzy:reaction.dizzy,recovering:reaction.recovering,celebration:reaction.celebration,
   finalExpression:finalExpressionFor(presentation,side),
  }));
 });
 return <group ref={root}>{FIGHTER_PARTS.map((id,index)=>(
  <mesh key={id} ref={(node)=>{refs.current[index]=node;}} castShadow receiveShadow>
   {PIECES[id].geometry}
   <meshStandardMaterial color={palette[PIECES[id].material]} roughness={.55} metalness={.05}/>
   {id==="head"&&<>
    <FighterFace refs={faceRefs} palette={palette}/>
    <mesh position={[0,.22,0]}><sphereGeometry args={[.2,12,10]}/><meshStandardMaterial color={palette.pants} roughness={.8}/></mesh>
   </>}
  </mesh>
 ))}</group>;
}
function finalExpressionFor(presentation:FighterPresentationState,side:Side):FinalFaceExpression{
 if(presentation.phase!=="MATCH_OVER")return null;
 if(presentation.winner===null)return "draw";
 return presentation.winner===side?"winner":"loser";
}
