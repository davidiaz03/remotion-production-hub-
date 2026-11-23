import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {COLORS, FONT} from '../theme';
import {formatGrouped, parseGrowthNumber} from '../format';
import type {DataItem} from '../types';

/**
 * Gráfico de crecimiento (G3, plan 1.3): barras que crecen + números
 * que cuentan hacia arriba. Datos de scene.items (DataItem[]):
 * 600.000 (ago-2025) → 748.000+ (17-mar-2026) → 770.000+ (4-jul-2026).
 *
 * La última barra va en rojo (la cifra vigente). El conteo formatea a
 * mano (formatGrouped): toLocaleString('es-ES') NO agrupa miles en el
 * Chrome headless del render.
 */
export const GrowthChart: React.FC<{
  items: DataItem[];
  title?: string;
  footnote?: string;
  itemAt?: number[];
  durationInFrames: number;
}> = ({
  items,
  title = 'La página creció mientras publicaba contenido falso',
  footnote = 'FUENTES: ELTOQUE (17-MAR-2026) · CUBABAJOLUPA (4-JUL-2026)',
  itemAt,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const parsed = items.map((it) => ({
    ...it,
    value: parseGrowthNumber(it.value) ?? 0,
  }));
  const max = Math.max(...parsed.map((p) => p.value), 1);
  const chartH = 420;
  const n = parsed.length;

  return (
    <div style={{width: '100%', maxWidth: 1500}}>
      <div
        style={{
          fontFamily: FONT,
          fontSize: 52,
          fontWeight: 800,
          lineHeight: 1.15,
          color: COLORS.ink,
          textAlign: 'center',
          marginBottom: 16,
        }}
      >
        {title}
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: 48,
          alignItems: 'flex-end',
          justifyContent: 'center',
          height: chartH + 120,
          paddingTop: 20,
        }}
      >
        {parsed.map((p, i) => {
          // Cada barra crece cuando la VO dice su cifra (itemAt) o, sin
          // sincronía, repartida por la escena.
          const at =
            itemAt?.[i] ??
            Math.floor(((durationInFrames - 40) * i) / Math.max(n, 1));
          const grow = interpolate(frame, [at, at + 24], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const eased = Easing.out(Easing.ease)(grow);
          const h = Math.max((p.value / max) * chartH * eased, 4);
          const isLast = i === n - 1;
          const countT = interpolate(frame, [at, at + 24], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const shown =
            frame >= at + 24
              ? p.value
              : Math.round(p.value * Easing.out(Easing.ease)(countT));
          return (
            <div
              key={i}
              style={{
                flex: 1,
                maxWidth: 380,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
                height: '100%',
              }}
            >
              <div
                style={{
                  fontFamily: FONT,
                  fontSize: 56,
                  fontWeight: 800,
                  letterSpacing: -1,
                  lineHeight: 1,
                  color: isLast ? COLORS.red : COLORS.ink,
                  opacity: grow,
                  marginBottom: 12,
                }}
              >
                {formatGrouped(shown)}
                {p.value > 0 && /\+$/.test(items[i].value) ? '+' : ''}
              </div>
              <div
                style={{
                  width: '100%',
                  height: h,
                  background: isLast ? COLORS.red : COLORS.ink,
                  borderRadius: '16px 16px 0 0',
                }}
              />
              <div
                style={{
                  fontFamily: FONT,
                  fontSize: 30,
                  fontWeight: 700,
                  letterSpacing: 1,
                  color: COLORS.gray,
                  marginTop: 16,
                  textTransform: 'uppercase',
                }}
              >
                {p.label}
              </div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          fontFamily: FONT,
          fontSize: 26,
          fontWeight: 600,
          letterSpacing: 1,
          color: COLORS.dim,
          textAlign: 'center',
          marginTop: 28,
        }}
      >
        {footnote}
      </div>
    </div>
  );
};
