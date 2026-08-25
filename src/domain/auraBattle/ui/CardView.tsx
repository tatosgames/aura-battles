import type { CSSProperties } from "react";
import { cardOf, riderText, type CardCategory, type CardId } from "../rules/CardDefinition";
import { BEATS, isCoreCategory } from "../rules/CounterSystem";
import { GameIcon } from "./GameIcon";
export const CATEGORY_COLOR: Record<CardCategory, string> = {
 COOL: "#3b82f6", DEADPAN: "#8fa3bf", MEME: "#f59e0b", CHAOS: "#ef4444", RECOVERY: "#22c55e", FINAL: "#a855f7",
};
export type CardAvailability = "playable" | "unavailable";
export function CardView({ card, availability, onPlay, compact }: { card: CardId; availability: CardAvailability; onPlay?: (card: CardId) => void; compact?: boolean }) {
 const definition = cardOf(card);
 const accent = CATEGORY_COLOR[definition.category];
 const playable = availability === "playable";
 const counterTarget = isCoreCategory(definition.category) ? BEATS[definition.category] : null;
 const rider = riderText(definition.rider);
 const risk = definition.failChance > 0 ? `Risk ${Math.round(definition.failChance * 100)}%.` : "";
 const crown = definition.finalCounterFor ? "Perfect Final Counter." : "";
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
    <span className="card-kind"><GameIcon name={definition.category}/>{definition.category}</span>
    <span className="card-yields">
     {definition.aura > 0 ? <span className="card-yield"><GameIcon name="AURA"/>+{definition.aura}</span> : null}
     {definition.hype > 0 ? <span className="card-yield card-yield-hype"><GameIcon name="HYPE"/>+{definition.hype}</span> : null}
    </span>
   </span>
   <span className="card-name">{definition.name}</span>
   <span className="card-blurb">{definition.blurb}</span>
   {counterTarget ? <span className="card-rule">BEATS <GameIcon name={counterTarget}/>{counterTarget}</span> : null}
   {rider ? <span className="card-rider">{rider}</span> : null}
   {definition.failChance > 0 ? <span className="card-risk">RISK {Math.round(definition.failChance * 100)}%</span> : null}
   {definition.finalCounterFor ? <span className="card-state"><GameIcon name="FINAL"/>PERFECT VS FINAL</span> : null}
  </button>
 );
}
