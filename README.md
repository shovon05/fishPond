# Living Pond

> A quiet little world, alive on your screen.

Living Pond is an ambient, procedural ornamental koi pond experience built with React, TypeScript, and Three.js. It features independently articulated koi, dynamic water rendering, tactile interactions, atmosphere presets, and an unobtrusive interface designed for calm desktop viewing or mobile exploration.

---

## Features

- **Procedural Koi Anatomy & Articulation:** Each fish has a 14-point trailing spine chain. When turning or cruising, a speed-governed travelling wave passes through the body, delivering fluid swimming motion rather than rigid rotation.
- **Organic Visual Variation:** Seeded colour palettes (Ivory/Vermilion Kohaku, Charcoal/White Shiro Utsuri, Yamabuki Gold, Tancho Orange, and Asagi Grey), varying body proportions, and irregular patch distributions.
- **Living School Behaviour:** Weighted boid-style flocking blended with individual wander phases, smooth boundary avoidance, and depth migration.
- **Layered Water Environment:** Custom GLSL shaders simulating organic pond currents, depth-dependent light attenuation, surface caustic shimmers, moving lily pads, and dynamic interactive ripples.
- **Tactile Interactions:**
  - **Attract (`A`):** Call nearby koi toward pointer clicks with natural orbiting.
  - **Scatter (`S`):** Cause a disturbance sending fish bursting outward.
  - **Feed (`F`):** Drop food pellets to surface-feed koi.
- **Atmosphere Presets:** Seamless transitions between **Dawn**, **Noon**, **Dusk**, **Night**, and **Rain**.
- **Ambient Mode:** Press `Tab` or click Ambient in the dock to hide all UI elements for distraction-free contemplation.
- **Procedural Audio:** Subtle ambient water lap sound synthesised via Web Audio API (off by default; activates on explicit user gesture).
- **Persistent Preferences:** Fish count, motion intensity, atmosphere, and volume persist across browser sessions in localStorage.

---

## Getting Started

### Prerequisites

- Node.js 18+ (tested up to Node.js 26)
- npm 9+

### Installation

```bash
npm install
```

### Development Server

```bash
npm run dev
```

Open the printed URL (typically `http://localhost:5173`) in any modern browser.

### Verification & Testing

```bash
npm run typecheck    # Strict TypeScript checks
npm run test         # Vitest unit test suite (55 tests)
npm run build        # Production bundle
npm run preview      # Preview production build
```

---

## Controls & Shortcuts

| Action | Shortcut | Description |
|---|---|---|
| **Attract** | <kbd>A</kbd> | Set mode to call fish to pointer |
| **Scatter** | <kbd>S</kbd> | Set mode to frighten fish away from pointer |
| **Feed** | <kbd>F</kbd> | Set mode to drop food pellets |
| **Pause / Resume** | <kbd>Space</kbd> | Toggle simulation clock |
| **Ambient Mode** | <kbd>Tab</kbd> | Toggle HUD and dock visibility |
| **Settings** | <kbd>,</kbd> | Open/close settings drawer |
| **Close Overlay** | <kbd>Esc</kbd> | Dismiss settings panel |

---

## Architecture Overview

```
src/
├── types/             # Shared types (FishState, Vec2, PondSettings, presets)
├── utils/
│   ├── math.ts        # Vector operations, wrapAngle, rotateToward, splitmix32 PRNG
│   ├── settings.ts    # localStorage persistence and schema validation
│   └── audio.ts       # Web Audio API procedural sound engine
├── simulation/
│   ├── SimClock.ts    # Fixed-timestep accumulator (60Hz) with tab-suspend guard
│   ├── fishFactory.ts # Procedural koi generator with deterministic seeds
│   ├── steering.ts    # Boid forces (wander, sep, align, coh, boundary, seek, flee)
│   └── PondSimulation.ts # Master simulation loop (fish, ripples, food, disturbances)
├── rendering/
│   └── PondRenderer.ts # Three.js scene, dual GLSL shaders, spine mesh deformation
├── store/
│   └── pondStore.ts   # Zustand state store decoupled from 60fps render loop
├── hooks/
│   └── usePond.ts     # Hook bridging React lifecycle with PondSimulation & PondRenderer
└── components/
    ├── PondCanvas.tsx # WebGL canvas host with pointer interaction listeners
    ├── ControlDock.tsx# Bottom floating pill dock with accessible buttons
    ├── SettingsPanel.tsx # Settings drawer with sliders, atmosphere picker, and toggles
    └── HUD.tsx        # Identity badge, interaction hints, and ambient helpers
```

---

## Troubleshooting

- **Canvas is blank or shows fallback:** Ensure WebGL is enabled in your browser (`chrome://gpu` or `about:support`).
- **No sound after turning audio switch on:** Web browsers require an explicit user gesture (a tap on the pond or a click) before AudioContext can resume.
- **High battery or CPU usage:** Lower the fish count or motion intensity in the Settings panel; the simulation automatically pauses when switching browser tabs.

---

## License

MIT
