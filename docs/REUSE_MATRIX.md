# Reuse matrix

The internal Fight3D repository was inspected only as source provenance. Nothing here imports it at runtime.

| Source area | Classification | Template destination and reason |
| --- | --- | --- |
| `src/core/Clock.ts` | Reused/generalized | `engine/clock/FixedStepLoop.ts`; preserves accumulator cap and restart semantics while removing game terms. |
| `src/physics/rapierRuntime.ts`, `PhysicsWorld.ts` | Reused/generalized | `engine/physics`; preserves async retry, world ownership, disposal, debug rendering, single queue drain and ordered observation. |
| `src/core/EventBus.ts`, `ui/versionedExternalStore.ts` | Reused/generalized | `TypedEventBus` and `GameBridge`; generic event/state type parameters and unsubscribe/revision behaviour. |
| WebGL support, quality, canvas lifecycle | Reused/decoupled | `app/canvas`; browser capability guard and R3F shell without presentation dependencies. |
| Audio/vendor/analytics | Reused/decoupled | `app/platform`; synthesized local audio and no-op optional adapter, no IDs, scripts, or metrics. |
| `RagdollFactory.ts` | Generalized | `ArticulatedBodyFactory`; arbitrary part IDs, shapes, ballast, subtree removal. |
| `GameRuntime.ts` | Generalized | `FixedStepLoop`; generic simulation/presentation/error/visibility host callbacks. |
| `InputManager.ts`, direct gesture coordinator | Generalized | `InputRouter`; pointer capture and cancel-safe semantic commands. |
| Collision/impact/destructible systems | Split | Plain contact metadata retained; no cooldowns, HP, scoring, cracks, or fragments in engine. |
| Fighters, balance, intent, damage, parry, knockback, ring-out | Excluded | Combat-specific mechanics are not template concerns. |
| Match flow, modes, CPU, menus, tutorial, progression, comic/toon VFX | Excluded | Product-specific domain and branding excluded. |
