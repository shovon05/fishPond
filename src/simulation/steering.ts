// Steering behaviours for Living Pond fish simulation

import type { FishState, Vec2, SimulationConfig } from '../types';
import {
  add, sub, scale, limit, normalize, length, lengthSq, distSq,
  lerp, angleDiff, wrapAngle, vec2FromAngle, angleFromVec2, clamp,
} from '../utils/math';

/** Wander: slowly evolving random heading change */
export function steerWander(fish: FishState, dt: number, motionIntensity: number): Vec2 {
  const circleRadius = 0.18;
  const circleDistance = 0.1;
  const jitter = 0.9 * motionIntensity;

  // Advance wander phase
  fish.wanderPhase += (Math.random() - 0.5) * jitter * dt * 4;

  const circleCenter: Vec2 = {
    x: fish.position.x + Math.cos(fish.heading) * circleDistance,
    y: fish.position.y + Math.sin(fish.heading) * circleDistance,
  };
  return {
    x: circleCenter.x + Math.cos(fish.wanderPhase) * circleRadius,
    y: circleCenter.y + Math.sin(fish.wanderPhase) * circleRadius,
  };
}

/** Separation: steer away from nearby fish */
export function steerSeparation(fish: FishState, neighbours: FishState[], cfg: SimulationConfig): Vec2 {
  let steering: Vec2 = { x: 0, y: 0 };
  let count = 0;

  const radiusSq = cfg.separationRadius * cfg.separationRadius;

  for (const other of neighbours) {
    if (other.id === fish.id) continue;
    const dSq = distSq(fish.position, other.position);
    if (dSq < radiusSq && dSq > 1e-9) {
      const diff = sub(fish.position, other.position);
      // Weight by proximity (closer = stronger)
      const w = 1 - Math.sqrt(dSq) / cfg.separationRadius;
      steering = add(steering, scale(normalize(diff), w));
      count++;
    }
  }

  if (count === 0) return { x: 0, y: 0 };
  return scale(steering, 1 / count);
}

/** Alignment: steer toward average heading of nearby fish */
export function steerAlignment(fish: FishState, neighbours: FishState[], cfg: SimulationConfig): Vec2 {
  let avgHeading: Vec2 = { x: 0, y: 0 };
  let count = 0;
  const radiusSq = cfg.alignmentRadius * cfg.alignmentRadius;

  for (const other of neighbours) {
    if (other.id === fish.id) continue;
    if (distSq(fish.position, other.position) < radiusSq) {
      avgHeading = add(avgHeading, vec2FromAngle(other.heading));
      count++;
    }
  }

  if (count === 0) return { x: 0, y: 0 };
  return scale(avgHeading, 1 / count);
}

/** Cohesion: steer toward average position of nearby fish */
export function steerCohesion(fish: FishState, neighbours: FishState[], cfg: SimulationConfig): Vec2 {
  let centroid: Vec2 = { x: 0, y: 0 };
  let count = 0;
  const radiusSq = cfg.cohesionRadius * cfg.cohesionRadius;

  for (const other of neighbours) {
    if (other.id === fish.id) continue;
    if (distSq(fish.position, other.position) < radiusSq) {
      centroid = add(centroid, other.position);
      count++;
    }
  }

  if (count === 0) return { x: 0, y: 0 };
  centroid = scale(centroid, 1 / count);
  return sub(centroid, fish.position);
}

/** Boundary avoidance: steer away from pond edges */
export function steerBoundary(fish: FishState, cfg: SimulationConfig): Vec2 {
  const margin = cfg.boundaryMargin;
  const hw = cfg.worldWidth / 2 - margin;
  const hh = cfg.worldHeight / 2 - margin;
  let steering: Vec2 = { x: 0, y: 0 };

  const { x, y } = fish.position;

  if (x < -hw) {
    const strength = clamp((-hw - x) / margin, 0, 1);
    steering.x += strength;
  } else if (x > hw) {
    const strength = clamp((x - hw) / margin, 0, 1);
    steering.x -= strength;
  }

  if (y < -hh) {
    const strength = clamp((-hh - y) / margin, 0, 1);
    steering.y += strength;
  } else if (y > hh) {
    const strength = clamp((y - hh) / margin, 0, 1);
    steering.y -= strength;
  }

  return steering;
}

