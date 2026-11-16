// usePond — the main hook that runs the pond simulation and rendering loop

import { useEffect, useRef, useCallback } from 'react';
import { PondSimulation } from '../simulation/PondSimulation';
import { PondRenderer } from '../rendering/PondRenderer';
import { SimClock } from '../simulation/SimClock';
import { usePondStore } from '../store/pondStore';

export interface PondInteractions {
  attractToPoint: (cssX: number, cssY: number) => void;
  scatter: (cssX: number, cssY: number) => void;
  feed: (cssX: number, cssY: number) => void;
}

export function usePond(canvasRef: React.RefObject<HTMLCanvasElement>): {
  interactions: PondInteractions;
  webglAvailable: boolean;
} {
  const sim = useRef<PondSimulation | null>(null);
  const renderer = useRef<PondRenderer | null>(null);
  const clock = useRef<SimClock>(new SimClock(1 / 60));
  const rafId = useRef<number>(0);
  const webglAvailable = useRef(true);

  const settings = usePondStore((s) => s.settings);
  const isPaused = usePondStore((s) => s.isPaused);
  const settingsRef = useRef(settings);
  const isPausedRef = useRef(isPaused);

  // Keep refs in sync for use inside the loop without stale closures
  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);

  // Initialise renderer and simulation once
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Simulation
    const s = new PondSimulation(42);
    s.init(settings.fishCount);
    sim.current = s;

    // Renderer
    const r = new PondRenderer(canvas);
    const ok = r.init(settings.atmosphere);
    webglAvailable.current = ok;
    renderer.current = r;

    if (!ok) return;

    // Size
    const resize = () => {
      const { innerWidth: w, innerHeight: h } = window;
      r.resize(w, h);
    };
    resize();

    // Animation loop
    const loop = (now: number) => {
      rafId.current = requestAnimationFrame(loop);
      if (isPausedRef.current) {
        clock.current.pause();
      } else {
        clock.current.resume();
      }

      const steps = clock.current.tick(now / 1000);
      const cfg = settingsRef.current;
      const motionIntensity = cfg.motionIntensity;

      for (let i = 0; i < steps; i++) {
        s.step(1 / 60, motionIntensity);
      }

      r.syncFish(s.fish);
      r.syncRipples(s.ripples);
      r.syncFood(s.food);
      r.render(now);
    };
    rafId.current = requestAnimationFrame(loop);

    const ro = new ResizeObserver(resize);
    ro.observe(document.documentElement);

    // Visibility change — pause when hidden
    const onVisChange = () => {
      if (document.hidden) {
        clock.current.pause();
      } else {
        clock.current.resume();
      }
    };
    document.addEventListener('visibilitychange', onVisChange);

    return () => {
      cancelAnimationFrame(rafId.current);
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVisChange);
      r.dispose();
      sim.current = null;
      renderer.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasRef]); // Only init once; settings updates handled below

  // Fish count changes
  useEffect(() => {
    sim.current?.resize(settings.fishCount);
  }, [settings.fishCount]);

  // Atmosphere changes
  useEffect(() => {
    renderer.current?.setAtmosphere(settings.atmosphere);
  }, [settings.atmosphere]);

  // Pause/resume
  useEffect(() => {
    if (isPaused) {
      clock.current.pause();
    } else {
      clock.current.resume();
    }
  }, [isPaused]);

  const interactions: PondInteractions = {
    attractToPoint: useCallback((cssX: number, cssY: number) => {
      const r = renderer.current;
      const s = sim.current;
      if (!r || !s) return;
      const world = r.screenToWorld(cssX, cssY);
      s.attractToPoint(world, 2.5, 0.6, 6);
    }, []),

    scatter: useCallback((cssX: number, cssY: number) => {
      const r = renderer.current;
      const s = sim.current;
      if (!r || !s) return;
      const world = r.screenToWorld(cssX, cssY);
      s.scatter(world);
    }, []),

    feed: useCallback((cssX: number, cssY: number) => {
      const r = renderer.current;
      const s = sim.current;
      if (!r || !s) return;
      const world = r.screenToWorld(cssX, cssY);
      s.feed(world);
    }, []),
  };

  return {
    interactions,
    webglAvailable: webglAvailable.current,
  };
}
