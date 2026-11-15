import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

export type MagnifierProps = {
  /** Centro de la lupa (1080×1920). */
  x: number;
  y: number;
  /** Diámetro de la lente. */
  size?: number;
  /** Factor de zoom del contenido. */
  zoom?: number;
  /** Fotograma en el que aparece. */
  delay?: number;
  /** Color del anillo. */
  ringColor?: string;
  /** Mostrar el mango. */
  handle?: boolean;
  /** Contenido a ampliar: diséñalo para caber en un cuadrado de
   *  (size / zoom) px; la lupa lo escala por `zoom`. */
  children: React.ReactNode;
};

/**
 * Lupa de detalle (técnica T7 del estilo de referencia): una lente circular
 * con mango que amplía un detalle (un número, una palabra, un botón) con
 * entrada elástica. El contenido se diseña a tamaño natural en un cuadrado
 * de (size / zoom) y la lupa lo escala.
 */
export const Magnifier: React.FC<MagnifierProps> = ({
  x,
  y,
  size = 380,
  zoom = 2,
  delay = 0,
  ringColor = '#151517',
  handle = true,
  children,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = spring({
    frame: frame - delay,
    fps,
    config: {damping: 12, stiffness: 220, mass: 0.9},
  });
  if (frame < delay) return null;

  const inner = size / zoom;
  const handleLen = size * 0.42;

  return (
    <div
      style={{
        position: 'absolute',
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        opacity: p,
        transform: `scale(${interpolate(p, [0, 1], [0.6, 1])})`,
        pointerEvents: 'none',
      }}
    >
      {/* Mango */}
      {handle && (
        <div
          style={{
            position: 'absolute',
            right: -handleLen * 0.62,
            bottom: -handleLen * 0.62,
            width: handleLen,
            height: size * 0.09,
            borderRadius: size * 0.045,
            background: ringColor,
            transform: 'rotate(45deg)',
            transformOrigin: 'left center',
            boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
          }}
        />
      )}
      {/* Lente */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: `12px solid ${ringColor}`,
          overflow: 'hidden',
          background: '#0B0B0D',
          boxShadow: '0 24px 60px rgba(0,0,0,0.7), inset 0 0 0 3px rgba(255,255,255,0.14)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: inner,
            height: inner,
            marginLeft: -inner / 2,
            marginTop: -inner / 2,
            transform: `scale(${zoom})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {children}
        </div>
        {/* Reflejo de cristal */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.02) 32%, transparent 55%)',
          }}
        />
      </div>
    </div>
  );
};
