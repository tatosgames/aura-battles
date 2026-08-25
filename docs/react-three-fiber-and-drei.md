# React Three Fiber and Drei

Use React Three Fiber (R3F) to compose the rendering tree, not to own simulation state. The fixed-step engine owns authoritative state; R3F reads serializable snapshots after each simulation step. Keep HUDs, menus, controls, and settings in the normal React/DOM tree.

`@react-three/drei` is a first-class dependency of this template. The sandbox uses `OrbitControls`; use other helpers only where they replace repeated, well-understood rendering glue. Keep camera rigs/control components isolated from domain systems and disable or coordinate controls during pointer gestures.

For high-frequency transforms, mutate Three object references inside `useFrame` from immutable snapshots or a small presentation store—do not enqueue broad React state updates every frame. R3F owns the simulation/render frame and drives the fixed accumulator before scene presentation. A canvas is mounted only after `canCreateWebGLContext()` succeeds. Context loss/recovery, renderer configuration, and native Canvas resize stay in `src/app/canvas`, not in gameplay code.

Use local assets by default. Dispose owner-created Three geometries, materials, render targets, and debug helpers when the owning scene is disposed.
