import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import arenaConfig from "@/data/auraArena.json";
import { FixedStepLoop } from "@/engine/clock/FixedStepLoop";
import { AuraBattleController, type BattleSnapshot } from "@/domain/auraBattle/AuraBattleController";
import { ArenaScene } from "@/domain/auraBattle/view/ArenaScene";
import { CameraDirector } from "@/domain/auraBattle/view/CameraDirector";
import { BattleHud } from "@/domain/auraBattle/ui/BattleHud";
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
  void AuraBattleController.create(arenaConfig, { seed: Number.isFinite(seed) && seed > 0 ? seed : undefined, fast: query.has("fast") }).then((created) => {
   if (!alive) { created.dispose(); return; }
   battle.current = created;
   (window as unknown as { __aura?: AuraBattleController }).__aura = created;
   // The camera and the speakers listen to the domain; neither can talk back to it.
   created.events.on("cue", ({ cue, side }) => {
    if (cue === "impact") { director.current.set("IMPACT", side); director.current.shake(.9); platform.current.audio.play("impact"); }
    else if (cue === "fail") { director.current.set("IMPACT", side); director.current.shake(.6); platform.current.audio.play("fail"); }
    else if (cue === "slowmo") director.current.set("SLOWMO_ORBIT", side);
    else if (cue === "crowdPop") { platform.current.audio.play("crowd"); director.current.shake(.2); }
    else if (cue === "land") { director.current.set("IMPACT", side); director.current.shake(.4); }
    else director.current.set("FOCUS", side);
   });
   created.events.on("phase", ({ phase, activeSide, promptSide }) => {
    if (phase === "COUNTER") director.current.set("COUNTER_SNAP", promptSide ?? activeSide);
    else if (phase === "FINAL_DECLARED" || phase === "FINAL_PERFORM") director.current.set("FINAL", activeSide);
    else if (phase === "FINAL_COUNTER") director.current.set("FINAL", promptSide ?? activeSide);
    else if (phase === "SCORE" || phase === "CHOOSE" || phase === "INTRO") director.current.set("DUEL", activeSide);
    else if (phase === "MATCH_OVER") director.current.set("WIN", activeSide);
   });
   created.events.on("moment", ({ tone, side, text }) => {
    platform.current.audio.play(TONE_SOUND[tone] ?? "click");
    if (text === "PERFECT COUNTER" && side !== null) { director.current.set("REVERSAL", side); director.current.shake(1); }
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
   loop.current.start();
   void lifecycle.current.loadingFinished();
   setReady(true);
  });
  return () => {
   alive = false;
   loop.current?.stop();
   battle.current?.dispose();
   battle.current = undefined;
   void lifecycle.current.stopGameplay();
  };
 }, [query]);
 const updatePaused = useCallback((value: boolean) => { setPaused(value); loop.current?.setPaused(value); void lifecycle.current.setPaused(value); }, []);
 const debugControls = useMemo(() => ({
  paused, debugWireframe, setPaused: updatePaused, setDebugWireframe,
  reset: () => battle.current?.restart(),
 }), [paused, debugWireframe, updatePaused]);
 return ready && battle.current
  ? <RunningMatch battle={battle.current} director={director.current} excitement={excitement} debug={debugWireframe} controls={debugControls} onInteract={() => lifecycle.current.playerInteraction()} />
  : <div className="stage"><div role="status" className="boot">Loading arena…</div></div>;
}
function RunningMatch({ battle, director, excitement, debug, controls, onInteract }: {
 battle: AuraBattleController; director: CameraDirector; excitement: { current: number }; debug: boolean;
 controls: React.ComponentProps<typeof DebugPanel>["controls"]; onInteract: () => void;
}) {
 const state = useSyncExternalStore(battle.bridge.subscribe, battle.bridge.getSnapshot) as BattleSnapshot;
 const propOrder = useMemo<{ id: string; kind: PropKind }[]>(() => battle.propOrder(), [battle, state.propCount]);
 const actions = useMemo(() => ({
  playCard: (card: string) => { onInteract(); battle.bridge.actions.playCard(card); },
  pass: () => { onInteract(); battle.bridge.actions.pass(); },
  declareFinal: () => { onInteract(); battle.bridge.actions.declareFinal(); },
  restart: () => { onInteract(); director.reset(); battle.bridge.actions.restart(); },
 }), [battle, director, onInteract]);
 return (
  <div className="stage">
   <div className="viewport">
    <WebGLCanvas>
     <ArenaScene arena={battle.arena} director={director} propOrder={propOrder} excitement={excitement} debug={debug} />
    </WebGLCanvas>
   </div>
   <BattleHud state={state} actions={actions} />
   <DebugPanel enabled={new URLSearchParams(window.location.search).has("debug")} controls={controls} />
  </div>
 );
}
