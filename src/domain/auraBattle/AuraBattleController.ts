import { GameBridge } from "@/app/bridge/GameBridge";
import { TypedEventBus } from "@/engine/events/TypedEventBus";
import { createRng, type Rng } from "@/engine/math/rng";
import { ArenaController } from "./sim/ArenaController";
import { MoveDirector } from "./sim/MoveDirector";
import type { Cue } from "./sim/performanceScripts";
import type { PropKind } from "./sim/PropSystem";
import { cardOf, type CardId, type CoreCategory } from "./rules/CardDefinition";
import { HYPE_TO_WIN } from "./rules/HypeSystem";
import { COMBO_LABEL, type ChainEntry, type FighterState, type Phase, type Side } from "./rules/BattleState";
import { createFighter, discard, refill } from "./rules/Deck";
import { beatenBy, legalCounters, legalOpeners, MAX_CHAIN } from "./rules/CounterSystem";
import { applyFailure, applyOutcome, resolveChain, rollFailure } from "./rules/CardResolver";
import { applyFinalSteal, canDeclareFinal, legalFinalCounters, resolveFinalCounter } from "./rules/FinalMoveSystem";
import { AIController } from "./ai/AIController";
export type CalloutTone = "aura" | "counter" | "fail" | "final" | "combo" | "info";
export type Callout = { id: number; text: string; tone: CalloutTone; side: Side | null; at: number };
export type FighterPublic = { side: Side; name: string; aura: number; hype: number; hand: CardId[]; deckCount: number; recoveries: CardId[]; finalMove: CardId; finalReady: boolean };
export type BattleSnapshot = {
 revision: number; phase: Phase; activeSide: Side; promptSide: Side | null;
 windowSeconds: number; windowStartedAt: number;
 fighters: [FighterPublic, FighterPublic];
 chain: ChainEntry[]; options: CardId[]; canDeclareFinal: boolean;
 requiredCounterCategory: CoreCategory | null; tutorial: "OBJECTIVE" | "MOVE" | "COUNTER" | null;
 callouts: Callout[]; winner: Side | null; propCount: number; turn: number;
};
export type BattleActions = { playCard(card: CardId): void; pass(): void; declareFinal(): void; restart(): void };
export type BattleEvents = {
 cue: { cue: Cue; side: Side };
 phase: { phase: Phase; activeSide: Side; promptSide: Side | null };
 moment: { tone: CalloutTone; side: Side | null; text: string };
};
export const HUMAN: Side = 0;
type Timings = { counter: number; finalCounter: number; fail: number; score: number; intro: number };
const NORMAL: Timings = { counter: 3.6, finalCounter: 4.2, fail: 3.2, score: 1.4, intro: 1.6 };
const FAST: Timings = { counter: 1.2, finalCounter: 1.2, fail: 1, score: .5, intro: .4 };
/**
 * Owns the whole match: the phase machine, the rules calls, and the instructions handed to the
 * ragdolls. Rules resolve first and physics is told what to sell, never the other way round.
 */
