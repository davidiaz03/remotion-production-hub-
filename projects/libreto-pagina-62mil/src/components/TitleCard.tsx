import React from 'react';
import {spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS, FONT, FONT_DISPLAY, headlineSize} from '../theme';
import {RedRule} from './SceneShell';

/** Tarjeta de título del video (tras el gancho, ~0:40): kicker rojo +
 * título en Noto Serif Display Black + subtítulo. Fondo Papel. */
export const TitleCard: React.FC<{
  kicker?: string;
  title: string;
  subtitle?: string;
}> = ({kicker, title, subtitle}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pop = spring({
    frame,
    fps,
    config: {damping: 200, stiffness: 160},
    durationInFrames: 16,
  });
  return (
    <div style={{textAlign: 'center', maxWidth: 1560}}>
      {kicker ? (
        <div
          style={{
            fontFamily: FONT,
            fontSize: 36,
            fontWeight: 700,
            letterSpacing: 8,
            color: COLORS.red,
            marginBottom: 28,
          }}
        >
          {kicker}
        </div>
      ) : null}
      <RedRule width={160} />
      <div
        style={{
          fontFamily: FONT_DISPLAY,
          fontSize: headlineSize(title),
          fontWeight: 900,
          lineHeight: 1.12,
          color: COLORS.ink,
          transform: `scale(${pop})`,
        }}
      >
        {title}
      </div>
      {subtitle ? (
        <div
          style={{
            fontFamily: FONT,
            fontSize: 42,
            fontWeight: 500,
            lineHeight: 1.3,
            color: COLORS.gray,
            marginTop: 32,
          }}
        >
          {subtitle}
        </div>
      ) : null}
    </div>
  );
};
