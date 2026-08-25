import type { FighterPartId } from "./fighterSkeleton";
export type Euler=[number,number,number];
export type Pose={
 balance:number;          // 0 = pure ragdoll, 1 = fully braced. Dropping this is how a FAIL is sold.
 stiffness:number;        // global multiplier on pose-tracking torque
 rotations:Partial<Record<FighterPartId,Euler>>;
 elbows?:[number,number]; // revolute motor targets, left then right
 knees?:[number,number];
 lift?:number;            // extra upward assist on the pelvis, for hops and slides
};
const P=Math.PI;
// Arm idioms in the fighter's facing frame (+x is toward the opponent, capsule long axis is local +y).
// Targets stay clear of a full half turn: at exactly P the shortest-arc axis flips sign every step and the servo tears the limb off.
const ARM_DOWN:Euler=[0,0,0], ARM_FWD:Euler=[0,0,P/2], ARM_UP:Euler=[0,0,2.85], ARM_BACK:Euler=[0,0,-P/2];
const ARM_OUT_L:Euler=[-P/2,0,0], ARM_OUT_R:Euler=[P/2,0,0];
const pose=(balance:number,stiffness:number,rotations:Pose["rotations"],extra:Partial<Pose>={}):Pose=>({balance,stiffness,rotations,...extra});
export const POSES={
 IDLE:pose(.95,1,{torso:[0,0,.04],head:[0,0,-.05],upperArmL:[-.16,0,0],upperArmR:[.16,0,0]},{elbows:[.35,.35],knees:[-.12,-.12]}),
 WALK_A:pose(.9,1.05,{torso:[0,0,.12],upperArmL:[0,0,-.5],upperArmR:[0,0,.5],upperLegL:[0,0,.5],upperLegR:[0,0,-.45]},{elbows:[.7,.4],knees:[-.15,-.9]}),
 WALK_B:pose(.9,1.05,{torso:[0,0,.12],upperArmL:[0,0,.5],upperArmR:[0,0,-.5],upperLegL:[0,0,-.45],upperLegR:[0,0,.5]},{elbows:[.4,.7],knees:[-.9,-.15]}),
 STARE:pose(1,1.5,{torso:[0,0,-.06],head:[0,0,.16],upperArmL:[-.1,0,0],upperArmR:[.1,0,0]},{elbows:[.2,.2],knees:[-.05,-.05]}),
 FLEX:pose(1,1.6,{torso:[0,0,-.1],head:[0,0,.1],upperArmL:ARM_OUT_L,upperArmR:ARM_OUT_R},{elbows:[2.1,2.1],knees:[-.3,-.3]}),
 SUNGLASSES:pose(1,1.4,{torso:[0,0,-.05],head:[0,0,.12],upperArmL:[0,0,1.5],upperArmR:[.2,0,0]},{elbows:[2.2,.3],knees:[-.1,-.1]}),
 SLOW_TURN:pose(.95,1.2,{torso:[0,.9,0],head:[0,-.5,.1],upperArmL:[-.2,0,0],upperArmR:[.2,0,0]},{elbows:[.3,.3],knees:[-.15,-.15]}),
 VICTORY:pose(1,1.6,{torso:[0,0,-.14],head:[0,0,.2],upperArmL:ARM_UP,upperArmR:ARM_UP},{elbows:[.2,.2],knees:[-.1,-.1]}),
 ARMS_CROSSED:pose(1,1.7,{torso:[0,0,-.05],head:[0,0,.08],upperArmL:[-.5,0,.9],upperArmR:[.5,0,.9]},{elbows:[2.2,2.2],knees:[-.1,-.1]}),
 CLAP_A:pose(.95,1.3,{torso:[0,0,.05],head:[0,0,.05],upperArmL:[-.7,0,.9],upperArmR:[.7,0,.9]},{elbows:[1.9,1.9],knees:[-.15,-.15]}),
 CLAP_B:pose(.95,1.3,{torso:[0,0,.05],head:[0,0,.05],upperArmL:[-.1,0,1.1],upperArmR:[.1,0,1.1]},{elbows:[1.4,1.4],knees:[-.15,-.15]}),
 PHONE:pose(1,1.5,{torso:[0,0,.14],head:[0,0,.45],upperArmL:[-.3,0,1.1],upperArmR:[.3,0,1.0]},{elbows:[2.0,1.8],knees:[-.2,-.2]}),
 LOOK_AWAY:pose(1,1.5,{torso:[0,.5,0],head:[0,1.2,-.1],upperArmL:[-.12,0,0],upperArmR:[.12,0,0]},{elbows:[.25,.25],knees:[-.1,-.1]}),
 POINT:pose(.95,1.4,{torso:[0,0,-.06],head:[0,0,.14],upperArmL:[-.15,0,0],upperArmR:ARM_FWD},{elbows:[.3,.05],knees:[-.15,-.15]}),
 SHRUG:pose(.9,1.2,{torso:[0,0,.02],head:[0,0,-.12],upperArmL:[-.9,0,.3],upperArmR:[.9,0,.3]},{elbows:[1.7,1.7],knees:[-.2,-.2]}),
 WINDUP:pose(.85,1.4,{torso:[0,-.7,-.15],head:[0,-.3,.1],upperArmL:[0,0,-.8],upperArmR:[0,0,-1.1]},{elbows:[1.6,1.6],knees:[-.5,-.5]}),
 THROW:pose(.6,1.8,{torso:[0,.8,.35],head:[0,.4,.2],upperArmL:[0,0,1.3],upperArmR:[0,0,1.7]},{elbows:[.15,.1],knees:[-.35,-.35]}),
 KICK:pose(.55,1.7,{torso:[0,0,-.3],head:[0,0,.15],upperArmL:ARM_BACK,upperArmR:ARM_BACK,upperLegR:[0,0,1.35]},{elbows:[.4,.4],knees:[-.2,-.05]}),
 BACKFLIP_TUCK:pose(0,1.9,{torso:[0,0,-.6],head:[0,0,-.4],upperArmL:ARM_UP,upperArmR:ARM_UP,upperLegL:[0,0,-1.5],upperLegR:[0,0,-1.5]},{elbows:[1.2,1.2],knees:[-2.2,-2.2],lift:1}),
 SLIDE:pose(.15,1.2,{torso:[0,0,1.0],head:[0,0,-.5],upperArmL:ARM_BACK,upperArmR:ARM_BACK,upperLegL:[0,0,.5],upperLegR:[0,0,.5]},{elbows:[.3,.3],knees:[-.4,-.4]}),
 KNOCKED:pose(0,.15,{},{elbows:[.6,.6],knees:[-.6,-.6]}),
 RECOVER_STAND:pose(.75,1.35,{torso:[0,0,.25],head:[0,0,.05],upperArmL:[-.35,0,.4],upperArmR:[.35,0,.4]},{elbows:[1.1,1.1],knees:[-.8,-.8]}),
 THRONE_SIT:pose(.85,1.5,{torso:[0,0,-.12],head:[0,0,.1],upperArmL:[-.6,0,.5],upperArmR:[.6,0,.5],upperLegL:[0,0,1.5],upperLegR:[0,0,1.5]},{elbows:[1.3,1.3],knees:[-1.5,-1.5]}),
 BOW:pose(.8,1.3,{torso:[0,0,1.1],head:[0,0,.3],upperArmL:[-.3,0,.6],upperArmR:[.3,0,.6]},{elbows:[.6,.6],knees:[-.25,-.25]}),
 DANCE_A:pose(.85,1.2,{torso:[0,.35,.15],head:[0,.2,-.1],upperArmL:ARM_UP,upperArmR:[.4,0,.4]},{elbows:[1.5,1.0],knees:[-.5,-.15]}),
 DANCE_B:pose(.85,1.2,{torso:[0,-.35,.15],head:[0,-.2,-.1],upperArmL:[-.4,0,.4],upperArmR:ARM_UP},{elbows:[1.0,1.5],knees:[-.15,-.5]}),
 GRAB:pose(.9,1.4,{torso:[0,0,.35],head:[0,0,.2],upperArmL:ARM_FWD,upperArmR:ARM_FWD},{elbows:[.4,.4],knees:[-.7,-.7]}),
 CART_PUSH:pose(.9,1.3,{torso:[0,0,.3],head:[0,0,.1],upperArmL:ARM_FWD,upperArmR:ARM_FWD},{elbows:[.9,.9],knees:[-.4,-.4]}),
} as const satisfies Record<string,Pose>;
export type PoseId=keyof typeof POSES;
export const IDENTITY_ARM=ARM_DOWN;
