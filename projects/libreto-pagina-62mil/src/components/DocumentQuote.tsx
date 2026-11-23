import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS, FONT, FONT_DISPLAY, CONTENT} from '../theme';
import {
  assetExists,
  cardForAsset,
  expandAssets,
  isDarkAsset,
  overlayForAsset,
  type AssetCard,
} from '../assetMap';
import {DocumentImage} from './DocumentImage';
import {SourcePill} from './SourcePill';
import {RedRule} from './SceneShell';

/**
 * Artículo/cita con titular y fecha (plan 0.4, 1.1, 1.7, 1.8, 2.1, 2.3,
 * 2.4, 2.6). Segmentos en cortes secos, a partes iguales:
 *
 * - Una imagen por página (la expansión a -p2 la hace expandAssets):
 *   F1 → F1-p2 (métricas), F2 → F2-p2 (fórmula), F3 → F3-p2 (veredicto),
 *   F5 → F5-p2 (cita del tuit, recortada a la zona de la cita).
 * - Una tarjeta de texto por cada asset con CARDS en assetMap:
 *   F6 → cita «Es totalmente falso» (la p2 NO se muestra: 95% en
 *   blanco + campana sobre la cita); F13 → nota de Padron (plan B,
 *   sin captura).
 * - `overlay`: píldora DEBAJO de la imagen (F8: «EL JUICIO EMPIEZA EL
 *   1 DE MARZO DE 2027» — dato del dossier, 2027 NO está en la imagen,
 *   nunca se resalta sobre ella). Si no se pasa, sale de overlayForAsset.
 * - `quote` explícito (scene.quote) añade una tarjeta de cita al final.
 * - Sin imágenes ni tarjetas: tarjeta neutra con el texto de la escena.
 *
 * Las imágenes van en contain sobre fondo tinta (las páginas son
 * verticales; nunca deformadas). Los recortes de privacidad y banner
 * los aplica DocumentImage desde assetMap.
 */
type Segment =
  | {kind: 'image'; file: string; overlay: string | null}
  | {kind: 'card'; card: AssetCard};

export const DocumentQuote: React.FC<{
  assets: string[];
  quote?: string;
  outlet?: string;
  date?: string;
  overlay?: string;
  text?: string;
  durationInFrames: number;
}> = ({assets, quote, outlet, date, overlay, text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const segments: Segment[] = [];
  for (const file of expandAssets(assets)) {
    if (assetExists(file)) {
      segments.push({
        kind: 'image',
        file,
        overlay: overlay ?? overlayForAsset(file),
      });
    }
  }
  for (const a of assets) {
    const card = cardForAsset(a);
    if (card) segments.push({kind: 'card', card});
  }
  if (quote) {
    segments.push({
      kind: 'card',
      card: {
        text: quote,
        attribution: [outlet, date].filter(Boolean).join(' · '),
        kind: 'quote',
      },
    });
  }

  const contentW = 1920 - CONTENT.side * 2;
  const contentH = CONTENT.bottom - CONTENT.top;

  if (segments.length === 0) {
    return (
      <div style={{textAlign: 'center', maxWidth: 1400}}>
        <RedRule />
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 64,
            fontWeight: 900,
            lineHeight: 1.2,
            color: COLORS.ink,
          }}
        >
          {text ?? 'La fuente se cita en la narración.'}
        </div>
      </div>
    );
  }

  const slice = durationInFrames / segments.length;
  const idx = Math.min(Math.floor(frame / slice), segments.length - 1);
  const seg = segments[idx];
  const localFrame = frame - idx * slice;

  // Entrada: SOLO el primer segmento funde desde 0 (entrada de escena;
  // el fundido general de SceneShell ya cubre la escena). Los cambios
  // de segmento son cortes secos (pasar de página): fundir desde 0 en
  // cada corte dejaba 10 f de Papel vacío a mitad de escena — el
  // pre-vuelo lo cazó (S13/S14/S16/S19 salieron vacías porque su punto
  // medio cae justo en el corte entre segmentos).
  const enter =
    idx === 0
      ? interpolate(localFrame, [0, 10], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
      : 1;
  const cardPop =
    idx === 0
      ? spring({
          frame: localFrame,
          fps,
          config: {damping: 200, stiffness: 180},
          durationInFrames: 14,
        })
      : 1;

  if (seg.kind === 'card') {
    const isQuote = seg.card.kind === 'quote';
    // Respiración lenta sobre el pop de entrada: los segmentos de
    // tarjeta pueden durar >20 s (escena 2.6) y no deben quedar fijos.
    const breathe = interpolate(
      localFrame,
      [0, Math.max(slice - 1, 1)],
      [1, 1.015],
      {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
    );
    return (
      <div
        style={{
          width: '100%',
          maxWidth: 1500,
          background: isQuote ? COLORS.ink : COLORS.surface,
          border: isQuote ? 'none' : `3px solid ${COLORS.official}`,
          borderRadius: 28,
          padding: '56px 64px',
          textAlign: 'center',
          opacity: cardPop,
          transform: `scale(${interpolate(cardPop, [0, 1], [0.97, 1]) * breathe})`,
          boxShadow: '0 16px 40px rgba(26,26,46,0.12)',
        }}
      >
        {isQuote ? <RedRule width={120} /> : null}
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: isQuote ? 72 : 56,
            fontWeight: 900,
            lineHeight: 1.2,
            color: isQuote ? COLORS.paper : COLORS.ink,
          }}
        >
          {isQuote ? `«${seg.card.text}»` : seg.card.text}
        </div>
        {seg.card.attribution ? (
          <div
            style={{
              fontFamily: FONT,
              fontSize: 32,
              fontWeight: 700,
              letterSpacing: 3,
              color: isQuote ? COLORS.highlighter : COLORS.official,
              marginTop: 32,
            }}
          >
            {seg.card.attribution}
          </div>
        ) : null}
      </div>
    );
  }

  const imgH = seg.overlay ? contentH - 110 : contentH;
  // Zoom lento 100→106% dentro del segmento (Ken Burns).
  const zoom = interpolate(localFrame, [0, Math.max(slice - 1, 1)], [1, 1.06], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        position: 'relative',
        width: contentW,
        height: contentH,
        opacity: enter,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: imgH,
          background: COLORS.ink,
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        <DocumentImage asset={seg.file} width={contentW} height={imgH} zoom={zoom} />
      </div>
      <div style={{position: 'absolute', top: 16, left: 16}}>
        <SourcePill
          asset={seg.file}
          bg={isDarkAsset(seg.file) ? COLORS.paper : 'rgba(26,26,46,0.88)'}
          color={isDarkAsset(seg.file) ? COLORS.ink : COLORS.paper}
        />
      </div>
      {seg.overlay ? (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              background: COLORS.red,
              color: COLORS.paper,
              fontFamily: FONT,
              fontSize: 38,
              fontWeight: 800,
              letterSpacing: 1,
              padding: '16px 36px',
              borderRadius: 999,
              boxShadow: '0 10px 28px rgba(192,57,43,0.35)',
            }}
          >
            {seg.overlay}
          </div>
        </div>
      ) : null}
    </div>
  );
};
