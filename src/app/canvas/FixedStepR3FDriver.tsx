import { useFrame } from "@react-three/fiber";
import { useEffect } from "react";
import type { FixedStepLoop } from "@/engine/clock/FixedStepLoop";
/** Gives R3F ownership of the simulation/render frame while preserving the fixed simulation accumulator. */
export function FixedStepR3FDriver({ loop }: { loop: FixedStepLoop }) {
 useEffect(function bindVisibility() { function syncVisibility(): void { loop.handleVisibilityChange(document.hidden); } syncVisibility(); document.addEventListener("visibilitychange", syncVisibility); return function unbindVisibility() { document.removeEventListener("visibilitychange", syncVisibility); }; }, [loop]);
 useFrame((state) => { loop.tick(state.clock.elapsedTime * 1_000); }, -100);
 return null;
}
