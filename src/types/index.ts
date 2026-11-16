// Core type definitions for Living Pond

export interface Vec2 {
  x: number;
  y: number;
}

export type FishMotionState = 'cruise' | 'glide' | 'turn' | 'burst' | 'hover' | 'investigate';

export interface FishTarget {
  position: Vec2;
  type: 'food' | 'attraction' | 'orbit';
  strength: number;
  expiresAt: number;
}

export interface FishState {
  id: number;
  position: Vec2;
  velocity: Vec2;
  heading: number;        // radians, 0 = right, CCW positive
  speed: number;
  depth: number;          // 0 = surface, 1 = deepest
  size: number;           // scale factor relative to base
  preferredSpeed: number;
  turnResponsiveness: number;
  wanderPhase: number;
  personalitySeed: number;
  motionState: FishMotionState;
  stateTimer: number;
  target?: FishTarget;
  // Spine for body articulation (12 points, head to tail)
  spine: Vec2[];
  spineAngles: number[];
  // Tail wave
  tailPhase: number;
  tailAmplitude: number;
  // Visual properties (derived from personalitySeed)
  colorPalette: number;   // 0–4
  patchSeed: number;
  bodyLength: number;     // in world units
  bodyWidth: number;
  depthTarget: number;
  depthChangeTimer: number;
}

export interface RippleState {
  id: number;
  position: Vec2;
  radius: number;
  maxRadius: number;
  opacity: number;
  birthTime: number;
  lifetime: number;
  type: 'tap' | 'fish' | 'rain' | 'food';
}

export interface FoodParticle {
  id: number;
  position: Vec2;
  velocity: Vec2;
  opacity: number;
  birthTime: number;
  lifetime: number;
  eaten: boolean;
}

export type AtmospherePreset = 'dawn' | 'noon' | 'dusk' | 'night' | 'rain';

export interface PondSettings {
  fishCount: number;
  motionIntensity: number;   // 0–1
  visualQuality: 'low' | 'medium' | 'high' | 'auto';
  soundEnabled: boolean;
  soundVolume: number;       // 0–1
  atmosphere: AtmospherePreset;
  reducedMotion: boolean;
  ambientMode: boolean;
  showHint: boolean;
}

export const DEFAULT_SETTINGS: PondSettings = {
  fishCount: 12,
  motionIntensity: 0.5,
  visualQuality: 'auto',
  soundEnabled: false,
  soundVolume: 0.5,
  atmosphere: 'noon',
  reducedMotion: false,
  ambientMode: false,
  showHint: true,
};

export interface SimulationConfig {
  worldWidth: number;    // e.g. 2.0 (from -1 to 1)
  worldHeight: number;
  fixedDt: number;       // 1/60
  maxFish: number;
  // Steering weights
  wanderWeight: number;
  separationWeight: number;
  alignmentWeight: number;
  cohesionWeight: number;
  boundaryWeight: number;
  // Radii
  separationRadius: number;
  alignmentRadius: number;
  cohesionRadius: number;
  boundaryMargin: number;
  // Speeds
  minSpeed: number;
  maxSpeed: number;
  maxForce: number;
  maxTurnRate: number;   // radians per second
}

export const DEFAULT_SIM_CONFIG: SimulationConfig = {
  worldWidth: 2.0,
  worldHeight: 2.0,
  fixedDt: 1 / 60,
  maxFish: 50,
  wanderWeight: 0.4,
  separationWeight: 1.8,
  alignmentWeight: 0.5,
  cohesionWeight: 0.3,
  boundaryWeight: 2.5,
  separationRadius: 0.12,
  alignmentRadius: 0.35,
  cohesionRadius: 0.5,
  boundaryMargin: 0.15,
  minSpeed: 0.03,
  maxSpeed: 0.45,
  maxForce: 0.6,
  maxTurnRate: Math.PI * 1.2,
};
