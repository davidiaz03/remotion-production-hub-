import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {COLORS, FONT} from '../theme';
import type {TimelineChapter} from '../types';

/**
 * Barra de progreso con capítulos, siempre visible en el BORDE SUPERIOR
 * (decisión documentada: el borde inferior lo ocupa el karaoke; arriba
 * no compite con nada). 15 segmentos proporcionales a la duración de
 * cada capítulo: completados en ámbar, activo con relleno parcial ámbar,
 * pendientes en gris. Debajo, el capítulo activo en texto (28 px).
 */
export const ProgressBar: React.FC<{
  chapters: TimelineChapter[];
  totalFrames: number;
}> = ({chapters, totalFrames}) => {
  const frame = useCurrentFrame();
  const activeIdx = Math.max(
    0,
    chapters.findIndex((c, i) => {
      const next = chapters[i + 1];
      return frame >= c.startFrame && (!next || frame < next.startFrame);
    }),
  );
  const active = chapters[activeIdx];
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {/* Segmentos */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 10,
          display: 'flex',
          flexDirection: 'row',
          gap: 4,
          padding: '0 4px',
        }}
      >
        {chapters.map((c) => {
          const span = c.endFrame - c.startFrame;
          const fill = interpolate(frame, [c.startFrame, c.endFrame], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          return (
            <div
              key={c.number}
              style={{
                flexGrow: span,
                flexBasis: 0,
                background: COLORS.border,
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${fill * 100}%`,
                  height: '100%',
                  background: COLORS.amber,
                }}
              />
            </div>
          );
        })}
      </div>
      {/* Capítulo activo */}
      <div
        style={{
          position: 'absolute',
          top: 26,
          left: 40,
          fontFamily: FONT,
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: 2,
          color: COLORS.gray,
        }}
      >
        <span style={{color: COLORS.amber}}>
          CAPÍTULO {active.number}
        </span>
        {'  ·  '}
        {active.shortTitle.toUpperCase()}
      </div>
      {/* Contador de capítulos a la derecha */}
      <div
        style={{
          position: 'absolute',
          top: 26,
          right: 40,
          fontFamily: FONT,
          fontSize: 28,
          fontWeight: 600,
          letterSpacing: 2,
          color: COLORS.dim,
        }}
      >
        {active.number + 1} / {chapters.length}
      </div>
    </AbsoluteFill>
  );
};
