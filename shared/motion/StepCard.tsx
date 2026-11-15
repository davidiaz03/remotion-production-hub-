import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {MOTION_COLORS, POPPINS} from './theme';

export type StepCardProps = {
  /** Número del paso. */
  n: number;
  /** Título del paso. */
  title: string;
  /** Descripción corta (opcional). */
  subtitle?: string;
  /** Color del círculo numerado. */
  accent?: string;
  /** Fotograma de entrada. */
  delay?: number;
  /** Distancia desde arriba. */
  top?: number;
  /** Ancho de la tarjeta. */
  width?: number;
  /** Estado completado: el número se convierte en ✓. */
  done?: boolean;
};

/**
 * Tarjeta de paso numerado para tutoriales («Paso 1, 2, 3…»): círculo
 * numerado de color + título + descripción, con entrada elástica desde
 * abajo. Apílalas con `top` distintos y `delay` escalonados.
 */
export const StepCard: React.FC<StepCardProps> = ({
  n,
  title,
  subtitle,
  accent = MOTION_COLORS.red,
  delay = 0,
  top = 700,
  width = 920,
  done = false,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = spring({
    frame: frame - delay,
    fps,
    config: {damping: 14, stiffness: 220, mass: 0.9},
  });
  if (frame < delay) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top,
        left: '50%',
        marginLeft: -width / 2,
        width,
        display: 'flex',
        alignItems: 'center',
        gap: 26,
        background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.16)',
        borderRadius: 26,
        padding: '26px 32px',
        opacity: p,
        transform: `translateY(${interpolate(p, [0, 1], [44, 0])}px) scale(${interpolate(p, [0, 1], [0.96, 1])})`,
        boxShadow: '0 16px 40px rgba(0,0,0,0.45)',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          flexShrink: 0,
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: POPPINS,
          fontSize: 38,
          fontWeight: 800,
          color: MOTION_COLORS.white,
          boxShadow: `0 0 28px ${accent}66`,
        }}
      >
        {done ? '✓' : n}
      </div>
      <div>
        <div
          style={{
            fontFamily: POPPINS,
            fontSize: 44,
            fontWeight: 700,
            lineHeight: 1.1,
            color: MOTION_COLORS.white,
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              fontFamily: POPPINS,
              fontSize: 30,
              fontWeight: 400,
              lineHeight: 1.25,
              color: MOTION_COLORS.gray,
              marginTop: 6,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
};
