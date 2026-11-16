import { describe, it, expect } from 'vitest';
import {
  vec2, add, sub, scale, length, lengthSq, normalize, limit,
  distSq, dist, lerp, clamp, angleFromVec2, vec2FromAngle,
  angleDiff, wrapAngle, rotateToward, seededRandom, mapRange,
} from '../utils/math';

describe('vec2 math', () => {
  it('creates a vector', () => {
    expect(vec2(1, 2)).toEqual({ x: 1, y: 2 });
  });

  it('adds two vectors', () => {
    expect(add({ x: 1, y: 2 }, { x: 3, y: 4 })).toEqual({ x: 4, y: 6 });
  });

  it('subtracts two vectors', () => {
    expect(sub({ x: 5, y: 3 }, { x: 2, y: 1 })).toEqual({ x: 3, y: 2 });
  });

  it('scales a vector', () => {
    expect(scale({ x: 2, y: 3 }, 2)).toEqual({ x: 4, y: 6 });
  });

  it('computes length squared', () => {
    expect(lengthSq({ x: 3, y: 4 })).toBe(25);
  });

  it('computes length', () => {
    expect(length({ x: 3, y: 4 })).toBeCloseTo(5);
  });

  it('normalizes a vector', () => {
    const n = normalize({ x: 3, y: 4 });
    expect(length(n)).toBeCloseTo(1);
    expect(n.x).toBeCloseTo(0.6);
    expect(n.y).toBeCloseTo(0.8);
  });

  it('normalizes zero vector to zero', () => {
    const n = normalize({ x: 0, y: 0 });
    expect(n).toEqual({ x: 0, y: 0 });
  });

  it('limits a vector', () => {
    const v = limit({ x: 10, y: 0 }, 3);
    expect(v.x).toBeCloseTo(3);
    expect(v.y).toBeCloseTo(0);
  });

  it('does not limit a short vector', () => {
    const v = limit({ x: 2, y: 0 }, 5);
    expect(v.x).toBeCloseTo(2);
    expect(v.y).toBeCloseTo(0);
  });

  it('computes distSq', () => {
    expect(distSq({ x: 0, y: 0 }, { x: 3, y: 4 })).toBeCloseTo(25);
  });

  it('computes dist', () => {
    expect(dist({ x: 0, y: 0 }, { x: 3, y: 4 })).toBeCloseTo(5);
  });
});

describe('scalar math', () => {
  it('lerps', () => {
    expect(lerp(0, 10, 0.5)).toBeCloseTo(5);
    expect(lerp(0, 10, 0)).toBeCloseTo(0);
    expect(lerp(0, 10, 1)).toBeCloseTo(10);
  });

  it('clamps', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('mapRange', () => {
    expect(mapRange(0.5, 0, 1, 0, 100)).toBeCloseTo(50);
    expect(mapRange(0, 0, 1, -1, 1)).toBeCloseTo(-1);
  });
});

describe('angle math', () => {
  it('angleFromVec2 is atan2', () => {
    expect(angleFromVec2({ x: 1, y: 0 })).toBeCloseTo(0);
    expect(angleFromVec2({ x: 0, y: 1 })).toBeCloseTo(Math.PI / 2);
  });

  it('vec2FromAngle is inverse of angleFromVec2', () => {
    const v = vec2FromAngle(Math.PI / 4);
    expect(v.x).toBeCloseTo(Math.cos(Math.PI / 4));
    expect(v.y).toBeCloseTo(Math.sin(Math.PI / 4));
  });

  it('angleDiff returns shortest path', () => {
    expect(angleDiff(0, Math.PI)).toBeCloseTo(Math.PI);
    expect(angleDiff(Math.PI * 1.9, 0)).toBeCloseTo(Math.PI * 0.1);
  });

  it('wrapAngle keeps angle in [-pi, pi]', () => {
    expect(wrapAngle(Math.PI * 3)).toBeCloseTo(Math.PI);
    expect(wrapAngle(-Math.PI * 2 - 0.1)).toBeCloseTo(-0.1, 2);
  });

  it('rotateToward moves by at most maxDelta', () => {
    const result = rotateToward(0, Math.PI, 0.1);
    expect(result).toBeCloseTo(0.1);
  });

  it('rotateToward reaches target when close', () => {
    const result = rotateToward(0, 0.05, 0.1);
    expect(result).toBeCloseTo(0.05);
  });
});

describe('seededRandom', () => {
  it('produces consistent sequence for same seed', () => {
    const rng1 = seededRandom(42);
    const rng2 = seededRandom(42);
    expect(rng1()).toBeCloseTo(rng2());
    expect(rng1()).toBeCloseTo(rng2());
    expect(rng1()).toBeCloseTo(rng2());
  });

  it('produces different sequences for different seeds', () => {
    const rng1 = seededRandom(42);
    const rng2 = seededRandom(43);
    expect(rng1()).not.toBe(rng2());
  });

  it('produces values in [0, 1)', () => {
    const rng = seededRandom(99);
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});
