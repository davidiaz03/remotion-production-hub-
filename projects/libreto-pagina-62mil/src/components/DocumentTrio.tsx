import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {COLORS, FONT, CONTENT} from '../theme';
import {assetExists, expandAssets, sourceLabel} from '../assetMap';
import {DocumentImage} from './DocumentImage';

/**
 * Tres documentos en fila, el central destacado (plan 1.6 y 3.2).
 * Entran uno a uno (deslize + fundido, 12 f entre cada uno). El central
 * lleva borde rojo y escala 1,05. Bajo cada uno, su píldora de fuente
 * en pequeño.
 *
 * - 2 imágenes: dos tarjetas centradas. 1 imagen: tarjeta centrada.
 * - Sin imágenes: tarjetas de texto con `items` (si los hay) o una
 *   tarjeta neutra. Nunca se rompe.
 */
export const DocumentTrio: React.FC<{
  assets: string[];
  items?: string[];
  durationInFrames: number;
}> = ({assets, items, durationInFrames}) => {
  const frame = useCurrentFrame();
  const imgs = expandAssets(assets)
    .filter((a) => assetExists(a))
    .slice(0, 3);
  const contentW = 1920 - CONTENT.side * 2;
  const contentH = CONTENT.bottom - CONTENT.top;

  if (imgs.length === 0) {
    const cards = items && items.length > 0 ? items : ['La evidencia se describe en la narración.'];
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: 28,
          width: '100%',
          justifyContent: 'center',
        }}
      >
        {cards.slice(0, 3).map((c, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              maxWidth: 520,
              background: COLORS.surface,
              border: `2px solid ${COLORS.border}`,
              borderRadius: 24,
              padding: '40px 32px',
              fontFamily: FONT,
              fontSize: 36,
              fontWeight: 600,
              lineHeight: 1.35,
              color: COLORS.ink,
              textAlign: 'center',
              opacity: interpolate(frame, [i * 12, i * 12 + 10], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
            }}
          >
            {c}
          </div>
        ))}
      </div>
    );
  }

  const gap = 28;
  const cardW = (contentW - gap * (imgs.length - 1)) / imgs.length;
  const mid = Math.floor(imgs.length / 2);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap,
        width: '100%',
        height: contentH,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {imgs.map((img, i) => {
        const at = i * 12;
        const enter = interpolate(frame, [at, at + 12], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const highlighted = imgs.length === 3 && i === mid;
        const cardH = highlighted ? contentH : contentH - 48;
        return (
          <div
            key={img}
            style={{
              width: cardW,
              height: cardH,
              flexShrink: 0,
              background: COLORS.surface,
              border: highlighted
                ? `4px solid ${COLORS.red}`
                : `2px solid ${COLORS.border}`,
              borderRadius: 24,
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              opacity: enter,
              transform: `translateY(${interpolate(enter, [0, 1], [28, 0])}px) scale(${
                highlighted ? 1.03 : 1
              })`,
              boxShadow: highlighted
                ? '0 20px 48px rgba(192,57,43,0.22)'
                : '0 12px 32px rgba(26,26,46,0.08)',
            }}
          >
            <div style={{flex: 1, minHeight: 0}}>
              <DocumentImage asset={img} width={cardW - 32} height={cardH - 32 - 64} />
            </div>
            <div
              style={{
                height: 64,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: FONT,
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: 1,
                color: highlighted ? COLORS.red : COLORS.gray,
                textAlign: 'center',
                lineHeight: 1.2,
              }}
            >
              {sourceLabel(img)}
            </div>
          </div>
        );
      })}
    </div>
  );
};
