import React from 'react';
import {spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS, FONT, headlineSize} from '../theme';
import {AmberRule} from './SceneShell';

/** Pregunta de reflexión a pantalla completa. */
export const Question: React.FC<{text: string}> = ({text}) => {
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
      <div
        style={{
          fontFamily: FONT,
          fontSize: 36,
          fontWeight: 700,
          letterSpacing: 8,
          color: COLORS.amber,
          marginBottom: 28,
        }}
      >
        PREGUNTA PARA TI
      </div>
      <AmberRule width={160} />
      <div
        style={{
          fontFamily: FONT,
          fontSize: headlineSize(text),
          fontWeight: 700,
          lineHeight: 1.2,
          color: COLORS.bone,
          transform: `scale(${pop})`,
        }}
      >
        {text}
      </div>
    </div>
  );
};
