import React from 'react';
import {Audio, Sequence, staticFile, useVideoConfig} from 'remotion';
import {SFX_INDEX, SfxId} from './index';

export type SfxProps = {
  /** Id del sonido en el índice (p. ej. 'whoosh-fast-hard'). */
  id: SfxId;
  /** Fotograma en el que cae el PUNTO DE SINCRONÍA del sonido (su
   *  pico/ataque), no su inicio: el componente retrasa el inicio lo
   *  necesario para que el sync caiga exacto sobre el evento visual. */
  atFrame: number;
  /** Volumen explícito (1 = nivel del archivo). Si no se pasa, se usa
   *  1 a secas, o la ganancia `under_voiceover_db` del kit cuando
   *  `underVO` es true. */
  volume?: number;
  /** El sonido suena bajo voz en off: aplica la ganancia recomendada
   *  por el kit (típicamente −4 dB) para no tapar la voz. */
  underVO?: boolean;
};

/**
 * Coloca un efecto de sonido de la biblioteca del hub por su PUNTO DE
 * SINCRONÍA: `atFrame` es el fotograma del evento visual (el corte, el
 * toque, la aparición) y el sonido se adelanta lo justo para que su
 * pico caiga ahí. Es el método del propio SFX Kit (wyzowl/sfx-kit,
 * CC0): cada sonido trae `sync.at` medido.
 *
 * Antes de usar un id, cópialo al public/ del proyecto:
 *   node shared/motion/sfx/add-sfx.mjs <proyecto> <id...>
 *
 * Reglas de mezcla (del kit y del hub):
 *   · Un SFX por evento; dos como máximo si se emparejan (whoosh +
 *     impacto, whoosh + pop) con el segundo a menor ganancia.
 *   · Bajo VO, siempre `underVO` (o volumen ≤ 0,6).
 *   · La mezcla final se masteriza a −16 LUFS / −1 dBTP como los
 *     demás reels del hub; los SFX no deben empujar el true peak.
 */
export const Sfx: React.FC<SfxProps> = ({id, atFrame, volume, underVO = false}) => {
  const {fps} = useVideoConfig();
  const meta = SFX_INDEX[id];
  if (!meta) {
    throw new Error(`Sfx: id desconocido "${id}". Busca en SFX_INDEX o con sfxSearch().`);
  }
  // El sonido empieza (sync segundos) antes del evento.
  const startFrame = Math.max(0, Math.round(atFrame - meta.sync * fps));
  const gain = volume ?? (underVO ? Math.pow(10, meta.uvo / 20) : 1);
  return (
    <Sequence from={startFrame} name={`sfx:${id}`}>
      <Audio src={staticFile(`audio/sfx/${meta.file}`)} volume={gain} />
    </Sequence>
  );
};

/** Ganancia lineal para unos dB (p. ej. dbGain(-4) ≈ 0,63). */
export const dbGain = (db: number): number => Math.pow(10, db / 20);
