import { Vector3, type PerspectiveCamera } from "three";
import { FIGHTER_FLOATS } from "../sim/RagdollController";
export type ShotId = "DUEL" | "FOCUS" | "COUNTER_SNAP" | "IMPACT" | "SLOWMO_ORBIT" | "FINAL" | "REVERSAL" | "WIN";
/**
 * `bias` slides the anchor from the midpoint of the duel (0) toward the shot's subject (1).
 * No shot goes all the way: the player must always be able to see who is answering whom.
 */
type Shot = { offset: [number, number, number]; look: [number, number, number]; fov: number; bias: number; ease: number };
const SHOTS: Record<ShotId, Shot> = {
 DUEL: { offset: [0, 3.4, 9.8], look: [0, 1.5, 0], fov: 44, bias: 0, ease: 1.6 },
 FOCUS: { offset: [1.6, 2.4, 7.4], look: [0, 1.35, 0], fov: 40, bias: .55, ease: 2.6 },
 COUNTER_SNAP: { offset: [1.4, 2.0, 7.6], look: [0, 1.4, 0], fov: 42, bias: .35, ease: 13 },
 IMPACT: { offset: [1.2, 2.1, 6.4], look: [0, 1.2, 0], fov: 37, bias: .7, ease: 9 },
 SLOWMO_ORBIT: { offset: [3.4, 2.2, 6.4], look: [0, 1.4, 0], fov: 38, bias: .25, ease: 1.1 },
 FINAL: { offset: [2.4, 1.9, 8.4], look: [0, 1.6, 0], fov: 47, bias: .45, ease: 1.3 },
 REVERSAL: { offset: [1.5, 1.1, 5.8], look: [0, 1.5, 0], fov: 38, bias: .7, ease: 12 },
 WIN: { offset: [0, 2.6, 7.4], look: [0, 1.4, 0], fov: 43, bias: .3, ease: 2 },
};
const scratch = new Vector3();
const DEG = Math.PI / 180;
/** The desktop framing this shot table was tuned against; narrower aspects widen from here. */
const REFERENCE_ASPECT = 16 / 9;
const MAX_DUEL_VERTICAL_FOV = 70;
const MAX_ACTION_VERTICAL_FOV = 54;
/**
 * A shot's `fov` is a vertical field of view tuned for `REFERENCE_ASPECT`. On a narrower (portrait)
 * screen, keeping that vertical FOV crops the horizontal frame sharply — exactly where the two
 * fighters stand offset left/right. Widen the vertical FOV just enough to hold the same horizontal
 * FOV instead, so neither fighter falls out of frame on a phone held vertically.
 */
const aspectAwareFov = (verticalFov: number, aspect: number, preserveDuelWidth: boolean): number => {
 if (aspect >= REFERENCE_ASPECT) return verticalFov;
 const horizontalAtReference = 2 * Math.atan(Math.tan((verticalFov * DEG) / 2) * REFERENCE_ASPECT);
 const widened = (2 * Math.atan(Math.tan(horizontalAtReference / 2) / aspect)) / DEG;
 return Math.min(preserveDuelWidth ? MAX_DUEL_VERTICAL_FOV : MAX_ACTION_VERTICAL_FOV, widened);
};
export class CameraDirector {
 private shot: ShotId = "DUEL"; private subject: 0 | 1 = 0; private shakeAmount = 0; private orbit = 0;
 // `punch` is a second, faster-decaying channel: it drives the zoom-in hit and the directional shove,
 // while the slower `shakeAmount` keeps driving the rattly positional jitter and the roll wobble.
 private punch = 0;
 private readonly position = new Vector3(0, 3.4, 9.8); private readonly target = new Vector3(0, 1.5, 0); private fov = 44;
 set(shot: ShotId, subject: 0 | 1 = this.subject): void { this.shot = shot; this.subject = subject; }
 shake(amount: number): void { this.shakeAmount = Math.min(1.2, this.shakeAmount + amount); this.punch = Math.min(1, this.punch + amount * .8); }
 reset(): void { this.shot = "DUEL"; this.shakeAmount = 0; this.punch = 0; this.orbit = 0; }
 update(dt: number, camera: PerspectiveCamera, transforms: Float32Array, elapsed: number): void {
  const shot = SHOTS[this.shot];
  const base = this.subject * FIGHTER_FLOATS, other = (1 - this.subject) * FIGHTER_FLOATS;
  const subjectX = transforms[base], subjectY = transforms[base + 1], subjectZ = transforms[base + 2];
  const midX = (subjectX + transforms[other]) / 2, midZ = (subjectZ + transforms[other + 2]) / 2;
  const anchorX = midX + (subjectX - midX) * shot.bias;
  const anchorZ = midZ + (subjectZ - midZ) * shot.bias;
  const anchorY = 1.1 + (Math.max(.6, subjectY) - 1.1) * shot.bias;
  // Stand in front of the current subject: action shots must sell their facial reaction.
  const sign = this.subject === 0 ? 1 : -1;
  this.orbit = this.shot === "SLOWMO_ORBIT" ? this.orbit + dt * .55 : this.orbit * .94;
  const swing = Math.sin(this.orbit) * 2.2;
  const ease = Math.min(1, shot.ease * dt);
  this.position.lerp(scratch.set(anchorX + shot.offset[0] * sign + swing, anchorY + shot.offset[1], anchorZ + shot.offset[2] - Math.abs(swing) * .35), ease);
  this.target.lerp(scratch.set(anchorX + shot.look[0], anchorY * .5 + shot.look[1], anchorZ + shot.look[2]), Math.min(1, shot.ease * 1.4 * dt));
  this.fov += (aspectAwareFov(shot.fov, camera.aspect || REFERENCE_ASPECT, this.shot === "DUEL") - this.fov) * ease;
  this.shakeAmount = Math.max(0, this.shakeAmount - dt * 2.2);
  this.punch = Math.max(0, this.punch - dt * 4.5);
  const jitter = this.shakeAmount * this.shakeAmount * .55;
  // A quick shove along the duel axis on top of the rattle — the camera reacting to the hit too.
  const kick = this.punch * sign * 1.4;
  camera.position.set(
   this.position.x + Math.sin(elapsed * 57) * jitter + kick,
   this.position.y + Math.sin(elapsed * 71) * jitter,
   this.position.z + Math.sin(elapsed * 43) * jitter,
  );
  camera.lookAt(this.target);
  // Dutch tilt: a roll kick riding the same rattle, applied after aim so it doesn't fight lookAt.
  camera.rotateZ(Math.sin(elapsed * 31) * this.shakeAmount * this.shakeAmount * .14);
  // Punch-in zoom: briefly tighten the FOV on a hard hit, independent of the shot's own eased FOV.
  const renderedFov = Math.max(18, this.fov - this.punch * this.punch * 7);
  if (Math.abs(camera.fov - renderedFov) > .01) { camera.fov = renderedFov; camera.updateProjectionMatrix(); }
 }
}
