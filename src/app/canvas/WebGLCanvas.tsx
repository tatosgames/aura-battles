import { Canvas } from "@react-three/fiber";
import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type * as THREE from "three";
import type { FixedStepLoop } from "@/engine/clock/FixedStepLoop";
import { FixedStepR3FDriver } from "./FixedStepR3FDriver";
import { configureRenderer, WEBGL_CONTEXT_ATTRIBUTES } from "./rendererConfig";
import { bindWebGLContextLifecycle } from "./webglContextLifecycle";
import { probeWebGLContext } from "./webglSupport";
type RecoveryStatus = "ready" | "recovering" | "failed";
export type WebGLCanvasProps = { children: ReactNode; loop: FixedStepLoop; onContextLost?: () => void; onContextRestored?: () => void; };
class CanvasBoundary extends Component<{ children: ReactNode; onFailure(): void }, { failed: boolean }> {
 state = { failed: false };
 static getDerivedStateFromError(): { failed: true } { return { failed: true }; }
 componentDidCatch(): void { this.props.onFailure(); }
 render(): ReactNode { return this.state.failed ? <div role="status" className="webgl-status">The 3D renderer could not start. Reload to continue the match.</div> : this.props.children; }
}
export function WebGLCanvas({ children, loop, onContextLost, onContextRestored }: WebGLCanvasProps) {
 const [probe] = useState(() => probeWebGLContext(document, WEBGL_CONTEXT_ATTRIBUTES));
 const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
 const [status, setStatus] = useState<RecoveryStatus>("ready");
 const renderer = useRef<THREE.WebGLRenderer | null>(null);
 const fail = useCallback(() => { setStatus("failed"); onContextLost?.(); }, [onContextLost]);
 const handleCreated = useCallback(({ gl }: { gl: THREE.WebGLRenderer }) => { renderer.current = gl; configureRenderer(gl); gl.domElement.dataset.testid = "game-renderer"; setCanvas(gl.domElement); }, []);
 useEffect(function bindContextLifecycle() {
  if (!canvas) return;
  return bindWebGLContextLifecycle(canvas, { onLost: () => { setStatus("recovering"); onContextLost?.(); }, onRestored: () => { if (renderer.current) configureRenderer(renderer.current); setStatus("ready"); onContextRestored?.(); }, onCreationError: fail, onRecoveryFailed: fail });
 }, [canvas, fail, onContextLost, onContextRestored]);
 if (!probe.available || status === "failed") return <div role="status" className="webgl-status">{status === "failed" ? "The 3D renderer stopped responding. Reload to continue the match." : "WebGL is unavailable; the game controls remain available."}</div>;
 return <CanvasBoundary onFailure={fail}><><Canvas shadows dpr={[1, 1.5]} gl={WEBGL_CONTEXT_ATTRIBUTES} camera={{ position: [12, 9, 12], fov: 45 }} onCreated={handleCreated}><FixedStepR3FDriver loop={loop}/>{children}</Canvas>{status === "recovering" ? <div role="status" className="webgl-status">Restoring the 3D arena…</div> : null}</></CanvasBoundary>;
}
