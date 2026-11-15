import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {MOTION_COLORS, POPPINS} from './theme';

export type KaraokeWord = {
  /** Texto de la palabra (con su puntuación). */
  t: string;
  /** Inicio en segundos (word_timestamps de faster-whisper). */
  s: number;
  /** Fin en segundos. */
  e: number;
  /** Palabra clave: al decirse se encierra en el recuadro azul. */
  kw?: boolean;
};

export type KaraokeLine = {words: KaraokeWord[]};

export type TopKaraokeProps = {
  /** Líneas preagrupadas (como los chunks de captions.ts). */
  lines: KaraokeLine[];
  /** Distancia desde arriba (1080×1920). */
  top?: number;
  /** Tamaño de fuente. */
  size?: number;
  fontFamily?: string;
  /** Color de la palabra activa. */
  activeColor?: string;
  /** Color de las palabras no activas. */
  idleColor?: string;
  /** Color del recuadro de palabra clave. */
  keywordColor?: string;
  /** Ancho máximo del bloque. */
  maxWidth?: number;
};

/**
 * Subtítulo karaoke SUPERIOR del explainer animado (técnica central del
 * estilo de referencia): la palabra que se está diciendo va en BLANCO y
 * negrita con un pop de escala; las demás en GRIS. Las palabras clave
 * (kw) se encierran en el recuadro azul con puntos en las esquinas al
 * pronunciarse. Las líneas de una sola palabra van alineadas a la izquierda
 * (como en la referencia); las demás, centradas.
 *
 * Los tiempos vienen de faster-whisper (word_timestamps=True), igual que
 * el karaoke inferior del Memorial (captions.ts).
 */
export const TopKaraoke: React.FC<TopKaraokeProps> = ({
  lines,
  top = 340,
  size = 72,
  fontFamily = POPPINS,
  activeColor = MOTION_COLORS.white,
  idleColor = MOTION_COLORS.gray,
  keywordColor = MOTION_COLORS.blue,
  maxWidth = 960,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const now = frame / fps;

  // Línea activa: desde que empieza su primera palabra hasta 0,2 s después
  // de la última. Entre líneas no se muestra nada (corte limpio).
  const lineIdx = lines.findIndex((line) => {
    if (line.words.length === 0) return false;
    const start = line.words[0].s;
    const end = line.words[line.words.length - 1].e;
    return now >= start - 0.02 && now <= end + 0.2;
  });
  if (lineIdx < 0) return null;
  const line = lines[lineIdx];

  const lineStart = line.words[0].s * fps;
  const enter = interpolate(frame, [lineStart, lineStart + 6], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const single = line.words.length === 1;

  return (
    <div
      style={{
        position: 'absolute',
        top,
        left: single ? 110 : 60,
        right: 60,
        maxWidth: single ? maxWidth : undefined,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: single ? 'flex-start' : 'center',
        alignItems: 'baseline',
        gap: `0 ${Math.round(size * 0.28)}px`,
        opacity: enter,
        transform: `translateY(${interpolate(enter, [0, 1], [10, 0])}px)`,
        pointerEvents: 'none',
      }}
    >
      {line.words.map((w, i) => {
        const end = w.e > w.s ? w.e : w.s + 0.08;
        const active = now >= w.s && now < end;
        const said = now >= end;
        const pop = active
          ? spring({
              frame: frame - w.s * fps,
              fps,
              config: {damping: 12, stiffness: 320},
            })
          : 1;
        const scale = interpolate(pop, [0, 1], [1.3, 1]);
        const boxed = Boolean(w.kw) && (active || said);
        return (
          <span
            key={`${lineIdx}-${i}`}
            style={{
              position: 'relative',
              fontFamily,
              fontSize: size,
              fontWeight: active ? 800 : 500,
              lineHeight: 1.15,
              color: active ? activeColor : idleColor,
              transform: `scale(${scale})`,
              display: 'inline-block',
              // Recuadro de palabra clave (azul, esquinas redondeadas).
              border: boxed ? `3px solid ${keywordColor}` : '3px solid transparent',
              borderRadius: 14,
              padding: boxed ? '0 14px 2px' : '0 2px 2px',
              margin: boxed ? '0 4px' : 0,
              background: boxed ? 'rgba(46,124,246,0.14)' : 'transparent',
            }}
          >
            {w.t}
            {boxed && (
              <>
                <span
                  style={{
                    position: 'absolute',
                    left: -6,
                    top: -6,
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: keywordColor,
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    right: -6,
                    bottom: -6,
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: keywordColor,
                  }}
                />
              </>
            )}
          </span>
        );
      })}
    </div>
  );
};