export class AuraBattleController {
 readonly bridge: GameBridge<BattleSnapshot, BattleActions>;
 readonly events = new TypedEventBus<BattleEvents>();
 private readonly directors: [MoveDirector, MoveDirector];
 private readonly ai: AIController;
 private rng: Rng;
 private fighters: [FighterState, FighterState];
 private phase: Phase = "INTRO";
 private activeSide: Side = 0;
 private promptSide: Side | null = null;
 private chain: ChainEntry[] = [];
 private options: CardId[] = [];
 private callouts: Callout[] = [];
 private winner: Side | null = null;
 private turn = 1;
 private windowSeconds = 0;
 private windowLeft = 0;
 private windowStartedAt = 0;
 private aiThink = Number.POSITIVE_INFINITY;
 private failSide: Side | null = null;
 private finalAttacker: Side | null = null;
 private finalStolen = false;
 private tutorial: "OBJECTIVE" | "MOVE" | "COUNTER" | null = "OBJECTIVE";
 private counterTutorialShown = false;
 private timeScale = 1;
 private timeScaleLeft = 0;
 private calloutId = 1;
 private propOrderRevision = -1;
 private propOrderCache: { id: string; kind: PropKind }[] = [];
 private constructor(readonly arena: ArenaController, private readonly timings: Timings, private readonly seed: number, private readonly warm = false) {
  this.rng = createRng(seed);
  this.ai = new AIController(this.rng.fork(7));
  this.fighters = this.deal();
  const sink = (cue: Cue, side: Side) => this.handleCue(cue, side);
  this.directors = [new MoveDirector(arena, 0, sink), new MoveDirector(arena, 1, sink)];
  this.bridge = new GameBridge<BattleSnapshot, BattleActions>(this.snapshot(0), {
   playCard: (card) => this.playCard(card),
   pass: () => this.pass(),
   declareFinal: () => this.declareFinal(),
   restart: () => this.restart(),
  });
  this.openWindow(timings.intro);
 }
 static async create(config: unknown, options: { seed?: number; fast?: boolean; warm?: boolean } = {}): Promise<AuraBattleController> {
  const arena = await ArenaController.create(config);
  return new AuraBattleController(arena, options.fast ? FAST : NORMAL, options.seed ?? Math.floor(Math.random() * 1e9), options.warm);
 }
 /** `warm` starts both meters one card short of a Final Move, for tuning and testing the finale. */
 private deal(): [FighterState, FighterState] {
  const dealt: [FighterState, FighterState] = [createFighter(0, this.rng), createFighter(1, this.rng)];
  if (this.warm) dealt.forEach((fighter) => { fighter.aura = 9; fighter.hype = 3; });
  return dealt;
 }

 // ---- presentation-facing reads, all plain numbers ---------------------------------

 propOrder(): { id: string; kind: PropKind }[] {
  if (this.arena.props.revision !== this.propOrderRevision) { this.propOrderRevision = this.arena.props.revision; this.propOrderCache = this.arena.props.order(); }
  return this.propOrderCache;
 }
 excitement(): number {
  const heat = (this.fighters[0].hype + this.fighters[1].hype) / (HYPE_TO_WIN * 2);
  const performing = this.directors.some((director) => director.active) ? .35 : 0;
  const finale = this.phase === "FINAL_PERFORM" || this.phase === "FINAL_COUNTER" ? .6 : 0;
  return Math.min(1, heat * .7 + performing + finale);
 }

 // ---- simulation -------------------------------------------------------------------

 fixedUpdate(dt: number): void {
  if (this.timeScaleLeft > 0) { this.timeScaleLeft -= dt; if (this.timeScaleLeft <= 0) this.timeScale = 1; }
  const scaled = dt * this.timeScale;
  if (scaled > 0) {
   this.directors.forEach((director) => director.fixedUpdate(scaled));
   this.arena.fixedUpdate(scaled);
  }
  // Phase timers run on real time so hit-stop and slow motion never change a window's length.
  this.advance(dt);
 }
 private advance(dt: number): void {
  if (this.windowLeft > 0) this.windowLeft = Math.max(0, this.windowLeft - dt);
  const expired = this.windowSeconds > 0 && this.windowLeft <= 0;
  switch (this.phase) {
   case "INTRO": if (expired) this.beginTurn(); break;
   case "CHOOSE": this.tickAi(dt, () => this.aiOpen()); break;
   case "COUNTER": this.tickAi(dt, () => this.aiCounter()); if (expired) this.closeChain(); break;
   case "PERFORM": if (!this.performing()) this.afterPerformance(); break;
   case "FAIL": this.tickAi(dt, () => this.aiRecover()); if (expired) this.enterScore(); break;
   case "RECOVER": if (!this.performing()) this.enterScore(); break;
   case "SCORE": if (expired) this.beginTurn(); break;
   case "FINAL_DECLARED": if (expired) this.openFinalCounter(); break;
   case "FINAL_COUNTER": this.tickAi(dt, () => this.aiFinalCounter()); if (expired) this.settleFinal(null); break;
   case "FINAL_PERFORM": if (!this.performing()) this.finishFinal(); break;
   default: break;
  }
 }
 private performing(): boolean { return this.directors.some((director) => director.active); }
 private tickAi(dt: number, act: () => void): void {
  if (this.promptSide !== 1) return;
  this.aiThink -= dt;
  if (this.aiThink <= 0) { this.aiThink = Number.POSITIVE_INFINITY; act(); }
 }

