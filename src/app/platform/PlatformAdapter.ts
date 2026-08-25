export type AudioCue = "click" | "impact" | "counter" | "aura" | "fail" | "final" | "crowd";
export interface AudioAdapter { play(kind: AudioCue): void; }
export interface VendorAdapter { init?(): Promise<void> | void; loadingFinished?(): Promise<void> | void; gameplayStart?(): Promise<void> | void; gameplayStop?(): Promise<void> | void; setPaused?(paused: boolean): Promise<void> | void; measure?(category: string, action: string): Promise<void> | void; }
export interface PlatformAdapter { audio: AudioAdapter; analytics: { track(name: string): void }; vendor: VendorAdapter; }
export class VendorLifecycle {
  private initialized = false; private loadingReported = false; private gameplayActive = false; private playerInteracted = false;
  constructor(private readonly vendor: VendorAdapter = {}) {}
  async init(): Promise<void> { if (this.initialized) return; this.initialized = true; await this.safely(() => this.vendor.init?.()); }
  async loadingFinished(): Promise<void> { if (this.loadingReported) return; this.loadingReported = true; await this.safely(() => this.vendor.loadingFinished?.()); }
  playerInteraction(): void { this.playerInteracted = true; void this.startGameplay(); }
  async startGameplay(): Promise<void> { if (!this.playerInteracted || this.gameplayActive) return; this.gameplayActive = true; await this.safely(() => this.vendor.gameplayStart?.()); }
  async stopGameplay(): Promise<void> { if (!this.gameplayActive) return; this.gameplayActive = false; await this.safely(() => this.vendor.gameplayStop?.()); }
  async setPaused(paused: boolean): Promise<void> { await this.safely(() => this.vendor.setPaused?.(paused)); }
  private async safely(operation: () => Promise<void> | void): Promise<void> { try { await operation(); } catch { /* Optional vendor failures never break local play. */ } }
}
export const createLocalPlatform = (): PlatformAdapter => ({ audio: { play(kind) { try { const Context = globalThis.AudioContext; if (!Context) return; const context = new Context(); const oscillator = context.createOscillator(); const gain = context.createGain(); const TONES: Record<AudioCue, [number, number, OscillatorType]> = { click: [420, .06, "square"], impact: [140, .16, "sawtooth"], counter: [660, .1, "square"], aura: [880, .14, "triangle"], fail: [95, .3, "sawtooth"], final: [1180, .3, "triangle"], crowd: [240, .22, "triangle"] };
      const [frequency, length, shape] = TONES[kind] ?? TONES.click;
      oscillator.type = shape;
      oscillator.frequency.value = frequency; gain.gain.value = .05; oscillator.connect(gain).connect(context.destination); oscillator.start(); gain.gain.exponentialRampToValueAtTime(.0001, context.currentTime + length);
      oscillator.stop(context.currentTime + length); } catch { /* Audio is optional. */ } } }, analytics: { track() { /* No network by default. */ } }, vendor: {} });