/** Seek a target position */
export function steerSeek(fish: FishState, target: Vec2, arrivalRadius = 0.08): Vec2 {
  const toTarget = sub(target, fish.position);
  const d = length(toTarget);
  if (d < 1e-6) return { x: 0, y: 0 };

  // Slow down near target
  const speedFactor = d < arrivalRadius ? d / arrivalRadius : 1;
  const desired = scale(normalize(toTarget), speedFactor);
  return sub(desired, normalize(fish.velocity));
}

/** Orbit around a point (loosely circle rather than stack) */
export function steerOrbit(fish: FishState, center: Vec2, orbitRadius = 0.15): Vec2 {
  const toCenter = sub(center, fish.position);
  const d = length(toCenter);
  if (d < 1e-6) return { x: 0, y: 0 };

  // Tangent: perpendicular to toCenter (counter-clockwise)
  const tangent: Vec2 = { x: -toCenter.y / d, y: toCenter.x / d };
  // If too close, move outward; if too far, move inward
  const radialDesired = normalize(toCenter);
  const radialBlend = (d - orbitRadius) / orbitRadius;
  const desired = {
    x: tangent.x + radialBlend * radialDesired.x,
    y: tangent.y + radialBlend * radialDesired.y,
  };
  return normalize(desired);
}

/** Flee from a disturbance point */
export function steerFlee(fish: FishState, point: Vec2, fleeRadius: number): Vec2 {
  const diff = sub(fish.position, point);
  const dSq = lengthSq(diff);
  if (dSq > fleeRadius * fleeRadius) return { x: 0, y: 0 };
  const strength = 1 - Math.sqrt(dSq) / fleeRadius;
  return scale(normalize(diff), strength * 2);
}

/** Combined steering for one fish; returns desired heading and speed */
export function computeSteering(
  fish: FishState,
  neighbours: FishState[],
  cfg: SimulationConfig,
  dt: number,
  motionIntensity: number,
): { desiredHeading: number; desiredSpeed: number } {
  // Build weighted steering force
  let force: Vec2 = { x: 0, y: 0 };

  // Boundary (highest priority when near edge)
  const boundaryForce = steerBoundary(fish, cfg);
  force = add(force, scale(boundaryForce, cfg.boundaryWeight));

  // Target seeking
  if (fish.target) {
    const now = performance.now() / 1000;
    if (now < fish.target.expiresAt) {
      let targetForce: Vec2;
      if (fish.target.type === 'orbit') {
        targetForce = steerOrbit(fish, fish.target.position, 0.12);
      } else {
        targetForce = steerSeek(fish, fish.target.position);
      }
      force = add(force, scale(targetForce, fish.target.strength));
    } else {
      fish.target = undefined;
    }
  }

  // Social forces (only applied when no strong target)
  const targetStrength = fish.target ? fish.target.strength : 0;
  if (targetStrength < 2) {
    const sep = steerSeparation(fish, neighbours, cfg);
    force = add(force, scale(sep, cfg.separationWeight));

    const ali = steerAlignment(fish, neighbours, cfg);
    force = add(force, scale(ali, cfg.alignmentWeight));

    const coh = steerCohesion(fish, neighbours, cfg);
    force = add(force, scale(coh, cfg.cohesionWeight));
  }

  // Wander
  const wanderDest = steerWander(fish, dt, motionIntensity);
  const wanderForce = sub(wanderDest, fish.position);
  force = add(force, scale(normalize(wanderForce), cfg.wanderWeight));

  // Clamp total force
  const limited = limit(force, cfg.maxForce);

  // Derive desired heading from force
  const desiredHeading =
    lengthSq(limited) > 1e-9 ? angleFromVec2(limited) : fish.heading;

  // Speed: blend toward preferred with intensity
  const baseSpeed = fish.preferredSpeed * (0.6 + motionIntensity * 0.8);
  const desiredSpeed = clamp(baseSpeed, cfg.minSpeed, cfg.maxSpeed * motionIntensity + cfg.minSpeed);

  return { desiredHeading, desiredSpeed };
}

export { lerp, wrapAngle, angleDiff };
