// Core type definitions for Living Pond (Nagomi-grade architecture)

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

export interface MinnowState {
  id: number;
  position: Vec2;
  velocity: Vec2;
  heading: number;
  speed: number;
}

export interface FishState {
  id: number;
  position: Vec2;
  velocity: Vec2;
  heading: number;        // radians
  speed: number;
  depth: number;          // 0 = surface, 1 = deep
  size: number;
  preferredSpeed: number;
  turnResponsiveness: number;
  wanderPhase: number;
  personalitySeed: number;
  motionState: FishMotionState;
  stateTimer: number;
  target?: FishTarget;
  // Spine chain (16 joints for high-fidelity fluid bend)
  spine: Vec2[];
  spineAngles: number[];
  // Tail dynamics
  tailPhase: number;
  tailAmplitude: number;
  // Japanese variety style
  colorPalette: number;   // 0: Kohaku, 1: Showa, 2: Yamabuki, 3: Shiro, 4: Asagi, 5: Tancho
  patchSeed: number;
  bodyLength: number;
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
  minnowCount: number;
  motionIntensity: number;   // 0–1
  visualQuality: 'low' | 'medium' | 'high' | 'auto';
  soundEnabled: boolean;
  soundVolume: number;       // 0–1
  atmosphere: AtmospherePreset;
  reducedMotion: boolean;
  ambientMode: boolean;
  showHint: boolean;
  debugSpine: boolean;
}

export const DEFAULT_SETTINGS: PondSettings = {
  fishCount: 14,
  minnowCount: 28,
  motionIntensity: 0.55,
  visualQuality: 'auto',
  soundEnabled: false,
  soundVolume: 0.5,
  atmosphere: 'noon',
  reducedMotion: false,
  ambientMode: false,
  showHint: true,
  debugSpine: false,
};

export interface SimulationConfig {
  worldWidth: number;
  worldHeight: number;
  fixedDt: number;
  maxFish: number;
  wanderWeight: number;
  separationWeight: number;
  alignmentWeight: number;
  cohesionWeight: number;
  boundaryWeight: number;
  separationRadius: number;
  alignmentRadius: number;
  cohesionRadius: number;
  boundaryMargin: number;
  minSpeed: number;
  maxSpeed: number;
  maxForce: number;
  maxTurnRate: number;
}

export const DEFAULT_SIM_CONFIG: SimulationConfig = {
  worldWidth: 2.4,
  worldHeight: 2.4,
  fixedDt: 1 / 60,
  maxFish: 50,
  wanderWeight: 0.45,
  separationWeight: 1.9,
  alignmentWeight: 0.5,
  cohesionWeight: 0.35,
  boundaryWeight: 2.8,
  separationRadius: 0.22,
  alignmentRadius: 0.5,
  cohesionRadius: 0.65,
  boundaryMargin: 0.2,
  minSpeed: 0.04,
  maxSpeed: 0.48,
  maxForce: 0.65,
  maxTurnRate: Math.PI * 1.3,
};
