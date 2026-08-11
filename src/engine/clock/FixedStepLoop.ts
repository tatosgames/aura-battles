export interface SimulationHost { fixedUpdate(dt: number): void; presentationUpdate(alpha: number, realDt: number): void; onError?(error: unknown): void; onVisibilityChange?(suspended: boolean): void; }
export class FixedStepLoop {
  readonly step: number; private accumulator=0; private lastTime=0; private frameId=0; private running=false; private paused=false;
  constructor(private readonly host: SimulationHost, hz=60, private readonly maxSubSteps=5) { if (!Number.isFinite(hz)||hz<=0) throw new Error("Fixed-step rate must be positive"); this.step=1/hz; }
  start(): void { if(this.running)return; this.running=true; this.lastTime=performance.now(); document.addEventListener("visibilitychange",this.onVisibility); this.frameId=requestAnimationFrame(this.frame); }
  stop(): void { this.running=false; cancelAnimationFrame(this.frameId); document.removeEventListener("visibilitychange",this.onVisibility); this.accumulator=0; }
  setPaused(paused: boolean): void { this.paused=paused; this.accumulator=0; this.lastTime=performance.now(); }
  isPaused(): boolean { return this.paused; }
  tick(now=performance.now()): number { const realDt=Math.min(Math.max((now-this.lastTime)/1000,0),this.step*this.maxSubSteps); this.lastTime=now; if(!this.paused){ this.accumulator+=realDt; let count=0; while(this.accumulator>=this.step&&count++<this.maxSubSteps){this.host.fixedUpdate(this.step);this.accumulator-=this.step;} } const alpha=this.accumulator/this.step; this.host.presentationUpdate(alpha,realDt); return alpha; }
  private readonly frame=():void=>{if(!this.running)return;try{this.tick();this.frameId=requestAnimationFrame(this.frame);}catch(error){this.stop();this.host.onError?.(error);}};
  private readonly onVisibility=():void=>{const hidden=document.hidden; this.host.onVisibilityChange?.(hidden); if(!hidden){this.accumulator=0;this.lastTime=performance.now();}};
}
