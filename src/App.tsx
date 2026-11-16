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

  // Sound sync
  useEffect(() => {
    if (soundEnabled) {
      pondAudio.start(soundVolume);
    } else {
      pondAudio.stop();
    }
  }, [soundEnabled, soundVolume]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePause();
          break;
        case 'Tab':
          e.preventDefault();
          toggleAmbientMode();
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
        case ',':
          toggleSettingsPanel();
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [togglePause, toggleAmbientMode, toggleSettingsPanel]);

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
          <div className="shortcut-row"><kbd>S</kbd><span>Scatter</span></div>
          <div className="shortcut-row"><kbd>F</kbd><span>Feed</span></div>
          <div className="shortcut-row"><kbd>Space</kbd><span>Pause</span></div>
          <div className="shortcut-row"><kbd>Tab</kbd><span>Ambient</span></div>
        </div>
      )}
    </div>
  );
}
