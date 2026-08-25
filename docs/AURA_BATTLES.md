# Aura Battles

A 1v1 card duel where every card triggers a ragdoll performance on a small theatrical stage. The
fantasy is not damage. It is **stealing the moment**: gain Aura, build Hype, and land a Final Move
before the opponent counters it.

The whole build follows one rule:

> **The rules decide the outcome. Physics sells the outcome.**

## Reading the match

| Meter | Range | Meaning |
| --- | --- | --- |
| Aura | 0–10 (shown ×1000) | social dominance; 10 is the door to a Final Move, not a win |
| Hype | 0–3 🔥 | escalation; 3 opens the Final Move alongside 10 Aura |

You win by **resolving a Final Move**, never by the meter alone.

## Turn structure

```
CHOOSE  → the active fighter plays a Move; the performance starts immediately
COUNTER → the opponent has one short window to answer (chain depth max 3)
RESOLVE → the last unanswered card takes the moment
PERFORM → the ragdolls finish acting it out
FAIL    → if the rules blew the move up, the failing fighter is offered a Recovery
SCORE   → meters settle, hands refill, the active fighter swaps
```

The Final Move branch replaces `CHOOSE`:

```
FINAL_DECLARED → the performance begins and the stage dresses itself
FINAL_COUNTER  → the defender gets exactly one answer
FINAL_PERFORM  → it lands and the match ends, or it is stolen and the match swings
```

## Card families

| Family | Reads as | Beats | Loses to |
| --- | --- | --- | --- |
| 😎 COOL | posing, main-character energy | itself, via `STYLE STREAK` | 😂 MEME |
| 🗿 DEADPAN | refusing to react | 💥 CHAOS, via `ZERO REACTION` | 😎 COOL pressure |
| 😂 MEME | ridicule and mimicry | 😎 COOL, via `AURA STEAL` | 🗿 DEADPAN |
| 💥 CHAOS | props and stunts | raw numbers | 🗿 DEADPAN, and its own failure roll |
| 🩹 RECOVERY | turning a pratfall into the plan | a `FAIL`, via `ACCIDENTAL CINEMA` | — |
| 👑 FINAL | the closer | everything | its one perfect counter |

Twenty-five cards live in [`rules/CardDefinition.ts`](../src/domain/auraBattle/rules/CardDefinition.ts).
Each carries at most one short rider, drawn from a closed `Bonus` union so cards stay glanceable.

### Design rules the numbers encode

- **Countering beats raw numbers.** Any card that answers another gains `+1` on top of its printed
  value. Holding a response is usually worth more than opening with it.
- **Composure is a real strategy.** DEADPAN answers to CHAOS score more than the stunt they cancel.
- **Recovery can beat perfection.** A rescued failure (`ACCIDENTAL CINEMA`) pays more than a safe
  card, which is exactly what makes CHAOS worth gambling on.
- **Openers prefer standalone cards.** `legalOpeners` hides pure counters while the hand holds
  anything else, so a counter is never burned for nothing and a turn is never dead.

## Failure is scripted, never emergent

A CHAOS card's `failChance` is rolled **the instant it is played**, by the seeded domain RNG, before
a single body has moved. The result is stored on the chain entry. Only then does `MoveDirector` pick
the script's `fail` branch, drop the ragdoll's `balance` to zero and let it eat the floor.

This inverts the naive approach on purpose. A chair that physically misses, a landing that happens to
look clean, a body that tumbles off frame — none of it can change who took the moment.

## Final Moves and the perfect counter

Each fighter's Final Move is face up from turn one, and each deck contains the **one card that steals
the other fighter's Final Move outright**:

| Final Move | Perfect counter | Held by |
| --- | --- | --- |
| The King Has Arrived 👑 | Take The Throne | REDD |
| Last Dance 🎧 | Unplug The Speaker | BLU |

Any DEADPAN or MEME card may be thrown at a Final Move as a desperate answer, with a seeded 30%
chance. The perfect counter always works. A stolen Final Move does not end the match — it reverses
it: the attacker drops 6 Aura and all Hype, the defender gains 3 Aura and 2 Hype.

The attacker's Final Move performance **starts before** the counter window opens, so a steal cuts it
off mid-sequence. That interruption is the point of the whole system.

## Layers

