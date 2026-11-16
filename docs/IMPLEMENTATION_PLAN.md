# Living Pond — Implementation Plan & Phase Tracking

## 1. Overview & Stack Decisions
- **Framework:** React 18 + TypeScript (strict mode)
- **Bundler / Tooling:** Vite 5, Vitest for unit testing
- **Graphics Engine:** Three.js (orthogonal camera, procedural custom mesh articulation, GLSL custom shaders for bed and surface highlights)
- **State Management:** Zustand with custom localStorage synchronisation and schema validation
- **Audio:** Web Audio API procedural pink noise and lowpass resonance filter for ambient water movement
- **Styling:** Modular CSS tokens, semantic HTML, mobile safe-area insets (`env(safe-area-inset-*)`), responsive media queries

## 2. Architecture & Modules
- `src/types/index.ts`: Strongly-typed fish state (`FishState`), simulation configuration, presets, and vector structures.
- `src/utils/math.ts`: Vector operations, angle wrapping, heading rotation, deterministic `splitmix32` PRNG.
- `src/simulation/SimClock.ts`: Fixed-timestep accumulator (60 updates/sec) with clamp protection against tab suspension.
- `src/simulation/fishFactory.ts`: Procedural koi generation with unique scale, palette, spine chains, and personality seeds.
- `src/simulation/steering.ts`: Weighted multi-intention steering (wander, separation, alignment, cohesion, boundary avoidance, seek/orbit, flee).
- `src/simulation/PondSimulation.ts`: Pure simulation model managing koi school, ripples, food pellets, and disturbance forces.
- `src/rendering/PondRenderer.ts`: Three.js lifecycle, dual GLSL water materials, spine-articulated buffer geometry, dynamic shadows, and depth z-ordering.
- `src/store/pondStore.ts`: React-isolated reactive store for settings, pause, ambient mode, and panel visibility.
- `src/utils/audio.ts`: Web Audio API sound generator activated only upon explicit user gesture.

## 3. Implementation Phases & Status

- [x] **Phase 0 — Repository audit and technical plan:** Stack audited, clean architecture established.
- [x] **Phase 1 — App shell and scene lifecycle:** Full-viewport canvas, responsive orthogonal camera, WebGL context loss protection & fallback UI.
- [x] **Phase 2 — One high-quality fish:** Multi-segment spine chain (14 points), lateral wave deformation with head-to-tail amplitude growth, organic patches & fins.
- [x] **Phase 3 — School simulation:** 12 default fish with distinct personalities, social boid flocking + individual wandering, deterministic seed reproduction.
- [x] **Phase 4 — Water and environment:** Dual GLSL shaders (procedural FBM current & depth bed gradient + animated surface highlights), floating lily pads, and dynamic water ripples.
- [x] **Phase 5 — Interaction and control system:** Attract (`A`), Scatter (`S`), Feed (`F`), Pause (`Space`), Ambient mode (`Tab`), Control dock, and accessible HUD.
- [x] **Phase 6 — Preferences, ambient mode, and sound:** 5 atmospheric presets (Dawn, Noon, Dusk, Night, Rain), persistent localStorage with validation, Web Audio ambient engine.
- [x] **Phase 7 — Performance and accessibility:** In-place vertex buffer updates, object disposal, 44px touch targets, prefers-reduced-motion support, keyboard shortcuts.
- [x] **Phase 8 — Testing, inspection, and final polish:** 55 unit tests passing across 5 test suites; clean production build.
