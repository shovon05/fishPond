import { usePondStore } from '../store/pondStore';
import './HUD.css';

export function IdentityBadge() {
  const isAmbientMode = usePondStore((s) => s.isAmbientMode);

  return (
    <div className={`identity-badge ${isAmbientMode ? 'ambient-hidden' : ''}`} aria-hidden="true">
      <div className="identity-pond-icon">🌿</div>
      <div className="identity-text">
        <span className="identity-name">Living Pond</span>
        <span className="identity-tagline">A quiet little world</span>
      </div>
    </div>
  );
}

export function InteractionHint() {
  const showHint = usePondStore((s) => s.settings.showHint);
  const isAmbientMode = usePondStore((s) => s.isAmbientMode);

  if (!showHint || isAmbientMode) return null;

  return (
    <div className="interaction-hint" aria-hidden="true">
      <span>🐟</span>
      <span>Click the pond to call the koi</span>
    </div>
  );
}

export function AmbientRevealHint() {
  const isAmbientMode = usePondStore((s) => s.isAmbientMode);
  if (!isAmbientMode) return null;

  return (
    <div className="ambient-reveal-hint" aria-live="polite">
      Press Tab or move cursor to reveal controls
    </div>
  );
}
