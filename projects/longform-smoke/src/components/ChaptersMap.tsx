import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import chaptersMetaRaw from '../../chapters.json';
import {COLORS, FONT} from '../theme';
import type {ChaptersMeta} from '../types';

const CHAPTERS = (chaptersMetaRaw as unknown as ChaptersMeta).chapters;

/**
 * Mapa de los 15 capítulos (3×5): el capítulo activo lleva borde ámbar
 * y número ámbar; debajo, su idea clave. `highlight` marca el activo
 * (por defecto, el capítulo de la escena).
 */
export const ChaptersMap: React.FC<{
  chapter: number;
  highlight?: number;
  durationInFrames: number;
}> = ({chapter, highlight, durationInFrames}) => {
  const frame = useCurrentFrame();
  const active = highlight ?? chapter;
  const activeMeta = CHAPTERS.find((c) => c.number === active);
  // Las tarjetas aparecen en oleadas de 3 (una fila por oleada), con la
  // última fila visible desde los 2/3 de la escena para que el mapa
  // completo + la idea clave tengan tiempo en pantalla.
  const rowAt = (row: number) =>
    Math.floor(((durationInFrames - 30) * row) / 6);
  return (
    <div style={{width: '100%'}}>
      <div
        style={{
          fontFamily: FONT,
          fontSize: 52,
          fontWeight: 800,
          lineHeight: 1.15,
          color: COLORS.bone,
          marginBottom: 28,
          textAlign: 'center',
        }}
      >
        Mapa de capítulos
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          alignItems: 'center',
        }}
      >
        {[0, 1, 2, 3, 4].map((row) => {
          const at = rowAt(row);
          const enter = interpolate(frame, [at, at + 10], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          return (
            <div
              key={row}
              style={{
                display: 'flex',
                flexDirection: 'row',
                gap: 12,
                opacity: enter,
              }}
            >
              {CHAPTERS.slice(row * 3, row * 3 + 3).map((c) => {
                const isActive = c.number === active;
                return (
                  <div
                    key={c.number}
                    style={{
                      width: 508,
                      height: 96,
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 16,
                      padding: '0 24px',
                      background: isActive
                        ? COLORS.amberDim
                        : COLORS.surface,
                      border: `2px solid ${
                        isActive ? COLORS.amber : COLORS.border
                      }`,
                      borderRadius: 16,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: FONT,
                        fontSize: 40,
                        fontWeight: 800,
                        color: isActive ? COLORS.amber : COLORS.dim,
                        flexShrink: 0,
                      }}
                    >
                      {String(c.number).padStart(2, '0')}
                    </div>
                    <div
                      style={{
                        fontFamily: FONT,
                        fontSize: 32,
                        fontWeight: 600,
                        lineHeight: 1.15,
                        color: isActive ? COLORS.bone : COLORS.gray,
                      }}
                    >
                      {c.short_title}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      {activeMeta ? (
        <div
          style={{
            fontFamily: FONT,
            fontSize: 34,
            fontWeight: 500,
            lineHeight: 1.35,
            color: COLORS.gray,
            textAlign: 'center',
            maxWidth: 1500,
            margin: '26px auto 0',
            opacity: interpolate(frame, [rowAt(4) + 10, rowAt(4) + 22], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          }}
        >
          {activeMeta.key_idea}
        </div>
      ) : null}
    </div>
  );
};