 // ---- phase transitions -------------------------------------------------------------

 private setPhase(phase: Phase, promptSide: Side | null, options: CardId[] = []): void {
  this.phase = phase; this.promptSide = promptSide; this.options = options;
  this.aiThink = promptSide === 1 ? this.ai.thinkDelay() : Number.POSITIVE_INFINITY;
  this.events.emit("phase", { phase, activeSide: this.activeSide, promptSide });
  this.publish();
 }
 private openWindow(seconds: number): void { this.windowSeconds = seconds; this.windowLeft = seconds; this.windowStartedAt = Date.now(); }
 private beginTurn(): void {
  this.chain = []; this.failSide = null;
  this.fighters.forEach((fighter) => refill(fighter, this.rng));
  if (this.phase !== "INTRO") { this.activeSide = this.activeSide === 0 ? 1 : 0; this.turn++; }
  if (this.tutorial === "OBJECTIVE") this.tutorial = "MOVE";
  this.openWindow(0);
  this.setPhase("CHOOSE", this.activeSide, legalOpeners(this.fighters[this.activeSide]));
 }
 private playCard(card: CardId): void {
  if (this.promptSide === null) return;
  if (this.phase === "CHOOSE") this.commitOpener(this.promptSide, card);
  else if (this.phase === "COUNTER") this.commitCounter(this.promptSide, card);
  else if (this.phase === "FAIL") this.commitRecovery(this.promptSide, card);
  else if (this.phase === "FINAL_COUNTER") this.settleFinal(card);
 }
 private pass(): void {
  if (this.phase === "COUNTER") { if (this.tutorial === "COUNTER") this.tutorial = null; this.closeChain(); }
  else if (this.phase === "FAIL") this.enterScore();
  else if (this.phase === "FINAL_COUNTER") this.settleFinal(null);
 }
 private commitOpener(side: Side, card: CardId): void {
  if (!legalOpeners(this.fighters[side]).includes(card)) return;
  if (side === HUMAN && this.tutorial === "MOVE") this.tutorial = null;
  this.perform(side, card);
  const defender: Side = side === 0 ? 1 : 0;
  const options = legalCounters(this.fighters[defender], this.chain);
  if (options.length === 0) { this.closeChain(); return; }
  if (defender === HUMAN && !this.counterTutorialShown) { this.tutorial = "COUNTER"; this.counterTutorialShown = true; }
  this.openWindow(this.timings.counter);
  this.setPhase("COUNTER", defender, options);
 }
 private commitCounter(side: Side, card: CardId): void {
  if (!legalCounters(this.fighters[side], this.chain).includes(card)) return;
  if (side === HUMAN && this.tutorial === "COUNTER") this.tutorial = null;
  this.perform(side, card);
  this.say("COUNTER", "counter", side);
  this.events.emit("cue", { cue: "focus", side });
  if (this.chain.length >= MAX_CHAIN) { this.closeChain(); return; }
  const responder: Side = side === 0 ? 1 : 0;
  const options = legalCounters(this.fighters[responder], this.chain);
  if (options.length === 0) { this.closeChain(); return; }
  if (responder === HUMAN && !this.counterTutorialShown) { this.tutorial = "COUNTER"; this.counterTutorialShown = true; }
  this.openWindow(this.timings.counter);
  this.setPhase("COUNTER", responder, options);
 }
 /** The single place a card's fate is decided, and it is decided before anything moves. */
 private perform(side: Side, card: CardId): void {
  const definition = cardOf(card);
  const failed = rollFailure(definition.failChance, this.rng);
  this.chain.push({ side, card, failed });
  discard(this.fighters[side], card);
  this.directors[side].play(definition, failed);
  this.publish();
 }
 private closeChain(): void {
  if (this.chain.length === 0) { this.enterScore(); return; }
  const outcome = resolveChain(this.chain, this.fighters);
  if (outcome.failed) {
   applyFailure(this.fighters, outcome);
   this.failSide = outcome.winner;
   this.say("AURA DESTROYED", "fail", outcome.winner);
  } else {
   applyOutcome(this.fighters, outcome);
   if (outcome.combo) this.say(COMBO_LABEL[outcome.combo], "combo", outcome.winner);
   this.say(`+${outcome.auraGain * 1000} AURA`, "aura", outcome.winner);
   if (outcome.wasCounter) this.say("MOMENT STOLEN", "counter", outcome.winner);
  }
  this.openWindow(0);
  this.setPhase("PERFORM", null);
 }
 private afterPerformance(): void {
  const failer = this.failSide;
  if (failer === null) { this.enterScore(); return; }
  const options = this.fighters[failer].recoveries;
  if (options.length === 0) { this.enterScore(); return; }
  this.say("FAIL", "fail", failer);
  this.openWindow(this.timings.fail);
  this.setPhase("FAIL", failer, [...options]);
 }
 private commitRecovery(side: Side, card: CardId): void {
  const pile = this.fighters[side].recoveries;
  const index = pile.indexOf(card);
  if (index < 0) return;
  pile.splice(index, 1);
  this.chain = [{ side, card, failed: false }];
  const outcome = resolveChain(this.chain, this.fighters, true);
  applyOutcome(this.fighters, outcome);
  if (outcome.combo) this.say(COMBO_LABEL[outcome.combo], "combo", side);
  this.say(`+${outcome.auraGain * 1000} AURA`, "aura", side);
  this.directors[side].play(cardOf(card), false);
  this.openWindow(0);
  this.setPhase("RECOVER", null);
 }
 private enterScore(): void {
  this.failSide = null;
  const ready = this.fighters.find((fighter) => canDeclareFinal(fighter));
  if (ready) this.say("FINAL MOVE READY", "final", ready.side);
  this.openWindow(this.timings.score);
  this.setPhase("SCORE", null);
 }

