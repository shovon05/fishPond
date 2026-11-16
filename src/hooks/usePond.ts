// usePond — hook running the pond simulation, minnows, and Three.js renderer loop

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

  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const s = new PondSimulation(42);
    s.init(settings.fishCount, settings.minnowCount);
    sim.current = s;

    const r = new PondRenderer(canvas);
    const ok = r.init(settings.atmosphere);
    webglAvailable.current = ok;
    renderer.current = r;

    if (!ok) return;

    const resize = () => {
      const { innerWidth: w, innerHeight: h } = window;
      r.resize(w, h);
    };
    resize();

    const loop = (now: number) => {
      rafId.current = requestAnimationFrame(loop);
      if (isPausedRef.current) {
        clock.current.pause();
      } else {
        clock.current.resume();
      }

      const steps = clock.current.tick(now / 1000);
      const cfg = settingsRef.current;
      const isRaining = cfg.atmosphere === 'rain';

      for (let i = 0; i < steps; i++) {
        s.step(1 / 60, cfg.motionIntensity, isRaining);
      }

      r.setDebugSpine(cfg.debugSpine);
      r.syncFish(s.fish);
      r.syncMinnows(s.minnows);
      r.syncRipples(s.ripples);
      r.syncFood(s.food);
      r.render(now);
    };
    rafId.current = requestAnimationFrame(loop);

    const ro = new ResizeObserver(resize);
    ro.observe(document.documentElement);

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
  }, [canvasRef]);

  // Fish count changes
  useEffect(() => {
    sim.current?.resize(settings.fishCount);
  }, [settings.fishCount]);

  // Minnow count changes
  useEffect(() => {
    sim.current?.resizeMinnows(settings.minnowCount);
  }, [settings.minnowCount]);

  // Atmosphere changes
  useEffect(() => {
    renderer.current?.setAtmosphere(settings.atmosphere);
  }, [settings.atmosphere]);

  // Debug spine
  useEffect(() => {
    renderer.current?.setDebugSpine(settings.debugSpine);
  }, [settings.debugSpine]);

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
      s.attractToPoint(world, 3.2, 0.75, 6);
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
