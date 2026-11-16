// Main simulation engine for Living Pond (supporting Koi, Minnow schools, Ripples, and Weather)

import type {
  FishState, MinnowState, RippleState, FoodParticle, Vec2, SimulationConfig,
} from '../types';
import { DEFAULT_SIM_CONFIG } from '../types';
import { createSchool, createFish, createMinnows, SPINE_COUNT } from './fishFactory';
import { computeSteering } from './steering';
import {
  add, sub, scale, normalize, lengthSq, distSq,
  lerp, clamp, rotateToward, seededRandom,
} from '../utils/math';

const FOOD_LIFETIME = 18;
const RIPPLE_LIFETIME_TAP = 2.8;
const RIPPLE_LIFETIME_FISH = 1.2;

let nextRippleId = 1;
let nextFoodId = 1;

export class PondSimulation {
  fish: FishState[] = [];
  minnows: MinnowState[] = [];
  ripples: RippleState[] = [];
  food: FoodParticle[] = [];
  time: number = 0;

  private cfg: SimulationConfig;
  private seed: number;
  private disturbance?: { position: Vec2; strength: number; expiresAt: number };
  private rainTimer: number = 0;

  constructor(seed = 42, cfg: Partial<SimulationConfig> = {}) {
    this.seed = seed;
    this.cfg = { ...DEFAULT_SIM_CONFIG, ...cfg };
  }

  init(fishCount: number, minnowCount = 28): void {
    this.fish = createSchool(fishCount, this.seed);
    this.minnows = createMinnows(minnowCount, this.seed);
    this.ripples = [];
    this.food = [];
    this.time = 0;
  }

  resize(fishCount: number): void {
    const current = this.fish.length;
    if (fishCount > current) {
      const rng = seededRandom(this.seed + current * 999);
      for (let i = current; i < fishCount; i++) {
        const pos: Vec2 = {
          x: (rng() - 0.5) * 1.6,
          y: (rng() - 0.5) * 1.6,
        };
        this.fish.push(createFish(i, pos, this.seed + i));
      }
    } else if (fishCount < current) {
      this.fish = this.fish.slice(0, fishCount);
    }
  }

  resizeMinnows(count: number): void {
    const current = this.minnows.length;
    if (count > current) {
      const added = createMinnows(count - current, this.seed + current);
      this.minnows.push(...added);
    } else if (count < current) {
      this.minnows = this.minnows.slice(0, count);
    }
  }

  step(dt: number, motionIntensity: number, isRaining = false): void {
    this.time += dt;
    const now = this.time;

    if (isRaining) {
      this.rainTimer += dt;
      if (this.rainTimer > 0.08) {
        this.rainTimer = 0;
        const rx = (Math.random() - 0.5) * 1.8;
        const ry = (Math.random() - 0.5) * 1.8;
        this.addRipple({ x: rx, y: ry }, 'rain');
      }
    }

    this.updateFish(dt, motionIntensity);
    this.updateMinnows(dt, motionIntensity);
    this.updateRipples(now);
    this.updateFood(dt, now);
    this.updateDisturbance(now);
  }

  attractToPoint(pos: Vec2, strength = 3.0, radius = 0.7, duration = 6): void {
    const expiresAt = this.time + duration;
    for (const fish of this.fish) {
      const dSq = distSq(fish.position, pos);
      if (dSq < radius * radius) {
        const factor = 1 - Math.sqrt(dSq) / radius;
        fish.target = {
          position: pos,
          type: Math.random() < 0.65 ? 'orbit' : 'attraction',
          strength: strength * factor,
          expiresAt,
        };
        fish.motionState = 'investigate';
      }
    }

    for (const minnow of this.minnows) {
      const dSq = distSq(minnow.position, pos);
      if (dSq < 0.4 * 0.4) {
        const diff = sub(minnow.position, pos);
        minnow.heading = Math.atan2(diff.y, diff.x);
        minnow.speed = 0.35;
      }
    }

    this.addRipple(pos, 'tap');
  }

