// Fish factory — creates initial FishState with deterministic seeded variation

import type { FishState, MinnowState, Vec2 } from '../types';
import { seededRandom } from '../utils/math';

const SPINE_COUNT = 16;

function makeSpine(pos: Vec2): Vec2[] {
  return Array.from({ length: SPINE_COUNT }, () => ({ x: pos.x, y: pos.y }));
}

export function createFish(id: number, pos: Vec2, globalSeed: number): FishState {
  const rng = seededRandom(globalSeed + id * 7919);
  const r = rng;

  const personalitySeed = (globalSeed + id * 2654435761) >>> 0;

  // Authentic Nagomi-scale koi proportions
  const size = 0.95 + r() * 0.45;           // 0.95–1.40
  const bodyLength = 0.28 + r() * 0.1;     // Large, magnificent koi visible across the pond
  const bodyWidth = bodyLength * (0.24 + r() * 0.05);
  const preferredSpeed = 0.07 + r() * 0.07;
  const turnResponsiveness = 0.5 + r() * 0.5;
  const depth = 0.05 + r() * 0.55;
  const colorPalette = Math.floor(r() * 6);  // 0–5 (Kohaku, Showa, Yamabuki, Shiro, Asagi, Tancho)
  const patchSeed = (r() * 0xffffffff) >>> 0;

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
    tailAmplitude: 0.035 + r() * 0.02,
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
  const halfW = 0.8;
  const halfH = 0.8;

  for (let i = 0; i < count; i++) {
    const angle = rng() * Math.PI * 2;
    const radius = 0.15 + rng() * 0.75;
    const pos: Vec2 = {
      x: Math.cos(angle) * radius * halfW,
      y: Math.sin(angle) * radius * halfH,
    };
    fish.push(createFish(i, pos, seed));
  }

  return fish;
}

export function createMinnows(count: number, seed: number): MinnowState[] {
  const rng = seededRandom(seed + 8888);
  const minnows: MinnowState[] = [];
  for (let i = 0; i < count; i++) {
    const angle = rng() * Math.PI * 2;
    const r = 0.1 + rng() * 0.7;
    const heading = rng() * Math.PI * 2;
    const speed = 0.12 + rng() * 0.1;
    minnows.push({
      id: i,
      position: { x: Math.cos(angle) * r, y: Math.sin(angle) * r },
      velocity: { x: Math.cos(heading) * speed, y: Math.sin(heading) * speed },
      heading,
      speed,
    });
  }
  return minnows;
}

export { SPINE_COUNT };
