---
name: threejs-rapier-template
description: Build or extend this template's Three.js/R3F presentation and deterministic Rapier simulation without crossing engine boundaries.
---

# Three.js + Rapier template guidance

Use `PhysicsRuntime` as the sole owner of Rapier's world and event queue. Drive it only from `FixedStepLoop.fixedUpdate`; copy contact data immediately into plain serializable notices. Do not store Rapier references in React state, bridge snapshots, events, or public actions.

R3F belongs in `src/app/canvas` or a domain presentation layer. It reads serializable body snapshots after the fixed step. Probe WebGL before mounting `Canvas`, handle context recovery at the shell boundary, and dispose Three.js debug geometry/material when its owner ends.

Pointer interaction belongs in `InputRouter`: retain capture through move/up/cancel, translate DOM data into a typed semantic command, and let the simulation validate the selected body and apply its impulse on a fixed update. Do not make a mesh mutation authoritative.

For new dynamic bodies, use a JSON-validated configuration, `CollisionLayerRegistry` masks, and `ArticulatedBodyFactory` with arbitrary string part IDs. Keep physics and gameplay terms domain-neutral in `src/engine`; a new game lives outside the demo and must not import it.

Before delivery run `npm run lint`, `npm run build`, `npm run test`, and `npm run test:browser`.
