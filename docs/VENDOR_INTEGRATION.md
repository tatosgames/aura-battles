# Vendor integration

Vendor integration is a boundary around the game, not a set of SDK calls spread
through gameplay. The local build must remain playable with no vendor SDK, a
missing SDK, or a vendor call that rejects.

The intended shape is:

```text
gameplay/app -> PlatformAdapter -> VendorLifecycle -> selected adapter or no-op
```

## Local-first contract

`createLocalPlatform()` is the default. It provides local audio, no-network
analytics, and an empty vendor adapter. Development and tests must not require
credentials, remote scripts, a game ID, or a platform account.

The current public contract lives in `src/app/platform/PlatformAdapter.ts`:

- `PlatformAdapter` groups `audio`, `analytics`, and `vendor` capabilities.
- `VendorAdapter` exposes optional `init`, `loadingFinished`,
  `gameplayStart`, `gameplayStop`, `setPaused`, and `measure` operations.
- `VendorLifecycle` owns idempotence, first-interaction gating, and failure
  containment.

Keep the interface small. Optional capabilities should remain optional instead
of making local play depend on advertising, rewards, accounts, or sharing.

## Lifecycle

Use an explicit lifecycle:

```text
created -> initializing -> loading -> ready -> playing -> stopped
                                  \-> failed-but-playable
```

Recommended semantics:

1. Call `init()` once during application boot.
2. Call `loadingFinished()` once after the local simulation and first playable
   presentation are ready.
3. Call `playerInteraction()` only from trusted pointer or keyboard input.
   It unlocks one `gameplayStart()` call and prevents autoplay analytics.
4. Call `setPaused()` when the game is explicitly paused or resumed.
5. Call `stopGameplay()` on result/scene end, hidden-tab suspension, and
   unmount.

`VendorLifecycle` must make repeated signals harmless. Visibility recovery must
not restart gameplay unless the game is still accepting input.

## Boundary rules

Vendor adapters belong under `src/app/platform`. Gameplay, physics, input, and
R3F presentation must not import portal globals or vendor SDKs directly. Vendor
code must not:

- read or mutate Rapier bodies, colliders, worlds, or event queues;
- alter the fixed timestep, simulation state, collision results, or scoring;
- become a required runtime dependency for local development or tests;
- spread vendor names or event payloads through domain code;
- expose credentials, upload tokens, game IDs, or private URLs in source.

Use product semantics at the facade boundary, such as `match-start`,
`match-complete`, `session-suspended`, or `button-interact`. Translate them to
platform-specific event names only inside the adapter.

## Analytics

Analytics should be low-cardinality and routed through the platform facade or
the existing `PlatformAdapter.analytics.track()` surface. Emit meaningful
milestones and terminal outcomes, deduplicate repeated lifecycle signals, and
avoid per-frame, per-tick, per-particle, or per-collision events. Do not send
raw URLs, stack traces, browser status messages, or sensitive user data.

Vendor failures are diagnostics, not gameplay failures. Catch rejected SDK
operations, keep the local adapter usable, and use stable failure categories
when a diagnostic event is genuinely needed.

## Verification

- Run the app with the local adapter and confirm no network request is required.
- Confirm loading and gameplay lifecycle calls happen once in the intended
  order, including boot failure and retry paths.
- Confirm the first real input starts gameplay and React effects cannot fake it.
- Confirm pause, hidden-tab, result, reset, unmount, and vendor rejection are
  safe and idempotent.
- Audit builds for credentials, SDK URLs, game IDs, and accidental vendor
  imports outside `src/app/platform`.
