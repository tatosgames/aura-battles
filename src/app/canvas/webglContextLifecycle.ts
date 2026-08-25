/* global Event */
export interface WebGLContextLifecycleOptions {
 onLost(statusMessage: string): void;
 onRestored(): void;
 onCreationError(statusMessage: string): void;
 onRecoveryFailed(statusMessage: string, durationMs: number): void;
 recoveryTimeoutMs?: number;
}
/** Owns browser context events only; gameplay and the fixed loop stay with the app shell. */
export function bindWebGLContextLifecycle(canvas: HTMLCanvasElement, options: WebGLContextLifecycleOptions): () => void {
 const recoveryTimeoutMs = options.recoveryTimeoutMs ?? 5_000;
 let disposed = false, lostAt = 0, statusMessage = "unknown", recoveryTimer: number | undefined;
 function clearRecoveryTimer(): void { if (recoveryTimer !== undefined) { window.clearTimeout(recoveryTimer); recoveryTimer = undefined; } }
 function onContextLost(event: Event): void { event.preventDefault(); if (disposed || lostAt !== 0) return; lostAt = performance.now(); statusMessage = (event as Event & { statusMessage?: string }).statusMessage || "unknown"; options.onLost(statusMessage); recoveryTimer = window.setTimeout(() => { recoveryTimer = undefined; if (!disposed && lostAt !== 0) options.onRecoveryFailed(statusMessage, Math.round(performance.now() - lostAt)); }, recoveryTimeoutMs); }
 function onContextRestored(): void { if (disposed || lostAt === 0) return; lostAt = 0; clearRecoveryTimer(); options.onRestored(); }
 function onContextCreationError(event: Event): void { if (!disposed) options.onCreationError((event as Event & { statusMessage?: string }).statusMessage || "unknown"); }
 canvas.addEventListener("webglcontextlost", onContextLost); canvas.addEventListener("contextlost", onContextLost);
 canvas.addEventListener("webglcontextrestored", onContextRestored); canvas.addEventListener("contextrestored", onContextRestored); canvas.addEventListener("webglcontextcreationerror", onContextCreationError);
 return () => { disposed = true; clearRecoveryTimer(); canvas.removeEventListener("webglcontextlost", onContextLost); canvas.removeEventListener("contextlost", onContextLost); canvas.removeEventListener("webglcontextrestored", onContextRestored); canvas.removeEventListener("contextrestored", onContextRestored); canvas.removeEventListener("webglcontextcreationerror", onContextCreationError); };
}
