# Generic game-design and juice rules

Gameplay feedback should clarify player intent, state changes, impact, risk, and recovery. Every effect needs a gameplay source, a bounded duration, a cancellation/disposal path, and a readable fallback when audio or WebGL is unavailable.

- Make input response immediate; if an action has wind-up or charge, reveal it before the consequential impulse.
- Put the strongest visual/audio feedback at the authoritative contact or state transition, not at an arbitrary screen position.
- Prefer a small hierarchy of feedback: persistent state first, transient confirmation second, decorative particles last.
- Keep timing deterministic in the simulation. Camera, particles, screen-space effects, and audio are presentation-only and may interpolate but never change outcomes.
- Use contrast, motion, and sound for readability; do not rely on colour alone.
- Bound effects by count, lifetime, and screen/scene density. Under performance pressure, drop decorative effects before interaction or state feedback.
- Reset/scene exit must cancel active effects and release resources.

When adding a genre-specific feature, write its readable intent, success/failure feedback, interruption behaviour, and low-performance fallback before adding polish.
