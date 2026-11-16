import { type InteractionMode } from './PondCanvas';
import { usePondStore } from '../store/pondStore';
import './ControlDock.css';

interface Props {
  mode: InteractionMode;
  onModeChange: (mode: InteractionMode) => void;
}

const MODES: Array<{ id: InteractionMode; icon: string; label: string; title: string }> = [
  { id: 'attract', icon: '🐟', label: 'Attract', title: 'Click pond to call fish (A)' },
  { id: 'scatter', icon: '💨', label: 'Scatter', title: 'Click pond to scatter fish (S)' },
  { id: 'feed', icon: '🌾', label: 'Feed', title: 'Click pond to drop food (F)' },
];

// SVG icons as inline components
const IconPause = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <rect x="6" y="4" width="4" height="16" rx="1"/>
    <rect x="14" y="4" width="4" height="16" rx="1"/>
  </svg>
);

const IconPlay = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M8 5v14l11-7z"/>
  </svg>
);

const IconSettings = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

const IconAmbient = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/>
    <line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);

export function ControlDock({ mode, onModeChange }: Props) {
  const isPaused = usePondStore((s) => s.isPaused);
  const togglePause = usePondStore((s) => s.togglePause);
  const isAmbientMode = usePondStore((s) => s.isAmbientMode);
  const toggleAmbientMode = usePondStore((s) => s.toggleAmbientMode);
  const toggleSettingsPanel = usePondStore((s) => s.toggleSettingsPanel);

  return (
    <nav
      className={`control-dock ${isAmbientMode ? 'ambient-hidden' : ''}`}
      role="navigation"
      aria-label="Pond controls"
    >
      {/* Interaction mode selector */}
      <div className="mode-group" role="group" aria-label="Interaction mode">
        {MODES.map((m) => (
          <button
            key={m.id}
            className={`mode-btn ${mode === m.id ? 'selected' : ''}`}
            onClick={() => onModeChange(m.id)}
            title={m.title}
            aria-pressed={mode === m.id}
            aria-label={m.title}
          >
            <span className="dock-icon" aria-hidden="true">{m.icon}</span>
            <span className="dock-label">{m.label}</span>
          </button>
        ))}
      </div>

      <div className="dock-divider" aria-hidden="true" />

      {/* Pause/Resume */}
      <button
        className={`dock-btn ${isPaused ? 'active-warm' : ''}`}
        onClick={togglePause}
        title={isPaused ? 'Resume simulation (Space)' : 'Pause simulation (Space)'}
        aria-label={isPaused ? 'Resume simulation' : 'Pause simulation'}
        aria-pressed={isPaused}
      >
        {isPaused ? <IconPlay /> : <IconPause />}
        <span className="dock-label">{isPaused ? 'Resume' : 'Pause'}</span>
      </button>

      {/* Ambient mode */}
      <button
        className={`dock-btn ${isAmbientMode ? 'active' : ''}`}
        onClick={toggleAmbientMode}
        title="Toggle ambient mode — hide UI (Tab)"
        aria-label={isAmbientMode ? 'Exit ambient mode' : 'Enter ambient mode'}
        aria-pressed={isAmbientMode}
      >
        <IconAmbient />
        <span className="dock-label">Ambient</span>
      </button>

      {/* Settings */}
      <button
        className="dock-btn"
        onClick={toggleSettingsPanel}
        title="Open settings"
        aria-label="Open settings panel"
      >
        <IconSettings />
        <span className="dock-label">Settings</span>
      </button>
    </nav>
  );
}
