import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {COLORS, FONT} from '../theme';

/**
 * Lista con título: los ítems aparecen uno a uno, repartidos por el
 * avance de la escena (cada ítem llega con su línea de VO, aprox.).
 * Tarjetas blancas sobre Papel, número en lápiz rojo.
 */
export const List: React.FC<{
  title?: string;
  items: string[];
  itemAt?: number[];
  durationInFrames: number;
}> = ({title, items, itemAt, durationInFrames}) => {
  const frame = useCurrentFrame();
  const n = items.length;
  // Cada ítem aparece cuando la VO lo enuncia (itemAt) o, sin
  // sincronía, al llegar su fracción de la escena (con 8 f de entrada).
  const revealAt = (i: number) =>
    itemAt?.[i] ?? Math.floor(((durationInFrames - 20) * i) / n);
  return (
    <div style={{width: '100%', maxWidth: 1500}}>
      {title ? (
        <div
          style={{
            fontFamily: FONT,
            fontSize: 56,
            fontWeight: 800,
            lineHeight: 1.15,
            color: COLORS.ink,
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
              boxShadow: '0 8px 24px rgba(26,26,46,0.06)',
            }}
          >
            <div
              style={{
                fontFamily: FONT,
                fontSize: 40,
                fontWeight: 800,
                color: COLORS.red,
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
                color: COLORS.ink,
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
