/**
 * Composición de verificación del módulo shared/captions (auditoría R2).
 *
 * Renderiza los componentes compartidos con los captions REALES de
 * Marabana V1.3 y se compara fotograma a fotograma con el máster
 * (mismo texto, mismos tiempos, misma posición del karaoke).
 *
 * - BottomKaraokeTest: <BottomKaraoke> con `lines` adaptadas desde los
 *   CapSegment de Marabana (capSegmentsToLines). Debe ser idéntico al
 *   karaoke del máster V1.3.
 * - TopKaraokeCaptionsTest: <TopKaraoke> con `captions` (HubCaption[])
 *   construidos con whisperWordsToCaptions desde las mismas palabras
 *   (chunk ends + keywords derivados de los CapWord). Verifica el flujo
 *   nuevo completo Whisper → Caption[] → líneas → componente.
 *
 * Fondo neutro oscuro + contador de fotograma para que la comparación
 * sea inequívoca (el máster tiene video/fotos de fondo; aquí solo
 * importa la capa de karaoke).
 */
import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {CAPTIONS} from '../../marabana-v1/src/captions';
import {
  BottomKaraoke,
  capSegmentsToLines,
  whisperWordsToCaptions,
  type WhisperWord,
} from '../../../shared/captions';
import {TopKaraoke} from '../../../shared/motion';

const LINES = capSegmentsToLines(CAPTIONS);

// Palabras planas + índices de fin de chunk y de keywords, derivados de
// los CapWord (misma información que transcribe-vo.py, sin regenerar).
const {WORDS, CHUNK_ENDS, KEYWORDS} = (() => {
  const words: WhisperWord[] = [];
  const chunkEnds = new Set<number>();
  const keywords = new Set<number>();
  for (const seg of CAPTIONS) {
    for (const chunk of seg.chunks) {
      for (const w of chunk.words) {
        const i = words.length;
        words.push({word: w.t, start: w.s, end: w.e});
        if (w.kw) keywords.add(i);
      }
      chunkEnds.add(words.length - 1);
    }
  }
  return {WORDS: words, CHUNK_ENDS: chunkEnds, KEYWORDS: keywords};
})();

const CAPTIONS_NEW = whisperWordsToCaptions(WORDS, {
  chunkEndIndices: CHUNK_ENDS,
  keywordIndices: KEYWORDS,
});

const FrameTag: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <div
      style={{
        position: 'absolute',
        top: 40,
        left: 40,
        fontFamily: 'monospace',
        fontSize: 36,
        color: '#FFFF00',
        background: 'rgba(0,0,0,0.6)',
        padding: '8px 16px',
        borderRadius: 8,
      }}
    >
      f{frame} · {(frame / fps).toFixed(2)}s
    </div>
  );
};

export const BottomKaraokeTest: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: '#111111'}}>
    <FrameTag />
    <BottomKaraoke lines={LINES} />
  </AbsoluteFill>
);

export const TopKaraokeCaptionsTest: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: '#111111'}}>
    <FrameTag />
    <TopKaraoke captions={CAPTIONS_NEW} top={340} size={72} />
  </AbsoluteFill>
);
