import React from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS, FONT, FONT_DISPLAY, CONTENT} from '../theme';
import {formatGrouped} from '../format';
import {expandAssets, isDarkAsset} from '../assetMap';
import {DocumentImage} from './DocumentImage';
import {SourcePill} from './SourcePill';

/**
 * Captura del post + contador animado 0 → 62.000 (G1, plan 0.2) +
 * píldoras de métricas que aparecen una a una (3.300 COMPARTIDOS /
 * ~5.400 COMENTARIOS — cifras de F1-p2, elTOQUE 17-mar-2026).
 *
 * El contador formatea a mano (formatGrouped): toLocaleString('es-ES')
 * NO agrupa miles en el Chrome headless del render (misma trampa que
 * documenta DataStrip), así que el CountUp compartido mostraría
 * «62000» sin punto.
 *
 * Sin imagen (assets vacío): el contador va centrado a pantalla completa.
 */
const DEFAULT_METRICS = [
  {label: 'COMPARTIDOS', value: '3.300'},
  {label: 'COMENTARIOS', value: '~5.400'},
];

export const DocumentCounter: React.FC<{
  assets: string[];
  countTo?: number;
  metrics?: Array<{label: string; value: string}>;
  countLandAt?: number;
  metricAt?: number[];
  durationInFrames: number;
}> = ({
  assets,
  countTo = 62000,
  metrics = DEFAULT_METRICS,
  countLandAt,
  metricAt,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const imgs = expandAssets(assets);
  const img = imgs[0];

  // Conteo 0 → countTo en 1,5 s (45 f), con ease-out; aterriza exacto
  // en countLandAt (fotograma de la palabra «62.000» en la VO) o en f51.
  const COUNT_FRAMES = 45;
  const landAt = countLandAt ?? 6 + COUNT_FRAMES;
  const countStart = Math.max(landAt - COUNT_FRAMES, 0);
  const t = interpolate(frame, [countStart, landAt], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const value = Math.round(countTo * Easing.out(Easing.ease)(t));
  const shown = frame >= landAt ? countTo : value;

  const pop = spring({
    frame: frame - 4,
    fps,
    config: {damping: 200, stiffness: 300},
    durationInFrames: 8,
  });

  const contentH = CONTENT.bottom - CONTENT.top;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: contentH,
        display: 'flex',
        flexDirection: 'row',
        gap: 56,
        alignItems: 'center',
      }}
    >
      {img ? (
        <div style={{position: 'relative', flexShrink: 0}}>
          <DocumentImage asset={img} width={640} height={contentH} />
          <div style={{position: 'absolute', top: 0, left: 0}}>
            <SourcePill
              asset={img}
              bg={isDarkAsset(img) ? COLORS.paper : 'rgba(26,26,46,0.88)'}
              color={isDarkAsset(img) ? COLORS.ink : COLORS.paper}
            />
          </div>
        </div>
      ) : null}

      <div
        style={{
          flex: 1,
          textAlign: img ? 'left' : 'center',
          opacity: pop,
          transform: `scale(${interpolate(pop, [0, 1], [1.12, 1])})`,
        }}
      >
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 168,
            fontWeight: 900,
            letterSpacing: -3,
            lineHeight: 1,
            color: COLORS.red,
          }}
        >
          {formatGrouped(shown)}
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 44,
            fontWeight: 800,
            letterSpacing: 6,
            color: COLORS.ink,
            marginTop: 8,
          }}
        >
          REACCIONES
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: 24,
            marginTop: 44,
            justifyContent: img ? 'flex-start' : 'center',
          }}
        >
          {metrics.map((m, i) => {
            const at = metricAt?.[i] ?? landAt + 8 + i * 14;
            const enter = interpolate(frame, [at, at + 10], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            return (
              <div
                key={m.label}
                style={{
                  background: COLORS.surface,
                  border: `2px solid ${COLORS.border}`,
                  borderRadius: 20,
                  padding: '24px 32px',
                  textAlign: 'center',
                  opacity: enter,
                  transform: `translateY(${interpolate(enter, [0, 1], [16, 0])}px)`,
                  boxShadow: '0 8px 24px rgba(26,26,46,0.06)',
                }}
              >
                <div
                  style={{
                    fontFamily: FONT,
                    fontSize: 56,
                    fontWeight: 800,
                    lineHeight: 1,
                    color: COLORS.ink,
                  }}
                >
                  {m.value}
                </div>
                <div
                  style={{
                    fontFamily: FONT,
                    fontSize: 26,
                    fontWeight: 700,
                    letterSpacing: 2,
                    color: COLORS.gray,
                    marginTop: 8,
                  }}
                >
                  {m.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
