/**
 * Subtítulos karaoke compartidos del hub (auditoría R2, 15-nov-2026).
 *
 * Flujo canónico:
 *   faster-whisper word_timestamps
 *     → whisperWordsToCaptions() → HubCaption[]
 *     → captionsToLines()        → KaraokeLine[]
 *     → <BottomKaraoke /> / <TopKaraoke />
 *   Exportación: linesToSrt().
 *
 * Proyectos con captions.ts antiguo (CapSegment): capSegmentsToLines().
 */
export type {Caption, HubCaption, KaraokeLine, KaraokeWord, TikTokPage, TikTokToken, WhisperWord} from './types';
export {
  captionsToLines,
  resolveKaraokeLines,
  whisperWordsToCaptions,
  type CaptionsToLinesOptions,
  type WhisperToCaptionsOptions,
} from './whisper';
export {
  capSegmentsToLines,
  type LegacyCapChunk,
  type LegacyCapSegment,
  type LegacyCapWord,
} from './legacy';
export {linesToSrt, serializeSrt} from './srt';
export {
  BottomKaraoke,
  ARCHIVO_BLACK,
  MEMORIAL_RED,
  textOutline,
  type BottomKaraokeProps,
} from './BottomKaraoke';
