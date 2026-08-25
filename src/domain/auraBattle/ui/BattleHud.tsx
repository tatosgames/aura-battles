import { useEffect, useRef } from "react";
import { cardOf, type CardId } from "../rules/CardDefinition";
import type { Phase } from "../rules/BattleState";
import type { BattleActions, BattleSnapshot } from "../AuraBattleController";
import { HUMAN } from "../AuraBattleController";
import { CardView } from "./CardView";
import { Meters } from "./Meters";
/** Drains without re-rendering React: the ring is the tensest thing on screen and must stay smooth. */
function WindowTimer({ startedAt, seconds }: { startedAt: number; seconds: number }) {
 const bar = useRef<HTMLDivElement>(null);
 useEffect(() => {
  if (seconds <= 0) return;
  let frame = 0;
  const tick = () => {
   const left = Math.max(0, 1 - (Date.now() - startedAt) / (seconds * 1000));
   if (bar.current) bar.current.style.transform = `scaleX(${left})`;
   if (left > 0) frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(frame);
 }, [startedAt, seconds]);
 if (seconds <= 0) return null;
 return <div className="timer"><div ref={bar} className="timer-fill" /></div>;
}
const PROMPT: Partial<Record<Phase, string>> = {
 CHOOSE: "YOUR MOVE", COUNTER: "COUNTER?", FAIL: "RECOVER?", FINAL_COUNTER: "FINAL COUNTER?",
};
const WAITING: Partial<Record<Phase, string>> = {
 CHOOSE: "THEY ARE POSING…", COUNTER: "WILL THEY ANSWER?", FAIL: "THEY ARE ON THE FLOOR", FINAL_COUNTER: "THEY ARE DECIDING",
 PERFORM: "", RECOVER: "", SCORE: "", INTRO: "AURA BATTLES", FINAL_DECLARED: "FINAL MOVE INCOMING",
 FINAL_PERFORM: "", MATCH_OVER: "",
};
export function BattleHud({ state, actions }: { state: BattleSnapshot; actions: BattleActions }) {
 const you = state.fighters[HUMAN];
 const them = state.fighters[HUMAN === 0 ? 1 : 0];
 const yourTurn = state.promptSide === HUMAN;
 const offered: CardId[] = yourTurn ? state.options : [];
 const banner = yourTurn ? PROMPT[state.phase] ?? "" : WAITING[state.phase] ?? "";
 const chainNames = state.chain.map((entry) => cardOf(entry.card).name);
 return (
  <div className="hud">
   <div className="hud-top">
    <Meters fighter={you} mirrored={false} active={state.activeSide === you.side} />
    <div className="hud-center">
     <div className="hud-turn">TURN {state.turn}</div>
     {chainNames.length > 0 && <div className="hud-chain">{chainNames.join("  →  ")}</div>}
     {banner && <div className={`hud-banner${yourTurn ? " urgent" : ""}`}>{banner}</div>}
     <WindowTimer startedAt={state.windowStartedAt} seconds={yourTurn ? state.windowSeconds : 0} />
    </div>
    <Meters fighter={them} mirrored active={state.activeSide === them.side} />
   </div>
   <div className="callouts">
    {state.callouts.slice(-3).map((callout) => (
     <div key={callout.id} className={`callout tone-${callout.tone}${callout.side === null ? "" : callout.side === HUMAN ? " side-left" : " side-right"}`}>{callout.text}</div>
    ))}
   </div>
   {state.phase === "MATCH_OVER" ? (
    <div className="endcard">
     <h2>{state.winner === HUMAN ? "AURA ETERNAL" : "AURA DESTROYED"}</h2>
     <p>{state.winner === HUMAN ? "You closed it out. Nobody recovers from that." : `${them.name} took the moment. Run it back.`}</p>
     <button type="button" className="primary" onClick={actions.restart}>REMATCH</button>
    </div>
   ) : (
    <div className="hand">
     {(state.phase === "FAIL" && yourTurn ? offered : you.hand).map((card, index) => (
      <CardView
       key={`${card}-${index}`}
       card={card}
       enabled={yourTurn && offered.includes(card)}
       onPlay={actions.playCard}
      />
     ))}
     <div className="hand-side">
      {state.canDeclareFinal && (
       <button type="button" className="primary final" onClick={actions.declareFinal}>
        FINAL MOVE<small>{cardOf(you.finalMove).name}</small>
       </button>
      )}
      {yourTurn && state.phase !== "CHOOSE" && (
       <button type="button" className="ghost" onClick={actions.pass}>LET IT LAND</button>
      )}
      {you.recoveries.length > 0 && <div className="pile">🩹 {you.recoveries.length} recoveries left</div>}
      <div className="pile">🂠 {you.deckCount} in deck · 🪑 {state.propCount} props on stage</div>
     </div>
    </div>
   )}
  </div>
 );
}
