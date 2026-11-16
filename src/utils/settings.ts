// Settings persistence with localStorage

import type { PondSettings } from '../types';
import { DEFAULT_SETTINGS } from '../types';

const STORAGE_KEY = 'living-pond-settings-v1';

export function loadSettings(): PondSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<PondSettings>;
    // Merge with defaults for forward/backward compat
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: PondSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage unavailable — silently ignore
  }
}

export function resetSettings(): PondSettings {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  return { ...DEFAULT_SETTINGS };
}

/** Validate that a settings object has the required fields */
export function validateSettings(obj: unknown): obj is Partial<PondSettings> {
  if (typeof obj !== 'object' || obj === null) return false;
  const s = obj as Record<string, unknown>;
  if ('fishCount' in s && (typeof s.fishCount !== 'number' || s.fishCount < 1 || s.fishCount > 50)) return false;
  if ('motionIntensity' in s && (typeof s.motionIntensity !== 'number' || s.motionIntensity < 0 || s.motionIntensity > 1)) return false;
  if ('soundVolume' in s && (typeof s.soundVolume !== 'number' || s.soundVolume < 0 || s.soundVolume > 1)) return false;
  return true;
}
