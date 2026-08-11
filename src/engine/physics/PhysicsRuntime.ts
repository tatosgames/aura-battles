import * as THREE from "three";
import { getRapier, loadRapier, type Rapier } from "./rapierRuntime";
export type ContactNotice={colliderA:number;colliderB:number;force:number};
export class PhysicsRuntime { readonly world: InstanceType<Rapier["World"]>; private readonly queue:InstanceType<Rapier["EventQueue"]>; private readonly observers=new Set<(notice:ContactNotice)=>void>(); private debug:THREE.LineSegments|null=null;
 private constructor(world:InstanceType<Rapier["World"]>){this.world=world;this.queue=new (getRapier().EventQueue)(true);}
 static async create(gravity={x:0,y:-9.81,z:0},step=1/60):Promise<PhysicsRuntime>{let last:unknown;for(let i=0;i<2;i++)try{const rapier=await loadRapier();const world=new rapier.World(gravity);world.timestep=step;return new PhysicsRuntime(world);}catch(error){last=error;}throw last;}
 step(dt:number):void{this.world.timestep=dt;this.world.step(this.queue);}
 observeContacts(observer:(notice:ContactNotice)=>void):()=>void{this.observers.add(observer);return()=>this.observers.delete(observer);}
 drainContacts(primary:(notice:ContactNotice)=>void):void{this.queue.drainContactForceEvents((event)=>{const notice=Object.freeze({colliderA:event.collider1(),colliderB:event.collider2(),force:event.totalForceMagnitude()});primary(notice);this.observers.forEach((observer)=>observer(notice));});this.queue.drainCollisionEvents(()=>{});}
 updateDebug(scene:THREE.Scene,enabled:boolean):void{if(!enabled){this.debug?.removeFromParent();return;}const {vertices,colors}=this.world.debugRender();if(!this.debug){this.debug=new THREE.LineSegments(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({vertexColors:true}));this.debug.frustumCulled=false;}if(!this.debug.parent)scene.add(this.debug);this.debug.geometry.setAttribute("position",new THREE.BufferAttribute(vertices,3));this.debug.geometry.setAttribute("color",new THREE.BufferAttribute(colors,4));}
 dispose():void{this.observers.clear();this.debug?.geometry.dispose();(this.debug?.material as THREE.Material|undefined)?.dispose();this.debug?.removeFromParent();this.queue.free();this.world.free();}
}
