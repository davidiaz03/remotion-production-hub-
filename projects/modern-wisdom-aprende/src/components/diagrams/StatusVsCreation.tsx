import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {COLORS, FONT} from '../../theme';
import {DiagramShell} from './DiagramShell';

/** ¿En qué juego juegas? Estatus (suma cero) frente a creación (suma positiva). */
export const StatusVsCreation: React.FC<{
  title?: string;
  notes?: string;
  durationInFrames: number;
}> = ({title, notes, durationInFrames}) => {
  const frame = useCurrentFrame();
  const half = Math.floor(durationInFrames / 2);
  const left = interpolate(frame, [4, 16], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const right = interpolate(frame, [half, half + 14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <DiagramShell title={title} notes={notes}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: 36,
          alignItems: 'stretch',
        }}
      >
        <div
          style={{
            width: 700,
            background: COLORS.surface,
            border: `2px solid ${COLORS.border}`,
            borderRadius: 28,
            padding: '44px 48px',
            opacity: left,
            transform: `translateX(${interpolate(left, [0, 1], [-24, 0])}px)`,
          }}
        >
          <div
            style={{
              fontFamily: FONT,
              fontSize: 48,
              fontWeight: 800,
              color: COLORS.gray,
              marginBottom: 16,
            }}
          >
            Juegos de estatus
          </div>
          <div
            style={{
              fontFamily: FONT,
              fontSize: 40,
              fontWeight: 700,
              color: COLORS.bone,
              marginBottom: 12,
            }}
          >
            Suma cero
          </div>
          <div
            style={{
              fontFamily: FONT,
              fontSize: 34,
              fontWeight: 500,
              lineHeight: 1.4,
              color: COLORS.gray,
            }}
          >
            Parecer. Si yo subo, tú bajas.
          </div>
        </div>
        <div
          style={{
            width: 700,
            background: COLORS.amberDim,
            border: `3px solid ${COLORS.amber}`,
            borderRadius: 28,
            padding: '44px 48px',
            opacity: right,
            transform: `translateX(${interpolate(right, [0, 1], [24, 0])}px)`,
          }}
        >
          <div
            style={{
              fontFamily: FONT,
              fontSize: 48,
              fontWeight: 800,
              color: COLORS.amber,
              marginBottom: 16,
            }}
          >
            Juegos de creación
          </div>
          <div
            style={{
              fontFamily: FONT,
              fontSize: 40,
              fontWeight: 700,
              color: COLORS.bone,
              marginBottom: 12,
            }}
          >
            Suma positiva
          </div>
          <div
            style={{
              fontFamily: FONT,
              fontSize: 34,
              fontWeight: 500,
              lineHeight: 1.4,
              color: COLORS.gray,
            }}
          >
            Crear. Si yo creo, todos ganan.
          </div>
        </div>
      </div>
    </DiagramShell>
  );
};
