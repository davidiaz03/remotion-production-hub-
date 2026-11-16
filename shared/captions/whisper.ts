/**
 * Conversión faster-whisper → Caption[] y agrupación en líneas de karaoke.
 *
 * Flujo canónico del hub:
 *
 *   faster-whisper word_timestamps
 *     → whisperWordsToCaptions()  → HubCaption[] (con kw y pageBreakAfter)
 *     → captionsToLines()         → KaraokeLine[] (vía createTikTokStyleCaptions)
 *     → <BottomKaraoke lines={...} /> / <TopKaraoke lines={...} />
 *
 * REGLA DEL ESPACIO INICIAL: `createTikTokStyleCaptions` solo puede romper
 * una página en una palabra cuyo texto empiece por espacio (lo comprueba
 * con `text.startsWith(' ')`). faster-whisper ya trae el espacio inicial
 * en casi todas las palabras, pero la primera de cada segmento no lo trae
 * y alguna palabra con puntuación tampoco; el conversor lo normaliza: toda
 * palabra salvo la primera del documento lleva espacio inicial.
 */
import {createTikTokStyleCaptions} from '@remotion/captions';
import type {HubCaption, KaraokeLine, WhisperWord} from './types';

export type WhisperToCaptionsOptions = {
  /**
   * Índices (0-based, sobre el array de palabras) de las palabras clave.
   * Alternativa a `keywordWords` cuando ya se sabe la posición.
   */
  keywordIndices?: Set<number> | number[];
  /**
   * Palabras clave por texto (comparación insensible a mayúsculas y sin
   * puntuación final). Útil cuando el guion marca las keywords por palabra.
   */
  keywordWords?: Set<string> | string[];
  /**
   * Índices (0-based) de la ÚLTIMA palabra de cada chunk manual. Esas
   * palabras llevan `pageBreakAfter: true`, de modo que
   * `createTikTokStyleCaptions` reproduce exactamente los chunks del guion
   * (los que define transcribe-vo.py). Sin esto, las páginas se agrupan
   * solo por duración y silencios.
   */
  chunkEndIndices?: Set<number> | number[];
};

const normalizeWord = (w: string) =>
  w
    .trim()
    .toLowerCase()
    .replace(/[.,;:!?¿¡«»"“”()…]+$/g, '');

const toSet = (v: Set<number> | number[] | undefined): Set<number> =>
  v === undefined ? new Set() : v instanceof Set ? v : new Set(v);

const toStringSet = (v: Set<string> | string[] | undefined): Set<string> =>
  v === undefined
    ? new Set()
    : new Set(Array.from(v).map((w) => normalizeWord(w)));

/**
 * faster-whisper word_timestamps → HubCaption[].
 *
 * - `text`: la palabra, con espacio inicial asegurado salvo en la primera
 *   del documento (ver regla del espacio inicial, arriba).
 * - `timestampMs`: = startMs (convención para captions de palabra).
 * - `confidence`: la probabilidad de Whisper, o null.
 * - `kw`: según `keywordIndices` / `keywordWords`.
 * - `pageBreakAfter`: según `chunkEndIndices`.
 */
export const whisperWordsToCaptions = (
  words: WhisperWord[],
  opts: WhisperToCaptionsOptions = {},
): HubCaption[] => {
  const kwIdx = toSet(opts.keywordIndices);
  const kwWords = toStringSet(opts.keywordWords);
  const chunkEnds = toSet(opts.chunkEndIndices);
  return words.map((w, i) => {
    const bare = w.word.trim();
    // Espacio inicial en todas salvo la primera (la primera nunca rompe
    // página y `createTikTokStyleCaptions` hace trimStart del texto).
    const text = i === 0 ? bare : ` ${bare}`;
    const startMs = Math.round(w.start * 1000);
    const endMs = Math.round(w.end * 1000);
    return {
      text,
      startMs,
      endMs,
      timestampMs: startMs,
      confidence: w.probability ?? null,
      ...(kwIdx.has(i) || kwWords.has(normalizeWord(bare))
        ? {kw: true}
        : {}),
      ...(chunkEnds.has(i) ? {pageBreakAfter: true} : {}),
    };
  });
};

export type CaptionsToLinesOptions = {
  /**
   * Ventana máxima de una página en ms (pasado a
   * `combineTokensWithinMilliseconds`). Por defecto 1500: con chunks
   * manuales (`pageBreakAfter`) este valor casi no interviene; sin ellos,
   * agrupa ~1,5 s por página.
   */
  combineTokensWithinMilliseconds?: number;
  /**
   * Rompe página tras un silencio de esta duración (ms). Por defecto 400.
   */
  breakOnSilenceAfterMilliseconds?: number;
};

/**
 * Resuelve la entrada de un componente de karaoke: `lines` ya agrupadas
 * tienen prioridad; si no hay, se agrupan los `captions` con
 * `captionsToLines`. Lanza si no viene ninguna de las dos.
 */
export const resolveKaraokeLines = (
  lines: KaraokeLine[] | undefined,
  captions: HubCaption[] | undefined,
  opts: CaptionsToLinesOptions = {},
): KaraokeLine[] => {
  if (lines !== undefined) {
    return lines;
  }
  if (captions !== undefined) {
    return captionsToLines(captions, opts);
  }
  throw new Error(
    'karaoke: pasa `lines` (KaraokeLine[]) o `captions` (HubCaption[])',
  );
};

/**
 * HubCaption[] → KaraokeLine[] usando `createTikTokStyleCaptions` para las
 * fronteras de página y recuperando `kw` por orden (los tokens salen en
 * el mismo orden que los captions de entrada, uno por palabra no vacía).
 */
export const captionsToLines = (
  captions: HubCaption[],
  opts: CaptionsToLinesOptions = {},
): KaraokeLine[] => {
  const {pages} = createTikTokStyleCaptions({
    captions,
    combineTokensWithinMilliseconds: opts.combineTokensWithinMilliseconds ?? 1500,
    breakOnSilenceAfterMilliseconds: opts.breakOnSilenceAfterMilliseconds ?? 400,
  });
  // Los tokens salen en orden de entrada; los captions de texto vacío no
  // generan token. El zip por índice recupera `kw`.
  const nonEmpty = captions.filter((c) => c.text.trim() !== '');
  let cursor = 0;
  return pages.map((page) => {
    const words = page.tokens.map((tok) => {
      const src = nonEmpty[cursor++];
      return {
        t: tok.text.trim(),
        s: tok.fromMs / 1000,
        e: tok.toMs / 1000,
        ...(src?.kw ? {kw: true} : {}),
      };
    });
    return {words};
  });
};
