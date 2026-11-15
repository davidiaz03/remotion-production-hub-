import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {MOTION_COLORS} from './theme';

export type SweepTransitionProps = {
  /** Color del panel que barre. */
  color?: string;
  /** Duración total del barrido en fotogramas. */
  durationInFrames?: number;
  /** Fotograma en el que empieza. */
  delay?: number;
  /** Dirección del barrido. */
  direction?: 'left' | 'right' | 'up' | 'down';
};

/**
 * Transición de barrido entre escenas: un panel de color cruza la pantalla
 * y en su punto medio (delay + duration/2) la cubre por completo — ahí es
 * donde quien llama debe cambiar la escena de fondo (con un Sequence que
 * empiece en ese fotograma). Entrada y salida con easing suave.
 */
export const SweepTransition: React.FC<SweepTransitionProps> = ({
  color = MOTION_COLORS.inkSoft,
  durationInFrames = 16,
  delay = 0,
  direction = 'right',
}) => {
  const frame = useCurrentFrame();
  if (frame < delay || frame > delay + durationInFrames) return null;

  const p = Easing.inOut(Easing.ease)(
    interpolate(frame, [delay, delay + durationInFrames], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  );
  // De -100% a +100%: en p=0,5 cubre toda la pantalla.
  const pos = interpolate(p, [0, 1], [-100, 100]);
  const horizontal = direction === 'left' || direction === 'right';
  const sign = direction === 'left' || direction === 'up' ? -1 : 1;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: color,
        transform: horizontal
          ? `translateX(${pos * sign}%)`
          : `translateY(${pos * sign}%)`,
        pointerEvents: 'none',
        zIndex: 50,
      }}
    />
  );
};
