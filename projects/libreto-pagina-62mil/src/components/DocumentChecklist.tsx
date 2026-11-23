import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS, FONT, CONTENT} from '../theme';
import {assetExists, expandAssets, isDarkAsset} from '../assetMap';
import type {ChecklistItem} from '../types';
import {DocumentImage} from './DocumentImage';
import {SourcePill} from './SourcePill';

/**
 * Checklist de la comprobación 2 (plan 3.5): «revisa los canales
 * oficiales». Cada fila aparece repartida por la escena, con su marca
 * animada (✗ roja + «NADA» para la ausencia; ✓ para lo verificado).
 *
 * Plan B (F14 sin captura, estado actual): checklist gráfico a
 * pantalla completa, sin imagen. Si F14 se captura después, la imagen
 * va a la izquierda (40%) y el checklist a la derecha.
 */
const DEFAULT_CHECKLIST: ChecklistItem[] = [
  {label: 'X · PERFIL OFICIAL DE MESSI', mark: 'cross'},
  {label: 'INSTAGRAM · PERFIL OFICIAL DE MESSI', mark: 'cross'},
  {label: 'X / INSTAGRAM · PERFILES DE RONALDO', mark: 'cross'},
];

export const DocumentChecklist: React.FC<{
  assets: string[];
  checklist?: ChecklistItem[];
  itemAt?: number[];
  markAt?: number[];
  durationInFrames: number;
}> = ({assets, checklist = DEFAULT_CHECKLIST, itemAt, markAt, durationInFrames}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const imgs = expandAssets(assets).filter((a) => assetExists(a));
  const img = imgs[0];
  const contentW = 1920 - CONTENT.side * 2;
  const contentH = CONTENT.bottom - CONTENT.top;
  const n = checklist.length;

  // Las filas aparecen cuando la VO nombra los canales (itemAt); las
  // marcas ✗/✓ y el «NADA» caen cuando la VO dice el veredicto
  // («No estaba en ninguna», markAt). Sin sincronía, reparto uniforme
  // y marca 6 f después de su fila.
  const revealAt = (i: number) =>
    itemAt?.[i] ?? Math.floor(((durationInFrames - 30) * i) / Math.max(n, 1));
  const popAt = (i: number, at: number) => markAt?.[i] ?? at + 6;

  const list = (
    <div style={{width: '100%', maxWidth: img ? 900 : 1200}}>
      <div
        style={{
          fontFamily: FONT,
          fontSize: 32,
          fontWeight: 800,
          letterSpacing: 5,
          color: COLORS.red,
          marginBottom: 12,
        }}
      >
        COMPROBACIÓN 2 DE 3
      </div>
      <div
        style={{
          fontFamily: FONT,
          fontSize: 54,
          fontWeight: 800,
          lineHeight: 1.15,
          color: COLORS.ink,
          marginBottom: 36,
        }}
      >
        Revisa los canales oficiales
      </div>
      {checklist.map((item, i) => {
        const at = revealAt(i);
        const enter = interpolate(frame, [at, at + 10], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const markPop = spring({
          frame: frame - popAt(i, at),
          fps,
          config: {damping: 200, stiffness: 300},
          durationInFrames: 10,
        });
        const isCross = item.mark === 'cross';
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: 24,
              alignItems: 'center',
              background: COLORS.surface,
              border: `2px solid ${COLORS.border}`,
              borderRadius: 20,
              padding: '26px 32px',
              marginBottom: i < n - 1 ? 18 : 0,
              opacity: enter,
              transform: `translateX(${interpolate(enter, [0, 1], [-24, 0])}px)`,
              boxShadow: '0 8px 24px rgba(26,26,46,0.06)',
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                flexShrink: 0,
                borderRadius: '50%',
                background: isCross ? COLORS.red : COLORS.official,
                color: COLORS.paper,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: FONT,
                fontSize: 44,
                fontWeight: 800,
                lineHeight: 1,
                transform: `scale(${markPop})`,
                opacity: markPop,
              }}
            >
              {isCross ? '✗' : '✓'}
            </div>
            <div
              style={{
                flex: 1,
                fontFamily: FONT,
                fontSize: 38,
                fontWeight: 700,
                lineHeight: 1.25,
                color: COLORS.ink,
              }}
            >
              {item.label}
            </div>
            {isCross ? (
              <div
                style={{
                  fontFamily: FONT,
                  fontSize: 34,
                  fontWeight: 800,
                  letterSpacing: 2,
                  color: COLORS.red,
                  background: 'rgba(192,57,43,0.10)',
                  borderRadius: 12,
                  padding: '8px 20px',
                  flexShrink: 0,
                  opacity: markPop,
                }}
              >
                NADA
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );

  if (!img) return list;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap: 56,
        width: contentW,
        height: contentH,
        alignItems: 'center',
      }}
    >
      <div style={{position: 'relative', flexShrink: 0}}>
        <DocumentImage asset={img} width={640} height={contentH} />
        <div style={{position: 'absolute', top: 0, left: 0}}>
          <SourcePill
            asset={img}
            bg={isDarkAsset(img) ? COLORS.paper : 'rgba(26,26,46,0.88)'}
            color={isDarkAsset(img) ? COLORS.ink : COLORS.paper}
          />
        </div>
      </div>
      <div style={{flex: 1, display: 'flex', justifyContent: 'center'}}>{list}</div>
    </div>
  );
};
