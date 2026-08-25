# Physics Game Template

A proprietary, standalone Vite foundation for browser physics games. It ships one neutral local physics sandbox demonstrating fixed simulation, Rapier ownership, immutable UI state, and Three.js presentation.

## Prerequisites and commands

Node.js 20+ and npm are required.

```bash
npm install
npm run dev
npm run lint
npm run build
npm run test
npm run test:browser
```

Use **Spawn box/sphere/capsule** to add bodies, click a body to apply a throw impulse, and use pause, reset, and debug-wireframe controls to inspect the simulation. All assets, sounds, and adapters are local; the default adapter makes no network request.

## Deploying to Cloudflare Pages

This is a static Vite app, so deploy the generated `dist/` directory to **Cloudflare Pages**. The repository intentionally contains no Cloudflare account ID, project name, API token, or production binding.

1. Build and verify the exact artifact locally:

   ```bash
   npm run build
   npm run test:browser
   ```

2. Authenticate the local Wrangler CLI (once per developer machine) and verify the active account:

   ```bash
   npx wrangler login
   npx wrangler whoami
   ```

3. Create a Pages project in the Cloudflare dashboard, or allow the first deploy to create one. Replace the placeholder with that project's own name:

   ```bash
   npx wrangler pages deploy dist --project-name <your-pages-project> --branch main
   ```

For connected Git deployments, configure the Cloudflare Pages project with build command `npm run build` and output directory `dist`. Each branch can use a Pages preview deployment; use `main` only for the production branch.

For CI, provide `CLOUDFLARE_API_TOKEN` through the CI secret store (never commit it), then run the same build and deploy command. This template does not require a Worker, Pages Functions, KV, D1, or R2 binding. Add a `functions/` directory or a Worker only if your game genuinely needs server-side behavior; keep credentials and network integration outside `src/engine`.

## Stack

React 19, React Three Fiber, Three.js, deterministic Rapier, TypeScript strict mode, Vitest, and Playwright.

This template deliberately does not provide game rules, characters, combat, scores, menus, matchmaking, analytics, remote assets, or a platform SDK integration. Build those as a domain layer on top of `src/engine`, never by importing from `src/demo`.

Read [architecture](docs/ARCHITECTURE.md), [extension instructions](docs/EXTENDING.md), [reuse matrix](docs/REUSE_MATRIX.md), [provenance](docs/PROVENANCE.md), [R3F/Drei guidance](docs/react-three-fiber-and-drei.md), [Three.js physics](docs/threejs-physics.md), [game-design and juice rules](docs/GAME_DESIGN_AND_JUICE_RULES.md), [vendor integration](docs/VENDOR_INTEGRATION.md), [UI architecture and responsive rules](docs/UI_ARCHITECTURE_AND_RESPONSIVE_RULES.md), and [UI/transitions](docs/UI_AND_REACT_TRANSITIONS.md) before extending it.

Repository-local implementation guidance for future agents lives in [`.agents/skills/threejs-rapier-template/SKILL.md`](.agents/skills/threejs-rapier-template/SKILL.md).

## Local reference projects

Use these projects as implementation and visual references when extending Aura Battles. Keep their code and assets separate from this repository unless a task explicitly asks for reuse.

- `fight3dstickman` — `C:\Projects\GitHub\fight3dstickman` — local 3D fighting-game reference for R3F presentation, combat feel, HUD patterns, assets, and browser playtesting.
- `smash-royale` — `C:\Projects\GitLab\RisingPixel\smash-royale` — local destruction-game reference for levels, physics tuning, camera framing, and presentation feedback.
