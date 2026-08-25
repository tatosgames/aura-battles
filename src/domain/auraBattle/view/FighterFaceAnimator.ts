import { MathUtils, Quaternion, Vector2, Vector3 } from "three";

export type FinalFaceExpression = "winner" | "loser" | "draw" | null;

export interface FighterFaceInput {
 headPosition: Vector3;
 headQuaternion: Quaternion;
 gazeTargetPosition: Vector3;
 focus: number;
 impact: number;
 dizzy: number;
 recovering: number;
 celebration: number;
 finalExpression: FinalFaceExpression;
}

export interface FighterFaceFrame {
 pupilLateral: number;
 pupilVertical: number;
 eyeOpen: number;
 eyeWide: number;
 browTilt: number;
 browLift: number;
 mouthOpen: number;
 mouthWide: number;
 xEyes: boolean;
}

const WORLD_DOWN = new Vector3(0, -1, 0);
const TAU = Math.PI * 2;
const MAX_DELTA_SECONDS = 0.1;
const MAX_PUPIL_OFFSET = 0.019;

/**
 * Presentation-only googly-eye animation. It observes the rendered head transform,
 * never Rapier state, and keeps all non-deterministic-looking motion local to R3F.
 */
export class FighterFaceAnimator {
 private readonly offset = new Vector2();
 private readonly velocity = new Vector2();
 private readonly target = new Vector2();
 private readonly previousPosition = new Vector3();
 private readonly previousVelocity = new Vector3();
 private readonly acceleration = new Vector3();
 private readonly inverseHead = new Quaternion();
 private readonly localVector = new Vector3();
 private readonly toGazeTarget = new Vector3();
 private hasHistory = false;
 private blinkCountdown: number;
 private blinkRemaining = 0;
 private idleTime = 0;
 private dizzyTime = 0;
 private randomSeed: number;

 constructor(seed: number) {
  this.randomSeed = seed;
  this.blinkCountdown = this.nextBlinkDelay();
 }

 update(delta: number, input: FighterFaceInput): FighterFaceFrame {
  const dt = Math.min(Math.max(delta, 0.0001), MAX_DELTA_SECONDS);
  this.trackHeadAcceleration(dt, input.headPosition);
  this.inverseHead.copy(input.headQuaternion).invert();
  this.buildPupilTarget(input);
  this.integratePupils(dt);
  this.advanceBlink(dt);
  this.idleTime += dt;
  this.dizzyTime += dt;
  return this.composeFrame(input);
 }

 reset(): void {
  this.offset.set(0, 0);
  this.velocity.set(0, 0);
  this.target.set(0, 0);
  this.acceleration.set(0, 0, 0);
  this.previousVelocity.set(0, 0, 0);
  this.hasHistory = false;
  this.blinkRemaining = 0;
  this.blinkCountdown = this.nextBlinkDelay();
 }

 private trackHeadAcceleration(dt: number, position: Vector3): void {
  if (!this.hasHistory) {
   this.previousPosition.copy(position);
   this.previousVelocity.set(0, 0, 0);
   this.acceleration.set(0, 0, 0);
   this.hasHistory = true;
   return;
  }
  this.localVector.subVectors(position, this.previousPosition).divideScalar(dt);
  this.acceleration.subVectors(this.localVector, this.previousVelocity).divideScalar(dt);
  this.previousVelocity.copy(this.localVector);
  this.previousPosition.copy(position);
 }

 private buildPupilTarget(input: FighterFaceInput): void {
  this.target.set(0, 0);
  this.localVector.copy(this.acceleration).applyQuaternion(this.inverseHead);
  // Aura faces point along local +X, so the visible eye plane is local Z/Y.
  this.target.x -= this.localVector.z * 0.000018;
  this.target.y -= this.localVector.y * 0.000018;

  this.localVector.copy(WORLD_DOWN).applyQuaternion(this.inverseHead);
  this.target.x += this.localVector.z * 0.005;
  this.target.y += (this.localVector.y + 1) * 0.005;

  this.toGazeTarget.subVectors(input.gazeTargetPosition, input.headPosition);
  if (this.toGazeTarget.lengthSq() > 0.0001) {
   this.localVector.copy(this.toGazeTarget).normalize().applyQuaternion(this.inverseHead);
   this.target.x += this.localVector.z * 0.009;
   this.target.y += this.localVector.y * 0.009;
  }
  if (this.target.length() > MAX_PUPIL_OFFSET) this.target.setLength(MAX_PUPIL_OFFSET);
 }

