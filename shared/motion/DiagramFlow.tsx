import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';

export type DiagramFlowProps = {
  /** Punto de origen (1080×1920). */
  from: {x: number; y: number};
  /** Punto de destino. */
  to: {x: number; y: number};
  /** Fotograma en el que empieza el viaje. */
  startFrame: number;
  /** Duración del viaje en fotogramas. */
  durationInFrames: number;
  /** Elemento que viaja (sobre, punto, icono…). */
  traveler: React.ReactNode;
  /** Tamaño del cuadro del viajero. */
  travelerSize?: number;
  /** Color del rastro. */
  trailColor?: string;
  /** Anillo pulsante al llegar al destino. */
  arrivePulse?: boolean;
};

/**
 * Flujo de diagrama animado (técnica T10 del estilo de referencia): un
 * elemento viaja de A a B mientras el rastro se dibuja solo, y al llegar
 * deja un anillo pulsante en el destino. Los nodos (origen/destino) los
 * pone quien llama al componente como hijos normales de la escena; este
 * componente solo anima el viaje y el rastro.
 *
 * Ejemplo: el código que viaja de la torre al chip, un documento que va
 * de un archivo a otro, una denuncia que llega a su destino.
 */
export const DiagramFlow: React.FC<DiagramFlowProps> = ({
  from,
  to,
  startFrame,
  durationInFrames,
  traveler,
  travelerSize = 120,
  trailColor = '#2E7CF6',
  arrivePulse = true,
}) => {
  const frame = useCurrentFrame();
  if (frame < startFrame) return null;

  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const raw = interpolate(frame, [startFrame, startFrame + durationInFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const p = Easing.inOut(Easing.ease)(raw);
  const x = from.x + dx * p;
  const y = from.y + dy * p;
  const arrived = frame >= startFrame + durationInFrames;

  // Anillo pulsante tras la llegada (ciclo de 30 f).
  const pulsePhase = arrived ? (frame - startFrame - durationInFrames) % 30 : 0;
  const pulseR = 30 + (pulsePhase / 30) * 70;
  const pulseOpacity = arrived ? (1 - pulsePhase / 30) * 0.7 : 0;

  return (
    <>
      {/* Rastro que se dibuja solo */}
      <svg
        style={{position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none'}}
        viewBox="0 0 1080 1920"
      >
        <line
          x1={from.x}
          y1={from.y}
          x2={to.x}
          y2={to.y}
          stroke={trailColor}
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={`${len}`}
          strokeDashoffset={len * (1 - p)}
          opacity={0.85}
        />
      </svg>
      {/* Viajero */}
      <div
        style={{
          position: 'absolute',
          left: x - travelerSize / 2,
          top: y - travelerSize / 2,
          width: travelerSize,
          height: travelerSize,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))',
          pointerEvents: 'none',
        }}
      >
        {traveler}
      </div>
      {/* Anillo de llegada */}
      {arrivePulse && arrived && (
        <div
          style={{
            position: 'absolute',
            left: to.x - pulseR,
            top: to.y - pulseR,
            width: pulseR * 2,
            height: pulseR * 2,
            borderRadius: '50%',
            border: `4px solid ${trailColor}`,
            opacity: pulseOpacity,
            pointerEvents: 'none',
          }}
        />
      )}
    </>
  );
};
