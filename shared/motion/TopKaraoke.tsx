import React from 'react';
import {
	Easing,
	interpolate,
	spring,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import {
  resolveKaraokeLines,
  type CaptionsToLinesOptions,
  type HubCaption,
  type KaraokeLine,
  type KaraokeWord,
} from '../captions';
import {MOTION_COLORS, POPPINS} from './theme';

// Re-exportados desde shared/captions (tipos canónicos del hub) para que
// los imports existentes desde './TopKaraoke' sigan funcionando.
export type {KaraokeLine, KaraokeWord} from '../captions';

export type TopKaraokeProps = {
  /** Líneas preagrupadas (como los chunks de captions.ts). */
  lines?: KaraokeLine[];
  /**
   * Alternativa a `lines`: captions de palabra (HubCaption[]) que se
   * agrupan en líneas con `captionsToLines`. Si vienen ambos, manda `lines`.
   */
  captions?: HubCaption[];
  /** Opciones de agrupación (solo si se pasa `captions`). */
  captionsOptions?: CaptionsToLinesOptions;
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
  /**
   * Pop SOLO en la palabra clave (kw): escala 1 → 1,05 con overshoot
   * en 2 f al inicio de la palabra; el resto sin escala. Por defecto
   * (false) todas las palabras activas hacen pop 1,3 → 1.
   */
  keywordPop?: boolean;
  /** Puntos en las esquinas del recuadro de palabra clave. */
  keywordDots?: boolean;
  /**
   * Segundos que una línea sigue visible tras su última palabra.
   * Por defecto 0,2. Con solapes, manda la línea más reciente.
   */
  hold?: number;
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
 * el karaoke inferior del Memorial (captions.ts). Acepta `lines`
 * preagrupadas o `captions` (HubCaption[]) que se agrupan con
 * `captionsToLines` (shared/captions).
 */
export const TopKaraoke: React.FC<TopKaraokeProps> = ({
  lines: linesProp,
  captions,
  captionsOptions,
  top = 340,
  size = 72,
  fontFamily = POPPINS,
  activeColor = MOTION_COLORS.white,
  idleColor = MOTION_COLORS.gray,
  keywordColor = MOTION_COLORS.blue,
  maxWidth = 960,
  keywordPop = false,
  keywordDots = true,
  hold = 0.2,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const now = frame / fps;

  const lines = React.useMemo(
    () => resolveKaraokeLines(linesProp, captions, captionsOptions),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [linesProp, captions],
  );

  // Línea activa: desde que empieza su primera palabra hasta `hold`
  // después de la última. Entre líneas no se muestra nada (corte
  // limpio). Si dos líneas solapan (hold largo), manda la más
  // reciente: la línea vieja nunca bloquea a la nueva. (reduce
  // en vez de findLastIndex: el lib de TS no llega a es2023.)
  const lineIdx = lines.reduce<number>((acc, line, i) => {
    if (line.words.length === 0) return acc;
    const start = line.words[0].s;
    const end = line.words[line.words.length - 1].e;
    return now >= start - 0.02 && now <= end + hold ? i : acc;
  }, -1);
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
        const isKw = Boolean(w.kw);
        // Pop: con keywordPop, SOLO la palabra clave (1 → 1,05 con
        // overshoot en 2 f al activarse, 1,05 mientras se dice, 1 al
        // terminar); el resto sin escala. Sin keywordPop, el pop
        // clásico 1,3 → 1 en cada palabra activa.
        let scale = 1;
        if (keywordPop) {
          if (isKw && active) {
            scale = interpolate(frame - w.s * fps, [0, 2], [1, 1.05], {
              easing: Easing.out(Easing.back(2.2)),
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
          }
        } else if (active) {
          const pop = spring({
            frame: frame - w.s * fps,
            fps,
            config: {damping: 12, stiffness: 320},
          });
          scale = interpolate(pop, [0, 1], [1.3, 1]);
        }
        const boxed = isKw && (active || said);
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
              // Sombra sutil: define los glifos sobre fondos claros
              // (p. ej. el documento blanco de L4); invisible sobre
              // fondos oscuros.
              textShadow: '0 2px 10px rgba(0,0,0,0.85)',
              // Recuadro de palabra clave (azul, esquinas redondeadas).
              border: boxed ? `3px solid ${keywordColor}` : '3px solid transparent',
              borderRadius: 14,
              padding: boxed ? '0 14px 2px' : '0 2px 2px',
              margin: boxed ? '0 4px' : 0,
              background: boxed ? 'rgba(46,124,246,0.14)' : 'transparent',
            }}
          >
            {w.t}
            {boxed && keywordDots && (
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
