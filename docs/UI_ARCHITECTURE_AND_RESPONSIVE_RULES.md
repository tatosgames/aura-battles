# UI architecture and responsive rules

`aura-battles` uses React/DOM for application controls and HUD, React Three
Fiber for world presentation, and the engine for deterministic simulation.
There is one authoritative gameplay path:

```text
DOM/R3F input -> InputRouter -> fixed simulation -> serializable snapshot
              -> GameBridge -> React HUD and R3F presentation
```

React components, meshes, camera effects, and audio are projections. They must
not become a second gameplay authority or inspect Rapier objects directly.

## Ownership boundaries

| Surface | Owner | Rule |
| --- | --- | --- |
| Application shell and lifecycle | `src/app/App.tsx` | Boot, platform lifecycle, loop ownership, and teardown |
| DOM controls and HUD | React components in `src/app` or the domain UI layer | Read snapshots and dispatch restricted actions |
| Canvas and WebGL fallback | `src/app/canvas/WebGLCanvas.tsx` | Probe WebGL, mount R3F, handle renderer boundary concerns |
| World presentation | `src/domain/*/view` and R3F scene components | Render authoritative snapshots; never mutate gameplay state |
| Domain simulation | `src/domain/*/sim` | Own game rules and bridge-ready serializable state |
| Engine | `src/engine` | Fixed stepping, Rapier ownership, typed events, input routing, and generic contracts |
| Cross-surface state | `src/app/bridge/GameBridge.ts` | Publish frozen revisioned snapshots and expose restricted actions |

`src/engine` must not depend on React, Three.js view code, or vendor APIs.
`src/domain` may use public engine contracts but must keep game rules outside
`src/demo`. `GameBridge` may contain plain serializable state only: no Rapier
worlds, bodies, colliders, manifolds, event queues, or callbacks.

## UI layers

During active play, keep three layers:

1. **Persistent:** only the compact status required to understand the current
   objective, simulation state, and available controls.
2. **Contextual:** transient telegraphs, contact notices, warnings, and feedback
   placed near their cause and removed when no longer useful.
3. **Blocking:** settings, help, pause, results, or onboarding; only one
   blocking surface should accept input at a time.

Keep the arena centre and lower playfield clear. Every new surface must answer
which immediate decision it enables, when it appears/disappears, and which
existing signal it replaces or simplifies. Subtract or merge before adding a
new card, popup, or status row.

## Input and transitions

Route pointer/touch input through `InputRouter`. Preserve pointer capture across
move/up/cancel, translate DOM data into typed semantic commands, and validate
commands in the simulation before applying impulses or changing state. Do not
make a mesh mutation authoritative.

Treat transitions as presentation state machines:

```text
enter -> active -> resolve -> exit
```

Record the authoritative result in the simulation first, then animate from the
next serializable snapshot. Transitions must tolerate cancellation, reset,
visibility suspension, WebGL context loss, and navigation. Clean up timers,
subscriptions, audio, animation frames, and temporary scene effects on exit.

Use visible focus, pressed, disabled, and unavailable states. Important state
must not be communicated by colour alone. Text should confirm a consequence or
teach a necessary action, not repeat an object or interaction already visible
in the playfield.

## R3F and renderer rules

- Mount `WebGLCanvas` only after `canCreateWebGLContext()` succeeds.
- Keep camera rigs, controls, and scene presentation isolated from simulation
  systems.
- For high-frequency transforms, mutate Three.js references from immutable
  snapshots or a small presentation store instead of broad React state updates.
- Coordinate camera controls with pointer gestures so controls cannot steal or
  reinterpret gameplay input.
- Dispose owner-created geometries, materials, render targets, debug helpers,
  listeners, and effects when their scene or renderer owner ends.
- Provide a DOM fallback when WebGL is unavailable; core controls and status
  should remain understandable.

## Responsive rules

- Design touch targets at least 48 CSS pixels.
- Validate HUD, controls, status, and canvas at narrow portrait and landscape
  viewports, not only desktop dimensions.
- Preserve the same semantic ordering and player/object identity across
  orientations; do not rely on position or colour alone.
- Respect safe areas and avoid invisible overlays that intercept input.
- Remove secondary keyboard copy before shrinking the primary icon or control.
- Keep the primary action and important feedback visible during resize and
  viewport changes.

## Review checklist

Before adding a UI surface or animation, verify:

- the source snapshot or validated action it consumes;
- the decision or consequence it communicates;
- its entry, exit, cancellation, and cleanup behaviour;
- its touch, focus, disabled, narrow-viewport, and WebGL-fallback states;
- that React, Three.js, or timing code cannot change authoritative gameplay.
