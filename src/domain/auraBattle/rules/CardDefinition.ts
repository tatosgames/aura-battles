import type { PropKind } from "../sim/PropSystem";
import type { ScriptId } from "../sim/performanceScripts";

export type CoreCategory = "COOL" | "DEADPAN" | "MEME" | "CHAOS";
export type CardCategory = CoreCategory | "RECOVERY" | "FINAL";
export type CardId = string;

/** One visible rider at most. Its wording is shared by the HUD and the resolver. */
export type Rider =
 | { kind: "LINK"; category: CoreCategory; aura: number }
 | { kind: "AFTER"; category: CoreCategory; aura: number }
 | { kind: "AHEAD"; aura: number; hype: number }
 | { kind: "OPENING"; aura: number }
 | { kind: "COUNTER_DRAIN_HYPE"; hype: number }
 | { kind: "REPEAT"; aura: number }
 | { kind: "MIRROR" };

export type CardDefinition = {
 id: CardId;
 name: string;
 category: CardCategory;
 aura: number;
 hype: number;
 blurb: string;
 script: ScriptId;
 failChance: number;
 rider?: Rider;
 requiresProp?: PropKind;
 spawnsProp?: PropKind;
 /** A crown badge: this is the only deterministic answer to that Final Move. */
 finalCounterFor?: CardId;
};

const card = (definition: Partial<CardDefinition> & Pick<CardDefinition, "id" | "name" | "category" | "blurb" | "script">): CardDefinition =>
 ({ aura: 1, hype: 0, failChance: 0, ...definition });

