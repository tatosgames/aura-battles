# Three.js physics integration

Rapier is the simulation authority; Three.js is presentation. `PhysicsRuntime` owns the `World` and the event queue. It advances only through `FixedStepLoop.fixedUpdate(dt)` at a configured fixed rate. Rendering never steps Rapier, and physics never reads a React component.

After each step, copy body translations/rotations and contact notices into plain values. Rapier bodies, colliders, event-queue objects, contact manifolds, and callbacks are temporary implementation details and must not enter React state, `GameBridge`, events, or public APIs.

Create collision groups with `CollisionLayerRegistry`, preserve named layers in validated JSON, and keep body construction/removal in `ArticulatedBodyFactory`. For interactions, DOM/R3F pointer data becomes a typed command, the controller validates it, and the impulse is applied during a fixed update. Never use visual mesh position as authoritative state.

Rapier contact queues have one primary drain. `PhysicsRuntime.drainContacts()` copies a neutral notice then fans out observers in registration order. Dispose in reverse ownership order: listeners and loop, dynamic bodies, Three debug lines, Rapier event queue/world.
