// Vector math utilities for Living Pond simulation

import type { Vec2 } from '../types';

export function vec2(x: number, y: number): Vec2 {
  return { x, y };
}

export function add(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function sub(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function scale(v: Vec2, s: number): Vec2 {
  return { x: v.x * s, y: v.y * s };
}

export function dot(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y;
}

export function lengthSq(v: Vec2): number {
  return v.x * v.x + v.y * v.y;
}

export function length(v: Vec2): number {
  return Math.sqrt(lengthSq(v));
}

export function normalize(v: Vec2): Vec2 {
  const len = length(v);
  if (len < 1e-9) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

export function limit(v: Vec2, max: number): Vec2 {
  const sq = lengthSq(v);
  if (sq > max * max) {
    return scale(normalize(v), max);
  }
  return { x: v.x, y: v.y };
}

export function distSq(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export function dist(a: Vec2, b: Vec2): number {
  return Math.sqrt(distSq(a, b));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpVec2(a: Vec2, b: Vec2, t: number): Vec2 {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function angleFromVec2(v: Vec2): number {
  return Math.atan2(v.y, v.x);
}

export function vec2FromAngle(angle: number): Vec2 {
  return { x: Math.cos(angle), y: Math.sin(angle) };
}

export function angleDiff(a: number, b: number): number {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function wrapAngle(a: number): number {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

/** Rotate angle by delta, respecting max turn rate */
export function rotateToward(current: number, target: number, maxDelta: number): number {
  const diff = angleDiff(current, target);
  const step = clamp(diff, -maxDelta, maxDelta);
  return wrapAngle(current + step);
}

/** Seeded pseudo-random using splitmix32 */
export function seededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x9e3779b9) | 0;
    let z = s;
    z = ((z ^ (z >>> 16)) * 0x85ebca6b) | 0;
    z = ((z ^ (z >>> 13)) * 0xc2b2ae35) | 0;
    return ((z ^ (z >>> 16)) >>> 0) / 4294967296;
  };
}

/** Map a value from [inMin,inMax] to [outMin,outMax] */
export function mapRange(
  v: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return outMin + ((v - inMin) / (inMax - inMin)) * (outMax - outMin);
}
