import { useState, useEffect } from 'react';
import { PondCanvas, type InteractionMode } from './components/PondCanvas';
import { ControlDock } from './components/ControlDock';
import { SettingsPanel } from './components/SettingsPanel';
import { IdentityBadge, InteractionHint, AmbientRevealHint } from './components/HUD';
import { usePondStore } from './store/pondStore';
import { pondAudio } from './utils/audio';
import './App.css';

export default function App() {
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('attract');
  const toggleAmbientMode = usePondStore((s) => s.toggleAmbientMode);
  const togglePause = usePondStore((s) => s.togglePause);
  const toggleSettingsPanel = usePondStore((s) => s.toggleSettingsPanel);
  const settingsPanelOpen = usePondStore((s) => s.settingsPanelOpen);
  const soundEnabled = usePondStore((s) => s.settings.soundEnabled);
  const soundVolume = usePondStore((s) => s.settings.soundVolume);
  const fishCount = usePondStore((s) => s.settings.fishCount);
  const debugSpine = usePondStore((s) => s.settings.debugSpine);
  const updateSetting = usePondStore((s) => s.updateSetting);
  const resetToDefaults = usePondStore((s) => s.resetToDefaults);

  // Sound sync
  useEffect(() => {
    if (soundEnabled) {
      pondAudio.start(soundVolume);
    } else {
      pondAudio.stop();
    }
  }, [soundEnabled, soundVolume]);

  // Keyboard shortcuts matching Nagomi conventions + Living Pond
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          // Nagomi spacebar: Scatter fish
          setInteractionMode('scatter');
          break;
        case 'Tab':
        case 'h':
        case 'H':
          e.preventDefault();
          // Hide / Show UI (Ambient mode)
          toggleAmbientMode();
          break;
        case 'd':
        case 'D':
          // Toggle procedural spine debug view
          updateSetting('debugSpine', !debugSpine);
          break;
        case '[':
          // Decrease fish count
          updateSetting('fishCount', Math.max(4, fishCount - 1));
          break;
        case ']':
          // Increase fish count
          updateSetting('fishCount', Math.min(32, fishCount + 1));
          break;
        case 'r':
        case 'R':
          if (!e.ctrlKey && !e.metaKey) {
            resetToDefaults();
          }
          break;
        case 'a':
        case 'A':
          setInteractionMode('attract');
          break;
        case 's':
        case 'S':
          if (!e.ctrlKey && !e.metaKey) {
            setInteractionMode('scatter');
          }
          break;
        case 'f':
        case 'F':
          setInteractionMode('feed');
          break;
        case 'p':
        case 'P':
          togglePause();
          break;
        case ',':
          toggleSettingsPanel();
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [togglePause, toggleAmbientMode, toggleSettingsPanel, fishCount, debugSpine, updateSetting, resetToDefaults]);

  return (
    <div className="app" aria-label="Living Pond application">
      <PondCanvas mode={interactionMode} />
      <IdentityBadge />
      <InteractionHint />
      <AmbientRevealHint />
      <ControlDock mode={interactionMode} onModeChange={setInteractionMode} />
      <SettingsPanel />
      {settingsPanelOpen && (
        <div className="keyboard-shortcuts" aria-hidden="true">
          <div className="shortcut-row"><kbd>A</kbd><span>Attract</span></div>
          <div className="shortcut-row"><kbd>Space</kbd><span>Scatter</span></div>
          <div className="shortcut-row"><kbd>F</kbd><span>Feed</span></div>
          <div className="shortcut-row"><kbd>[</kbd> <kbd>]</kbd><span>Fish Count</span></div>
          <div className="shortcut-row"><kbd>D</kbd><span>Spine Debug</span></div>
          <div className="shortcut-row"><kbd>H</kbd> / <kbd>Tab</kbd><span>Hide UI</span></div>
          <div className="shortcut-row"><kbd>R</kbd><span>Reset</span></div>
        </div>
      )}
    </div>
  );
}
