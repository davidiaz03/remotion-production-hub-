import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS, FONT, headlineSize} from '../theme';
import {AmberRule} from './SceneShell';

/**
 * Afirmación central a pantalla completa. Las palabras entran en grupos
 * de ~4 con un pop suave escalonado (ritmo pausado, no karaoke).
 */
export const BigStatement: React.FC<{text: string; source?: string}> = ({
  text,
  source,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const words = text.split(/\s+/);
  const GROUP = 4;
  const groups: string[][] = [];
  for (let i = 0; i < words.length; i += GROUP) {
    groups.push(words.slice(i, i + GROUP));
  }
  const sourceOpacity = interpolate(
    frame,
    [groups.length * 5 + 6, groups.length * 5 + 16],
    [0, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  return (
    <div style={{textAlign: 'center', maxWidth: 1600}}>
      <AmberRule />
      <div
        style={{
          fontFamily: FONT,
          fontSize: headlineSize(text),
          fontWeight: 700,
          lineHeight: 1.18,
          color: COLORS.bone,
        }}
      >
        {groups.map((g, gi) => {
          const pop = spring({
            frame: frame - gi * 5,
            fps,
            config: {damping: 200, stiffness: 240},
            durationInFrames: 10,
          });
          return (
            <span
              key={gi}
              style={{
                display: 'inline-block',
                opacity: pop,
                transform: `scale(${interpolate(pop, [0, 1], [1.08, 1])})`,
              }}
            >
              {g.join(' ') + (gi < groups.length - 1 ? ' ' : '')}
            </span>
          );
        })}
      </div>
      {source ? (
        <div
          style={{
            fontFamily: FONT,
            fontSize: 36,
            fontWeight: 500,
            color: COLORS.gray,
            marginTop: 40,
            opacity: sourceOpacity,
          }}
        >
          {source}
        </div>
      ) : null}
    </div>
  );
};
