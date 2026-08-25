import { describe, expect, it, vi } from "vitest";
import { GameBridge } from "@/app/bridge/GameBridge";
import { FixedStepLoop } from "@/engine/clock/FixedStepLoop";
import { validateSandboxConfig } from "@/engine/config/runtimeConfig";
import { TypedEventBus } from "@/engine/events/TypedEventBus";
import { CollisionLayerRegistry } from "@/engine/physics/CollisionLayerRegistry";
import { loadRapier, setRapierLoaderForTests } from "@/engine/physics/rapierRuntime";
describe("engine primitives", () => {
 it("caps externally driven fixed substeps and resets the clock across pauses", () => {
  const fixed = vi.fn(), presentation = vi.fn();
  const loop = new FixedStepLoop({ fixedUpdate: fixed, presentationUpdate: presentation }, 60, 2);
  loop.tick(0); loop.tick(1_000); expect(fixed).toHaveBeenCalledTimes(2);
  loop.setPaused(true); loop.tick(2_000); expect(fixed).toHaveBeenCalledTimes(2);
  loop.setPaused(false); loop.tick(3_000); expect(fixed).toHaveBeenCalledTimes(2);
  loop.tick(3_017); expect(fixed).toHaveBeenCalledTimes(3); expect(presentation).toHaveBeenCalled();
 });
 it("unsubscribes typed events", () => { const bus = new TypedEventBus<{ notice: { value: number } }>(), fn = vi.fn(); bus.on("notice", fn)(); bus.emit("notice", { value: 1 }); expect(fn).not.toHaveBeenCalled(); });
 it("makes collision masks from neutral names", () => { const layers = new CollisionLayerRegistry(["static", "dynamic"]); expect(layers.group(["dynamic"], ["static"])).toBeGreaterThan(0); expect(() => layers.mask("bad")).toThrow(); });
 it("validates sandbox configuration", () => { expect(() => validateSandboxConfig({ gravity: [0, 0], spawn: [0, 0, 0], impulseCap: 1, layers: ["a"] })).toThrow(); });
 it("freezes revisioned bridge snapshots", () => { const bridge = new GameBridge({ revision: 0, value: "a" }, { go: () => {} }); bridge.publish((revision) => ({ revision, value: "b" })); expect(bridge.getSnapshot()).toEqual({ revision: 1, value: "b" }); expect(Object.isFrozen(bridge.getSnapshot())).toBe(true); });
 it("retries Rapier loading after a failure", async () => { let tries = 0; setRapierLoaderForTests(async () => { if (++tries === 1) throw new Error("transient"); return {} as never; }); await expect(loadRapier()).rejects.toThrow("transient"); await expect(loadRapier()).resolves.toBeDefined(); setRapierLoaderForTests(); });
});
