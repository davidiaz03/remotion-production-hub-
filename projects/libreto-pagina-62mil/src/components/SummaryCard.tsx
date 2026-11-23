import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {COLORS, FONT} from '../theme';

/**
 * Tarjeta de cierre: borde rojo + rótulo. En este proyecto es la CTA
 * final («Suscríbete a El Libreto…»), así que el rótulo es la marca.
 */
export const SummaryCard: React.FC<{text: string; label?: string}> = ({
  text,
  label = 'EL LIBRETO',
}) => {
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
        border: `3px solid ${COLORS.red}`,
        borderRadius: 28,
        padding: '48px 56px',
        maxWidth: 1500,
        opacity: enter,
        transform: `translateY(${interpolate(enter, [0, 1], [20, 0])}px)`,
        boxShadow: '0 16px 40px rgba(26,26,46,0.10)',
      }}
    >
      <div
        style={{
          fontFamily: FONT,
          fontSize: 32,
          fontWeight: 800,
          letterSpacing: 6,
          color: COLORS.red,
          marginBottom: 24,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: FONT,
          fontSize: size,
          fontWeight: 600,
          lineHeight: 1.3,
          color: COLORS.ink,
        }}
      >
        {text}
      </div>
    </div>
  );
};
