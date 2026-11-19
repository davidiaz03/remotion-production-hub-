import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {COLORS, FONT} from '../../theme';
import {DiagramShell} from './DiagramShell';

/**
 * Anatomía del mito 80/20: lo que los datos sí dicen (likes concentrados,
 * barra sólida) frente al salto sin datos (relaciones acaparadas, barra
 * hueca tachada).
 */
export const Pareto8020: React.FC<{
  title?: string;
  notes?: string;
  durationInFrames: number;
}> = ({title, notes, durationInFrames}) => {
  const frame = useCurrentFrame();
  const bar1 = interpolate(frame, [6, 26], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const bar2 = interpolate(
    frame,
    [Math.floor(durationInFrames / 2), Math.floor(durationInFrames / 2) + 16],
    [0, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  return (
    <DiagramShell title={title} notes={notes}>
      <div
        style={{display: 'flex', flexDirection: 'column', gap: 40, width: 1560}}
      >
        {/* Fila 1: lo real */}
        <div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: 14,
            }}
          >
            <span
              style={{
                fontFamily: FONT,
                fontSize: 40,
                fontWeight: 700,
                color: COLORS.bone,
              }}
            >
              Likes en apps: concentrados
            </span>
            <span
              style={{
                fontFamily: FONT,
                fontSize: 30,
                fontWeight: 800,
                letterSpacing: 3,
                color: COLORS.amber,
              }}
            >
              REAL
            </span>
          </div>
          <div
            style={{
              height: 72,
              background: COLORS.surface,
              border: `2px solid ${COLORS.border}`,
              borderRadius: 16,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.round(bar1 * 80)}%`,
                height: '100%',
                background: COLORS.bone,
                borderRadius: 14,
              }}
            />
          </div>
        </div>
        {/* Fila 2: el salto sin datos */}
        <div style={{opacity: bar2}}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: 14,
            }}
          >
            <span
              style={{
                fontFamily: FONT,
                fontSize: 40,
                fontWeight: 700,
                color: COLORS.gray,
                textDecoration: 'line-through',
                textDecorationThickness: 4,
              }}
            >
              Relaciones acaparadas por pocos
            </span>
            <span
              style={{
                fontFamily: FONT,
                fontSize: 30,
                fontWeight: 800,
                letterSpacing: 3,
                color: COLORS.amber,
              }}
            >
              SIN DATOS
            </span>
          </div>
          <div
            style={{
              height: 72,
              background: 'transparent',
              border: `3px dashed ${COLORS.dim}`,
              borderRadius: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontFamily: FONT,
                fontSize: 32,
                fontWeight: 600,
                color: COLORS.dim,
              }}
            >
              El salto de «likes» a «relaciones» no se sostiene
            </span>
          </div>
        </div>
      </div>
    </DiagramShell>
  );
};