  scatter(pos: Vec2, strength = 4.5, radius = 0.85): void {
    const expiresAt = this.time + 3.2;
    for (const fish of this.fish) {
      const diff = sub(fish.position, pos);
      const dSq = lengthSq(diff);
      if (dSq < radius * radius) {
        const d = Math.sqrt(dSq);
        const factor = Math.max(0, 1 - d / radius);
        const fleeDir = d > 1e-6
          ? scale(diff, 1 / d)
          : { x: Math.random() - 0.5, y: Math.random() - 0.5 };
        fish.target = {
          position: add(fish.position, scale(fleeDir, 0.6)),
          type: 'attraction',
          strength: strength * factor,
          expiresAt,
        };
        fish.motionState = 'burst';
        fish.stateTimer = 0.7;
      }
    }

    for (const minnow of this.minnows) {
      const diff = sub(minnow.position, pos);
      const dSq = lengthSq(diff);
      if (dSq < radius * radius) {
        minnow.heading = Math.atan2(diff.y, diff.x) + (Math.random() - 0.5) * 0.4;
        minnow.speed = 0.42;
      }
    }

    this.disturbance = { position: pos, strength, expiresAt };
    this.addRipple(pos, 'tap');
  }

  feed(pos: Vec2): void {
    const now = this.time;
    for (let i = 0; i < 7; i++) {
      const angle = (i / 7) * Math.PI * 2 + Math.random() * 0.5;
      const r = 0.04 + Math.random() * 0.06;
      const foodPos: Vec2 = {
        x: pos.x + Math.cos(angle) * r,
        y: pos.y + Math.sin(angle) * r,
      };
      this.food.push({
        id: nextFoodId++,
        position: foodPos,
        velocity: { x: (Math.random() - 0.5) * 0.012, y: (Math.random() - 0.5) * 0.012 },
        opacity: 1,
        birthTime: now,
        lifetime: FOOD_LIFETIME,
        eaten: false,
      });
    }
    this.attractToPoint(pos, 3.5, 0.9, 8);
  }

  addRipple(pos: Vec2, type: RippleState['type']): void {
    const isLarge = type === 'tap';
    const maxR = type === 'rain' ? 0.07 : isLarge ? 0.24 : 0.1;
    this.ripples.push({
      id: nextRippleId++,
      position: { ...pos },
      radius: 0,
      maxRadius: maxR,
      opacity: type === 'rain' ? 0.45 : 0.85,
      birthTime: this.time,
      lifetime: isLarge ? RIPPLE_LIFETIME_TAP : RIPPLE_LIFETIME_FISH,
      type,
    });
    if (this.ripples.length > 36) {
      this.ripples.splice(0, this.ripples.length - 36);
    }
  }

  private updateFish(dt: number, motionIntensity: number): void {
    const cfg = this.cfg;

    for (const fish of this.fish) {
      fish.stateTimer -= dt;
      if (fish.stateTimer <= 0) {
        this.transitionState(fish);
      }

      fish.depthChangeTimer -= dt;
      if (fish.depthChangeTimer <= 0) {
        fish.depthTarget = 0.05 + Math.random() * 0.6;
        fish.depthChangeTimer = 4 + Math.random() * 8;
      }
      fish.depth = lerp(fish.depth, fish.depthTarget, dt * 0.35);

      const { desiredHeading, desiredSpeed } = computeSteering(
        fish, this.fish, cfg, dt, motionIntensity
      );

      let extraForce: Vec2 = { x: 0, y: 0 };
      if (this.disturbance && this.time < this.disturbance.expiresAt) {
        const diff = sub(fish.position, this.disturbance.position);
        const dSq = lengthSq(diff);
        const fleeR = 0.6;
        if (dSq < fleeR * fleeR && dSq > 1e-9) {
          const factor = 1 - Math.sqrt(dSq) / fleeR;
          extraForce = scale(normalize(diff), factor * this.disturbance.strength);
        }
      }

      const maxTurn = cfg.maxTurnRate * fish.turnResponsiveness * dt;
      fish.heading = rotateToward(fish.heading, desiredHeading, maxTurn);

      fish.speed = lerp(fish.speed, desiredSpeed, dt * 2.8);
      fish.speed = clamp(fish.speed, cfg.minSpeed, cfg.maxSpeed);

      const targetVel = {
        x: Math.cos(fish.heading) * fish.speed + extraForce.x * dt,
        y: Math.sin(fish.heading) * fish.speed + extraForce.y * dt,
      };
      fish.velocity = {
        x: lerp(fish.velocity.x, targetVel.x, dt * 4.5),
        y: lerp(fish.velocity.y, targetVel.y, dt * 4.5),
      };

      fish.position = {
        x: fish.position.x + fish.velocity.x * dt,
        y: fish.position.y + fish.velocity.y * dt,
      };

      const hw = cfg.worldWidth / 2 - 0.05;
      const hh = cfg.worldHeight / 2 - 0.05;
      fish.position.x = clamp(fish.position.x, -hw, hw);
      fish.position.y = clamp(fish.position.y, -hh, hh);

      this.updateSpine(fish, dt);

      const tailSpeed = 1.8 + (fish.speed / fish.preferredSpeed) * 1.8;
      fish.tailPhase += tailSpeed * dt * (1 + motionIntensity);
    }
  }

