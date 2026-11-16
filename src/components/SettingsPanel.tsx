import { useEffect } from 'react';
import { usePondStore } from '../store/pondStore';
import type { AtmospherePreset, PondSettings } from '../types';
import './SettingsPanel.css';

const ATMOSPHERE_OPTIONS: Array<{ id: AtmospherePreset; icon: string; label: string }> = [
  { id: 'dawn', icon: '🌅', label: 'Dawn' },
  { id: 'noon', icon: '☀️', label: 'Noon' },
  { id: 'dusk', icon: '🌇', label: 'Dusk' },
  { id: 'night', icon: '🌙', label: 'Night' },
  { id: 'rain', icon: '🌧️', label: 'Rain' },
];

const IconClose = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format?: (v: number) => string;
  onChange: (v: number) => void;
}) {
  const displayValue = format ? format(value) : String(value);
  return (
    <div className="settings-row">
      <label className="settings-label">
        <span>{label}</span>
        <span className="settings-value">{displayValue}</span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
      />
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="toggle-row">
      <span>{label}</span>
      <label className="toggle-switch">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          aria-label={label}
        />
        <span className="toggle-track" />
      </label>
    </div>
  );
}

export function SettingsPanel() {
  const isOpen = usePondStore((s) => s.settingsPanelOpen);
  const setOpen = usePondStore((s) => s.setSettingsPanelOpen);
  const settings = usePondStore((s) => s.settings);
  const updateSetting = usePondStore((s) => s.updateSetting);
  const resetToDefaults = usePondStore((s) => s.resetToDefaults);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, setOpen]);

  const update = <K extends keyof PondSettings>(key: K, value: PondSettings[K]) =>
    updateSetting(key, value);

  return (
    <div
      className={`settings-overlay ${isOpen ? 'open' : ''}`}
      aria-hidden={!isOpen}
    >
      <div
        className="settings-backdrop"
        onClick={() => setOpen(false)}
        aria-label="Close settings"
      />
      <div
        className="settings-panel"
        role="dialog"
        aria-label="Settings"
        aria-modal={isOpen}
      >
        <div className="settings-header">
          <h2 className="settings-title">Settings</h2>
          <button
            className="settings-close"
            onClick={() => setOpen(false)}
            aria-label="Close settings"
            title="Close (Esc)"
          >
            <IconClose />
          </button>
        </div>

        {/* Pond section */}
        <section className="settings-section" aria-label="Pond Population">
          <h3 className="settings-section-title">Pond Life</h3>

          <SliderRow
            label="Koi Fish"
            value={settings.fishCount}
            min={4}
            max={32}
            step={1}
            format={(v) => `${v} koi`}
            onChange={(v) => update('fishCount', v)}
          />

          <SliderRow
            label="Minnows (School)"
            value={settings.minnowCount}
            min={0}
            max={48}
            step={4}
            format={(v) => `${v} fish`}
            onChange={(v) => update('minnowCount', v)}
          />

          <SliderRow
            label="Motion Intensity"
            value={settings.motionIntensity}
            min={0.1}
            max={1}
            step={0.05}
            format={(v) => `${Math.round(v * 100)}%`}
            onChange={(v) => update('motionIntensity', v)}
          />
        </section>

        {/* Atmosphere section */}
        <section className="settings-section" aria-label="Atmosphere">
          <h3 className="settings-section-title">Atmosphere & Weather</h3>
          <div className="atm-grid" role="group" aria-label="Atmosphere preset">
            {ATMOSPHERE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                className={`atm-btn ${settings.atmosphere === opt.id ? 'selected' : ''}`}
                onClick={() => update('atmosphere', opt.id)}
                aria-pressed={settings.atmosphere === opt.id}
                title={opt.label}
              >
                <span className="atm-icon" aria-hidden="true">{opt.icon}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        {/* Visual section */}
        <section className="settings-section" aria-label="Visual options">
          <h3 className="settings-section-title">Visual & Diagnostics</h3>
          <div className="settings-row">
            <div className="settings-label"><span>Quality</span></div>
            <div className="quality-group" role="group" aria-label="Visual quality">
              {(['low', 'medium', 'high', 'auto'] as PondSettings['visualQuality'][]).map((q) => (
                <button
                  key={q}
                  className={`quality-btn ${settings.visualQuality === q ? 'selected' : ''}`}
                  onClick={() => update('visualQuality', q)}
                  aria-pressed={settings.visualQuality === q}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <ToggleRow
            label="Procedural Spine View (D)"
            checked={settings.debugSpine}
            onChange={(v) => update('debugSpine', v)}
          />

          <ToggleRow
            label="Reduced Motion"
            checked={settings.reducedMotion}
            onChange={(v) => update('reducedMotion', v)}
          />
        </section>

        {/* Sound section */}
        <section className="settings-section" aria-label="Sound">
          <h3 className="settings-section-title">Ambient Sound</h3>
          <ToggleRow
            label="River & Water Audio"
            checked={settings.soundEnabled}
            onChange={(v) => update('soundEnabled', v)}
          />
          {settings.soundEnabled && (
            <SliderRow
              label="Volume"
              value={settings.soundVolume}
              min={0}
              max={1}
              step={0.05}
              format={(v) => `${Math.round(v * 100)}%`}
              onChange={(v) => update('soundVolume', v)}
            />
          )}
        </section>

        {/* Reset */}
        <section className="settings-section">
          <button
            className="reset-btn"
            onClick={resetToDefaults}
            title="Reset all settings to defaults"
          >
            Reset to defaults (R)
          </button>
        </section>
      </div>
    </div>
  );
}
