// Fixture mínimo para tests/render-chunks-hash.test.mjs (P0-3).
// Formato real de captions (ver negacion-embargo): CapWord {t, s, e, kw}.
// El literal del array es JSON válido (claves entrecomilladas) para que
// parseCaptionsFile de render-chunks.mjs lo parsee y el hash de captions
// sea por tramo, no global. Segmento 1 = fotogramas 0-14, segmento 2 =
// fotogramas 15-29 (30 fps).
export type CapWord = {t: string; s: number; e: number; kw: boolean};
export type CapChunk = {start: number; end: number; words: CapWord[]};
export type CapSegment = {id: number; start: number; frames: number; chunks: CapChunk[]};
export const CAPTIONS: CapSegment[] = [{"id": 1, "start": 0, "frames": 15, "chunks": [{"start": 0, "end": 0.5, "words": [{"t": "UNO", "s": 0, "e": 0.5, "kw": false}]}]}, {"id": 2, "start": 0.5, "frames": 15, "chunks": [{"start": 0.5, "end": 1, "words": [{"t": "DOS", "s": 0.5, "e": 1, "kw": false}]}]}];
