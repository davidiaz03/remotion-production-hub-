import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {COLORS, FONT} from '../theme';

/**
 * Lista con título: los ítems aparecen uno a uno, repartidos por el
 * avance de la escena (cada ítem llega con su línea de VO, aprox.).
 */
export const List: React.FC<{
  title?: string;
  items: string[];
  durationInFrames: number;
}> = ({title, items, durationInFrames}) => {
  const frame = useCurrentFrame();
  const n = items.length;
  // Cada ítem aparece al llegar su fracción de la escena (con 8 f de entrada).
  const revealAt = (i: number) => Math.floor(((durationInFrames - 20) * i) / n);
  return (
    <div style={{width: '100%', maxWidth: 1500}}>
      {title ? (
        <div
          style={{
            fontFamily: FONT,
            fontSize: 56,
            fontWeight: 800,
            lineHeight: 1.15,
            color: COLORS.bone,
            marginBottom: 36,
          }}
        >
          {title}
        </div>
      ) : null}
      {items.map((item, i) => {
        const at = revealAt(i);
        const enter = interpolate(frame, [at, at + 10], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: 20,
              alignItems: 'flex-start',
              background: COLORS.surface,
              border: `2px solid ${COLORS.border}`,
              borderRadius: 20,
              padding: '22px 32px',
              marginBottom: i < n - 1 ? 16 : 0,
              opacity: enter,
              transform: `translateX(${interpolate(enter, [0, 1], [-24, 0])}px)`,
            }}
          >
            <div
              style={{
                fontFamily: FONT,
                fontSize: 40,
                fontWeight: 800,
                color: COLORS.amber,
                lineHeight: 1.3,
                flexShrink: 0,
              }}
            >
              {String(i + 1).padStart(2, '0')}
            </div>
            <div
              style={{
                fontFamily: FONT,
                fontSize: 40,
                fontWeight: 500,
                lineHeight: 1.3,
                color: COLORS.bone,
              }}
            >
              {item}
            </div>
          </div>
        );
      })}
    </div>
  );
};
