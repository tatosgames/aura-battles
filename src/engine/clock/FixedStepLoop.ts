export interface SimulationHost { fixedUpdate(dt: number): void; presentationUpdate(alpha: number, realDt: number): void; onError?(error: unknown): void; onVisibilityChange?(suspended: boolean): void; }
/** Fixed-step accumulator driven by an external presentation clock, normally R3F's `useFrame`. */
export class FixedStepLoop {
 readonly step: number; private accumulator = 0; private lastTime: number | undefined; private paused = false;
 constructor(private readonly host: SimulationHost, hz = 60, private readonly maxSubSteps = 5) { if (!Number.isFinite(hz) || hz <= 0) throw new Error("Fixed-step rate must be positive"); this.step = 1 / hz; }
 reset(): void { this.accumulator = 0; this.lastTime = undefined; }
 setPaused(paused: boolean): void { this.paused = paused; this.reset(); }
 isPaused(): boolean { return this.paused; }
 handleVisibilityChange(hidden: boolean): void { this.host.onVisibilityChange?.(hidden); this.reset(); }
 tick(now: number): number {
  if (!Number.isFinite(now)) return 0;
  if (this.lastTime === undefined) { this.lastTime = now; this.host.presentationUpdate(0, 0); return 0; }
  try { const realDt = Math.min(Math.max((now - this.lastTime) / 1000, 0), this.step * this.maxSubSteps); this.lastTime = now; if (!this.paused) { this.accumulator += realDt; let count = 0; while (this.accumulator >= this.step && count++ < this.maxSubSteps) { this.host.fixedUpdate(this.step); this.accumulator -= this.step; } } const alpha = this.accumulator / this.step; this.host.presentationUpdate(alpha, realDt); return alpha; } catch (error) { this.setPaused(true); this.host.onError?.(error); return 0; }
 }
}
