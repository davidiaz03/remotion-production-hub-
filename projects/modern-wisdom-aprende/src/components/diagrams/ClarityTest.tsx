import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {COLORS, FONT} from '../../theme';
import {DiagramShell} from './DiagramShell';

/**
 * La prueba de claridad: ¿da claridad incluso en sus días más ocupados?
 * La falta de claridad ES la señal (fila en ámbar).
 */
export const ClarityTest: React.FC<{
  title?: string;
  notes?: string;
  durationInFrames: number;
}> = ({title, notes, durationInFrames}) => {
  const frame = useCurrentFrame();
  const half = Math.floor(durationInFrames / 2);
  const q = interpolate(frame, [4, 16], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const row1 = interpolate(frame, [half - 10, half + 2], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const row2 = interpolate(frame, [half + 8, half + 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <DiagramShell title={title} notes={notes}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 28,
          width: 1500,
        }}
      >
        <div
          style={{
            fontFamily: FONT,
            fontSize: 72,
            fontWeight: 800,
            lineHeight: 1.15,
            color: COLORS.bone,
            textAlign: 'center',
            opacity: q,
          }}
        >
          ¿Da claridad incluso en sus días más ocupados?
        </div>
        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'row',
            gap: 20,
            alignItems: 'center',
            background: COLORS.surface,
            border: `2px solid ${COLORS.border}`,
            borderRadius: 20,
            padding: '24px 32px',
            opacity: row1,
          }}
        >
          <div
            style={{
              fontFamily: FONT,
              fontSize: 32,
              fontWeight: 800,
              letterSpacing: 2,
              color: COLORS.bone,
              background: COLORS.border,
              borderRadius: 12,
              padding: '8px 20px',
              flexShrink: 0,
            }}
          >
            SÍ
          </div>
          <div
            style={{
              fontFamily: FONT,
              fontSize: 38,
              fontWeight: 500,
              lineHeight: 1.3,
              color: COLORS.bone,
            }}
          >
            Interés genuino: disponibilidad, capacidad y madurez.
          </div>
        </div>
        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'row',
            gap: 20,
            alignItems: 'center',
            background: COLORS.amberDim,
            border: `3px solid ${COLORS.amber}`,
            borderRadius: 20,
            padding: '24px 32px',
            opacity: row2,
          }}
        >
          <div
            style={{
              fontFamily: FONT,
              fontSize: 32,
              fontWeight: 800,
              letterSpacing: 2,
              color: '#12100E',
              background: COLORS.amber,
              borderRadius: 12,
              padding: '8px 20px',
              flexShrink: 0,
            }}
          >
            NO
          </div>
          <div
            style={{
              fontFamily: FONT,
              fontSize: 38,
              fontWeight: 700,
              lineHeight: 1.3,
              color: COLORS.bone,
            }}
          >
            La falta de claridad ES la señal.
          </div>
        </div>
      </div>
    </DiagramShell>
  );
};