 // ---- final move --------------------------------------------------------------------

 private declareFinal(): void {
  const side = this.activeSide;
  if (this.phase !== "CHOOSE" || this.promptSide !== side || !canDeclareFinal(this.fighters[side])) return;
  this.finalAttacker = side; this.finalStolen = false;
  const finalMove = this.fighters[side].finalMove;
  this.chain = [{ side, card: finalMove, failed: false }];
  this.directors[side].play(cardOf(finalMove), false);
  this.say(cardOf(finalMove).name.toUpperCase(), "final", side);
  this.openWindow(1.2);
  this.setPhase("FINAL_DECLARED", null);
 }
 private openFinalCounter(): void {
  const attacker = this.finalAttacker!;
  const defender: Side = attacker === 0 ? 1 : 0;
  this.openWindow(this.timings.finalCounter);
  this.setPhase("FINAL_COUNTER", defender, legalFinalCounters(this.fighters[defender], this.fighters[attacker].finalMove));
 }
 private settleFinal(card: CardId | null): void {
  const attacker = this.finalAttacker!;
  const defender: Side = attacker === 0 ? 1 : 0;
  const finalMove = this.fighters[attacker].finalMove;
  if (card && legalFinalCounters(this.fighters[defender], finalMove).includes(card)) {
   const result = resolveFinalCounter(card, finalMove);
   discard(this.fighters[defender], card);
   if (result.stolen) {
    this.finalStolen = true;
    applyFinalSteal(this.fighters[attacker], this.fighters[defender]);
    // The attacker's own moment is cut off mid-performance: that is the entire point of the shot.
    this.directors[attacker].stop();
    this.arena.fighters[attacker].setPose("SHRUG");
    this.arena.fighters[attacker].setBalance(.25);
    this.directors[defender].play(cardOf(card), false);
    this.say("PERFECT COUNTER", "counter", defender);
    this.say("+9999 AURA", "aura", defender);
    this.events.emit("cue", { cue: "slowmo", side: defender });
   }
  }
  this.openWindow(0);
  this.setPhase("FINAL_PERFORM", null);
 }
 private finishFinal(): void {
  const attacker = this.finalAttacker!;
  this.finalAttacker = null;
  if (this.finalStolen) { this.chain = []; this.enterScore(); return; }
  this.winner = attacker;
  this.say("AURA ETERNAL", "final", attacker);
  this.openWindow(0);
  this.setPhase("MATCH_OVER", null);
 }

