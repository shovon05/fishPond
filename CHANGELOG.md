# Changelog

All notable changes to **Living Pond** are documented in this file.

## [1.0.0] - Initial Autonomous Release

### Added
- **Procedural Koi Fish Simulation:**
  - 14-joint spine articulation with trailing spring physics and speed-proportional travelling body waves.
  - Multi-intent steering behaviour combining boundary avoidance, neighbour separation, gentle cohesion, alignment, and wandering.
  - 5 distinct koi colour varieties (Ivory/Vermilion, White/Charcoal, Pale Gold, Warm Orange, Muted Grey) with seeded organic patch distribution.
  - Gradual depth migration affecting translucency, water tint attenuation, and soft shadow offset.
- **Atmospheric Water Rendering:**
  - Dual custom GLSL shaders: procedural pond-bed gradient with organic currents and surface shimmer caustics.
  - Dynamic expanding ripple effects triggered by user clicks, food drops, and fish movements.
  - Floating water lily pads drifting gently with water currents.
  - 5 switchable lighting & atmosphere presets: Dawn, Noon, Dusk, Night, and Rain with smooth transitions.
- **Tactile Pond Interactions:**
  - **Attract Mode (`A`):** Calls nearby koi toward the pointer with natural orbiting.
  - **Scatter Mode (`S`):** Creates a disturbance causing fish to burst away in retreat.
  - **Feed Mode (`F`):** Drops food pellets that drift slowly and attract feeding koi.
- **Controls & Ambient Mode:**
  - Minimal translucent control dock with 44px touch targets.
  - Ambient mode (`Tab`) hiding all controls for distraction-free passive viewing.
  - Settings drawer for adjusting fish count (3–30), motion intensity, atmosphere, visual quality, and audio.
  - Persistent settings via localStorage with schema validation and fallback defaults.
- **Web Audio Sound:**
  - Procedural pink-noise ambient water lap generator running on Web Audio API after user gesture.
- **Quality & Performance:**
  - Zero allocation in simulation hot loop; buffer geometries updated in place.
  - Decoupled fixed-timestep clock (60 Hz) preventing simulation explosions across tab suspension.
  - 55 comprehensive unit tests covering math, steering, factory, clock, and persistence logic.
