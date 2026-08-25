export type Quat={x:number;y:number;z:number;w:number};
export type Vector={x:number;y:number;z:number};
export const quatFromEuler=(x:number,y:number,z:number):Quat=>{const cx=Math.cos(x/2),sx=Math.sin(x/2),cy=Math.cos(y/2),sy=Math.sin(y/2),cz=Math.cos(z/2),sz=Math.sin(z/2);return {x:sx*cy*cz+cx*sy*sz,y:cx*sy*cz-sx*cy*sz,z:cx*cy*sz+sx*sy*cz,w:cx*cy*cz-sx*sy*sz};};
export const quatMul=(a:Quat,b:Quat):Quat=>({x:a.w*b.x+a.x*b.w+a.y*b.z-a.z*b.y,y:a.w*b.y-a.x*b.z+a.y*b.w+a.z*b.x,z:a.w*b.z+a.x*b.y-a.y*b.x+a.z*b.w,w:a.w*b.w-a.x*b.x-a.y*b.y-a.z*b.z});
export const quatConjugate=(q:Quat):Quat=>({x:-q.x,y:-q.y,z:-q.z,w:q.w});
/** Shortest-arc rotation vector (axis * angle) that takes `from` onto `to`. */
export const rotationTowards=(from:Quat,to:Quat):Vector=>{
 let delta=quatMul(to,quatConjugate(from));
 if(delta.w<0)delta={x:-delta.x,y:-delta.y,z:-delta.z,w:-delta.w};
 const sine=Math.hypot(delta.x,delta.y,delta.z);
 if(sine<1e-6)return {x:0,y:0,z:0};
 const angle=2*Math.atan2(sine,Math.min(1,delta.w));
 const scale=angle/sine;
 return {x:delta.x*scale,y:delta.y*scale,z:delta.z*scale};
};
export const rotateVector=(q:Quat,v:Vector):Vector=>{const tx=2*(q.y*v.z-q.z*v.y),ty=2*(q.z*v.x-q.x*v.z),tz=2*(q.x*v.y-q.y*v.x);return {x:v.x+q.w*tx+q.y*tz-q.z*ty,y:v.y+q.w*ty+q.z*tx-q.x*tz,z:v.z+q.w*tz+q.x*ty-q.y*tx};};
