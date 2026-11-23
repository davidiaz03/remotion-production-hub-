import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS, FONT, FONT_DISPLAY, headlineSize} from '../theme';
import {RedRule} from './SceneShell';

/**
 * Afirmación central a pantalla completa. Las palabras entran en grupos
 * de ~4 con un pop suave escalonado (ritmo pausado, no karaoke).
 * `highlight`: palabra que va con fondo Resaltador (plan 2.5: «deseable»).
 */
export const BigStatement: React.FC<{
  text: string;
  source?: string;
  highlight?: string;
  onVideo?: boolean;
}> = ({text, source, highlight, onVideo = false}) => {
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
  const isHighlight = (w: string) =>
    !!highlight && w.toLowerCase().includes(highlight.toLowerCase());
  return (
    <div style={{textAlign: 'center', maxWidth: 1600}}>
      <RedRule />
      <div
        style={{
          fontFamily: FONT_DISPLAY,
          fontSize: headlineSize(text),
          fontWeight: 900,
          lineHeight: 1.18,
          color: onVideo ? COLORS.paper : COLORS.ink,
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
              {g.map((w, wi) => (
                <span
                  key={wi}
                  style={
                    isHighlight(w)
                      ? {
                          background: COLORS.highlighter,
                          padding: '0 16px',
                          borderRadius: 10,
                        }
                      : undefined
                  }
                >
                  {w}
                  {wi < g.length - 1 || gi < groups.length - 1 ? ' ' : ''}
                </span>
              ))}
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
            color: onVideo ? 'rgba(245,241,232,0.75)' : COLORS.gray,
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
