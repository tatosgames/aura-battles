export interface AudioAdapter { play(kind: "click" | "impact"): void; }
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
export const createLocalPlatform = (): PlatformAdapter => ({ audio: { play(kind) { try { const Context = globalThis.AudioContext; if (!Context) return; const context = new Context(); const oscillator = context.createOscillator(); const gain = context.createGain(); oscillator.frequency.value = kind === "click" ? 420 : 180; gain.gain.value = .04; oscillator.connect(gain).connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + .06); } catch { /* Audio is optional. */ } } }, analytics: { track() { /* No network by default. */ } }, vendor: {} });
