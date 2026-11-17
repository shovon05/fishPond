# Changelog

All notable changes to **Living Pond** are documented in this file.

## [1.1.0] - Frontend Design & Aesthetic Polish

### Refined
- **Bespoke Japanese Aesthetic:** Replaced standard icons with bespoke inline SVG vector icons and introduced a traditional Japanese seal mark ("和" - Harmony) in the HUD.
- **Design Token Hierarchy:** Transitioned from generic dark styling to a restrained 5-color Japanese garden palette: Pond Abyss (`#031118`), Pond Deep (`#072530`), Pond Mid (`#0d4653`), Celadon (`#78a89f`), and Vermilion (`#e0533c`).
- **Control Dock Craftsmanship:** Redesigned into an ultra-clean frosted glass pill (`backdrop-filter: blur(20px)`) with tactile micro-interactions, subtle active glow, and keyboard hotkey hints.
- **Settings Drawer Typography:** Polished modal drawer with clean segmented controls, refined slider track styling, and legible parameter hierarchies.

## [1.0.0] - Initial Autonomous Release

### Added
- **Procedural Koi Fish Simulation:**
  - 16-joint spine articulation with trailing spring physics and speed-proportional travelling body waves.
  - Multi-intent steering behaviour combining boundary avoidance, neighbour separation, gentle cohesion, alignment, and wandering.
  - 6 distinct Japanese koi varieties (Kohaku, Showa, Yamabuki, Shiro Utsuri, Asagi, Tancho) with procedural spot shaders.
  - Schooling minnows with boid dynamics that dart away from disturbances and koi.
  - Gradual depth migration affecting translucency, water tint attenuation, and soft shadow offset.
- **Atmospheric Water Rendering:**
  - Dual custom GLSL shaders: procedural pond-bed gradient with organic currents and surface shimmer caustics.
  - Dynamic expanding ripple effects triggered by user clicks, food drops, rain, and fish movements.
  - Floating water lily pads with procedural blooming lotus flowers drifting gently with water currents.
  - 5 switchable lighting & atmosphere presets: Dawn, Noon, Dusk, Night, and Rain with smooth transitions.
- **Tactile Pond Interactions:**
  - **Attract Mode (`A`):** Calls nearby koi toward the pointer with natural orbiting.
  - **Scatter Mode (`Space`):** Creates a disturbance causing fish to burst away in retreat.
  - **Feed Mode (`F`):** Drops food pellets that drift slowly and attract feeding koi.
  - **Spine Debug (`D`):** Visualizes the procedural kinematic spine skeleton.
- **Controls & Ambient Mode:**
  - Minimal translucent control dock with 44px touch targets.
  - Ambient mode (`H` / `Tab`) hiding all controls for distraction-free passive viewing.
  - Settings drawer for adjusting fish count (1–40), motion intensity, atmosphere, visual quality, and audio.
  - Persistent settings via localStorage with schema validation and fallback defaults.
- **Web Audio Sound:**
  - Procedural pink-noise ambient water lap generator running on Web Audio API after user gesture.
- **Quality & Performance:**
  - Zero allocation in simulation hot loop; buffer geometries updated in place.
  - Decoupled fixed-timestep clock (60 Hz) preventing simulation explosions across tab suspension.
  - 55 comprehensive unit tests covering math, steering, factory, clock, and persistence logic.
