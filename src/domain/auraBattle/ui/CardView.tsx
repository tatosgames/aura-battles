import type { CSSProperties } from "react";
import { cardOf, type CardCategory, type CardId } from "../rules/CardDefinition";
import { GameIcon } from "./GameIcon";
export const CATEGORY_COLOR: Record<CardCategory, string> = {
 COOL: "#3b82f6", DEADPAN: "#8fa3bf", MEME: "#f59e0b", CHAOS: "#ef4444", RECOVERY: "#22c55e", FINAL: "#a855f7",
};
export type CardAvailability = "playable" | "reserved" | "unavailable";
export function CardView({ card, availability, onPlay, compact }: { card: CardId; availability: CardAvailability; onPlay?: (card: CardId) => void; compact?: boolean }) {
 const definition = cardOf(card);
 const accent = CATEGORY_COLOR[definition.category];
 const playable = availability === "playable";
 const stateLabel = availability === "reserved" ? "Final only" : availability === "unavailable" ? "Unavailable now" : "Play card";
 return (
  <button
   type="button"
   className={`card card-${availability}${compact ? " card-compact" : ""}`}
   style={{ "--accent": accent } as CSSProperties}
   disabled={!playable}
   onClick={() => onPlay?.(card)}
   aria-label={`${definition.name}. ${definition.category}. Gain ${definition.aura} Aura${definition.hype > 0 ? ` and ${definition.hype} Hype` : ""}. ${definition.blurb} ${stateLabel}.`}
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
   {availability === "reserved" ? <span className="card-state"><GameIcon name="FINAL"/>FINAL ONLY</span> : null}
  </button>
 );
}
