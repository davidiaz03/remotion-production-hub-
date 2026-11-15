import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {GLOW_PRESETS, GlowPreset, MOTION_COLORS, seeded} from './theme';

export type GlowStageProps = {
  /** Preset de color emocional (danger | safe | neutral | curiosity | ink). */
  glow?: GlowPreset;
  /** Posición del resplandor (por defecto centro, 42% de alto). */
  glowAt?: {x: number; y: number};
  /** Partículas ambientales (polvo/estrellas). */
  particles?: number;
  /** Semilla para las partículas (determinista). */
  seed?: number;
  children?: React.ReactNode;
};

/**
 * Escenario oscuro del explainer animado: fondo tinta + resplandor radial
 * de color emocional + partículas flotantes + viñeta.
 *
 * El resplandor es la narración emocional paralela del estilo de referencia:
 * rojo = peligro, verde = seguro, naranja = curiosidad. Para cambiar de acto,
 * monta dos GlowStage en Sequence con fundido (o anima `glow` entre presets
 * con un fundido cruzado manual).
 */
export const GlowStage: React.FC<GlowStageProps> = ({
  glow = 'ink',
  glowAt = {x: 50, y: 42},
  particles = 42,
  seed = 7,
  children,
}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const preset = GLOW_PRESETS[glow];
  const t = frame / fps;

  const dots = React.useMemo(
    () =>
      Array.from({length: particles}, (_, i) => {
        const s = seed * 1000 + i * 17;
        return {
          x: seeded(s) * width,
          y: seeded(s + 1) * height,
          size: 1.5 + seeded(s + 2) * 3,
          speed: 6 + seeded(s + 3) * 14,
          phase: seeded(s + 4) * Math.PI * 2,
          twinkle: 0.25 + seeded(s + 5) * 0.5,
          accent: seeded(s + 6) > 0.88,
        };
      }),
    [particles, seed, width, height],
  );

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 95% 75% at ${glowAt.x}% ${glowAt.y}%, ${preset.glow} 0%, ${preset.edge} 45%, ${MOTION_COLORS.ink} 78%)`,
      }}
    >
      {/* Partículas: deriva lenta hacia arriba + parpadeo. Determinista. */}
      {dots.map((d, i) => {
        const drift = (t * d.speed + d.phase * 20) % (height + 40);
        const y = (d.y - drift + height + 40) % (height + 40) - 20;
        const x = d.x + Math.sin(t * 0.4 + d.phase) * 12;
        const opacity =
          d.twinkle * (0.55 + 0.45 * Math.sin(t * 1.3 + d.phase * 3));
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: d.size,
              height: d.size,
              borderRadius: '50%',
              background: d.accent ? MOTION_COLORS.redSoft : '#FFFFFF',
              opacity: Math.max(0.05, opacity),
            }}
          />
        );
      })}
      {/* Viñeta */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse 105% 90% at 50% 45%, transparent 55%, rgba(0,0,0,0.55) 100%)',
        }}
      />
      {children}
    </AbsoluteFill>
  );
};

/**
 * Fundido cruzado entre dos presets de resplandor (cambio de acto).
 * Renderiza SOLO la etapa destino con opacidad 0→1; la etapa origen es
 * el GlowStage raíz que queda debajo. Las partículas usan la misma semilla
 * que el raíz, así que no se duplican durante el fundido.
 */
export const GlowCrossfade: React.FC<{
  to: GlowPreset;
  /** Fotograma en el que empieza el cambio. */
  atFrame: number;
  /** Duración del fundido en fotogramas. */
  durationInFrames?: number;
  particles?: number;
  seed?: number;
}> = ({to, atFrame, durationInFrames = 45, particles = 42, seed = 7}) => {
  const frame = useCurrentFrame();
  const mix = interpolate(frame, [atFrame, atFrame + durationInFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  if (frame < atFrame) return null;
  return (
    <AbsoluteFill style={{opacity: mix}}>
      <GlowStage glow={to} particles={particles} seed={seed} />
    </AbsoluteFill>
  );
};
