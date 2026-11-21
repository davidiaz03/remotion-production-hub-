import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {COLORS, CONTENT, fadeIn, fadeOut} from '../theme';

/**
 * Envoltorio de escena: área de contenido segura (debajo de la barra de
 * progreso, encima del karaoke) + fundidos simples de 10 fotogramas.
 * Los cambios de bloque (inicio de capítulo) usan corte directo.
 */
export const SceneShell: React.FC<{
  durationInFrames: number;
  hardIn?: boolean;
  hardOut?: boolean;
  children: React.ReactNode;
}> = ({durationInFrames, hardIn = false, hardOut = false, children}) => {
  const frame = useCurrentFrame();
  const opacity =
    fadeIn(frame, hardIn ? 0 : 10) * fadeOut(frame, durationInFrames, hardOut ? 0 : 10);
  const rise = hardIn
    ? 0
    : interpolate(frame, [0, 14], [18, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
  return (
    <AbsoluteFill style={{background: COLORS.bg}}>
      <div
        style={{
          position: 'absolute',
          left: CONTENT.side,
          right: CONTENT.side,
          top: CONTENT.top,
          bottom: 1080 - CONTENT.bottom,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          opacity,
          transform: `translateY(${rise}px)`,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};

/** Regla ámbar corta que corona titulares y afirmaciones. */
export const AmberRule: React.FC<{width?: number}> = ({width = 120}) => (
  <div
    style={{
      width,
      height: 6,
      background: COLORS.amber,
      borderRadius: 3,
      marginBottom: 36,
      marginLeft: 'auto',
      marginRight: 'auto',
    }}
  />
);
