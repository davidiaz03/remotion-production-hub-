import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {COLORS, FONT} from '../../theme';
import {DiagramShell} from './DiagramShell';

const TYPES = [
  {title: 'Práctica', sub: 'Resolver algo', key: false},
  {title: 'Emocional', sub: 'Ser escuchado', key: true},
  {title: 'Social', sub: 'Pertenecer', key: false},
];

/**
 * Diagnostica el tipo de conversación. La emocional va en ámbar: el error
 * clásico es responder con soluciones a quien solo quiere ser escuchado.
 */
export const ConversationTypes: React.FC<{
  title?: string;
  notes?: string;
  durationInFrames: number;
}> = ({title, notes, durationInFrames}) => {
  const frame = useCurrentFrame();
  const at = (i: number) =>
    Math.floor(((durationInFrames - 20) * i) / TYPES.length);
  return (
    <DiagramShell title={title} notes={notes}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: 28,
          alignItems: 'stretch',
        }}
      >
        {TYPES.map((t, i) => {
          const enter = interpolate(frame, [at(i), at(i) + 12], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          return (
            <div
              key={t.title}
              style={{
                width: 480,
                height: 260,
                background: t.key ? COLORS.amberDim : COLORS.surface,
                border: `3px solid ${t.key ? COLORS.amber : COLORS.border}`,
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
                  fontSize: 50,
                  fontWeight: 800,
                  color: t.key ? COLORS.amber : COLORS.bone,
                }}
              >
                {t.title}
              </div>
              <div
                style={{
                  fontFamily: FONT,
                  fontSize: 36,
                  fontWeight: 500,
                  color: COLORS.gray,
                }}
              >
                {t.sub}
              </div>
            </div>
          );
        })}
      </div>
    </DiagramShell>
  );
};
