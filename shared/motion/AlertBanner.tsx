import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {MOTION_COLORS, POPPINS} from './theme';

export type AlertBannerProps = {
  /** Texto de la advertencia. */
  text: string;
  /** Distancia desde arriba. */
  top?: number;
  /** Fotograma de entrada. */
  delay?: number;
  /** Número de marcas X rojas que aparecen en cascada debajo. */
  xs?: number;
  /** Color de la alerta. */
  color?: string;
};

/**
 * Banner de advertencia (técnica T8 del estilo de referencia): píldora
 * roja semitransparente que entra con un golpe elástico, con marcas X
 * rojas que aparecen en cascada debajo. Úsalo para advertencias y
 * consecuencias («Quedan 3 intentos», «Sin esto no hay…»).
 */
export const AlertBanner: React.FC<AlertBannerProps> = ({
  text,
  top = 900,
  delay = 0,
  xs = 0,
  color = MOTION_COLORS.redSoft,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = spring({
    frame: frame - delay,
    fps,
    config: {damping: 9, stiffness: 300, mass: 0.9},
  });
  if (frame < delay) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top,
        left: 0,
        right: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 26,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          background: 'rgba(255,59,48,0.16)',
          border: `2px solid ${color}99`,
          borderRadius: 999,
          padding: '16px 38px',
          fontFamily: POPPINS,
          fontSize: 42,
          fontWeight: 700,
          color: '#FF7A72',
          opacity: p,
          transform: `scale(${interpolate(p, [0, 1], [0.7, 1])})`,
          boxShadow: `0 0 36px ${color}44`,
          textAlign: 'center',
        }}
      >
        {text}
      </div>
      {xs > 0 && (
        <div style={{display: 'flex', gap: 22}}>
          {Array.from({length: xs}, (_, i) => {
            const xp = spring({
              frame: frame - delay - 8 - i * 6,
              fps,
              config: {damping: 10, stiffness: 320},
            });
            return (
              <div
                key={i}
                style={{
                  width: 62,
                  height: 62,
                  borderRadius: 16,
                  background: color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: xp,
                  transform: `scale(${interpolate(xp, [0, 1], [0.4, 1])}) rotate(${interpolate(xp, [0, 1], [-30, 0])}deg)`,
                  boxShadow: `0 8px 22px ${color}66`,
                }}
              >
                <span
                  style={{
                    fontFamily: POPPINS,
                    fontSize: 38,
                    fontWeight: 800,
                    color: MOTION_COLORS.white,
                    lineHeight: 1,
                  }}
                >
                  ✕
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
