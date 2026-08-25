import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import config from "@/data/sandbox.json";
import { FixedStepLoop } from "@/engine/clock/FixedStepLoop";
import { createLocalPlatform, VendorLifecycle } from "./platform/PlatformAdapter";
import { SandboxController, type BodySnapshot } from "@/demo/sandbox/SandboxController";
import { WebGLCanvas } from "./canvas/WebGLCanvas";
import { SandboxScene } from "@/demo/sandbox/SandboxScene";
import { DebugPanel } from "./debug/DebugPanel";

export function SandboxApp() {
  const controller = useRef<SandboxController | undefined>(undefined);
  const loop = useRef<FixedStepLoop | undefined>(undefined);
  const platform = useRef(createLocalPlatform());
  const lifecycle = useRef(new VendorLifecycle(platform.current.vendor));
  const [ready, setReady] = useState(false);
  const [bodies, setBodies] = useState<BodySnapshot[]>([]);
  const [paused, setPaused] = useState(false);
  const [debugWireframe, setDebugWireframe] = useState(false);
  const [notice, setNotice] = useState("No collisions observed.");
  const debugEnabled = new URLSearchParams(window.location.search).has("debug");
  const refresh = useCallback(() => { const snapshot = controller.current?.snapshot(); if (snapshot) { setBodies(snapshot.bodies); if (snapshot.notice) setNotice(`Contact force ${snapshot.notice.force.toFixed(2)}`); } }, []);
  const reset = useCallback(() => { controller.current?.reset(); refresh(); }, [refresh]);
  const updatePaused = useCallback((value: boolean) => { setPaused(value); loop.current?.setPaused(value); void lifecycle.current.setPaused(value); }, []);
  useEffect(() => { let alive = true; void lifecycle.current.init(); SandboxController.create(config).then((created) => { if (!alive) { created.dispose(); return; } controller.current = created; loop.current = new FixedStepLoop({ fixedUpdate: (dt) => created.step(dt), presentationUpdate: () => refresh(), onVisibilityChange: (hidden) => { if (hidden) void lifecycle.current.stopGameplay(); } }); loop.current.start(); void lifecycle.current.loadingFinished(); setReady(true); }); return () => { alive = false; loop.current?.stop(); controller.current?.dispose(); void lifecycle.current.stopGameplay(); }; }, [refresh]);
  const debugControls = useMemo(() => ({ paused, debugWireframe, setPaused: updatePaused, setDebugWireframe, reset }), [paused, debugWireframe, updatePaused, reset]);
  const spawn = (shape: "box" | "sphere" | "capsule") => { lifecycle.current.playerInteraction(); controller.current?.spawn(shape); platform.current.audio.play("click"); refresh(); };
  return <main><header><h1>Physics Sandbox</h1><p>Local deterministic Three.js + Rapier template.</p></header><section className="controls"><button onClick={() => spawn("box")}>Spawn box</button><button onClick={() => spawn("sphere")}>Spawn sphere</button><button onClick={() => spawn("capsule")}>Spawn capsule</button><button onClick={() => updatePaused(!paused)}>{paused ? "Resume" : "Pause"}</button><button onClick={reset}>Reset</button><button onClick={() => setDebugWireframe(!debugWireframe)}>Debug wireframe</button></section><section className="hud" aria-live="polite">Rate: 60 Hz · {paused ? "Paused" : "Running"} · Dynamic bodies: {bodies.length} · {notice}</section><div className="canvas">{ready && controller.current ? <WebGLCanvas><SandboxScene controller={controller.current} bodies={bodies} debug={debugWireframe} refresh={refresh}/></WebGLCanvas> : <div role="status">Loading local physics…</div>}</div><DebugPanel enabled={debugEnabled} controls={debugControls}/></main>;
}
