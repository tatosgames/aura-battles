import { AURA_TO_WIN } from "../rules/AuraSystem";
import { HYPE_TO_WIN } from "../rules/HypeSystem";
import { cardOf } from "../rules/CardDefinition";
import type { FighterPublic } from "../AuraBattleController";
import { GameIcon } from "./GameIcon";
export function Meters({ fighter, mirrored, active, onFinal }: { fighter: FighterPublic; mirrored: boolean; active: boolean; onFinal?: () => void }) {
 const finalName = cardOf(fighter.finalMove).name;
 const finalContent = <><GameIcon name="FINAL"/><span>{finalName}</span>{fighter.finalReady ? <strong>READY</strong> : null}</>;
 return (
  <div className={`meter${mirrored ? " meter-right" : ""}${active ? " meter-active" : ""}`}>
   <div className="meter-head">
    <span className="meter-name">{fighter.name}</span>
    <span className="meter-value"><GameIcon name="AURA"/><span>{fighter.aura}/{AURA_TO_WIN}</span><small>AURA</small></span>
   </div>
   <div className="meter-bar" role="meter" aria-label={`${fighter.name} Aura`} aria-valuemin={0} aria-valuemax={AURA_TO_WIN} aria-valuenow={fighter.aura}><i style={{ width: `${(fighter.aura / AURA_TO_WIN) * 100}%` }} /></div>
   <div className="meter-bottom">
    <div className="meter-hype" aria-label={`${fighter.hype} of ${HYPE_TO_WIN} Hype`}>
    {Array.from({ length: HYPE_TO_WIN }, (_, index) => (
     <span key={index} className={index < fighter.hype ? "hype-pip on" : "hype-pip"}><GameIcon name="HYPE"/></span>
    ))}
    </div>
    {onFinal ? <button type="button" className="meter-final meter-final-ready" onClick={onFinal} aria-label={`Play Final Move: ${finalName}`}>{finalContent}</button> : <div className={`meter-final${fighter.finalReady ? " meter-final-ready" : ""}`}>{finalContent}</div>}
   </div>
  </div>
 );
}
