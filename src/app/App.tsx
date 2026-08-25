import { lazy, Suspense } from "react";
const SandboxApp=lazy(()=>import("./SandboxApp").then((module)=>({default:module.SandboxApp})));
const AuraBattleApp=lazy(()=>import("./AuraBattleApp").then((module)=>({default:module.AuraBattleApp})));
export function App(){
 const sandbox=new URLSearchParams(window.location.search).has("sandbox");
 return <Suspense fallback={<div role="status" className="boot">Loading…</div>}>{sandbox?<SandboxApp/>:<AuraBattleApp/>}</Suspense>;
}
