// Fish factory — creates initial FishState with deterministic seeded variation

import type { FishState, Vec2 } from '../types';
import { seededRandom } from '../utils/math';

const SPINE_COUNT = 16;

function makeSpine(pos: Vec2): Vec2[] {
  return Array.from({ length: SPINE_COUNT }, () => ({ x: pos.x, y: pos.y }));
}

export function createFish(id: number, pos: Vec2, globalSeed: number): FishState {
  const rng = seededRandom(globalSeed + id * 7919);
  const r = rng;

  const personalitySeed = (globalSeed + id * 2654435761) >>> 0;

  // Realistic pond dimensions: fish should be prominent, graceful koi
  const size = 0.85 + r() * 0.45;           // 0.85–1.30
  const bodyLength = 0.22 + r() * 0.08;    // substantial size in world coordinates [-1, 1]
  const bodyWidth = bodyLength * (0.24 + r() * 0.06);
  const preferredSpeed = 0.08 + r() * 0.08;
  const turnResponsiveness = 0.5 + r() * 0.5;
  const depth = 0.1 + r() * 0.5;           // keep closer to visible depth
  const colorPalette = Math.floor(r() * 5);  // 0–4
  const patchSeed = (r() * 0xffffffff) >>> 0;

  // Scatter starting positions
  const heading = r() * Math.PI * 2;
  const speed = preferredSpeed * (0.8 + r() * 0.4);

  return {
    id,
    position: { x: pos.x, y: pos.y },
    velocity: {
      x: Math.cos(heading) * speed,
      y: Math.sin(heading) * speed,
    },
    heading,
    speed,
    depth,
    size,
    preferredSpeed,
    turnResponsiveness,
    wanderPhase: r() * Math.PI * 2,
    personalitySeed,
    motionState: 'cruise',
    stateTimer: r() * 3,
    target: undefined,
    spine: makeSpine(pos),
    spineAngles: new Array(SPINE_COUNT).fill(heading),
    tailPhase: r() * Math.PI * 2,
    tailAmplitude: 0.025 + r() * 0.015,
    colorPalette,
    patchSeed,
    bodyLength,
    bodyWidth,
    depthTarget: depth,
    depthChangeTimer: 3 + r() * 6,
  };
}

export function createSchool(count: number, seed: number): FishState[] {
  const rng = seededRandom(seed);
  const fish: FishState[] = [];
  const halfW = 0.75;
  const halfH = 0.75;

  for (let i = 0; i < count; i++) {
    const angle = rng() * Math.PI * 2;
    const radius = 0.2 + rng() * 0.6;
    const pos: Vec2 = {
      x: Math.cos(angle) * radius * halfW,
      y: Math.sin(angle) * radius * halfH,
    };
    fish.push(createFish(i, pos, seed));
  }

  return fish;
}

export { SPINE_COUNT };
