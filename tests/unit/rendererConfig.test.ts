import { describe, expect, it, vi } from "vitest";
import * as THREE from "three";
import { configureRenderer, WEBGL_CONTEXT_ATTRIBUTES } from "@/app/canvas/rendererConfig";
describe("renderer configuration", () => {
 it("locks the neutral Fight3D color contract", () => {
  const setClearColor = vi.fn();
  const renderer: Pick<THREE.WebGLRenderer, "outputColorSpace" | "toneMapping" | "toneMappingExposure" | "setClearColor"> = { outputColorSpace: THREE.LinearSRGBColorSpace, toneMapping: THREE.LinearToneMapping, toneMappingExposure: 0, setClearColor };
  configureRenderer(renderer);
  expect(renderer.outputColorSpace).toBe(THREE.SRGBColorSpace);
  expect(renderer.toneMapping).toBe(THREE.NoToneMapping);
  expect(renderer.toneMappingExposure).toBe(1);
  expect(setClearColor).toHaveBeenCalledWith("#070a12", 1);
  expect(WEBGL_CONTEXT_ATTRIBUTES).toMatchObject({ alpha: false, antialias: true, powerPreference: "high-performance" });
 });
});
