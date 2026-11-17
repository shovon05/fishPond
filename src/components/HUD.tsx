import { usePondStore } from '../store/pondStore';
import './HUD.css';

export function IdentityBadge() {
  const isAmbientMode = usePondStore((s) => s.isAmbientMode);

  return (
    <div className={`identity-badge ${isAmbientMode ? 'ambient-hidden' : ''}`} aria-hidden="true">
      <div className="identity-kanji">和</div>
      <div className="identity-copy">
        <span className="identity-name">Living Pond</span>
        <span className="identity-tagline">Autonomous Koi Ecology</span>
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
      <span>Tap pond water to attract koi</span>
    </div>
  );
}

export function AmbientRevealHint() {
  const isAmbientMode = usePondStore((s) => s.isAmbientMode);
  if (!isAmbientMode) return null;

  return (
    <div className="ambient-reveal-hint" aria-live="polite">
      Press Tab to exit ambient view
    </div>
  );
}
