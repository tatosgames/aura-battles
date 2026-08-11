/* eslint-disable @typescript-eslint/no-explicit-any */
import { CollisionLayerRegistry } from "@/engine/physics/CollisionLayerRegistry";
import { PhysicsRuntime, type ContactNotice } from "@/engine/physics/PhysicsRuntime";
import { validateSandboxConfig, type SandboxConfig } from "@/engine/config/runtimeConfig";
import { getRapier } from "@/engine/physics/rapierRuntime";
export type Shape="box"|"sphere"|"capsule";export type BodySnapshot={id:string;shape:Shape;position:[number,number,number];rotation:[number,number,number,number]};
export class SandboxController { readonly layers:CollisionLayerRegistry;private readonly bodies=new Map<string,{shape:Shape;body:any;collider:any}>();private nextId=1;private notice:ContactNotice|undefined;private config:SandboxConfig;
 private constructor(readonly physics:PhysicsRuntime,config:SandboxConfig){this.config=config;this.layers=new CollisionLayerRegistry(config.layers);this.createBounds();}
 static async create(value:unknown):Promise<SandboxController>{const config=validateSandboxConfig(value);return new SandboxController(await PhysicsRuntime.create({x:config.gravity[0],y:config.gravity[1],z:config.gravity[2]}),config);}
 private createBounds():void{const r=getRapier();const fixed=this.physics.world.createRigidBody(r.RigidBodyDesc.fixed());const make=(desc:any)=>{desc.setCollisionGroups(this.layers.group(["static"],["dynamic"]));this.physics.world.createCollider(desc,fixed);};make(r.ColliderDesc.cuboid(10,.25,10).setTranslation(0,-.25,0));for(const [x,z,sx,sz] of [[-10,0,.25,10],[10,0,.25,10],[0,-10,10,.25],[0,10,10,.25]] as const)make(r.ColliderDesc.cuboid(sx,3,sz).setTranslation(x,3,z));}
 spawn(shape:Shape):string{const r=getRapier();const id=`body-${this.nextId++}`;const [x,y,z]=this.config.spawn;const body=this.physics.world.createRigidBody(r.RigidBodyDesc.dynamic().setTranslation(x,y,z));const descriptor=shape==="box"?r.ColliderDesc.cuboid(.5,.5,.5):shape==="sphere"?r.ColliderDesc.ball(.55):r.ColliderDesc.capsule(.45,.35);descriptor.setCollisionGroups(this.layers.group(["dynamic"],["static","dynamic"])).setActiveEvents(r.ActiveEvents.CONTACT_FORCE_EVENTS);this.bodies.set(id,{shape,body,collider:this.physics.world.createCollider(descriptor,body)});return id;}
 throwBody(id:string,dx:number,dy:number):boolean{const target=this.bodies.get(id);if(!target)return false;const length=Math.hypot(dx,dy)||1;const cap=this.config.impulseCap;target.body.applyImpulse({x:Math.max(-cap,Math.min(cap,dx/length*cap)),y:Math.max(0,Math.min(cap,dy/length*cap)),z:-cap*.35},true);return true;}
 step(dt:number):void{this.physics.step(dt);this.physics.drainContacts((notice)=>{this.notice=notice;});}
 snapshot():{bodies:BodySnapshot[];notice?:ContactNotice}{return {bodies:[...this.bodies.entries()].map(([id,item])=>{const p=item.body.translation(),q=item.body.rotation();return {id,shape:item.shape,position:[p.x,p.y,p.z],rotation:[q.x,q.y,q.z,q.w]};}),notice:this.notice};}
 reset():void{this.bodies.forEach(({body,collider})=>{this.physics.world.removeCollider(collider,true);this.physics.world.removeRigidBody(body);});this.bodies.clear();this.notice=undefined;this.nextId=1;}
 dynamicCount():number{return this.bodies.size;} dispose():void{this.reset();this.physics.dispose();}
}
