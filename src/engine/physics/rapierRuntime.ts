export type Rapier = typeof import("@dimforge/rapier3d-deterministic")["default"];
type Loader=()=>Promise<Rapier>; let loaded:Rapier|undefined; let pending:Promise<Rapier>|undefined; let loader:Loader=()=>import("@dimforge/rapier3d-deterministic/rapier.js").then((m)=>m.default);
export function loadRapier():Promise<Rapier>{if(loaded)return Promise.resolve(loaded);if(!pending)pending=loader().then((value)=>{loaded=value;return value;}).catch((error:unknown)=>{pending=undefined;throw error;});return pending;}
export function getRapier():Rapier{if(!loaded)throw new Error("Rapier has not finished loading");return loaded;}
export function setRapierLoaderForTests(next?:Loader):void{loaded=undefined;pending=undefined;loader=next??(()=>import("@dimforge/rapier3d-deterministic/rapier.js").then((m)=>m.default));}