  private updateMinnows(dt: number, motionIntensity: number): void {
    const hw = 1.05;
    const hh = 1.05;

    for (const m of this.minnows) {
      m.heading += (Math.random() - 0.5) * 0.3 * motionIntensity;
      if (m.position.x < -hw) m.heading = 0;
      else if (m.position.x > hw) m.heading = Math.PI;
      if (m.position.y < -hh) m.heading = Math.PI / 2;
      else if (m.position.y > hh) m.heading = -Math.PI / 2;

      m.speed = lerp(m.speed, 0.12, dt * 1.5);

      m.velocity.x = Math.cos(m.heading) * m.speed;
      m.velocity.y = Math.sin(m.heading) * m.speed;

      m.position.x += m.velocity.x * dt;
      m.position.y += m.velocity.y * dt;
    }
  }

  private transitionState(fish: FishState): void {
    const rng = Math.random();
    if (fish.motionState === 'burst') {
      fish.motionState = 'glide';
      fish.stateTimer = 1 + Math.random() * 1.5;
    } else if (rng < 0.42) {
      fish.motionState = 'cruise';
      fish.stateTimer = 2.5 + Math.random() * 4;
    } else if (rng < 0.65) {
      fish.motionState = 'glide';
      fish.stateTimer = 1.2 + Math.random() * 2;
    } else if (rng < 0.78) {
      fish.motionState = 'hover';
      fish.stateTimer = 0.6 + Math.random() * 1.5;
    } else {
      fish.motionState = 'turn';
      fish.stateTimer = 0.4 + Math.random() * 0.8;
    }
  }

  private updateSpine(fish: FishState, dt: number): void {
    const spine = fish.spine;
    const angles = fish.spineAngles;
    const segLen = fish.bodyLength / (SPINE_COUNT - 1);

    spine[0] = { ...fish.position };
    angles[0] = fish.heading;

    for (let i = 1; i < SPINE_COUNT; i++) {
      const prev = spine[i - 1];
      const prevAngle = angles[i - 1];

      const targetX = prev.x - Math.cos(prevAngle) * segLen;
      const targetY = prev.y - Math.sin(prevAngle) * segLen;

      const t = i / (SPINE_COUNT - 1);
      const wave = Math.sin(fish.tailPhase - t * Math.PI * 2.6) * fish.tailAmplitude * t * t;
      const waveDir = { x: -Math.sin(prevAngle), y: Math.cos(prevAngle) };

      const target = {
        x: targetX + waveDir.x * wave,
        y: targetY + waveDir.y * wave,
      };

      const lerpRate = dt * 19;
      spine[i] = {
        x: lerp(spine[i].x, target.x, Math.min(1, lerpRate)),
        y: lerp(spine[i].y, target.y, Math.min(1, lerpRate)),
      };

      const dx = spine[i - 1].x - spine[i].x;
      const dy = spine[i - 1].y - spine[i].y;
      if (Math.abs(dx) + Math.abs(dy) > 1e-9) {
        const targetAngle = Math.atan2(dy, dx);
        angles[i] = lerp(angles[i - 1], targetAngle, 0.65);
      }
    }
  }

  private updateRipples(now: number): void {
    this.ripples = this.ripples.filter((r) => {
      const age = now - r.birthTime;
      if (age >= r.lifetime) return false;
      const t = age / r.lifetime;
      r.radius = r.maxRadius * t;
      r.opacity = (1 - t) * 0.75;
      return true;
    });
  }

  private updateFood(dt: number, now: number): void {
    this.food = this.food.filter((p) => {
      const age = now - p.birthTime;
      if (age >= p.lifetime || p.eaten) return false;

      p.position = add(p.position, scale(p.velocity, dt));
      p.opacity = clamp(1 - age / p.lifetime, 0, 1);

      for (const fish of this.fish) {
        if (distSq(fish.position, p.position) < 0.025 * 0.025) {
          p.eaten = true;
          return false;
        }
      }
      return true;
    });
  }

  private updateDisturbance(now: number): void {
    if (this.disturbance && now > this.disturbance.expiresAt) {
      this.disturbance = undefined;
    }
  }
}
