# Game design and juice rules

Juice makes every meaningful action immediate, exaggerated enough to notice, and
readable without changing the underlying game. The player should understand:

1. what they did;
2. which body, prop, or area was involved;
3. how strong the consequence was;
4. what changed and what they can do next.

## Core rules

- Resolve the authoritative action first; presentation amplifies the result.
- Show cause before consequence: input, telegraph, contact, reaction, outcome.
- Keep the strongest feedback at the authoritative contact or state transition.
- Use position, silhouette, shape, contrast, motion, and sound together; never
  rely on colour alone for ownership or state.
- Preserve readable evidence when audio, particles, or optional WebGL effects
  are unavailable.
- Keep the playfield centre clear of decorative HUD and competing panels.
- Write the intended feedback, interruption behaviour, and low-performance
  fallback before implementing a genre-specific effect.

## Authority boundary

The runtime flow is:

```text
input -> validated command -> fixed simulation -> serializable snapshot
      -> R3F scene, DOM HUD, audio, camera, and effects
```

Rapier, the fixed-step loop, and domain state remain authoritative. Camera
motion, hit-stop, screen effects, particles, audio, squash/stretch, and visual
offsets are presentation-only. They must never change bodies, colliders,
impulses, scoring, timing, or outcomes.

When using hit-stop or slow motion, keep the two clocks conceptually separate:

```text
real time       -> camera, flashes, tweens, UI, ambience
simulation time -> rules, movement, physics, scoring, entity state
```

Every transient effect needs a clear owner, bounded lifetime/count, and cleanup
path on reset, cancellation, scene change, context loss, unmount, or disposal.

## Feedback choreography

| Event | Minimum readable feedback |
| --- | --- |
| Accepted input | Immediate scale, tint, focus, or local highlight; no shake yet |
| Active gesture | Direction, intensity, target, and available action |
| Contact or hit | Contact flash, local recoil, short audio cue, or directional kick |
| Strong consequence | Bounded hit-stop, camera response, impact burst, and visible reaction |
| Recovery or settling | Wobble, loss of balance, settling debris, or restored control |
| Failure or interruption | Clear cancellation, unavailable state, or reason without phantom release |
| Victory or result | Physical outcome first, then concise result and next action |

Actor motion comes before camera, particles, and copy. No effect may hide the
active body, moving object, target, or important arena boundary.

## Timing and technique guide

| Class | Indicative duration | Use |
| --- | ---: | --- |
| Proof | 0–50 ms | Press, focus, state acknowledgement |
| Micro | 60–120 ms | Release, flash, chip, contact accent |
| UI | 120–360 ms | Marker, panel, result reveal |
| Cinematic | 360–700 ms | Detachment, ring-out, major reaction |
| Milestone | 700–1200 ms | Opening, tutorial, match end |

Useful techniques include action flashes, directional camera kicks, short
screen shake, hit-stop, recoil, squash/stretch, dust/contact puffs, limited
debris, world marks, reactive HUD values, and concise outcome stings. Prefer a
simple flash, ring, shake, sound, or particle burst over a bespoke effects
framework when both communicate the same fact.

Choose easing by feeling: exponential decay for recoil and camera offsets,
quadratic-out for bursts and fades, back-out for announcements, and restrained
spring/bounce motion for rewards or landings. Centralise durations, amplitudes,
quality caps, and global intensity in presentation configuration rather than
scattering them through components.

## Readability, comfort, and performance

- The first screen should communicate the primary action through the active
  control, world motion, or a short prompt rather than a wall of instructions.
- Interactive targets should be at least 48 CSS pixels on touch layouts.
- Keep important HUD and controls readable on narrow portrait and landscape
  viewports.
- Under load, reduce DPR, shadows, particles, and optional post-processing
  before reducing input or state feedback.
- Cap particle/debris pools and remove insignificant remnants predictably.
- Provide a readable fallback for muted audio, unavailable WebGL, and reduced
  visual quality profiles.

## Review checklist

Before adding an effect, identify:

- the authoritative event that triggers it;
- the player question it answers;
- the existing signal it replaces or simplifies;
- its duration, tuning source, quality fallback, and owner;
- its reset, cancellation, and disposal path;
- the test or invariant proving it cannot affect gameplay.

Verify significant actions with deterministic input, confirm effects begin and
expire within bounded time, and compare authoritative movement/collision/result
state with juice enabled and disabled. Playtest with fresh players and with
audio or optional effects unavailable to validate comprehension and comfort.
