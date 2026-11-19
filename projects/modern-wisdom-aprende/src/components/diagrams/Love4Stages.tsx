import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {COLORS, FONT} from '../../theme';
import {Arrow, DiagramShell} from './DiagramShell';

const STAGES = [
  {title: 'Atracción', sub: 'El primer interés'},
  {title: 'Euforia', sub: 'Dopamina'},
  {title: 'Obsesión', sub: 'Serotonina baja'},
  {title: 'Vínculo', sub: 'Oxitocina · vasopresina', key: true},
];

/** Las cuatro etapas del enamoramiento (Fisher y Aron, vía Brooks #931). */
export const Love4Stages: React.FC<{
  title?: string;
  notes?: string;
  durationInFrames: number;
}> = ({title, notes, durationInFrames}) => {
  const frame = useCurrentFrame();
  // Nodos repartidos por los primeros 4/5 de la escena (el diagrama
  // completo queda visible el último quinto); cada flecha aparece CON
  // la tarjeta a la que apunta, nunca sola (flecha colgando = parece bug).
  const at = (i: number) =>
    Math.floor(((durationInFrames - 20) * i) / (STAGES.length + 1));
  return (
    <DiagramShell title={title} notes={notes}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
        }}
      >
        {STAGES.map((s, i) => {
          const enter = interpolate(frame, [at(i), at(i) + 12], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          return (
            <React.Fragment key={s.title}>
              {i > 0 ? (
                <span style={{opacity: enter, display: 'flex'}}>
                  <Arrow width={70} color={COLORS.gray} />
                </span>
              ) : null}
              <div
                style={{
                  width: 340,
                  height: 260,
                  background: s.key ? COLORS.amberDim : COLORS.surface,
                  border: `3px solid ${s.key ? COLORS.amber : COLORS.border}`,
                  borderRadius: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 14,
                  opacity: enter,
                  transform: `translateY(${interpolate(enter, [0, 1], [20, 0])}px)`,
                }}
              >
                <div
                  style={{
                    fontFamily: FONT,
                    fontSize: 30,
                    fontWeight: 800,
                    letterSpacing: 3,
                    color: COLORS.dim,
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div
                  style={{
                    fontFamily: FONT,
                    fontSize: 46,
                    fontWeight: 800,
                    color: s.key ? COLORS.amber : COLORS.bone,
                    textAlign: 'center',
                  }}
                >
                  {s.title}
                </div>
                <div
                  style={{
                    fontFamily: FONT,
                    fontSize: 32,
                    fontWeight: 500,
                    color: COLORS.gray,
                    textAlign: 'center',
                    padding: '0 20px',
                    lineHeight: 1.3,
                  }}
                >
                  {s.sub}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </DiagramShell>
  );
};
