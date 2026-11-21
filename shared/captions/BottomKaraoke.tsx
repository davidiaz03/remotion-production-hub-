import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import type {HubCaption, KaraokeLine} from './types';
import {resolveKaraokeLines, type CaptionsToLinesOptions} from './whisper';

/** Rojo corporativo del Memorial (PANTONE 485 C). */
export const MEMORIAL_RED = '#ED1C24';
export const ARCHIVO_BLACK = "'Archivo Black', sans-serif";

/** Contorno negro de 8 direcciones + sombra (idéntico al de Pilar/Marabana). */
export const textOutline = (px: number) =>
  `${px}px 0 0 #000, -${px}px 0 0 #000, 0 ${px}px 0 #000, 0 -${px}px 0 #000, ` +
  `${px * 0.7}px ${px * 0.7}px 0 #000, -${px * 0.7}px -${px * 0.7}px 0 #000, ` +
  `${px * 0.7}px -${px * 0.7}px 0 #000, -${px * 0.7}px ${px * 0.7}px 0 #000, 0 8px 22px rgba(0,0,0,0.65)`;

export type BottomKaraokeProps = {
  /** Líneas preagrupadas (una línea = un chunk visible a la vez). */
  lines?: KaraokeLine[];
  /**
   * Alternativa a `lines`: captions de palabra (HubCaption[]) que se
   * agrupan en líneas con `captionsToLines`. Si vienen ambos, manda `lines`.
   */
  captions?: HubCaption[];
  /** Opciones de agrupación (solo si se pasa `captions`). */
  captionsOptions?: CaptionsToLinesOptions;
  /** Distancia desde abajo (1080×1920). */
  bottom?: number;
  /** Tamaño de fuente base. */
  size?: number;
  /** Tamaño para líneas largas (más de `longThreshold` caracteres). */
  longSize?: number;
  /** Umbral de caracteres para usar `longSize`. */
  longThreshold?: number;
  fontFamily?: string;
  /** Color de la palabra clave. */
  keywordColor?: string;
  /** Color de las palabras normales. */
  color?: string;
  /** Grosor del contorno negro. */
  outlinePx?: number;
  /** Margen lateral. */
  sideMargin?: number;
  /**
   * Estilo del karaoke (hub-v6): 'classic' es el probado (palabra
   * clave en rojo, resto en blanco, contorno negro); 'pill' pone a
   * la palabra ACTUAL en una píldora roja con texto blanco (el
   * estilo de moda en Reels/TikTok 2025-26) y deja el resto como
   * en 'classic'. Por defecto 'classic': ningún proyecto existente
   * cambia.
   */
  variant?: 'classic' | 'pill';
};

/**
 * Subtítulo karaoke INFERIOR estilo presentadora — el patrón probado de
 * Pilar V30 y Marabana V1.3, portado tal cual:
 *
 * - La línea activa es la última cuyo inicio ya pasó; queda visible hasta
 *   que empieza la siguiente (sin corte por fin de línea).
 * - Cada palabra se revela al decirse (`w.s <= t`); la palabra actual
 *   hace pop 1.2→1 en 0,1 s creciendo desde su BORDE IZQUIERDO (para no
 *   comerse el hueco con la anterior, que aún está oculta al hacer pop).
 * - Palabra clave en rojo corporativo; resto en blanco; contorno negro.
 * - Líneas largas (>28 caracteres) bajan de 60 a 52.
 *
 * Los tiempos vienen de faster-whisper (word_timestamps=True), igual que
 * en los proyectos originales.
 */
export const BottomKaraoke: React.FC<BottomKaraokeProps> = ({
  lines: linesProp,
  captions,
  captionsOptions,
  bottom = 235,
  size = 60,
  longSize = 52,
  longThreshold = 28,
  fontFamily = ARCHIVO_BLACK,
  keywordColor = MEMORIAL_RED,
  color = '#FFFFFF',
  outlinePx = 3,
  sideMargin = 40,
  variant = 'classic',
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;

  const lines = React.useMemo(
    () => resolveKaraokeLines(linesProp, captions, captionsOptions),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [linesProp, captions],
  );

  let active: KaraokeLine | null = null;
  for (const line of lines) {
    if (line.words.length === 0) continue;
    if (line.words[0].s <= t) active = line;
    else break;
  }
  if (!active) return null;
  const text = active.words.map((w) => w.t).join(' ');
  const fontSize = text.length > longThreshold ? longSize : size;

  return (
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center'}}>
      <div
        style={{
          marginBottom: bottom,
          marginLeft: sideMargin,
          marginRight: sideMargin,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          fontFamily,
          fontSize,
          lineHeight: 1.18,
        }}
      >
        {active.words.map((w, i) => {
          const revealed = w.s <= t;
          const isCurrent =
            revealed &&
            (i === active.words.length - 1 || active.words[i + 1].s > t);
          // Pop crece desde el borde IZQUIERDO de la palabra para no comerse
          // el hueco con la anterior (la siguiente aún está oculta al hacer pop).
          const pop = isCurrent
            ? interpolate(t - w.s, [0, 0.1], [1.2, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              })
            : 1;
          return (
            <span
              key={i}
              style={{
                visibility: revealed ? 'visible' : 'hidden',
                color:
                  variant === 'pill' && isCurrent
                    ? '#FFFFFF'
                    : w.kw
                      ? keywordColor
                      : color,
                display: 'inline-block',
                transform: `scale(${pop})`,
                transformOrigin: '0% 50%',
                margin: '0 12px',
                textShadow:
                  variant === 'pill' && isCurrent
                    ? '0 4px 14px rgba(0,0,0,0.5)'
                    : textOutline(outlinePx),
                ...(variant === 'pill' && isCurrent
                  ? {
                      backgroundColor: keywordColor,
                      padding: '2px 20px',
                      borderRadius: 20,
                    }
                  : {}),
              }}
            >
              {w.t}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
