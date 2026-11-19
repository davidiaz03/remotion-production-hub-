import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {COLORS, FONT} from '../../theme';
import {DiagramShell} from './DiagramShell';

/**
 * Escalera de 10 peldaños que se ilumina peldaño a peldaño con el avance
 * de la escena: peldaños superados en hueso, peldaño actual en ámbar,
 * pendientes en gris oscuro.
 */
export const ExposureLadder: React.FC<{
  title?: string;
  notes?: string;
  durationInFrames: number;
}> = ({title, notes, durationInFrames}) => {
  const frame = useCurrentFrame();
  const STEPS = 10;
  const lit = Math.min(
    STEPS - 1,
    Math.floor((frame / Math.max(durationInFrames - 10, 1)) * STEPS),
  );
  const maxH = 300;
  const minH = 56;
  return (
    <DiagramShell title={title} notes={notes}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: 12,
        }}
      >
        {Array.from({length: STEPS}, (_, i) => {
          const h = minH + ((maxH - minH) * i) / (STEPS - 1);
          const state: 'done' | 'current' | 'todo' =
            i < lit ? 'done' : i === lit ? 'current' : 'todo';
          const bg =
            state === 'done'
              ? COLORS.bone
              : state === 'current'
                ? COLORS.amber
                : '#2A2724';
          const labelColor =
            state === 'todo' ? COLORS.dim : state === 'current' ? '#12100E' : COLORS.bg;
          return (
            <div
              key={i}
              style={{
                width: 128,
                height: h,
                background: bg,
                borderRadius: '12px 12px 0 0',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                paddingTop: 14,
                opacity: interpolate(frame, [i * 4, i * 4 + 10], [0.4, 1], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                }),
              }}
            >
              <span
                style={{
                  fontFamily: FONT,
                  fontSize: 30,
                  fontWeight: 800,
                  color: labelColor,
                }}
              >
                {i + 1}
              </span>
            </div>
          );
        })}
      </div>
    </DiagramShell>
  );
};
