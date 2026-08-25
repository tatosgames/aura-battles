export type WebGLContextKind = "webgl2" | "webgl";
export type WebGLProbeResult = { available: true; kind: WebGLContextKind } | { available: false; reason: "no-context" | "probe-error" };
type CanvasProbe = Pick<HTMLCanvasElement, "getContext">;
type WebGLProbeDocument = { createElement(tagName: "canvas"): CanvasProbe };
export type WebGLContextAttributes = { alpha?: boolean; antialias?: boolean; powerPreference?: "default" | "high-performance" | "low-power" };
/** Probe before R3F creates its asynchronous renderer so unsupported devices get a usable DOM fallback. */
export function probeWebGLContext(documentRef: WebGLProbeDocument = document, attributes?: WebGLContextAttributes): WebGLProbeResult {
 try { const canvas = documentRef.createElement("canvas"); if (canvas.getContext("webgl2", attributes) !== null) return { available: true, kind: "webgl2" }; if (canvas.getContext("webgl", attributes) !== null) return { available: true, kind: "webgl" }; return { available: false, reason: "no-context" }; } catch { return { available: false, reason: "probe-error" }; }
}
export function canCreateWebGLContext(documentRef: WebGLProbeDocument = document, attributes?: WebGLContextAttributes): boolean { return probeWebGLContext(documentRef, attributes).available; }
