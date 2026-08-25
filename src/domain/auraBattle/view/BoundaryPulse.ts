/**
 * Presentation-only, single-slot state for the stage's visible "force field" catch — the same
 * imperative-pool shape as `SparkPool`, just holding one active pulse instead of many particles, and
 * ticked down by its own `update(dt)` the same way `SparkPool` ages out particles. Nothing here is
 * read back by the simulation; it exists purely so `BoundaryRing` has something to animate toward.
 */
export const BOUNDARY_PULSE_LIFETIME = .45;
export class BoundaryPulse {
 private x = 0;
 private z = 0;
 private remaining = 0;
 trigger(x: number, z: number): void { this.x = x; this.z = z; this.remaining = BOUNDARY_PULSE_LIFETIME; }
 update(dt: number): void { if (this.remaining > 0) this.remaining = Math.max(0, this.remaining - dt); }
 get active(): boolean { return this.remaining > 0; }
 /** 0 at the moment of the catch, 1 once the pulse has fully faded. */
 get progress(): number { return 1 - this.remaining / BOUNDARY_PULSE_LIFETIME; }
 position(): [number, number] { return [this.x, this.z]; }
 clear(): void { this.remaining = 0; }
}
