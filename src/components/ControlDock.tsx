import { type InteractionMode } from './PondCanvas';
import { usePondStore } from '../store/pondStore';
import './ControlDock.css';

interface Props {
  mode: InteractionMode;
  onModeChange: (mode: InteractionMode) => void;
}

// Crisp inline geometric icons
const IconAttract = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const IconScatter = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
  </svg>
);

const IconFeed = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2a5 5 0 0 1 5 5c0 5-5 13-5 13S7 12 7 7a5 5 0 0 1 5-5z" />
    <circle cx="12" cy="7" r="1.5" />
  </svg>
);

const IconPause = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <rect x="6" y="4" width="3.5" height="16" rx="1" />
    <rect x="14.5" y="4" width="3.5" height="16" rx="1" />
  </svg>
);

const IconPlay = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <polygon points="6 4 20 12 6 20 6 4" />
  </svg>
);

const IconAmbient = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconSettings = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="4" y1="21" x2="4" y2="14" />
    <line x1="4" y1="10" x2="4" y2="3" />
    <line x1="12" y1="21" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12" y2="3" />
    <line x1="20" y1="21" x2="20" y2="16" />
    <line x1="20" y1="12" x2="20" y2="3" />
    <line x1="1" y1="14" x2="7" y2="14" />
    <line x1="9" y1="8" x2="15" y2="8" />
    <line x1="17" y1="16" x2="23" y2="16" />
  </svg>
);

export function ControlDock({ mode, onModeChange }: Props) {
  const isPaused = usePondStore((s) => s.isPaused);
  const togglePause = usePondStore((s) => s.togglePause);
  const isAmbientMode = usePondStore((s) => s.isAmbientMode);
  const toggleAmbientMode = usePondStore((s) => s.toggleAmbientMode);
  const toggleSettingsPanel = usePondStore((s) => s.toggleSettingsPanel);
  const settingsPanelOpen = usePondStore((s) => s.settingsPanelOpen);

  return (
    <nav
      className={`control-dock ${isAmbientMode ? 'ambient-hidden' : ''}`}
      role="navigation"
      aria-label="Pond interactions"
    >
      {/* Interaction Mode Group */}
      <div className="mode-segmented" role="group" aria-label="Interaction mode">
        <button
          className={`dock-tab ${mode === 'attract' ? 'active' : ''}`}
          onClick={() => onModeChange('attract')}
          title="Attract koi to pointer (A)"
          aria-pressed={mode === 'attract'}
        >
          <IconAttract />
          <span>Attract</span>
        </button>

        <button
          className={`dock-tab ${mode === 'scatter' ? 'active' : ''}`}
          onClick={() => onModeChange('scatter')}
          title="Scatter fish (Space / S)"
          aria-pressed={mode === 'scatter'}
        >
          <IconScatter />
          <span>Scatter</span>
        </button>

        <button
          className={`dock-tab ${mode === 'feed' ? 'active' : ''}`}
          onClick={() => onModeChange('feed')}
          title="Drop food pellets (F)"
          aria-pressed={mode === 'feed'}
        >
          <IconFeed />
          <span>Feed</span>
        </button>
      </div>

      <div className="dock-separator" aria-hidden="true" />

      {/* Auxiliary actions */}
      <div className="dock-actions">
        <button
          className={`dock-action-btn ${isPaused ? 'paused-state' : ''}`}
          onClick={togglePause}
          title={isPaused ? 'Resume swimming (P)' : 'Pause swimming (P)'}
          aria-label={isPaused ? 'Resume swimming' : 'Pause swimming'}
        >
          {isPaused ? <IconPlay /> : <IconPause />}
        </button>

        <button
          className="dock-action-btn"
          onClick={toggleAmbientMode}
          title="Ambient mode (H / Tab)"
          aria-label="Toggle ambient view"
        >
          <IconAmbient />
        </button>

        <button
          className={`dock-action-btn ${settingsPanelOpen ? 'active' : ''}`}
          onClick={toggleSettingsPanel}
          title="Settings (,)"
          aria-label="Open settings"
          aria-expanded={settingsPanelOpen}
        >
          <IconSettings />
        </button>
      </div>
    </nav>
  );
}
