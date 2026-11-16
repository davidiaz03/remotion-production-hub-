/**
 * Exportación SRT de los subtítulos del hub.
 *
 * Re-exporta `serializeSrt` de `@remotion/captions` (que toma
 * `Caption[][]`: una entrada por línea SRT) y añade el atajo
 * `linesToSrt` desde las líneas de karaoke.
 */
import {serializeSrt} from '@remotion/captions';
import type {Caption, KaraokeLine} from './types';

export {serializeSrt};

/**
 * KaraokeLine[] → texto SRT. Cada línea de karaoke es una entrada SRT
 * (inicio = primera palabra, fin = última palabra, texto = palabras
 * unidas por espacios). Los tiempos salen en ms redondeados.
 */
export const linesToSrt = (lines: KaraokeLine[]): string => {
  const srtLines: Caption[][] = lines
    .filter((line) => line.words.length > 0)
    .map((line) => {
      const first = line.words[0];
      const last = line.words[line.words.length - 1];
      const text = line.words.map((w) => w.t).join(' ');
      const startMs = Math.round(first.s * 1000);
      const endMs = Math.round(last.e * 1000);
      return [
        {
          text,
          startMs,
          endMs,
          timestampMs: startMs,
          confidence: null,
        },
      ];
    });
  return serializeSrt({lines: srtLines});
};
