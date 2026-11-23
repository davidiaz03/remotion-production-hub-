import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {COLORS, FONT} from '../theme';
import type {TimelineMilestone} from '../types';

/**
 * Línea de tiempo del patrón (G2, plan-edicion.md): reaparece en cada
 * acto. Banda horizontal con los hitos que aparecen en secuencia.
 *
 * - `milestones`: de scene.timelineMilestones; si no se pasan, la línea
 *   completa del patrón (PATTERN_TIMELINE, del dossier R31).
 * - `activeIndex`: hitos ≤ active en tinta/rojo (ya ocurridos); los
 *   posteriores, en gris (aún no contados). Por defecto, todos activos.
 * - Se usa como OVERLAY al pie de la escena (Video.tsx lo coloca sobre
 *   el cierre 3.7 y sobre cualquier escena con timelineMilestones).
 */
export const PATTERN_TIMELINE: TimelineMilestone[] = [
  {date: '10-NOV-2024', label: 'Se crea la página'},
  {date: 'ENE-2026', label: 'Primera denuncia'},
  {date: 'MAR-2026', label: 'La ráfaga: Messi, Bukele, Musk'},
  {date: 'ABR-2026', label: 'elTOQUE destapa la fórmula'},
  {date: 'JUN-2026', label: 'El bulo sale del feed'},
  {date: 'JUL-2026', label: '770.000 seguidores'},
  {date: 'HOY', label: 'La fórmula sigue viva'},
];

export const TimelinePattern: React.FC<{
  milestones?: TimelineMilestone[];
  activeIndex?: number;
  durationInFrames: number;
}> = ({milestones = PATTERN_TIMELINE, activeIndex, durationInFrames}) => {
  const frame = useCurrentFrame();
  const n = milestones.length;
  const active = activeIndex ?? n - 1;
  // Los hitos aparecen en secuencia, repartidos por la escena.
  const revealAt = (i: number) =>
    Math.floor(((durationInFrames - 20) * i) / Math.max(n, 1));

  return (
    <div
      style={{
        width: '100%',
        background: COLORS.paper,
        borderTop: `3px solid ${COLORS.border}`,
        padding: '28px 40px 24px',
      }}
    >
      <div
        style={{
          fontFamily: FONT,
          fontSize: 26,
          fontWeight: 800,
          letterSpacing: 5,
          color: COLORS.red,
          marginBottom: 18,
        }}
      >
        EL PATRÓN, EN EL TIEMPO
      </div>
      <div style={{position: 'relative', height: 150}}>
        {/* Línea base */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 52,
            height: 4,
            background: COLORS.border,
            borderRadius: 2,
          }}
        />
        {/* Tramo recorrido hasta el hito activo */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 52,
            height: 4,
            width: `${(active / Math.max(n - 1, 1)) * 100}%`,
            background: COLORS.red,
            borderRadius: 2,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'row',
          }}
        >
          {milestones.map((m, i) => {
            const at = revealAt(i);
            const enter = interpolate(frame, [at, at + 10], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            const isActive = i === active;
            const isPast = i < active;
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  position: 'relative',
                  textAlign: 'center',
                  opacity: enter,
                  transform: `translateY(${interpolate(enter, [0, 1], [12, 0])}px)`,
                }}
              >
                <div
                  style={{
                    fontFamily: FONT,
                    fontSize: 24,
                    fontWeight: 800,
                    letterSpacing: 1,
                    color: isActive
                      ? COLORS.red
                      : isPast
                        ? COLORS.ink
                        : COLORS.dim,
                    height: 30,
                  }}
                >
                  {m.date}
                </div>
                <div
                  style={{
                    width: isActive ? 26 : 18,
                    height: isActive ? 26 : 18,
                    borderRadius: '50%',
                    background: isActive
                      ? COLORS.red
                      : isPast
                        ? COLORS.ink
                        : COLORS.surface,
                    border: isPast || isActive ? 'none' : `3px solid ${COLORS.dim}`,
                    margin: '10px auto 0',
                    boxShadow: isActive
                      ? '0 0 0 6px rgba(192,57,43,0.18)'
                      : 'none',
                  }}
                />
                <div
                  style={{
                    fontFamily: FONT,
                    fontSize: 24,
                    fontWeight: 600,
                    lineHeight: 1.25,
                    color: isActive || isPast ? COLORS.ink : COLORS.dim,
                    marginTop: 12,
                    padding: '0 8px',
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
