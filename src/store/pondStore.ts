// Zustand store for Living Pond application state

import { create } from 'zustand';
import type { PondSettings, AtmospherePreset } from '../types';
import { DEFAULT_SETTINGS } from '../types';
import { loadSettings, saveSettings, resetSettings } from '../utils/settings';

interface PondStore {
  settings: PondSettings;
  isPaused: boolean;
  isAmbientMode: boolean;
  settingsPanelOpen: boolean;
  hasUserGesture: boolean;

  // Actions
  updateSetting: <K extends keyof PondSettings>(key: K, value: PondSettings[K]) => void;
  updateSettings: (partial: Partial<PondSettings>) => void;
  resetToDefaults: () => void;
  togglePause: () => void;
  toggleAmbientMode: () => void;
  toggleSettingsPanel: () => void;
  setSettingsPanelOpen: (open: boolean) => void;
  setHasUserGesture: () => void;
  dismissHint: () => void;
  setAtmosphere: (preset: AtmospherePreset) => void;
}

const initialSettings = loadSettings();

export const usePondStore = create<PondStore>((set, get) => ({
  settings: initialSettings,
  isPaused: false,
  isAmbientMode: initialSettings.ambientMode,
  settingsPanelOpen: false,
  hasUserGesture: false,

  updateSetting: (key, value) => {
    const next = { ...get().settings, [key]: value };
    saveSettings(next);
    set({ settings: next });
  },

  updateSettings: (partial) => {
    const next = { ...get().settings, ...partial };
    saveSettings(next);
    set({ settings: next });
  },

  resetToDefaults: () => {
    const defaults = resetSettings();
    set({ settings: defaults, isAmbientMode: defaults.ambientMode });
  },

  togglePause: () => set((s) => ({ isPaused: !s.isPaused })),

  toggleAmbientMode: () => {
    const next = !get().isAmbientMode;
    const settings = { ...get().settings, ambientMode: next };
    saveSettings(settings);
    set({ isAmbientMode: next, settings });
  },

  toggleSettingsPanel: () => set((s) => ({ settingsPanelOpen: !s.settingsPanelOpen })),
  setSettingsPanelOpen: (open) => set({ settingsPanelOpen: open }),

  setHasUserGesture: () => set({ hasUserGesture: true }),

  dismissHint: () => {
    const settings = { ...get().settings, showHint: false };
    saveSettings(settings);
    set({ settings });
  },

  setAtmosphere: (preset) => {
    const settings = { ...get().settings, atmosphere: preset };
    saveSettings(settings);
    set({ settings });
  },
}));

export { DEFAULT_SETTINGS };
