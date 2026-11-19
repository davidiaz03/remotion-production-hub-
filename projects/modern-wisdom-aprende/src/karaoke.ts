/**
 * Karaoke PLACEHOLDER para las pruebas de montaje.
 *
 * TODO (cambiar a captions reales cuando exista la transcripción):
 *   1. Generar word_timestamps con scripts/audio/transcribe-vo.py
 *      (faster-whisper + vo-script.json).
 *   2. Convertir con `whisperWordsToCaptions(words, {chunkEndIndices,
 *      keywordWords})` y agrupar con `captionsToLines()` (módulo
 *      shared/captions, ver su README.md).
 *   3. Pasar el resultado a <BottomKaraoke lines={...} /> en Video.tsx
 *      en lugar de buildPlaceholderKaraokeLines().
 *
 * De momento, cada línea de VO es un chunk de karaoke (las líneas de más
 * de 12 palabras se parten en dos por la mitad) y las palabras se
 * reparten uniformemente en el tiempo de habla de la línea según
 * src/timeline.json. El resaltado por palabra es aproximado: sirve para
 * verificar layout y ritmo, NO para el máster final.
 */
import type {KaraokeLine, KaraokeWord} from '../../../shared/captions/types';
import type {TimelineLine} from './types';

const MAX_WORDS_PER_LINE = 6;

const splitWords = (words: string[]): string[][] => {
  // Parte en trozos de MAX_WORDS_PER_LINE como máximo, cortando por la
  // coma más cercana al límite cuando la hay (corte natural de frase).
  const chunks: string[][] = [];
  let rest = words;
  while (rest.length > MAX_WORDS_PER_LINE) {
    let cut = MAX_WORDS_PER_LINE;
    let best = -1;
    let bestDist = Infinity;
    rest.slice(0, MAX_WORDS_PER_LINE + 2).forEach((w, i) => {
      if (/[,:;]$/.test(w)) {
        const d = Math.abs(i + 1 - cut);
        if (d < bestDist) {
          bestDist = d;
          best = i + 1;
        }
      }
    });
    if (best > 0) cut = best;
    chunks.push(rest.slice(0, cut));
    rest = rest.slice(cut);
  }
  if (rest.length > 0) chunks.push(rest);
  return chunks;
};

export const buildPlaceholderKaraokeLines = (
  lines: TimelineLine[],
  fps: number,
): KaraokeLine[] => {
  const out: KaraokeLine[] = [];
  for (const line of lines) {
    const words = line.text.split(/\s+/).filter(Boolean);
    const chunks = splitWords(words);
    const totalFrames = Math.max(line.endFrame - line.startFrame, 1);
    let offset = 0;
    for (const chunk of chunks) {
      const chunkFrames = (totalFrames * chunk.length) / words.length;
      const kWords: KaraokeWord[] = chunk.map((t, i) => {
        const s = (line.startFrame + offset + (chunkFrames * i) / chunk.length) / fps;
        const e =
          (line.startFrame + offset + (chunkFrames * (i + 1)) / chunk.length) /
          fps;
        return {t, s, e};
      });
      out.push({words: kWords});
      offset += chunkFrames;
    }
  }
  return out;
};