```
src/domain/auraBattle/
├── rules/     pure TypeScript, seeded, zero Rapier and zero Three — fully unit tested
├── sim/       skeleton, poses, active ragdoll, performance scripts, props, arena (Rapier)
├── ai/        weighted heuristics with a deliberate ~15% mistake rate
├── view/      R3F presentation, camera director, particles (never talks back to the domain)
├── ui/        DOM overlay: hand, meters, counter window, callouts
└── AuraBattleController.ts   phase machine, the one place that joins rules to simulation
```

`AuraBattleController` publishes state on **two channels**, which is the main deviation from the
template's sandbox:

- **Transforms, 60 Hz** — `arena.transforms` / `arena.propTransforms` are plain `Float32Array`s read
  directly inside `useFrame`. They never touch React state, and no Rapier handle escapes.
- **Battle state, event-driven** — a frozen `BattleSnapshot` published through `GameBridge` only when
  something actually changes, consumed with `useSyncExternalStore`.

The counter timer is deliberately *not* on the snapshot channel: the HUD gets `windowStartedAt` and
`windowSeconds` and animates the bar itself, so the tensest element on screen costs zero re-renders.

## The active ragdoll

`ArticulatedBodyFactory` was extended with real Rapier joints: spherical for pelvis, neck, shoulders
and hips; revolute with limits and position motors for elbows and knees. Joint contacts are disabled
and each fighter's parts share a collision layer that excludes itself.

`RagdollController` servos each driven part toward a pose by **angular velocity scaled by real
inertia** — torque tuned against mass alone detonates the ragdoll — and drives elbows and knees
through their joint motors instead.

One scalar carries the whole feel:

**`balance` (0…1)** decides how much of its own weight a fighter carries. At `1` a pose holds exactly
as authored. Dropping it toward `0` hands the weight back, and the fighter buckles, topples and
becomes a pure ragdoll. Every fall in the game is that number moving.

## Responsive layout

Persistent HUD is deliberately thin — per [GAME_DESIGN_AND_JUICE_RULES.md](GAME_DESIGN_AND_JUICE_RULES.md)
and [UI_ARCHITECTURE_AND_RESPONSIVE_RULES.md](UI_ARCHITECTURE_AND_RESPONSIVE_RULES.md), only status tied
to the current decision stays always-on: the two meters, their always-visible Final Move, and the
current prompt. The hand exists only while the human can act. Counter and Recovery windows show only
legal answers plus `LET IT LAND`; performance and AI phases return the whole lower screen to the 3D
stage. A turn counter, full chain text, card answer footers and deck/prop counts were removed rather
than shrunk, since none of them answer an immediate decision.

Each card uses one authored icon system instead of emoji, then exposes only category, immediate
Aura/Hype yield, title and one rule line. Final activation is folded into its permanent meter badge,
so readiness changes the existing object into the action instead of creating a second button. The
active fighter is also marked in the arena with lighting and a floor ring; initiative can therefore
be read from the scene without another HUD label.

Sizing runs on `clamp()` tokens in `:root` (`--hud-pad`, `--meter-w`, `--card-w`, `--callout-size`)
instead of fixed pixels, with `env(safe-area-inset-*)` folded into the HUD padding. Below 700px wide,
the meters occupy one row and the compact prompt moves beneath them; the hand becomes a horizontally
scrollable, scroll-snapping row instead of wrapping over the arena. Short landscape layouts compact
the meters but never hide the Final Move. `CameraDirector` widens its vertical FOV on portrait
aspects so both fighters stay in frame instead of one falling out of a narrow crop.

## Debug flags

| URL | Effect |
| --- | --- |
| `/?sandbox` | the original template physics sandbox, untouched |
| `/?debug` | lil-gui panel: pause, collider wireframes, restart |
| `/?seed=123` | fixed seed — the same match replays identically |
| `/?fast=1` | short windows, for testing |
| `/?warm=1` | both fighters start one card short of a Final Move |

`window.__aura` exposes the controller for inspection and for the browser tests.

## Dev harnesses

`.devtools/` holds throwaway Playwright scripts used to build and tune this. They need `npm run dev`
running on port 5173.

```bash
node .devtools/autoplay.mjs 13 480000 . chaos
```

Plays a whole match against the AI, printing every phase transition, both meters, prop count and any
console error. The rest: `finale.mjs` captures the Final Move sequence, `phase.mjs` and `moment.mjs`
screenshot a chosen phase at desktop size, `phase-viewport.mjs` does the same at an arbitrary viewport
size for responsive checks, `responsive.mjs` autoplays a few turns at a given viewport and reports
layout overflow plus any touch target under 48px, `perf.mjs` times the simulation step, and
`leak.mjs` checks that a rematch returns every body, collider and joint to its baseline.
