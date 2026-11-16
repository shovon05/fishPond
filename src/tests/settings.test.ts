import { describe, it, expect } from 'vitest';
import { loadSettings, saveSettings, resetSettings, validateSettings } from '../utils/settings';
import { DEFAULT_SETTINGS } from '../types';

// Mock localStorage
const store: Record<string, string> = {};
globalThis.localStorage = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
  clear: () => { for (const k in store) delete store[k]; },
  length: 0,
  key: () => null,
};

describe('settings persistence', () => {
  it('returns defaults when storage is empty', () => {
    localStorage.clear();
    const s = loadSettings();
    expect(s.fishCount).toBe(DEFAULT_SETTINGS.fishCount);
    expect(s.motionIntensity).toBe(DEFAULT_SETTINGS.motionIntensity);
  });

  it('saves and loads settings', () => {
    localStorage.clear();
    const updated = { ...DEFAULT_SETTINGS, fishCount: 20 };
    saveSettings(updated);
    const loaded = loadSettings();
    expect(loaded.fishCount).toBe(20);
  });

  it('merges with defaults for missing keys', () => {
    localStorage.clear();
    localStorage.setItem('living-pond-settings-v1', JSON.stringify({ fishCount: 7 }));
    const loaded = loadSettings();
    expect(loaded.fishCount).toBe(7);
    expect(loaded.motionIntensity).toBe(DEFAULT_SETTINGS.motionIntensity);
  });

  it('resetSettings returns defaults', () => {
    saveSettings({ ...DEFAULT_SETTINGS, fishCount: 25 });
    const reset = resetSettings();
    expect(reset.fishCount).toBe(DEFAULT_SETTINGS.fishCount);
  });

  it('gracefully handles corrupt storage', () => {
    localStorage.clear();
    localStorage.setItem('living-pond-settings-v1', 'NOT_JSON{{{');
    const s = loadSettings();
    expect(s.fishCount).toBe(DEFAULT_SETTINGS.fishCount);
  });
});

describe('validateSettings', () => {
  it('accepts valid settings', () => {
    expect(validateSettings({ fishCount: 12 })).toBe(true);
    expect(validateSettings({ motionIntensity: 0.5 })).toBe(true);
  });

  it('rejects invalid fishCount', () => {
    expect(validateSettings({ fishCount: 0 })).toBe(false);
    expect(validateSettings({ fishCount: 100 })).toBe(false);
  });

  it('rejects invalid motionIntensity', () => {
    expect(validateSettings({ motionIntensity: -1 })).toBe(false);
    expect(validateSettings({ motionIntensity: 2 })).toBe(false);
  });

  it('rejects non-object', () => {
    expect(validateSettings(null)).toBe(false);
    expect(validateSettings('string')).toBe(false);
  });
});
