import { useRef, useCallback, useState } from 'react';
import { usePond } from '../hooks/usePond';
import { usePondStore } from '../store/pondStore';
import './PondCanvas.css';

export type InteractionMode = 'attract' | 'scatter' | 'feed';

interface Props {
  mode: InteractionMode;
  onInteract?: () => void;
}

export function PondCanvas({ mode, onInteract }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [webglFailed] = useState(false);
  const setHasUserGesture = usePondStore((s) => s.setHasUserGesture);
  const dismissHint = usePondStore((s) => s.dismissHint);

  const { interactions } = usePond(canvasRef as React.RefObject<HTMLCanvasElement>);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      e.preventDefault();
      setHasUserGesture();
      dismissHint();
      onInteract?.();

      const { clientX: x, clientY: y } = e;
      switch (mode) {
        case 'attract':
          interactions.attractToPoint(x, y);
          break;
        case 'scatter':
          interactions.scatter(x, y);
          break;
        case 'feed':
          interactions.feed(x, y);
          break;
      }
    },
    [mode, interactions, setHasUserGesture, dismissHint, onInteract]
  );

  if (webglFailed) {
    return (
      <div className="webgl-fallback" role="main">
        <div className="pond-icon" aria-hidden="true">🌿</div>
        <h2>Living Pond needs WebGL</h2>
        <p>
          Your browser doesn&apos;t support WebGL, which is required for the animated pond.
          Try updating your browser or enabling hardware acceleration in your browser settings.
        </p>
      </div>
    );
  }

  return (
    <div className="pond-canvas-wrapper">
      <canvas
        ref={canvasRef}
        className="pond-canvas"
        onPointerDown={handlePointerDown}
        aria-label="Living Pond — click to interact with the koi fish"
        role="img"
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  );
}
