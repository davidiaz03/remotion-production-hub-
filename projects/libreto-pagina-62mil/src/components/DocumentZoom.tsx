import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {COLORS, FONT, FONT_DISPLAY, CONTENT} from '../theme';
import {
  expandAssets,
  imageSrc,
  isDarkAsset,
  resolveAsset,
} from '../assetMap';
import {DocumentImage} from './DocumentImage';
import {SourcePill} from './SourcePill';

/**
 * Documento a pantalla completa con zoom lento + píldora de fuente.
 * Se usa dentro de SceneShell fullBleed (ocupa todo el fotograma).
 *
 * - Varios assets: cortes secos en tercios iguales (plan 0.1: F11 →
 *   F12-páginas, «No encontramos resultados»; la búsqueda general F12
 *   NO se usa — su contenido central es el bulo de 6ix9ine, fuera de
 *   guion — y la expansión a -p2/-páginas la hace expandAssets).
 * - F11 (URL caída) va en COVER a pantalla completa: el mensaje está
 *   centrado y se lee entero. El resto va en contain sobre fondo tinta.
 * - `urlBar`: barra de navegador FALSA con la URL (F11 NO tiene barra
 *   de direcciones en el PDF — NOTAS-RECURSOS.md); solo se muestra
 *   sobre la imagen F11, nunca sobre las demás.
 * - `zoomTo` > 1,3 (lupa Gemini, 3.6): zoom en dos fases — lento hasta
 *   1,08 y luego picado al foco — y `caption` («GEMINI») en grande
 *   debajo cuando el zoom aterriza.
 * - `mini`: mini-captura (1/3 del ancho, plan 1.5 Bukele) con fondo
 *   difuminado de la propia imagen.
 * - Sin assets: tarjeta neutra (nunca pantalla vacía ni error).
 */
export const DocumentZoom: React.FC<{
  assets: string[];
  urlBar?: string;
  zoomTo?: number;
  focus?: {x: number; y: number};
  caption?: string;
  mini?: boolean;
  durationInFrames: number;
}> = ({
  assets,
  urlBar,
  zoomTo = 1.08,
  focus = {x: 0.5, y: 0.5},
  caption,
  mini = false,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const imgs = expandAssets(assets).filter(
    (a) => !/\.mp4$/i.test(resolveAsset(a)),
  );

  if (imgs.length === 0) {
    return (
      <AbsoluteFill
        style={{
          background: COLORS.ink,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            fontFamily: FONT,
            fontSize: 40,
            fontWeight: 600,
            color: COLORS.paper,
            maxWidth: 1200,
            textAlign: 'center',
            lineHeight: 1.4,
          }}
        >
          La evidencia se describe en la narración.
        </div>
      </AbsoluteFill>
    );
  }

  const slice = durationInFrames / imgs.length;
  const idx = Math.min(Math.floor(frame / slice), imgs.length - 1);
  const img = imgs[idx];
  const localFrame = frame - idx * slice;
  const isF11 = resolveAsset(img) === 'pagina-no-disponible-url.jpg';

  // Zoom en dos fases cuando hay picado (lupa); lineal en caso contrario.
  const zoom =
    zoomTo > 1.3
      ? interpolate(
          localFrame,
          [0, slice * 0.35, slice * 0.6, slice],
          [1, 1.08, zoomTo, zoomTo],
          {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
        )
      : interpolate(localFrame, [0, slice], [1, zoomTo], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
  const captionOpacity = caption
    ? interpolate(localFrame, [slice * 0.6, slice * 0.6 + 12], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 0;

  const showUrlBar = !!urlBar && isF11;

  return (
    <AbsoluteFill style={{background: COLORS.ink}}>
      {mini ? (
        <>
          {/* Fondo difuminado de la propia imagen (nunca bandas negras). */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${imageSrc(img)})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(40px) brightness(0.45)',
              transform: 'scale(1.15)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: CONTENT.top,
              bottom: 1080 - CONTENT.bottom,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <DocumentImage
              asset={img}
              width={620}
              height={CONTENT.bottom - CONTENT.top}
              zoom={zoom}
              focus={focus}
            />
          </div>
        </>
      ) : (
        <DocumentImage
          asset={img}
          width={1920}
          height={1080}
          zoom={zoom}
          focus={focus}
          // En la lupa (zoomTo > 1,3) el detalle se centra al picar;
          // en Ken Burns normal el foco queda donde está.
          centerFocus={zoomTo > 1.3}
          fill={isF11}
        />
      )}

      {/* Barra de navegador FALSA (solo sobre F11). La barra de progreso
          se oculta sola durante estos slices (hideRanges en Video.tsx),
          así que aquí no hace falta z-index. */}
      {showUrlBar ? (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 76,
            background: '#242526',
            display: 'flex',
            alignItems: 'center',
            padding: '0 28px',
            gap: 18,
            borderBottom: '1px solid #3A3B3C',
          }}
        >
          <div style={{display: 'flex', gap: 10}}>
            {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
              <div
                key={c}
                style={{width: 22, height: 22, borderRadius: '50%', background: c}}
              />
            ))}
          </div>
          <div
            style={{
              flex: 1,
              maxWidth: 900,
              margin: '0 auto',
              background: '#3A3B3C',
              borderRadius: 999,
              height: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: FONT,
              fontSize: 28,
              fontWeight: 600,
              color: '#E4E6EB',
            }}
          >
            <svg
              width="22"
              height="26"
              viewBox="0 0 22 26"
              style={{marginRight: 12, flexShrink: 0}}
            >
              <rect x="2" y="11" width="18" height="13" rx="3" fill="#E4E6EB" />
              <path
                d="M6 11V8a5 5 0 0 1 10 0v3"
                fill="none"
                stroke="#E4E6EB"
                strokeWidth="2.5"
              />
            </svg>
            {urlBar}
          </div>
          <div style={{width: 86}} />
        </div>
      ) : null}

      {/* Píldora de fuente: arriba a la izquierda (a la derecha si hay
          barra de URL, para no taparla). */}
      <div
        style={{
          position: 'absolute',
          top: showUrlBar ? 96 : 100,
          ...(showUrlBar ? {right: 40} : {left: 40}),
        }}
      >
        <SourcePill
          asset={img}
          bg={isDarkAsset(img) ? COLORS.paper : 'rgba(26,26,46,0.88)'}
          color={isDarkAsset(img) ? COLORS.ink : COLORS.paper}
        />
      </div>

      {/* Rótulo grande al aterrizar el zoom (p. ej. «GEMINI»). */}
      {caption ? (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 216,
            textAlign: 'center',
            opacity: captionOpacity,
            fontFamily: FONT_DISPLAY,
            fontSize: 96,
            fontWeight: 900,
            letterSpacing: 12,
            color: COLORS.paper,
            textShadow: '0 6px 32px rgba(0,0,0,0.8)',
          }}
        >
          {caption}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
