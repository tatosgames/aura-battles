import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ComponentProps, type RefObject } from "react";
import arenaConfig from "@/data/auraArena.json";
import { FixedStepLoop } from "@/engine/clock/FixedStepLoop";
import { AuraBattleController, type BattleSnapshot } from "@/domain/auraBattle/AuraBattleController";
import { ArenaScene, type ArenaPresentationState } from "@/domain/auraBattle/view/ArenaScene";
import { CameraDirector } from "@/domain/auraBattle/view/CameraDirector";
import { BattleHud } from "@/domain/auraBattle/ui/BattleHud";
import { SparkPool } from "@/domain/auraBattle/view/SparkPool";
import { FIGHTER_FLOATS } from "@/domain/auraBattle/sim/RagdollController";
import type { PropKind } from "@/domain/auraBattle/sim/PropSystem";
import { WebGLCanvas } from "./canvas/WebGLCanvas";
import { createLocalPlatform, VendorLifecycle } from "./platform/PlatformAdapter";
import type { AudioCue } from "./platform/PlatformAdapter";
import { DebugPanel } from "./debug/DebugPanel";
const TONE_SOUND: Record<string, AudioCue> = { aura: "aura", counter: "counter", fail: "fail", final: "final", combo: "crowd", info: "click" };
export function AuraBattleApp() {
 const battle = useRef<AuraBattleController | undefined>(undefined);
 const loop = useRef<FixedStepLoop | undefined>(undefined);
 const director = useRef(new CameraDirector());
 const excitement = useRef(.2);
 const sparks = useRef(new SparkPool());
 const flash = useRef<HTMLDivElement>(null);
 const platform = useRef(createLocalPlatform());
 const lifecycle = useRef(new VendorLifecycle(platform.current.vendor));
 const [ready, setReady] = useState(false);
 const [paused, setPaused] = useState(false);
 const [debugWireframe, setDebugWireframe] = useState(false);
 const query = useMemo(() => new URLSearchParams(window.location.search), []);
 useEffect(() => {
  let alive = true;
  void lifecycle.current.init();
  const seed = Number(query.get("seed"));
  void AuraBattleController.create(arenaConfig, { seed: Number.isFinite(seed) && seed > 0 ? seed : undefined, fast: query.has("fast"), warm: query.has("warm") }).then((created) => {
   if (!alive) { created.dispose(); return; }
   battle.current = created;
   (window as unknown as { __aura?: AuraBattleController }).__aura = created;
   // Head position of a fighter, straight out of the transform buffer: no Rapier handles escape.
   const headOf = (side: 0 | 1): [number, number, number] => {
    const base = side * FIGHTER_FLOATS + 2 * 7;
    return [created.arena.transforms[base], created.arena.transforms[base + 1], created.arena.transforms[base + 2]];
   };
   const pop = () => {
    const node = flash.current;
    if (!node) return;
    node.style.animation = "none";
    void node.offsetWidth;
    node.style.animation = "flash .4s ease-out";
   };
   // The camera and the speakers listen to the domain; neither can talk back to it.
   created.events.on("cue", ({ cue, side }) => {
    const [x, y, z] = headOf(side);
    if (cue === "impact") { director.current.set("IMPACT", side); director.current.shake(.9); platform.current.audio.play("impact"); sparks.current.burst(x, y, z, "impact", 40, 6); pop(); }
    else if (cue === "fail") { director.current.set("IMPACT", side); director.current.shake(.6); platform.current.audio.play("fail"); sparks.current.burst(x, y, z, "fail", 30, 3); }
    else if (cue === "slowmo") { director.current.set("SLOWMO_ORBIT", side); sparks.current.burst(x, y + .4, z, "final", 50, 5); }
    else if (cue === "crowdPop") { platform.current.audio.play("crowd"); director.current.shake(.2); sparks.current.burst(x, y + .5, z, "aura", 24, 4); }
    else if (cue === "land") { director.current.set("IMPACT", side); director.current.shake(.4); sparks.current.burst(x, .2, z, "impact", 26, 5); }
    else director.current.set("FOCUS", side);
   });
   created.events.on("phase", ({ phase, activeSide, promptSide }) => {
    // The window opens on the performer, not the responder: you have to see what you are answering.
    if (phase === "COUNTER") director.current.set("COUNTER_SNAP", promptSide === 0 ? 1 : 0);
    else if (phase === "FINAL_DECLARED" || phase === "FINAL_PERFORM") director.current.set("FINAL", activeSide);
    else if (phase === "FINAL_COUNTER") director.current.set("FINAL", promptSide ?? activeSide);
    else if (phase === "SCORE" || phase === "CHOOSE" || phase === "INTRO") director.current.set("DUEL", activeSide);
    else if (phase === "MATCH_OVER") director.current.set("WIN", activeSide);
   });
   created.events.on("moment", ({ tone, side, text }) => {
    platform.current.audio.play(TONE_SOUND[tone] ?? "click");
    if (side !== null) { const [x, y, z] = headOf(side); sparks.current.burst(x, y + .6, z, tone, tone === "aura" ? 22 : 30, 5); }
    if (text === "PERFECT COUNTER" && side !== null) {
     director.current.set("REVERSAL", side); director.current.shake(1); pop();
     const [x, y, z] = headOf(side);
     for (let ring = 0; ring < 4; ring++) sparks.current.burst(x, y + ring * .4, z, "final", 40, 7);
    }
   });
   loop.current = new FixedStepLoop({
    fixedUpdate: (dt) => created.fixedUpdate(dt),
    presentationUpdate: () => {
     excitement.current = created.excitement();
     const impact = created.arena.takeImpact();
     if (impact > 900) director.current.shake(Math.min(.5, impact / 6000));
    },
    onVisibilityChange: (hidden) => { if (hidden) void lifecycle.current.stopGameplay(); },
   });
   void lifecycle.current.loadingFinished();
   setReady(true);
  });
  return () => {
   alive = false;
   loop.current = undefined;
   battle.current?.dispose();
   battle.current = undefined;
   void lifecycle.current.stopGameplay();
  };
 }, [query]);
 const updatePaused = useCallback((value: boolean) => { setPaused(value); loop.current?.setPaused(value); void lifecycle.current.setPaused(value); }, []);
 const pausedBeforeContextLoss = useRef(false);
 const pauseForContextLoss = useCallback(() => { pausedBeforeContextLoss.current = loop.current?.isPaused() ?? true; loop.current?.setPaused(true); setPaused(true); void lifecycle.current.stopGameplay(); }, []);
 const resumeAfterContextRestore = useCallback(() => { const wasPaused = pausedBeforeContextLoss.current; loop.current?.setPaused(wasPaused); setPaused(wasPaused); }, []);
 const debugControls = useMemo(() => ({
  paused, debugWireframe, setPaused: updatePaused, setDebugWireframe,
  reset: () => battle.current?.restart(),
 }), [paused, debugWireframe, updatePaused]);
 return ready && battle.current
  ? <RunningMatch battle={battle.current} loop={loop.current!} director={director.current} excitement={excitement} sparks={sparks.current} flash={flash} debug={debugWireframe} controls={debugControls} onInteract={() => lifecycle.current.playerInteraction()} onContextLost={pauseForContextLoss} onContextRestored={resumeAfterContextRestore} />
  : <div className="stage"><div role="status" className="boot">Loading arena…</div></div>;
}
function RunningMatch({ battle, loop, director, excitement, sparks, flash, debug, controls, onInteract, onContextLost, onContextRestored }: {
 battle: AuraBattleController; director: CameraDirector; excitement: { current: number }; sparks: SparkPool;
 loop: FixedStepLoop;
 flash: RefObject<HTMLDivElement | null>; debug: boolean;
 controls: ComponentProps<typeof DebugPanel>["controls"]; onInteract: () => void; onContextLost: () => void; onContextRestored: () => void;
}) {
 const state = useSyncExternalStore(battle.bridge.subscribe, battle.bridge.getSnapshot) as BattleSnapshot;
 const propOrder = useMemo<{ id: string; kind: PropKind }[]>(() => battle.propOrder(), [battle, state.propCount]);
 const presentation = useMemo<ArenaPresentationState>(() => ({ activeSide: state.activeSide, phase: state.phase }), [state.activeSide, state.phase]);
 const actions = useMemo(() => ({
  playCard: (card: string) => { onInteract(); battle.bridge.actions.playCard(card); },
  pass: () => { onInteract(); battle.bridge.actions.pass(); },
  declareFinal: () => { onInteract(); battle.bridge.actions.declareFinal(); },
  restart: () => { onInteract(); director.reset(); sparks.clear(); battle.bridge.actions.restart(); },
 }), [battle, director, sparks, onInteract]);
 return (
  <div className="stage">
   <div className="viewport">
    <WebGLCanvas loop={loop} onContextLost={onContextLost} onContextRestored={onContextRestored}>
     <ArenaScene arena={battle.arena} director={director} propOrder={propOrder} excitement={excitement} sparks={sparks} presentation={presentation} debug={debug} />
    </WebGLCanvas>
   </div>
   <div ref={flash} className="flash" />
   <BattleHud state={state} actions={actions} />
   <DebugPanel enabled={new URLSearchParams(window.location.search).has("debug")} controls={controls} />
  </div>
 );
}
