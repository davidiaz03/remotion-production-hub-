import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS, FONT} from '../theme';

/**
 * Diagrama de la fórmula (G4, plan 1.4): los pasos se construyen uno a
 * uno (un paso por frase de VO) y desembocan en VIRAL.
 *
 * items: los pasos de scene.items (se les quita el «1. » inicial si lo
 * traen). `lastStepTag`: rótulo bajo el último paso («SIN ACLARACIÓN»,
 * de F2-p2: «sin ningún tipo de aclaración»).
 */
const stripNumber = (s: string): string => s.replace(/^\s*\d+[.)]\s*/, '');

export const FormulaDiagram: React.FC<{
  items: string[];
  title?: string;
  lastStepTag?: string;
  itemAt?: number[];
  viralAt?: number;
  durationInFrames: number;
}> = ({
  items,
  title = 'La fórmula, en cuatro pasos',
  lastStepTag,
  itemAt,
  viralAt: viralAtProp,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const steps = items.map(stripNumber);
  const n = steps.length;
  // Cada paso aparece cuando la VO lo enuncia (itemAt) o, sin
  // sincronía, repartido por la escena.
  const revealAt = (i: number) =>
    itemAt?.[i] ??
    Math.floor(((durationInFrames - 30) * i) / Math.max(n + 1, 1));
  const viralAt = viralAtProp ?? revealAt(n);
  const viralPop = spring({
    frame: frame - viralAt,
    fps,
    config: {damping: 200, stiffness: 240},
    durationInFrames: 12,
  });

  return (
    <div style={{width: '100%', maxWidth: 1640}}>
      {title ? (
        <div
          style={{
            fontFamily: FONT,
            fontSize: 56,
            fontWeight: 800,
            lineHeight: 1.15,
            color: COLORS.ink,
            textAlign: 'center',
            marginBottom: 48,
          }}
        >
          {title}
        </div>
      ) : null}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: 0,
          alignItems: 'stretch',
          justifyContent: 'center',
        }}
      >
        {steps.map((step, i) => {
          const at = revealAt(i);
          const enter = interpolate(frame, [at, at + 12], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const isLast = i === n - 1;
          return (
            <React.Fragment key={i}>
              <div
                style={{
                  flex: 1,
                  maxWidth: 300,
                  background: COLORS.surface,
                  border: `2px solid ${COLORS.border}`,
                  borderRadius: 24,
                  padding: '32px 24px',
                  textAlign: 'center',
                  opacity: enter,
                  transform: `translateY(${interpolate(enter, [0, 1], [24, 0])}px)`,
                  boxShadow: '0 12px 32px rgba(26,26,46,0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    fontFamily: FONT,
                    fontSize: 30,
                    fontWeight: 800,
                    color: COLORS.red,
                    marginBottom: 12,
                  }}
                >
                  PASO {i + 1}
                </div>
                <div
                  style={{
                    fontFamily: FONT,
                    fontSize: 32,
                    fontWeight: 600,
                    lineHeight: 1.3,
                    color: COLORS.ink,
                  }}
                >
                  {step}
                </div>
                {isLast && lastStepTag ? (
                  <div
                    style={{
                      marginTop: 16,
                      fontFamily: FONT,
                      fontSize: 24,
                      fontWeight: 800,
                      letterSpacing: 2,
                      color: COLORS.paper,
                      background: COLORS.red,
                      borderRadius: 999,
                      padding: '8px 16px',
                      alignSelf: 'center',
                    }}
                  >
                    {lastStepTag}
                  </div>
                ) : null}
              </div>
              {i < n - 1 ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 10px',
                    fontFamily: FONT,
                    fontSize: 44,
                    fontWeight: 800,
                    color: COLORS.gray,
                    opacity: interpolate(frame, [at + 12, at + 20], [0, 1], {
                      extrapolateLeft: 'clamp',
                      extrapolateRight: 'clamp',
                    }),
                  }}
                >
                  +
                </div>
              ) : null}
            </React.Fragment>
          );
        })}
        {/* Flecha final + VIRAL */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0 14px',
            fontFamily: FONT,
            fontSize: 52,
            fontWeight: 800,
            color: COLORS.red,
            opacity: viralPop,
          }}
        >
          →
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: COLORS.red,
            borderRadius: 24,
            padding: '32px 36px',
            opacity: viralPop,
            transform: `scale(${interpolate(viralPop, [0, 1], [0.9, 1])})`,
            boxShadow: '0 16px 40px rgba(192,57,43,0.35)',
          }}
        >
          <div
            style={{
              fontFamily: FONT,
              fontSize: 56,
              fontWeight: 800,
              letterSpacing: 4,
              color: COLORS.paper,
            }}
          >
            VIRAL
          </div>
        </div>
      </div>
    </div>
  );
};
