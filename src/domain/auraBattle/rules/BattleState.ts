import type { CardCategory, CardId, CoreCategory } from "./CardDefinition";

export type Side = 0 | 1;
export type Phase = "INTRO" | "CHOOSE" | "COUNTER" | "RESOLVE" | "PERFORM" | "FAIL" | "RECOVER" | "SCORE" | "FINAL_DECLARED" | "FINAL_COUNTER" | "FINAL_PERFORM" | "MATCH_OVER";
export type ChainEntry = { side: Side; card: CardId; failed: boolean };
export type ComboId = "ACCIDENTAL_CINEMA";

export type FighterState = {
 side: Side;
 name: string;
 aura: number;
 hype: number;
 hand: CardId[];
 deck: CardId[];
 discard: CardId[];
 recoveries: CardId[];
 finalMove: CardId;
 lastCategory: CardCategory | null;
 repeatedCategory: boolean;
 link: { category: CoreCategory; aura: number } | null;
};

export type Outcome = {
 winner: Side;
 card: CardId;
 auraGain: number;
 auraLoss: number;
 hypeGain: number;
 hypeLoss: number;
 combo: ComboId | null;
 failed: boolean;
 wasCounter: boolean;
};

export const COMBO_LABEL: Record<ComboId, string> = { ACCIDENTAL_CINEMA: "ACCIDENTAL CINEMA" };
