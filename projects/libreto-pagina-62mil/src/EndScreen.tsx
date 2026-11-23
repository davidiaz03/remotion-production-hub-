import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {COLORS, FONT, FONT_DISPLAY} from './theme';
import {RedRule} from './components/SceneShell';

/**
 * Pantalla final (cola de 90 fotogramas tras la última línea de VO):
 * cierre de marca El Libreto — suscripción, video siguiente (el Short
 * de Messi) y la pregunta de marca. Sin karaoke. Fondo tinta.
 */
export const EndScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const cardIn = interpolate(frame, [14, 28], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill
      style={{
        background: COLORS.ink,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{textAlign: 'center', opacity, maxWidth: 1500}}>
        <RedRule width={160} />
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 110,
            fontWeight: 900,
            lineHeight: 1.05,
            color: COLORS.paper,
            letterSpacing: 2,
          }}
        >
          EL LIBRETO
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 44,
            fontWeight: 600,
            lineHeight: 1.3,
            color: COLORS.paper,
            marginTop: 24,
          }}
        >
          Geopolítica con las fuentes delante.
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 40,
            fontWeight: 700,
            color: COLORS.highlighter,
            marginTop: 16,
          }}
        >
          Suscríbete para no perderte el siguiente.
        </div>

        <div
          style={{
            marginTop: 56,
            background: 'rgba(245,241,232,0.08)',
            border: `2px solid rgba(245,241,232,0.25)`,
            borderRadius: 24,
            padding: '28px 40px',
            textAlign: 'left',
            opacity: cardIn,
            transform: `translateY(${interpolate(cardIn, [0, 1], [16, 0])}px)`,
          }}
        >
          <div
            style={{
              fontFamily: FONT,
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: 4,
              color: COLORS.red,
              marginBottom: 8,
            }}
          >
            A CONTINUACIÓN · EL SHORT
          </div>
          <div
            style={{
              fontFamily: FONT,
              fontSize: 36,
              fontWeight: 700,
              lineHeight: 1.3,
              color: COLORS.paper,
            }}
          >
            El post de Messi que engañó a 62.000 personas
          </div>
        </div>

        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 40,
            fontWeight: 900,
            fontStyle: 'italic',
            color: COLORS.paper,
            opacity: 0.75,
            marginTop: 48,
          }}
        >
          ¿Quién escribió el libreto?
        </div>
      </div>
    </AbsoluteFill>
  );
};
