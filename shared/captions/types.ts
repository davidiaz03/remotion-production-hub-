/**
 * Tipos canónicos de subtítulos del hub.
 *
 * La unidad base es `Caption` de `@remotion/captions` (una palabra con
 * tiempos en ms). El hub añade la marca de palabra clave (`kw`), que
 * `Caption` no tiene: por eso existe `HubCaption`.
 */
import type {Caption, TikTokPage, TikTokToken} from '@remotion/captions';

export type {Caption, TikTokPage, TikTokToken};

/**
 * Caption del hub: palabra con tiempos + marca de palabra clave.
 * `kw` = la palabra se resalta (rojo en BottomKaraoke, recuadro azul en
 * TopKaraoke). Es asignable a `Caption` (la prop extra no estorba a
 * `createTikTokStyleCaptions`, que la ignora).
 */
export type HubCaption = Caption & {
  /** Palabra clave del chunk (máx. 1-2 por chunk). */
  kw?: boolean;
};

/** Palabra de faster-whisper con `word_timestamps=True`. */
export type WhisperWord = {
  /** Texto tal como lo devuelve Whisper (suele traer espacio inicial). */
  word: string;
  /** Inicio en segundos. */
  start: number;
  /** Fin en segundos. */
  end: number;
  /** Probabilidad de la palabra (0-1), si Whisper la da. */
  probability?: number;
};

/** Palabra de karaoke en segundos (forma que usan los componentes). */
export type KaraokeWord = {
  /** Texto de la palabra (con su puntuación). */
  t: string;
  /** Inicio en segundos. */
  s: number;
  /** Fin en segundos. */
  e: number;
  /** Palabra clave. */
  kw?: boolean;
};

/** Línea (chunk) de karaoke: grupo de palabras que se muestra junto. */
export type KaraokeLine = {words: KaraokeWord[]};
