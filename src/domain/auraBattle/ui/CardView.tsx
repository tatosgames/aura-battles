import type { CSSProperties } from "react";
import { cardOf, type CardCategory, type CardId, type Rider } from "../rules/CardDefinition";
import { BEATS, isCoreCategory } from "../rules/CounterSystem";
import { GameIcon } from "./GameIcon";
export const CATEGORY_COLOR: Record<CardCategory, string> = {
 COOL: "#3b82f6", DEADPAN: "#8fa3bf", MEME: "#f59e0b", CHAOS: "#ef4444", RECOVERY: "#22c55e", FINAL: "#a855f7",
};
export type CardAvailability = "playable" | "unavailable";
function riderLabel(rider: Rider | undefined): string | null {
 if (!rider) return null;
 switch (rider.kind) {
  case "LINK": return `NEXT ${rider.category} +${rider.aura}`;
  case "AFTER": return `AFTER ${rider.category} +${rider.aura}`;
  case "AHEAD": return `AHEAD +${rider.aura} / +${rider.hype}`;
  case "OPENING": return `OPENING +${rider.aura}`;
  case "COUNTER_DRAIN_HYPE": return `COUNTER −${rider.hype} HYPE`;
  case "REPEAT": return `REPEAT +${rider.aura}`;
  case "MIRROR": return "MIRROR";
 }
}
export function CardView({ card, availability, onPlay, compact }: { card: CardId; availability: CardAvailability; onPlay?: (card: CardId) => void; compact?: boolean }) {
 const definition = cardOf(card);
 const accent = CATEGORY_COLOR[definition.category];
 const playable = availability === "playable";
 const counterTarget = isCoreCategory(definition.category) ? BEATS[definition.category] : null;
 const rider = riderLabel(definition.rider);
 const risk = definition.failChance > 0 ? `Risk ${Math.round(definition.failChance * 100)}%.` : "";
 const crown = definition.finalCounterFor ? "Perfect Final Counter." : "";
 const detail = definition.finalCounterFor ? `STOPS ${cardOf(definition.finalCounterFor).name.toUpperCase()}` : definition.failChance > 0 ? `RISK ${Math.round(definition.failChance * 100)}%` : rider;
 const stateLabel = availability === "unavailable" ? "Does not answer this move." : "Play card.";
 return (
  <button
   type="button"
   className={`card card-${availability}${compact ? " card-compact" : ""}`}
   style={{ "--accent": accent } as CSSProperties}
   disabled={!playable}
   onClick={() => onPlay?.(card)}
   aria-label={`${definition.name}. ${definition.category}. Gain ${definition.aura} Aura${definition.hype > 0 ? ` and ${definition.hype} Hype` : ""}. ${counterTarget ? `Beats ${counterTarget}.` : ""} ${rider ?? ""} ${risk} ${crown} ${definition.blurb} ${stateLabel}`}
  >
   <span className="card-top">
    <span className="card-kind"><GameIcon name={definition.category}/>{definition.category}{counterTarget ? <><b>→</b><GameIcon name={counterTarget}/>{counterTarget}</> : null}</span>
    <span className="card-yields">
     {definition.aura > 0 ? <span className="card-yield"><GameIcon name="AURA"/>+{definition.aura}</span> : null}
     {definition.hype > 0 ? <span className="card-yield card-yield-hype"><GameIcon name="HYPE"/>+{definition.hype}</span> : null}
    </span>
   </span>
   <span className="card-name">{definition.name}</span>
   {detail ? <span className={`card-detail${definition.failChance > 0 ? " card-risk" : ""}${definition.finalCounterFor ? " card-state" : ""}`}>{definition.finalCounterFor ? <GameIcon name="FINAL"/> : null}{detail}</span> : null}
  </button>
 );
}
