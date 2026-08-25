import { useEffect, useRef } from "react";
import { cardOf, type CardId } from "../rules/CardDefinition";
import type { Phase } from "../rules/BattleState";
import type { BattleActions, BattleSnapshot } from "../AuraBattleController";
import { HUMAN } from "../AuraBattleController";
import { CardView, type CardAvailability } from "./CardView";
import { GameIcon } from "./GameIcon";
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
 CHOOSE: "CHOOSE A MOVE", COUNTER: "COUNTER", FAIL: "SAVE THE MOMENT", FINAL_COUNTER: "STEAL THE FINAL",
};
const WAITING: Partial<Record<Phase, string>> = {
 CHOOSE: "REDD IS CHOOSING", COUNTER: "REDD IS ANSWERING", FAIL: "REDD CAN RECOVER", FINAL_COUNTER: "REDD CAN STEAL IT",
 PERFORM: "", RECOVER: "", SCORE: "", INTRO: "AURA BATTLES", FINAL_DECLARED: "FINAL MOVE INCOMING",
 FINAL_PERFORM: "", MATCH_OVER: "",
};
const ANSWERING_PHASES: Phase[] = ["COUNTER", "FINAL_COUNTER"];
const DECISION_PHASES: Phase[] = ["CHOOSE", "COUNTER", "FAIL", "FINAL_COUNTER"];
const TUTORIAL = {
 OBJECTIVE: "REACH 10 AURA + 3 HYPE. THEN PLAY FINAL MOVE.",
 MOVE: "PLAY ANY CARD. ITS ARROW SHOWS WHAT IT BEATS.",
 COUNTER: "FIND THE ICON THAT BEATS THE INCOMING MOVE.",
} as const;
export function BattleHud({ state, actions }: { state: BattleSnapshot; actions: BattleActions }) {
 const you = state.fighters[HUMAN];
 const them = state.fighters[HUMAN === 0 ? 1 : 0];
 const yourTurn = state.promptSide === HUMAN;
 const offered: CardId[] = yourTurn ? state.options : [];
 const answering = ANSWERING_PHASES.includes(state.phase) && state.chain.length > 0
  ? cardOf(state.chain[state.chain.length - 1].card).name
  : null;
 const required = state.requiredCounterCategory;
 const prompt = yourTurn
  ? `${PROMPT[state.phase] ?? ""}${answering ? ` · ${answering}` : ""}`
  : WAITING[state.phase] ?? "";
 const showDecision = yourTurn && DECISION_PHASES.includes(state.phase);
 // Keep every card readable in a counter window: the valid category is highlighted rather than hidden.
 const visibleCards = state.phase === "FAIL" ? offered : you.hand;
 const availabilityOf = (card: CardId): CardAvailability => {
  if (offered.includes(card)) return "playable";
  return "unavailable";
 };
 return (
  <div className="hud">
   <div className="hud-top">
    <Meters fighter={you} mirrored={false} active={state.activeSide === you.side} onFinal={state.canDeclareFinal ? actions.declareFinal : undefined} />
    <div className="hud-center">
     {prompt ? <div className={`hud-prompt${yourTurn ? " urgent" : ""}`}>{prompt}</div> : null}
     {state.tutorial ? <div className="hud-tutorial">{TUTORIAL[state.tutorial]}</div> : null}
     {required ? <div className="hud-context"><GameIcon name={required}/> {required} BEATS {answering?.toUpperCase()}</div> : null}
     {yourTurn && state.phase === "FAIL" ? <div className="hud-context"><GameIcon name="RECOVERY"/>{you.recoveries.length} RECOVERIES LEFT</div> : null}
     <WindowTimer startedAt={state.windowStartedAt} seconds={yourTurn ? state.windowSeconds : 0} />
    </div>
    <Meters fighter={them} mirrored active={state.activeSide === them.side} />
   </div>
   <div className="callouts">
    {state.callouts.slice(-2).map((callout) => (
     <div key={callout.id} className={`callout tone-${callout.tone}${callout.side === null ? "" : callout.side === HUMAN ? " side-left" : " side-right"}`}>{callout.text}</div>
    ))}
   </div>
   {state.phase === "MATCH_OVER" ? (
    <div className="endcard">
     <h2>{state.winner === HUMAN ? "AURA ETERNAL" : "AURA DESTROYED"}</h2>
     <p>{state.winner === HUMAN ? "You closed it out. Nobody recovers from that." : `${them.name} took the moment. Run it back.`}</p>
     <button type="button" className="primary" onClick={actions.restart}>REMATCH</button>
    </div>
   ) : showDecision ? (
    <div className="hand">
     <div className="hand-track">
      {visibleCards.map((card, index) => (
       <CardView
        key={`${card}-${index}`}
        card={card}
        availability={availabilityOf(card)}
        onPlay={actions.playCard}
       />
      ))}
     </div>
     {state.phase !== "CHOOSE" ? (
      <div className="hand-side">
       <button type="button" className="ghost" onClick={actions.pass}>LET IT LAND</button>
      </div>
     ) : null}
    </div>
   ) : null}
  </div>
 );
}
