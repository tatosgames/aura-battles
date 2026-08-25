import * as THREE from "three";
export const WEBGL_CONTEXT_ATTRIBUTES = { alpha: false, antialias: true, powerPreference: "high-performance" as const };
export function configureRenderer(renderer: Pick<THREE.WebGLRenderer, "outputColorSpace" | "toneMapping" | "toneMappingExposure" | "setClearColor">): void { renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NoToneMapping; renderer.toneMappingExposure = 1; renderer.setClearColor("#070a12", 1); }
