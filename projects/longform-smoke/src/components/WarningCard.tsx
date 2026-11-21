import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {COLORS, FONT} from '../theme';

/**
 * Tarjeta de advertencia («No copies la dosis», «NO CITAR»):
 * borde ámbar, NUNCA rojo (regla de identidad del proyecto).
 */
export const WarningCard: React.FC<{title?: string; text: string}> = ({
  title,
  text,
}) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const size = text.length <= 120 ? 52 : text.length <= 180 ? 46 : 42;
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
      {title ? (
        <div
          style={{
            fontFamily: FONT,
            fontSize: 56,
            fontWeight: 800,
            lineHeight: 1.15,
            color: COLORS.amber,
            marginBottom: 24,
          }}
        >
          {title}
        </div>
      ) : null}
      <div
        style={{
          fontFamily: FONT,
          fontSize: size,
          fontWeight: 500,
          lineHeight: 1.35,
          color: COLORS.bone,
        }}
      >
        {text}
      </div>
    </div>
  );
};
