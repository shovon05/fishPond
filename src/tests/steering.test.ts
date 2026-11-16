import { describe, it, expect } from 'vitest';
import {
  steerBoundary, steerSeparation, steerAlignment, steerCohesion,
} from '../simulation/steering';
import { createFish } from '../simulation/fishFactory';
import { DEFAULT_SIM_CONFIG } from '../types';
import { length } from '../utils/math';

const cfg = { ...DEFAULT_SIM_CONFIG };

function makeFishAt(x: number, y: number) {
  const fish = createFish(0, { x, y }, 42);
  fish.position = { x, y };
  return fish;
}

describe('steering', () => {
  describe('steerBoundary', () => {
    it('returns zero when well inside boundary', () => {
      const fish = makeFishAt(0, 0);
      const force = steerBoundary(fish, cfg);
      expect(length(force)).toBeCloseTo(0);
    });

    it('steers right when near left edge', () => {
      const fish = makeFishAt(-0.95, 0);
      const force = steerBoundary(fish, cfg);
      expect(force.x).toBeGreaterThan(0);
    });

    it('steers left when near right edge', () => {
      const fish = makeFishAt(0.95, 0);
      const force = steerBoundary(fish, cfg);
      expect(force.x).toBeLessThan(0);
    });

    it('steers down when near top edge', () => {
      const fish = makeFishAt(0, 0.95);
      const force = steerBoundary(fish, cfg);
      expect(force.y).toBeLessThan(0);
    });

    it('steers up when near bottom edge', () => {
      const fish = makeFishAt(0, -0.95);
      const force = steerBoundary(fish, cfg);
      expect(force.y).toBeGreaterThan(0);
    });
  });

  describe('steerSeparation', () => {
    it('pushes fish apart when overlapping', () => {
      const fish0 = makeFishAt(0, 0);
      fish0.id = 0;
      const fish1 = makeFishAt(0.05, 0);
      fish1.id = 1;
      const force = steerSeparation(fish0, [fish0, fish1], cfg);
      expect(force.x).toBeLessThan(0);
    });

    it('returns zero when no neighbours in radius', () => {
      const fish0 = makeFishAt(0, 0);
      fish0.id = 0;
      const fish1 = makeFishAt(2, 2);
      fish1.id = 1;
      const force = steerSeparation(fish0, [fish0, fish1], cfg);
      expect(length(force)).toBeCloseTo(0);
    });
  });

  describe('steerAlignment', () => {
    it('returns non-zero when neighbours are present', () => {
      const fish0 = makeFishAt(0, 0);
      fish0.id = 0;
      const fish1 = makeFishAt(0.1, 0);
      fish1.id = 1;
      fish1.heading = Math.PI / 4;
      const force = steerAlignment(fish0, [fish0, fish1], cfg);
      expect(length(force)).toBeGreaterThan(0);
    });
  });

  describe('steerCohesion', () => {
    it('attracts toward centroid of group', () => {
      const fish0 = makeFishAt(0, 0);
      fish0.id = 0;
      const fish1 = makeFishAt(0.2, 0);
      fish1.id = 1;
      const fish2 = makeFishAt(0.3, 0);
      fish2.id = 2;
      const force = steerCohesion(fish0, [fish0, fish1, fish2], cfg);
      expect(force.x).toBeGreaterThan(0);
    });
  });
});
