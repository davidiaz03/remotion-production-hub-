import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {COLORS, FONT} from './theme';
import {AmberRule} from './components/SceneShell';

/**
 * Pantalla final (cola de 90 fotogramas tras la última línea de VO):
 * limpia, sin karaoke, sin CTA. Solo la métrica.
 */
export const EndScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill
      style={{
        background: COLORS.bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{textAlign: 'center', opacity}}>
        <AmberRule width={160} />
        <div
          style={{
            fontFamily: FONT,
            fontSize: 96,
            fontWeight: 800,
            lineHeight: 1.15,
            color: COLORS.bone,
          }}
        >
          Éxito es haber actuado.
        </div>
      </div>
    </AbsoluteFill>
  );
};
