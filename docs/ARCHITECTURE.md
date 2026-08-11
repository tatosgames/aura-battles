# Architecture

The runtime flow is **pointer input → validated semantic command → fixed simulation → immutable serializable snapshot → R3F presentation**. `src/engine` owns no React, Three.js view, game rules, or browser portal behaviour. `src/app` owns browser and framework integration; `src/demo` is one consumer of public engine contracts.

`PhysicsRuntime` owns the Rapier world and event queue. It drains contact events once per step, immediately copies scalar handles/force into a plain notice, then fans it out in subscription order. No Rapier event, collider, body, manifold, or world crosses an engine public boundary into React.

`FixedStepLoop` owns accumulator, pause, visibility suspension, start/stop and error containment. The simulation writes serializable state after fixed updates. `GameBridge` publishes frozen revisioned snapshots; React reads only those snapshots and invokes restricted actions.

Disposal proceeds in reverse ownership order: stop the loop/listeners, remove demo dynamic bodies, dispose debug geometry/material, free Rapier queue/world, then unmount React/R3F. The WebGL shell probes support before mounting and provides a text fallback when unavailable.
