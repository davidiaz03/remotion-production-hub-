/**
 * Adaptador para los captions generados por los scripts antiguos
 * (`transcribe-vo.py` de Pilar/Marabana), que emiten CapSegment /
 * CapChunk / CapWord en `captions.ts`. Los proyectos nuevos usan el flujo
 * Whisper → HubCaption[] (`whisper.ts`); este adaptador permite que los
 * proyectos existentes usen los componentes compartidos sin regenerar
 * sus captions.
 */
import type {KaraokeLine} from './types';

/** Forma estructural de CapWord (captions.ts de Pilar/Marabana). */
export type LegacyCapWord = {t: string; s: number; e: number; kw: boolean};
/** Forma estructural de CapChunk. */
export type LegacyCapChunk = {
  start: number;
  end: number;
  words: LegacyCapWord[];
};
/** Forma estructural de CapSegment. */
export type LegacyCapSegment = {
  id: number;
  start: number;
  frames: number;
  chunks: LegacyCapChunk[];
};

/** CapSegment[] → KaraokeLine[] (un chunk = una línea, orden intacto). */
export const capSegmentsToLines = (
  segments: LegacyCapSegment[],
): KaraokeLine[] =>
  segments.flatMap((seg) =>
    seg.chunks.map((chunk) => ({
      words: chunk.words.map((w) => ({
        t: w.t,
        s: w.s,
        e: w.e,
        ...(w.kw ? {kw: true} : {}),
      })),
    })),
  );