 // ---- ai turns ----------------------------------------------------------------------

 private aiOpen(): void {
  const choice = this.ai.chooseOpener(this.fighters[1], this.fighters[0]);
  if (choice === "final") { this.declareFinal(); return; }
  if (choice) this.commitOpener(1, choice); else this.closeChain();
 }
 private aiCounter(): void {
  const choice = this.ai.chooseCounter(this.fighters[1], this.chain);
  if (choice) this.commitCounter(1, choice); else this.closeChain();
 }
 private aiRecover(): void {
  const pile = this.fighters[1].recoveries;
  if (pile.length > 0) this.commitRecovery(1, pile[0]); else this.enterScore();
 }
 private aiFinalCounter(): void {
  this.settleFinal(this.ai.chooseFinalCounter(this.fighters[1], this.fighters[this.finalAttacker!].finalMove));
 }

 // ---- presentation cues and callouts ---------------------------------------------------

 private handleCue(cue: Cue, side: Side): void {
  this.events.emit("cue", { cue, side });
  if (cue === "impact") { this.timeScale = 0; this.timeScaleLeft = .07; }
  if (cue === "slowmo") { this.timeScale = .3; this.timeScaleLeft = 1.1; }
  if (cue === "fail") { this.timeScale = .45; this.timeScaleLeft = .5; }
 }
 private say(text: string, tone: CalloutTone, side: Side | null): void {
  this.callouts = [...this.callouts.slice(-4), { id: this.calloutId++, text, tone, side, at: Date.now() }];
  this.events.emit("moment", { tone, side, text });
 }

 // ---- snapshot -------------------------------------------------------------------------

 private publicFighter(fighter: FighterState): FighterPublic {
  return {
   side: fighter.side, name: fighter.name, aura: fighter.aura, hype: fighter.hype, hand: [...fighter.hand],
   deckCount: fighter.deck.length, recoveries: [...fighter.recoveries], finalMove: fighter.finalMove, finalReady: canDeclareFinal(fighter),
  };
 }
 private snapshot(revision: number): BattleSnapshot {
  const incoming = this.chain.length > 0 ? cardOf(this.chain[this.chain.length - 1].card).category : null;
  return {
   revision, phase: this.phase, activeSide: this.activeSide, promptSide: this.promptSide,
   windowSeconds: this.windowSeconds, windowStartedAt: this.windowStartedAt,
   fighters: [this.publicFighter(this.fighters[0]), this.publicFighter(this.fighters[1])],
   chain: this.chain.map((entry) => ({ ...entry })), options: [...this.options],
   canDeclareFinal: this.phase === "CHOOSE" && this.promptSide === HUMAN && canDeclareFinal(this.fighters[HUMAN]),
   requiredCounterCategory: this.phase === "COUNTER" && incoming ? beatenBy(incoming) : null, tutorial: this.tutorial,
   callouts: [...this.callouts], winner: this.winner, propCount: this.arena.props.count(), turn: this.turn,
  };
 }
 private publish(): void { this.bridge.publish((revision) => this.snapshot(revision)); }
 restart(): void {
  this.arena.reset();
  this.directors.forEach((director) => director.stop());
  this.rng = createRng(this.seed + this.turn * 104729);
  this.fighters = this.deal();
  this.chain = []; this.callouts = []; this.winner = null; this.turn = 1; this.activeSide = 0;
  this.failSide = null; this.finalAttacker = null; this.finalStolen = false;
  this.tutorial = "OBJECTIVE"; this.counterTutorialShown = false;
  this.timeScale = 1; this.timeScaleLeft = 0;
  this.openWindow(this.timings.intro);
  this.setPhase("INTRO", null);
 }
 dispose(): void { this.arena.dispose(); }
}
