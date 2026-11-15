import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {MOTION_COLORS, POPPINS} from './theme';

export type HeadlineWord = {t: string; accent?: boolean};

export type KineticHeadlineProps = {
  /** Líneas; cada línea es un array de palabras ({t, accent?}). */
  lines: HeadlineWord[][];
  /** Distancia desde arriba. */
  top?: number;
  /** Tamaño de fuente. */
  size?: number;
  /** Fotograma en el que empieza la primera palabra. */
  delay?: number;
  /** Separación en fotogramas entre palabras. */
  step?: number;
  /** Color de las palabras con accent. */
  accentColor?: string;
  color?: string;
  fontFamily?: string;
  align?: 'center' | 'left';
};

/**
 * Titular cinético: las palabras entran UNA A UNA con pop de escala
 * (spring con sobrepaso) y subida, en cascada. Las palabras con accent
 * van en el color de acento (rojo del Memorial por defecto).
 *
 * Úsalo para titulares de acto («3 DATOS», «ASÍ FUNCIONA»), no para
 * subtítulos (eso es TopKaraoke).
 */
export const KineticHeadline: React.FC<KineticHeadlineProps> = ({
  lines,
  top = 300,
  size = 96,
  delay = 0,
  step = 5,
  accentColor = MOTION_COLORS.red,
  color = MOTION_COLORS.white,
  fontFamily = POPPINS,
  align = 'center',
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  let wordIndex = 0;

  return (
    <div
      style={{
        position: 'absolute',
        top,
        left: 56,
        right: 56,
        textAlign: align,
        pointerEvents: 'none',
      }}
    >
      {lines.map((line, li) => (
        <div
          key={li}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: align === 'center' ? 'center' : 'flex-start',
            gap: `0 ${Math.round(size * 0.26)}px`,
            lineHeight: 1.08,
          }}
        >
          {line.map((w, wi) => {
            const idx = wordIndex++;
            const start = delay + idx * step;
            const p = spring({
              frame: frame - start,
              fps,
              config: {damping: 11, stiffness: 260, mass: 0.8},
            });
            const scale = interpolate(p, [0, 1], [0.55, 1]);
            const y = interpolate(p, [0, 1], [34, 0]);
            return (
              <span
                key={wi}
                style={{
                  display: 'inline-block',
                  fontFamily,
                  fontSize: size,
                  fontWeight: 800,
                  letterSpacing: -1,
                  color: w.accent ? accentColor : color,
                  opacity: p,
                  transform: `scale(${scale}) translateY(${y}px)`,
                  textShadow: '0 4px 24px rgba(0,0,0,0.55)',
                }}
              >
                {w.t}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};
