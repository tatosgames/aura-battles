# UI rules and React transitions

React/DOM owns HUD, menus, settings, overlays, and transitions. R3F owns only scene composition and visual presentation. The engine publishes immutable revisioned snapshots through `GameBridge`; UI actions are restricted commands that the simulation validates. React must not inspect or mutate Rapier objects.

Use one clear primary action per state, keep persistent HUD compact, and avoid competing full-screen panels around an interactive canvas. Interactive elements need visible focus/pressed/disabled states, adequate contrast, and pointer targets sized for touch.

Treat a transition as a small state machine: enter, active, resolve, exit. Record the authoritative outcome in the simulation first, then animate presentation from snapshots. Transitions must tolerate cancellation, reset, context loss, and navigation; cleanup timers, subscriptions, audio, and transient scene effects on exit. Avoid CSS/React timing that determines rules or physics.

For React 19, use `startTransition` only for non-urgent visual/state work. Input response, critical HUD state, and authoritative command dispatch remain urgent. Do not use `useEffect` as a proxy for a player interaction when a platform lifecycle requires a user gesture.
