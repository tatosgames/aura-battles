import { cardOf } from "./CardDefinition";
import type { ChainEntry, ComboId } from "./BattleState";

/** Recovery is the only named bonus: it is obvious because it appears only after a FAIL. */
export function detectCombo(chain: ChainEntry[], recoveredFromFail: boolean): ComboId | null {
 const last = chain[chain.length - 1];
 return recoveredFromFail && cardOf(last.card).category === "RECOVERY" ? "ACCIDENTAL_CINEMA" : null;
}
