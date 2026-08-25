import { describe, expect, it, vi } from "vitest";
import { bindWebGLContextLifecycle } from "@/app/canvas/webglContextLifecycle";
describe("WebGL context lifecycle", () => {
 it("pauses for a lost context and resumes only when the browser restores it", () => {
  const canvas = document.createElement("canvas"), lost = vi.fn(), restored = vi.fn();
  const cleanup = bindWebGLContextLifecycle(canvas, { onLost: lost, onRestored: restored, onCreationError: vi.fn(), onRecoveryFailed: vi.fn() });
  const event = new globalThis.Event("webglcontextlost", { cancelable: true }); canvas.dispatchEvent(event);
  expect(event.defaultPrevented).toBe(true); expect(lost).toHaveBeenCalledOnce(); canvas.dispatchEvent(new globalThis.Event("webglcontextrestored")); expect(restored).toHaveBeenCalledOnce(); cleanup();
 });
 it("reports a context that never returns", () => {
  vi.useFakeTimers(); const canvas = document.createElement("canvas"), failed = vi.fn();
  const cleanup = bindWebGLContextLifecycle(canvas, { onLost: vi.fn(), onRestored: vi.fn(), onCreationError: vi.fn(), onRecoveryFailed: failed, recoveryTimeoutMs: 10 });
  canvas.dispatchEvent(new globalThis.Event("webglcontextlost", { cancelable: true })); vi.advanceTimersByTime(10); expect(failed).toHaveBeenCalledOnce(); cleanup(); vi.useRealTimers();
 });
 it("reports renderer creation errors without starting recovery", () => {
  const canvas = document.createElement("canvas"), failed = vi.fn();
  const cleanup = bindWebGLContextLifecycle(canvas, { onLost: vi.fn(), onRestored: vi.fn(), onCreationError: failed, onRecoveryFailed: vi.fn() });
  canvas.dispatchEvent(new globalThis.Event("webglcontextcreationerror"));
  expect(failed).toHaveBeenCalledWith("unknown");
  cleanup();
 });
});
