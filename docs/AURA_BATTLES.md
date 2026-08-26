# Aura Battles — Shipping Rules

Aura Battles is a 1v1 performance-card duel. You do not deal damage: you take the moment, build
Aura and Hype, then resolve a Final Move. Physics makes each performance funny; it never decides a
rule outcome.

> **The rules decide the outcome. Physics sells the outcome.**

## Learn it in one turn

1. Reach **10 Aura** and **3 Hype**.
2. On your turn, play **any card** in your three-card hand.
3. To counter, play the category whose arrow points at the incoming category.
4. The last unanswered move takes the moment. Then play your Final Move to win.

The first match exposes those three statements contextually, in that order. The counter cue becomes
the concrete answer (for example, `CHAOS BEATS COPY THAT`) rather than a second explanatory panel.
No rules modal is required before the player can act.

## The counter map

| Card category | Beats | Read it as |
| --- | --- | --- |
| 😎 COOL | 🗿 DEADPAN | style overwhelms indifference |
| 🗿 DEADPAN | 💥 CHAOS | composure defuses the stunt |
| 💥 CHAOS | 😂 MEME | disruption buries the joke |
| 😂 MEME | 😎 COOL | ridicule punctures posing |

Every core card is a legal opener. A counter is legal only when this map says its category beats
the current card. The UI leaves the full hand readable, highlights legal counters, and puts the
same `BEATS` arrow on every core card. A card exposes only one additional detail—rider, risk, or
Final-counter badge—so the choice stays readable. A chain has at most three cards.

## Scoring, risk, and Final Moves

- An unanswered move gains its printed Aura and Hype.
- A successful counter gains its printed values **plus 1 Aura**, and its target loses **1 Aura**.
- Only the explicit card rider can add a secondary effect, such as draining Hype. Riders are printed
  on the card; there are no hidden matchup bonuses.
- CHAOS cards show a percentage risk before they are played. A failed move gains nothing, costs the
  player 1 Hype, and grants the opponent 1 Aura.
- After a fail, the player may spend one of three Recovery cards. Recovery creates the sole named
  combo, **Accidental Cinema**: +2 Aura and +1 Hype beyond the Recovery card's printed value.
- At 10 Aura and 3 Hype, play the face-up Final Move. It wins unless the defender holds the exact
  crown-badged counter. There is no random “desperate counter.” A perfect counter removes 6 Aura
  and all Hype from the attacker, while the defender gains 3 Aura and 2 Hype.

## Card set and decks

The shipping set is exactly 25 cards: 20 core moves, 3 Recoveries, and 2 Final Moves. Card data is
the authority in [`CardDefinition.ts`](../src/domain/auraBattle/rules/CardDefinition.ts).

| Fighter | 15-card deck |
| --- | --- |
| BLU | Main Character Walk, Mewing Stare, Sunglasses On, Silent Flex, Victory Pose, No Reaction, Look Away, Walk Away, Unplug The Speaker, Slow Clap, Do It Better, NPC Reaction, Chair Entrance, Chair Yeet, Backflip Entrance |
| REDD | Main Character Walk, Mewing Stare, Silent Flex, Victory Pose, No Reaction, Look Away, Walk Away, Absolute Silence, Slow Clap, Copy That, NPC Reaction, Take The Throne, Chair Entrance, Table Slide, Shopping Cart Entrance |

Each player has a three-card hand. Played cards move to discard; the discard is deterministically
reshuffled only when the deck is empty. Recoveries sit outside the deck and are offered only after a
fail. BLU holds **Unplug The Speaker**, the exact answer to REDD's *Last Dance*; REDD holds **Take
The Throne**, the exact answer to BLU's *The King Has Arrived*.

## Turn and presentation boundaries

```
CHOOSE → COUNTER (max 3 cards) → PERFORM → FAIL/RECOVER when needed → SCORE → next turn
FINAL_DECLARED → FINAL_COUNTER → FINAL_PERFORM → win, or return to SCORE after a perfect counter
```

`rules/` is pure, seeded TypeScript. `sim/` owns Rapier and performance scripts. `view/` renders
those results. `ui/` renders the DOM HUD. `AuraBattleController` is the only bridge between the
rule state machine and the ragdoll performance. Keep those ownership boundaries intact.

## Wobble, jitter, and the stage's force field

The performance layer trades some of its earlier precision for arcade chaos, without ever letting
that chaos touch a card's outcome:

- **Idle sway** (`RagdollController`) adds a small, fixed, non-random sine-sum offset to every driven
  part's pose target, scaled by `stiffness * clamp(balance, .15, 1)` — a held pose reads as loose and
  alive instead of a statue, and the sway fades out as `balance` drops so it never fights a real fall.
- **Presentation RNG** (`MoveDirector`) jitters every scripted impulse/torque (±20% magnitude, a few
  degrees of horizontal spread) and draws a per-performance pace multiplier (~0.92–1.08), so the same
  card never plays identically twice. This RNG is derived from the match seed via simple integer
  mixing and never touches `AuraBattleController`'s own rules RNG — replaying a `?seed=` still
  reproduces the exact same match outcome, flourish included.
- **Flinch** (`RagdollController.flinch`) is a small, deterministic reaction — direction opposes the
  pelvis's current velocity, no randomness needed — fired by `ArenaController` whenever a contact
  notice clears a noticeable-knock threshold, so an incidental bump finally does something instead of
  nothing.
- **The stage's force field** (`ArenaController.applyBoundaryContainment`) cancels the outward
  component of velocity for anyone who crosses `stageRadius * 0.5` — a wall, not a tug, which is what
  actually arrests a hard-thrown prop — then eases them back with a proportional impulse. It fires for
  both fighters and props; only fighters get the camera cut, but `BoundaryPulse`/`BoundaryRing` render
  a yellow ring pulse at the catch point either way. The threshold sits well inside the stage's visual
  radius on purpose: ground friction kills horizontal momentum fast enough that nothing in this game
  ever slides near the true edge under normal impulses, so a safety net tuned to the literal edge would
  never visibly fire.
- **Camera juice** (`CameraDirector`) layers a fast-decaying `punch` channel on top of the existing
  `shakeAmount` rattle: a dutch-tilt roll (`camera.rotateZ` after `lookAt`), a brief zoom-in on the
  FOV, and a directional shove along the duel axis. `shake(...)` calls in `AuraBattleApp.tsx` are
  scaled by `1 + excitement * .5`, and `COUNTER_SNAP`/`PERFECT COUNTER` also flash a CSS-only
  speed-line overlay (`.speedlines`), reusing the same `pop()`-style replay trick as the existing
  `.flash`.

## Verification contract

Before shipping a rules change, verify: 25-card count; map legality; every core card as an opener;
counter payout; visible fail/recovery behavior; deterministic Final counters; AI legal choices;
onboarding and counter highlighting in browser; portrait and landscape HUD behavior.

## Debug flags

| URL | Effect |
| --- | --- |
| `/?sandbox` | original physics sandbox |
| `/?debug` | debug panel |
| `/?seed=123` | deterministic match seed |
| `/?fast=1` | short windows for tests |
| `/?warm=1` | both fighters start at 9 Aura / 3 Hype |
