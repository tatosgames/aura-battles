# Aura Battles — Current Product Brief

Build Aura Battles as a fast 1v1 physics-performance card game in the existing React, React Three
Fiber, TypeScript, Vite and deterministic Rapier project. Preserve the existing architecture:
Rapier is simulation authority, the rules are pure TypeScript, and Three/R3F presents state without
feeding outcomes back into gameplay.

## Product promise

A first-time player should understand the first useful action immediately:

> “I play a card. To answer their card, I play the icon that beats it.”

The target is a five-to-ten-minute duel with a three-card hand, no mana, no deck construction UI,
and one meaningful decision every few seconds. Expertise comes from timing, holding a counter,
reading risk, riders, and the Final counter — not memorising bespoke card-vs-card lists.

## Immutable game contract

- Win by resolving a Final Move after reaching **10 Aura + 3 Hype**.
- Every core card can open a turn.
- Use exactly this closed map: **COOL → DEADPAN → CHAOS → MEME → COOL**.
- A successful counter gives printed values +1 Aura and removes 1 Aura from the answered player.
- A core card has at most one plainly visible rider. No hidden category bonuses.
- CHAOS may fail only through its printed percentage. Failure costs 1 Hype and gives the opponent
  1 Aura; then Recovery is offered.
- Recovery is the only named combo: **Accidental Cinema** (+2 Aura, +1 Hype).
- A Final Move can be stopped only by its exact, crown-badged card. Never add random desperate
  Final counters.
- Ship exactly 25 cards: 20 core, 3 Recovery, 2 Final. Do not restore `check_phone` or
  `wrong_person` without revising the documented card count and decks.

## Onboarding and HUD

Show precisely three contextual prompts, once per match:

1. `REACH 10 AURA + 3 HYPE. THEN PLAY FINAL MOVE.`
2. `PLAY ANY CARD.`
3. A dynamic map cue, for example `CHAOS BEATS COPY THAT.`

Cards must show category and its `BEATS` target, printed Aura/Hype, then at most one specific detail:
rider, visible risk, or Final-counter crown. Do not render flavour copy in the operational hand. In a
counter window, retain the whole hand; make only legal answers actionable. Aura is displayed as
`current/10`, Hype as `current/3`, and the face-up Final Move remains visible in the scoreline.

## Engineering contract

- Card data, map legality, outcome resolution, decks, and final checks remain in `src/domain/auraBattle/rules/`.
- `AuraBattleController` owns phase transitions and is the only rules-to-simulation bridge.
- Simulation and presentation may sell a fail, counter, or Final interruption, but cannot change it.
- Keep all randomness seeded and decided before a performance begins.
- Keep the DOM HUD responsive: flat persistent scorelines, one contextual cue, an action-only
  three-card hand visible as three columns on narrow screens, and no horizontal overflow in portrait
  or landscape.

The detailed shipping rules, decklists, and verification checklist live in
[AURA_BATTLES.md](AURA_BATTLES.md). That file is authoritative when a design interpretation is
unclear.
