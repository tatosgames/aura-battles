import react from "@vitejs/plugin-react";
import wasm from "vite-plugin-wasm";
import { defineConfig } from "vitest/config";
export default defineConfig({ plugins: [react(), wasm()], resolve: { alias: { "@": "/src" } }, build: { target: "esnext" }, optimizeDeps: { exclude: ["@dimforge/rapier3d-deterministic"] }, test: { environment: "happy-dom", include: ["tests/unit/**/*.test.ts"] } });
