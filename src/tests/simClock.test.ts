import { describe, it, expect } from 'vitest';
import { SimClock } from '../simulation/SimClock';

describe('SimClock', () => {
  it('returns 0 steps on first tick', () => {
    const clock = new SimClock(1 / 60);
    expect(clock.tick(0)).toBe(0);
  });

  it('clamps large delta when exceeding maxAccumulated', () => {
    const clock = new SimClock(1 / 60, 0.25);
    clock.tick(0);
    const steps = clock.tick(1);
    expect(steps).toBe(15);
  });

  it('accumulates correctly over multiple small ticks', () => {
    const clock = new SimClock(1 / 60);
    clock.tick(0);
    let total = 0;
    for (let i = 1; i <= 60; i++) {
      total += clock.tick(i / 60);
    }
    expect(total).toBe(60);
  });

  it('clamps large frame delta (tab suspend)', () => {
    const clock = new SimClock(1 / 60, 0.25);
    clock.tick(0);
    const steps = clock.tick(10);
    expect(steps).toBe(15);
  });

  it('returns 0 when paused', () => {
    const clock = new SimClock(1 / 60);
    clock.tick(0);
    clock.pause();
    expect(clock.tick(1)).toBe(0);
    expect(clock.tick(2)).toBe(0);
  });

  it('resumes after pause without time jump and steps regularly', () => {
    const clock = new SimClock(1 / 60);
    clock.tick(0);
    clock.pause();
    clock.resume();
    const steps = clock.tick(100);
    expect(steps).toBe(0);
    const steps2 = clock.tick(100 + 1 / 60 + 1e-6);
    expect(steps2).toBe(1);
  });
});