/** The complete shipping set: 20 core cards, three Recoveries and two Final Moves. */
export const CARDS: Record<CardId, CardDefinition> = Object.fromEntries([
 // COOL — outshines DEADPAN.
 card({ id: "main_character_walk", name: "Main Character Walk", category: "COOL", aura: 2, hype: 1, blurb: "Own the room.", script: "MAIN_CHARACTER_WALK" }),
 card({ id: "mewing_stare", name: "Mewing Stare", category: "COOL", aura: 1, hype: 1, blurb: "Jaw locked. Hold eye contact.", script: "MEWING_STARE" }),
 card({ id: "sunglasses_on", name: "Sunglasses On", category: "COOL", aura: 1, hype: 1, rider: { kind: "LINK", category: "COOL", aura: 1 }, blurb: "Next COOL gets +1 Aura.", script: "SUNGLASSES_ON" }),
 card({ id: "silent_flex", name: "Silent Flex", category: "COOL", aura: 1, hype: 1, rider: { kind: "AFTER", category: "DEADPAN", aura: 2 }, blurb: "+2 Aura after DEADPAN.", script: "SILENT_FLEX" }),
 card({ id: "victory_pose", name: "Victory Pose", category: "COOL", aura: 2, hype: 0, rider: { kind: "AHEAD", aura: 1, hype: 1 }, blurb: "Ahead? +1 Aura and +1 Hype.", script: "VICTORY_POSE" }),

 // DEADPAN — defuses CHAOS.
 card({ id: "no_reaction", name: "No Reaction", category: "DEADPAN", aura: 2, hype: 1, blurb: "Let the stunt look desperate.", script: "NO_REACTION" }),
 card({ id: "look_away", name: "Look Away", category: "DEADPAN", aura: 1, hype: 1, rider: { kind: "COUNTER_DRAIN_HYPE", hype: 1 }, blurb: "Counter: burn 1 Hype.", script: "LOOK_AWAY" }),
 card({ id: "walk_away", name: "Walk Away", category: "DEADPAN", aura: 1, hype: 0, rider: { kind: "COUNTER_DRAIN_HYPE", hype: 2 }, blurb: "Counter: burn 2 Hype.", script: "WALK_AWAY" }),
 card({ id: "absolute_silence", name: "Absolute Silence", category: "DEADPAN", aura: 1, hype: 1, rider: { kind: "OPENING", aura: 2 }, blurb: "Opening move: +2 Aura.", script: "ABSOLUTE_SILENCE" }),
 card({ id: "unplug_the_speaker", name: "Unplug The Speaker", category: "DEADPAN", aura: 3, hype: 1, finalCounterFor: "last_dance", blurb: "Perfect counter to Last Dance.", script: "UNPLUG_THE_SPEAKER" }),

 // MEME — embarrasses COOL.
 card({ id: "slow_clap", name: "Slow Clap", category: "MEME", aura: 2, hype: 1, rider: { kind: "COUNTER_DRAIN_HYPE", hype: 1 }, blurb: "Counter: burn 1 Hype.", script: "SLOW_CLAP" }),
 card({ id: "do_it_better", name: "Do It Better", category: "MEME", aura: 2, hype: 1, rider: { kind: "MIRROR" }, blurb: "Copy the pose, then go bigger.", script: "DO_IT_BETTER" }),
 card({ id: "copy_that", name: "Copy That", category: "MEME", aura: 1, hype: 1, rider: { kind: "MIRROR" }, blurb: "Mirror the last move.", script: "COPY_THAT" }),
 card({ id: "npc_reaction", name: "NPC Reaction", category: "MEME", aura: 1, hype: 1, rider: { kind: "REPEAT", aura: 2 }, blurb: "+2 Aura against repeats.", script: "NPC_REACTION" }),
 card({ id: "take_the_throne", name: "Take The Throne", category: "MEME", aura: 3, hype: 1, finalCounterFor: "the_king_has_arrived", blurb: "Perfect counter to The King.", script: "TAKE_THE_THRONE" }),

 // CHAOS — overwhelms MEME, but visibly risks a fall.
 card({ id: "chair_entrance", name: "Chair Entrance", category: "CHAOS", aura: 2, hype: 1, blurb: "Arrive with a chair.", script: "CHAIR_ENTRANCE", spawnsProp: "chair", failChance: .2 }),
 card({ id: "chair_yeet", name: "Chair Yeet", category: "CHAOS", aura: 3, hype: 1, blurb: "Throw the chair. Loudly.", script: "CHAIR_YEET", requiresProp: "chair", failChance: .3 }),
 card({ id: "backflip_entrance", name: "Backflip Entrance", category: "CHAOS", aura: 4, hype: 1, blurb: "High Aura. High risk.", script: "BACKFLIP_ENTRANCE", failChance: .45 }),
 card({ id: "table_slide", name: "Table Slide", category: "CHAOS", aura: 3, hype: 1, blurb: "Slide across the table.", script: "TABLE_SLIDE", spawnsProp: "table", failChance: .35 }),
 card({ id: "shopping_cart", name: "Shopping Cart Entrance", category: "CHAOS", aura: 3, hype: 2, blurb: "Wheels. No brakes.", script: "SHOPPING_CART", spawnsProp: "cart", failChance: .4 }),

 // RECOVERY — held outside the deck and offered only after a FAIL.
 card({ id: "meant_to_do_that", name: "Meant To Do That", category: "RECOVERY", aura: 3, hype: 1, blurb: "Turn the fall into the plan.", script: "MEANT_TO_DO_THAT" }),
 card({ id: "walk_it_off", name: "Walk It Off", category: "RECOVERY", aura: 2, hype: 1, blurb: "Stand. Leave. Say nothing.", script: "WALK_IT_OFF" }),
 card({ id: "still_cool", name: "Still Cool", category: "RECOVERY", aura: 2, hype: 2, blurb: "Adjust the sunglasses.", script: "STILL_COOL" }),

 // FINAL — face up from turn one.
 card({ id: "the_king_has_arrived", name: "The King Has Arrived", category: "FINAL", aura: 0, hype: 0, blurb: "A throne. Silence. The end.", script: "THE_KING_HAS_ARRIVED", spawnsProp: "throne" }),
 card({ id: "last_dance", name: "Last Dance", category: "FINAL", aura: 0, hype: 0, blurb: "Drop the beat. Drop them.", script: "LAST_DANCE", spawnsProp: "boombox" }),
].map((definition) => [definition.id, definition]));

export const CATEGORY_EMOJI: Record<CardCategory, string> = { COOL: "😎", DEADPAN: "🗿", MEME: "😂", CHAOS: "💥", RECOVERY: "🩹", FINAL: "👑" };

export function riderText(rider: Rider | undefined): string | null {
 if (!rider) return null;
 switch (rider.kind) {
  case "LINK": return `Next ${rider.category} +${rider.aura} Aura.`;
  case "AFTER": return `+${rider.aura} Aura after ${rider.category}.`;
  case "AHEAD": return `Ahead: +${rider.aura} Aura, +${rider.hype} Hype.`;
  case "OPENING": return `Opening move: +${rider.aura} Aura.`;
  case "COUNTER_DRAIN_HYPE": return `Counter: opponent -${rider.hype} Hype.`;
  case "REPEAT": return `+${rider.aura} Aura against repeats.`;
  case "MIRROR": return "Mirrors the last pose.";
 }
}

export const cardOf = (id: CardId): CardDefinition => {
 const definition = CARDS[id];
 if (!definition) throw new Error(`Unknown card: ${id}`);
 return definition;
};
