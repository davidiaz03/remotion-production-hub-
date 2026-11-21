import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {CountUp} from '../../../../shared/motion/CountUp';
import {COLORS, FONT} from '../theme';
import type {DataItem} from '../types';

/**
 * Tira de cifras: 2–4 tarjetas con un número héroe. Los valores numéricos
 * usan CountUp (aterriza exacto); los no numéricos («N.º 8», rangos)
 * se muestran estáticos en el mismo tamaño.
 *
 * OJO — formato de CountUp: usa `toLocaleString('es-ES')`, que en el
 * Chrome headless del render NO agrupa miles ni pone coma decimal
 * (verificado en still: «~1.177» salía como «~1177»). Por eso los
 * valores ≥1000 o con decimales se muestran ESTÁTICOS con el texto
 * original de scenes.json (ya correctamente formateado); CountUp solo
 * se usa donde el formato es seguro (enteros <1000 sin decimales).
 */
type Parsed = {
  to: number;
  prefix: string;
  suffix: string;
  decimals: number;
  useCountUp: boolean;
} | null;

const parseValue = (value: string): Parsed => {
  const m = /^([~]?)\s*([\d.,]+)(.*)$/.exec(value.trim());
  if (!m) return null;
  const [, tilde, numRaw, suffix] = m;
  if (suffix.includes('–') || suffix.includes('-')) return null; // rangos: estático
  let decimals = 0;
  let num: number;
  if (numRaw.includes(',')) {
    // Decimal con coma (es-ES): «4,5» → 4.5
    const int = numRaw.split(',')[0].replace(/\./g, '');
    const dec = numRaw.split(',')[1] ?? '';
    decimals = dec.length;
    num = Number(`${int}.${dec}`);
  } else if (/^\d{1,3}(\.\d{3})+$/.test(numRaw)) {
    num = Number(numRaw.replace(/\./g, '')); // miles: «1.177» → 1177
  } else {
    num = Number(numRaw);
  }
  if (!Number.isFinite(num)) return null;
  return {
    to: num,
    prefix: tilde,
    suffix,
    decimals,
    useCountUp: decimals === 0 && num < 1000,
  };
};

const StatCard: React.FC<{item: DataItem; index: number}> = ({item, index}) => {
  const frame = useCurrentFrame();
  const parsed = parseValue(item.value);
  const enter = interpolate(frame, [index * 6, index * 6 + 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        flex: 1,
        background: COLORS.surface,
        border: `2px solid ${COLORS.border}`,
        borderRadius: 28,
        padding: '44px 32px 40px',
        textAlign: 'center',
        opacity: enter,
        transform: `translateY(${interpolate(enter, [0, 1], [20, 0])}px)`,
      }}
    >
      {parsed && parsed.useCountUp ? (
        <CountUp
          to={parsed.to}
          prefix={parsed.prefix}
          suffix={parsed.suffix}
          decimals={parsed.decimals}
          delay={index * 6 + 4}
          durationInFrames={18}
          size={88}
          color={COLORS.bone}
          labelColor={COLORS.gray}
        />
      ) : (
        <div
          style={{
            fontFamily: FONT,
            fontSize: 88,
            fontWeight: 800,
            letterSpacing: -2,
            lineHeight: 1,
            color: COLORS.bone,
          }}
        >
          {item.value}
        </div>
      )}
      <div
        style={{
          fontFamily: FONT,
          fontSize: 30,
          fontWeight: 600,
          lineHeight: 1.35,
          color: COLORS.gray,
          marginTop: 18,
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}
      >
        {item.label}
      </div>
    </div>
  );
};

export const DataStrip: React.FC<{items: DataItem[]}> = ({items}) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'row',
      gap: 28,
      width: '100%',
      alignItems: 'stretch',
    }}
  >
    {items.map((item, i) => (
      <StatCard key={i} item={item} index={i} />
    ))}
  </div>
);
