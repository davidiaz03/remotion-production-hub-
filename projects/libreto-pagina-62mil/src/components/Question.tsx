import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS, FONT, FONT_DISPLAY, headlineSize} from '../theme';
import {RedRule} from './SceneShell';

/**
 * Pregunta de reflexión a pantalla completa (re-gancho de acto).
 * Se renderiza sobre fondo Tinta (Video.tsx pasa bg a SceneShell):
 * texto Papel, rótulo en rojo. Respiración lenta 1→1,03 para que los
 * holds largos (la pregunta de fin de Acto 0 dura 14 s) no queden
 * como plano fijo.
 */
export const Question: React.FC<{text: string; durationInFrames?: number}> = ({
  text,
  durationInFrames = 300,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pop = spring({
    frame,
    fps,
    config: {damping: 200, stiffness: 160},
    durationInFrames: 16,
  });
  const breathe = interpolate(frame, [0, durationInFrames], [1, 1.03], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        textAlign: 'center',
        maxWidth: 1560,
        transform: `scale(${breathe})`,
      }}
    >
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
        EL LIBRETO
      </div>
      <RedRule width={160} />
      <div
        style={{
          fontFamily: FONT_DISPLAY,
          fontSize: headlineSize(text),
          fontWeight: 900,
          lineHeight: 1.2,
          color: COLORS.paper,
          transform: `scale(${pop})`,
        }}
      >
        {text}
      </div>
    </div>
  );
};
