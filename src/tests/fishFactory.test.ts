import { describe, it, expect } from 'vitest';
import { createFish, createSchool } from '../simulation/fishFactory';
import type { Vec2 } from '../types';

describe('fishFactory', () => {
  describe('createFish', () => {
    it('creates a fish with valid initial state', () => {
      const pos: Vec2 = { x: 0.1, y: 0.2 };
      const fish = createFish(0, pos, 42);

      expect(fish.id).toBe(0);
      expect(fish.position.x).toBeCloseTo(0.1);
      expect(fish.position.y).toBeCloseTo(0.2);
      expect(fish.speed).toBeGreaterThan(0);
      expect(fish.preferredSpeed).toBeGreaterThan(0);
      expect(fish.size).toBeGreaterThan(0);
      expect(fish.depth).toBeGreaterThanOrEqual(0);
      expect(fish.depth).toBeLessThanOrEqual(1);
      expect(fish.colorPalette).toBeGreaterThanOrEqual(0);
      expect(fish.colorPalette).toBeLessThanOrEqual(4);
      expect(fish.spine).toHaveLength(14);
      expect(fish.motionState).toBe('cruise');
    });

    it('produces deterministic output for same seed', () => {
      const pos: Vec2 = { x: 0, y: 0 };
      const fish1 = createFish(0, pos, 42);
      const fish2 = createFish(0, pos, 42);

      expect(fish1.preferredSpeed).toBeCloseTo(fish2.preferredSpeed);
      expect(fish1.colorPalette).toBe(fish2.colorPalette);
      expect(fish1.patchSeed).toBe(fish2.patchSeed);
    });

    it('produces different fish for different ids', () => {
      const pos: Vec2 = { x: 0, y: 0 };
      const fish0 = createFish(0, pos, 42);
      const fish1 = createFish(1, pos, 42);

      expect(fish0.preferredSpeed).not.toBeCloseTo(fish1.preferredSpeed);
    });
  });

  describe('createSchool', () => {
    it('creates the correct number of fish', () => {
      const school = createSchool(12, 42);
      expect(school).toHaveLength(12);
    });

    it('assigns unique ids', () => {
      const school = createSchool(8, 42);
      const ids = school.map((f) => f.id);
      const unique = new Set(ids);
      expect(unique.size).toBe(8);
    });

    it('distributes fish across the pond (not all at same position)', () => {
      const school = createSchool(10, 42);
      const positions = school.map((f) => `${f.position.x.toFixed(3)},${f.position.y.toFixed(3)}`);
      const unique = new Set(positions);
      expect(unique.size).toBeGreaterThan(1);
    });

    it('is deterministic', () => {
      const school1 = createSchool(5, 100);
      const school2 = createSchool(5, 100);

      for (let i = 0; i < 5; i++) {
        expect(school1[i].position.x).toBeCloseTo(school2[i].position.x);
        expect(school1[i].position.y).toBeCloseTo(school2[i].position.y);
      }
    });
  });
});
