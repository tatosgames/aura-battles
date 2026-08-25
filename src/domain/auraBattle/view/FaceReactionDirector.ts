import type { Cue } from "../sim/performanceScripts";
import type { Side } from "../rules/BattleState";

export interface FaceReactionSample {
 focus: number;
 impact: number;
 dizzy: number;
 recovering: number;
 celebration: number;
}

const createSample = (): FaceReactionSample => ({ focus: 0, impact: 0, dizzy: 0, recovering: 0, celebration: 0 });

/**
 * Holds short-lived visual reactions emitted by the match. It is deliberately
 * presentation-owned: cues can enter, but face animation can never affect rules.
 */
export class FaceReactionDirector {
 private readonly samples: [FaceReactionSample, FaceReactionSample] = [createSample(), createSample()];

 trigger(cue: Cue, side: Side): void {
  const sample = this.samples[side];
  if (cue === "focus" || cue === "reveal") sample.focus = 1;
  else if (cue === "impact") sample.impact = 1;
  else if (cue === "fail") { sample.dizzy = 1; sample.focus = 0; }
  else if (cue === "land") sample.recovering = 1;
  else if (cue === "crowdPop") sample.celebration = 1;
  else if (cue === "slowmo") { sample.focus = 1; sample.celebration = Math.max(sample.celebration, 0.35); }
 }

 update(delta: number): void {
  const dt = Math.min(Math.max(delta, 0), 0.1);
  for (const sample of this.samples) {
   sample.focus = decay(sample.focus, 1.35, dt);
   sample.impact = decay(sample.impact, 5.8, dt);
   sample.dizzy = decay(sample.dizzy, 0.85, dt);
   sample.recovering = decay(sample.recovering, 1.9, dt);
   sample.celebration = decay(sample.celebration, 1.15, dt);
  }
 }

 read(side: Side): Readonly<FaceReactionSample> {
  return this.samples[side];
 }

 reset(): void {
  for (const sample of this.samples) Object.assign(sample, createSample());
 }
}

function decay(value: number, rate: number, delta: number): number {
 return Math.max(0, value - rate * delta);
}