 private integratePupils(dt: number): void {
  this.velocity.x += (this.target.x - this.offset.x) * 85 * dt;
  this.velocity.y += (this.target.y - this.offset.y) * 85 * dt;
  this.velocity.multiplyScalar(Math.exp(-12 * dt));
  this.offset.addScaledVector(this.velocity, dt);
  if (this.offset.length() > MAX_PUPIL_OFFSET) {
   this.offset.setLength(MAX_PUPIL_OFFSET);
   this.velocity.multiplyScalar(0.35);
  }
 }

 private advanceBlink(dt: number): void {
  if (this.blinkRemaining > 0) {
   this.blinkRemaining = Math.max(0, this.blinkRemaining - dt);
   return;
  }
  this.blinkCountdown -= dt;
  if (this.blinkCountdown > 0) return;
  this.blinkRemaining = 0.11;
  this.blinkCountdown = this.nextBlinkDelay();
 }

 private composeFrame(input: FighterFaceInput): FighterFaceFrame {
  const focus = MathUtils.clamp(input.focus, 0, 1);
  const impact = MathUtils.clamp(input.impact, 0, 1);
  const dizzy = MathUtils.clamp(input.dizzy, 0, 1);
  const recovering = MathUtils.clamp(input.recovering, 0, 1);
  const celebration = MathUtils.clamp(input.celebration, 0, 1);
  const finalExpression = input.finalExpression;
  if (finalExpression === "winner") return { pupilLateral: 0, pupilVertical: 0.003, eyeOpen: 0.7, eyeWide: 1.12, browTilt: -0.32, browLift: 0.008, mouthOpen: 0.92, mouthWide: 1.2, xEyes: false };
  if (finalExpression === "loser") return { pupilLateral: 0, pupilVertical: 0, eyeOpen: 0.8, eyeWide: 1, browTilt: 0.12, browLift: -0.01, mouthOpen: 0.46, mouthWide: 0.78, xEyes: true };
  if (finalExpression === "draw") return { pupilLateral: 0, pupilVertical: -0.005, eyeOpen: 0.42, eyeWide: 1, browTilt: -0.1, browLift: -0.004, mouthOpen: 0.64, mouthWide: 0.9, xEyes: false };

  let pupilLateral = this.offset.x;
  let pupilVertical = this.offset.y;
  if (dizzy > 0) {
   pupilLateral += Math.cos(this.dizzyTime * 7) * MAX_PUPIL_OFFSET * 0.48 * dizzy;
   pupilVertical += Math.sin(this.dizzyTime * 7) * MAX_PUPIL_OFFSET * 0.48 * dizzy;
  }
  const pupilRadius = Math.hypot(pupilLateral, pupilVertical);
  if (pupilRadius > MAX_PUPIL_OFFSET) {
   pupilLateral = (pupilLateral / pupilRadius) * MAX_PUPIL_OFFSET;
   pupilVertical = (pupilVertical / pupilRadius) * MAX_PUPIL_OFFSET;
  }

  const blink = this.blinkRemaining > 0 ? 1 : 0;
  const idleGate = Math.max(0, 1 - Math.max(focus, impact, dizzy, recovering, celebration));
  const browWander = Math.sin(this.idleTime * 2.3 + this.randomSeed * TAU) * idleGate;
  const mouthWander = Math.sin(this.idleTime * 1.55 + this.randomSeed * 4.1) * idleGate;
  const closed = Math.max(blink, impact * 0.35, dizzy * 0.48, recovering * 0.18);
  return {
   pupilLateral,
   pupilVertical,
   eyeOpen: Math.max(0.08, 1 - closed),
   eyeWide: 1 + focus * 0.1 + impact * 0.18 + dizzy * 0.1 + celebration * 0.08,
   browTilt: browWander * 0.09 + focus * 0.25 + impact * 0.12 - dizzy * 0.22 - celebration * 0.22,
   browLift: browWander * 0.006 + focus * 0.004 - dizzy * 0.007 + celebration * 0.007,
   mouthOpen: Math.max(0.42, 0.72 + mouthWander * 0.12 + impact * 0.36 + dizzy * 0.18 + recovering * 0.12 + celebration * 0.32),
   mouthWide: 1 - mouthWander * 0.1 + focus * 0.05 - dizzy * 0.14 + celebration * 0.16,
   xEyes: false,
  };
 }

 private nextBlinkDelay(): number {
  return 1.8 + this.random() * 2.9;
 }

 private random(): number {
  this.randomSeed = (this.randomSeed * 9301 + 49297) % 233280;
  return this.randomSeed / 233280;
 }
}
