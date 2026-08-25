import { AURA_TO_WIN } from "../rules/AuraSystem";
import { HYPE_TO_WIN } from "../rules/HypeSystem";
import { cardOf } from "../rules/CardDefinition";
import type { FighterPublic } from "../AuraBattleController";
export function Meters({ fighter, mirrored, active }: { fighter: FighterPublic; mirrored: boolean; active: boolean }) {
 return (
  <div className={`meter${mirrored ? " meter-right" : ""}${active ? " meter-active" : ""}`}>
   <div className="meter-head">
    <span className="meter-name">{fighter.name}</span>
    <span className="meter-value">{fighter.aura * 1000}</span>
   </div>
   <div className="meter-bar"><i style={{ width: `${(fighter.aura / AURA_TO_WIN) * 100}%` }} /></div>
   <div className="meter-hype">
    {Array.from({ length: HYPE_TO_WIN }, (_, index) => (
     <span key={index} className={index < fighter.hype ? "flame on" : "flame"}>🔥</span>
    ))}
    {fighter.finalReady && <span className="meter-ready">FINAL MOVE READY</span>}
   </div>
   <div className="meter-final">👑 {cardOf(fighter.finalMove).name}</div>
  </div>
 );
}
