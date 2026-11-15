import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

export type TapPoint = {
  /** Coordenadas del punto a tocar (1080×1920). */
  x: number;
  y: number;
  /** Fotograma en el que cae el toque. */
  at: number;
};

export type TapHandProps = {
  /** Puntos a tocar, en orden cronológico. */
  taps: TapPoint[];
  /** Tamaño de la mano (ancho en px). */
  size?: number;
  /** Dirección de entrada antes del primer toque. */
  enterFrom?: 'bottom' | 'right' | 'left';
  /** Color de piel de la mano (SVG original, diseño propio). */
  skin?: string;
  /** Color de la manga. */
  sleeve?: string;
  /** Color del anillo de toque. */
  rippleColor?: string;
};

/**
 * Mano animada que señala y toca (técnica T6 del estilo de referencia):
 * entra desde fuera de cuadro, se desplaza entre puntos con muelle y en
 * cada toque hace una pulsación (escala 0,88) + un anillo expansivo.
 *
 * La mano es un SVG ORIGINAL de diseño plano (dedo índice extendido),
 * no el asset del creador de referencia. La punta del dedo cae EXACTAMENTE
 * sobre las coordenadas del punto de toque.
 */
export const TapHand: React.FC<TapHandProps> = ({
  taps,
  size = 170,
  enterFrom = 'bottom',
  skin = '#EAB892',
  sleeve = '#2B5EA7',
  rippleColor = '#FFFFFF',
}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  if (taps.length === 0) return null;

  const s = size / 120; // escala del viewBox 120×150
  const first = taps[0];

  // Posición actual: antes del primer toque, entra desde fuera; entre
  // toques, interpola con muelle; después del último, se queda quieta.
  let tx = first.x;
  let ty = first.y;
  let visible = 1;
  const enterStart = first.at - 14;
  if (frame < enterStart) {
    visible = 0;
  } else if (frame < first.at) {
    const p = interpolate(frame, [enterStart, first.at], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    const off =
      enterFrom === 'bottom'
        ? {x: 0, y: 320}
        : enterFrom === 'right'
          ? {x: 320, y: 60}
          : {x: -320, y: 60};
    tx = first.x + off.x * (1 - p);
    ty = first.y + off.y * (1 - p);
    visible = p;
  } else {
    let i = 0;
    while (i < taps.length - 1 && frame >= taps[i + 1].at) i++;
    if (i < taps.length - 1) {
      const a = taps[i];
      const b = taps[i + 1];
      const p = spring({
        frame: frame - a.at,
        fps,
        config: {damping: 16, stiffness: 120},
      });
      // Normaliza el muelle al intervalo entre toques.
      const span = Math.max(1, b.at - a.at);
      const q = Math.min(1, Math.max(0, (frame - a.at) / span));
      const ease = q * q * (3 - 2 * q);
      tx = interpolate(ease, [0, 1], [a.x, b.x]);
      ty = interpolate(ease, [0, 1], [a.y, b.y]);
      void p;
    }
    // Después del último toque: se queda en el último punto 12 f y sale.
    const last = taps[taps.length - 1];
    if (frame > last.at + 18) {
      visible = interpolate(frame, [last.at + 18, last.at + 30], [1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
      ty = last.y + interpolate(frame, [last.at + 18, last.at + 30], [0, 120], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
    }
  }

  // Pulsación: en cada toque, escala 1 → 0,86 (3 f) → 1 (6 f).
  let press = 1;
  for (const t of taps) {
    if (frame >= t.at && frame <= t.at + 9) {
      press = interpolate(frame, [t.at, t.at + 3, t.at + 9], [1, 0.86, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
    }
  }

  // La punta del dedo índice está en (70, 10) del viewBox 120×150.
  const handW = 120 * s;
  const handH = 150 * s;
  const left = tx - 70 * s;
  const top = ty - 10 * s;

  return (
    <>
      {/* Anillos de toque */}
      {taps.map((t, i) => {
        if (frame < t.at || frame > t.at + 16) return null;
        const p = interpolate(frame, [t.at, t.at + 16], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const r = 12 + p * 56;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: t.x - r,
              top: t.y - r,
              width: r * 2,
              height: r * 2,
              borderRadius: '50%',
              border: `3px solid ${rippleColor}`,
              opacity: (1 - p) * 0.8,
              pointerEvents: 'none',
            }}
          />
        );
      })}
      {/* Mano */}
      <div
        style={{
          position: 'absolute',
          left,
          top,
          width: handW,
          height: handH,
          opacity: visible,
          transform: `scale(${press})`,
          transformOrigin: '58% 8%',
          filter: 'drop-shadow(0 10px 22px rgba(0,0,0,0.5))',
          pointerEvents: 'none',
        }}
      >
        <svg width={handW} height={handH} viewBox="0 0 120 150">
          {/* Manga */}
          <rect x="38" y="122" width="48" height="28" rx="10" fill={sleeve} />
          {/* Palma */}
          <rect x="34" y="62" width="54" height="66" rx="20" fill={skin} />
          {/* Dedos doblados */}
          <circle cx="46" cy="66" r="9" fill={skin} />
          <circle cx="60" cy="62" r="9" fill={skin} />
          <circle cx="80" cy="66" r="9" fill={skin} />
          {/* Pulgar */}
          <ellipse cx="36" cy="94" rx="10" ry="17" fill={skin} transform="rotate(-28 36 94)" />
          {/* Índice extendido */}
          <rect x="62" y="8" width="17" height="64" rx="8.5" fill={skin} />
          <ellipse cx="70.5" cy="20" rx="5" ry="8" fill="#F3D3B8" />
          {/* Sombra de la palma */}
          <rect x="34" y="62" width="54" height="66" rx="20" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="2" />
        </svg>
      </div>
    </>
  );
};
