import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {COLORS, FONT} from '../theme';

/** Tarjeta-resumen de fin de capítulo: borde ámbar + rótulo «EN RESUMEN». */
export const SummaryCard: React.FC<{text: string}> = ({text}) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const size = text.length <= 120 ? 56 : text.length <= 170 ? 50 : 46;
  return (
    <div
      style={{
        background: COLORS.surface,
        border: `3px solid ${COLORS.amber}`,
        borderRadius: 28,
        padding: '48px 56px',
        maxWidth: 1500,
        opacity: enter,
        transform: `translateY(${interpolate(enter, [0, 1], [20, 0])}px)`,
      }}
    >
      <div
        style={{
          fontFamily: FONT,
          fontSize: 32,
          fontWeight: 800,
          letterSpacing: 6,
          color: COLORS.amber,
          marginBottom: 24,
        }}
      >
        EN RESUMEN
      </div>
      <div
        style={{
          fontFamily: FONT,
          fontSize: size,
          fontWeight: 600,
          lineHeight: 1.3,
          color: COLORS.bone,
        }}
      >
        {text}
      </div>
    </div>
  );
};
