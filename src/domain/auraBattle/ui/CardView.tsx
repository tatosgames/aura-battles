import { CATEGORY_EMOJI, cardOf, type CardCategory, type CardId } from "../rules/CardDefinition";
export const CATEGORY_COLOR: Record<CardCategory, string> = {
 COOL: "#3b82f6", DEADPAN: "#8fa3bf", MEME: "#f59e0b", CHAOS: "#ef4444", RECOVERY: "#22c55e", FINAL: "#a855f7",
};
export function CardView({ card, enabled, onPlay, compact }: { card: CardId; enabled: boolean; onPlay?: (card: CardId) => void; compact?: boolean }) {
 const definition = cardOf(card);
 const accent = CATEGORY_COLOR[definition.category];
 return (
  <button
   type="button"
   className={`card${enabled ? " card-live" : ""}${compact ? " card-compact" : ""}`}
   style={{ "--accent": accent } as React.CSSProperties}
   disabled={!enabled}
   onClick={() => onPlay?.(card)}
  >
   <span className="card-top">
    <span className="card-kind">{CATEGORY_EMOJI[definition.category]} {definition.category}</span>
    {definition.aura > 0 && <span className="card-aura">+{definition.aura}</span>}
   </span>
   <span className="card-name">{definition.name}</span>
   <span className="card-blurb">{definition.blurb}</span>
   {definition.counters.length > 0 && <span className="card-foot">answers {definition.counters.join(" / ")}</span>}
  </button>
 );
}
