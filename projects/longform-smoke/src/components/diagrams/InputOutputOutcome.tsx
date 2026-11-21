import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {COLORS, FONT} from '../../theme';
import {Arrow, DiagramShell} from './DiagramShell';

const NODES = [
  {title: 'Inputs', sub: 'El esfuerzo', key: false},
  {title: 'Outputs', sub: 'El trabajo hecho', key: false},
  {title: 'Outcomes', sub: 'Los resultados reales', key: true},
];

/** Inputs → Outputs → Outcomes: solo los outcomes miden efectividad real. */
export const InputOutputOutcome: React.FC<{
  title?: string;
  notes?: string;
  durationInFrames: number;
}> = ({title, notes, durationInFrames}) => {
  const frame = useCurrentFrame();
  // Nodos repartidos por los primeros 3/4 de la escena; cada flecha
  // aparece CON el nodo al que apunta, nunca sola (ver Love4Stages).
  const at = (i: number) =>
    Math.floor(((durationInFrames - 20) * i) / (NODES.length + 1));
  return (
    <DiagramShell title={title} notes={notes}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {NODES.map((n, i) => {
          const enter = interpolate(frame, [at(i), at(i) + 12], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          return (
            <React.Fragment key={n.title}>
              {i > 0 ? (
                <span style={{opacity: enter, display: 'flex'}}>
                  <Arrow color={COLORS.gray} />
                </span>
              ) : null}
              <div
                style={{
                  width: 420,
                  height: 240,
                  background: n.key ? COLORS.amberDim : COLORS.surface,
                  border: `3px solid ${n.key ? COLORS.amber : COLORS.border}`,
                  borderRadius: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  opacity: enter,
                  transform: `scale(${interpolate(enter, [0, 1], [0.92, 1])})`,
                }}
              >
                <div
                  style={{
                    fontFamily: FONT,
                    fontSize: 52,
                    fontWeight: 800,
                    color: n.key ? COLORS.amber : COLORS.bone,
                  }}
                >
                  {n.title}
                </div>
                <div
                  style={{
                    fontFamily: FONT,
                    fontSize: 34,
                    fontWeight: 500,
                    color: COLORS.gray,
                    textAlign: 'center',
                    padding: '0 24px',
                  }}
                >
                  {n.sub}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </DiagramShell>
  );
};
