# Extending the template

1. Add a scene under `src/domain/<scene>`; it may import public contracts from `src/engine` but never `src/demo`.
2. Add a collision-layer name to that scene's JSON config, validate it with `validateSandboxConfig`'s equivalent, and construct masks through `CollisionLayerRegistry`.
3. Define arbitrary string part IDs and `PartDefinition`s, then create/remove them through `ArticulatedBodyFactory`; call `removeSubtree` for authoritative removal.
4. Add a typed domain event map and emit it through `TypedEventBus`; copy any Rapier-derived values into serializable data first.
5. Add a revisioned UI state and restricted action interface through `GameBridge`; never expose a Rapier reference in either.
6. Add optional platform behavior by implementing `PlatformAdapter`. Keep the local/no-op default valid with no credentials or network connection.

Create tests alongside each layer: engine unit tests for deterministic behavior and browser smoke tests for the new presentation/controls.
