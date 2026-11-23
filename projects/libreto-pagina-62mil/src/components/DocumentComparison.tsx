import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS, FONT, CONTENT} from '../theme';
import {FLAG_CIRCLE, expandAssets, isDarkAsset} from '../assetMap';
import {containRect, DocumentImage} from './DocumentImage';
import {SourcePill} from './SourcePill';

/**
 * Comparación lado a lado (plan 0.3).
 *
 * - 1 imagen (messi-foto-98c58e7b73.jpg, que YA es el lado a lado de
 *   elTOQUE/InfoVeritas): se muestra entera, con el sello «2022» sobre
 *   el panel original y el círculo de lápiz rojo que se dibuja sobre
 *   la estrella de la bandera (FLAG_CIRCLE, medido en el JPG; queda
 *   por debajo de las caras).
 * - 2 imágenes: paneles lado a lado con entrada en swipe; el sello va
 *   en el panel derecho y el círculo en el izquierdo.
 * - `plate`: placa bajo la imagen («4-DIC-2022 · INSTAGRAM DE
 *   ANTONELA ROCCUZZO»).
 * - Sin imágenes: tarjeta neutra con el sello y la placa (plan B).
 */
export const DocumentComparison: React.FC<{
  assets: string[];
  stamp?: string;
  circle?: {x: number; y: number; r: number};
  plate?: string;
  durationInFrames: number;
}> = ({assets, stamp = '2022', circle = FLAG_CIRCLE, plate, durationInFrames}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const imgs = expandAssets(assets).slice(0, 2);
  const contentW = 1920 - CONTENT.side * 2;
  const plateH = plate ? 84 : 0;
  const contentH = CONTENT.bottom - CONTENT.top - plateH;

  // El círculo se dibuja en 0,5 s (15 f) a partir del 30% de la escena.
  const drawStart = Math.floor(durationInFrames * 0.3);
  const draw = interpolate(frame, [drawStart, drawStart + 15], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const stampPop = spring({
    frame: frame - Math.floor(durationInFrames * 0.18),
    fps,
    config: {damping: 200, stiffness: 260},
    durationInFrames: 12,
  });

  if (imgs.length === 0) {
    return (
      <div style={{textAlign: 'center', maxWidth: 1400}}>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 48,
            fontWeight: 700,
            lineHeight: 1.3,
            color: COLORS.ink,
          }}
        >
          La foto que circuló era de 2022. La original está en el
          Instagram de Antonela Roccuzzo.
        </div>
        {plate ? (
          <div
            style={{
              fontFamily: FONT,
              fontSize: 32,
              fontWeight: 700,
              letterSpacing: 2,
              color: COLORS.gray,
              marginTop: 28,
            }}
          >
            {plate}
          </div>
        ) : null}
      </div>
    );
  }

  const renderCircle = (box: {x: number; y: number; w: number; h: number}) => {
    const cx = box.x + circle.x * box.w;
    const cy = box.y + circle.y * box.h;
    const r = circle.r * box.w;
    const C = 2 * Math.PI * r;
    return (
      <svg
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          overflow: 'visible',
          pointerEvents: 'none',
        }}
        width={box.w}
        height={box.h}
        viewBox={`0 0 ${box.w} ${box.h}`}
      >
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={COLORS.red}
          strokeWidth={7}
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - draw)}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      </svg>
    );
  };

  const renderStamp = (x: number, y: number) => (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -50%) rotate(-8deg) scale(${stampPop})`,
        opacity: stampPop,
        border: `5px solid ${COLORS.red}`,
        borderRadius: 14,
        color: COLORS.red,
        fontFamily: FONT,
        fontSize: 54,
        fontWeight: 800,
        letterSpacing: 4,
        padding: '6px 22px',
        background: 'rgba(245,241,232,0.92)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
      }}
    >
      {stamp}
    </div>
  );

  // Entrada en swipe (solo con 2 paneles).
  const swipe = (dir: 1 | -1) =>
    imgs.length === 2
      ? interpolate(frame, [0, 14], [dir * 120, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
      : 0;

  return (
    <div style={{width: '100%'}}>
      <div
        style={{
          position: 'relative',
          width: contentW,
          height: contentH,
          display: 'flex',
          gap: 28,
        }}
      >
        {imgs.length === 1 ? (
          <div style={{position: 'relative', width: contentW, height: contentH}}>
            <DocumentImage asset={imgs[0]} width={contentW} height={contentH} />
            {(() => {
              const rect = containRect(imgs[0], contentW, contentH);
              if (!rect) return null;
              return (
                <div
                  style={{
                    position: 'absolute',
                    left: rect.x,
                    top: rect.y,
                    width: rect.w,
                    height: rect.h,
                  }}
                >
                  {renderCircle({x: 0, y: 0, w: rect.w, h: rect.h})}
                  {renderStamp(rect.w * 0.88, rect.h * 0.1)}
                </div>
              );
            })()}
            <div style={{position: 'absolute', top: 0, left: 0}}>
              <SourcePill
                asset={imgs[0]}
                bg={isDarkAsset(imgs[0]) ? COLORS.paper : 'rgba(26,26,46,0.88)'}
                color={isDarkAsset(imgs[0]) ? COLORS.ink : COLORS.paper}
              />
            </div>
          </div>
        ) : (
          imgs.map((img, i) => {
            const panelW = (contentW - 28) / 2;
            const rect = containRect(img, panelW, contentH);
            return (
              <div
                key={img}
                style={{
                  position: 'relative',
                  width: panelW,
                  height: contentH,
                  transform: `translateX(${swipe(i === 0 ? -1 : 1)}px)`,
                  opacity: interpolate(frame, [0, 10], [0, 1], {
                    extrapolateLeft: 'clamp',
                    extrapolateRight: 'clamp',
                  }),
                }}
              >
                <DocumentImage asset={img} width={panelW} height={contentH} />
                {rect ? (
                  <div
                    style={{
                      position: 'absolute',
                      left: rect.x,
                      top: rect.y,
                      width: rect.w,
                      height: rect.h,
                    }}
                  >
                    {i === 0
                      ? renderCircle({x: 0, y: 0, w: rect.w, h: rect.h})
                      : renderStamp(rect.w * 0.85, rect.h * 0.1)}
                  </div>
                ) : null}
                <div style={{position: 'absolute', top: 0, left: 0}}>
                  <SourcePill
                    asset={img}
                    bg={isDarkAsset(img) ? COLORS.paper : 'rgba(26,26,46,0.88)'}
                    color={isDarkAsset(img) ? COLORS.ink : COLORS.paper}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
      {plate ? (
        <div
          style={{
            fontFamily: FONT,
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: 2,
            color: COLORS.gray,
            textAlign: 'center',
            marginTop: 28,
          }}
        >
          {plate}
        </div>
      ) : null}
    </div>
  );
};
