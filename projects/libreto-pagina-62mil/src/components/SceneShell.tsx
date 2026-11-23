import React from 'react';
import {AbsoluteFill, interpolate, OffthreadVideo, useCurrentFrame} from 'remotion';
import {COLORS, CONTENT, fadeIn, fadeOut} from '../theme';
import {videoSrc} from '../assetMap';

/**
 * Envoltorio de escena: área de contenido segura (debajo de la barra de
 * progreso, encima del karaoke) + fundidos simples de 10 fotogramas.
 *
 * - `bg`: fondo de la escena (Papel por defecto; Tinta en tarjetas de
 *   pregunta). El fundido va contra ese fondo.
 * - `fullBleed`: el contenido ocupa todo el fotograma (documentos a
 *   pantalla completa); el componente hijo gestiona su propio layout.
 * - `blackIn` / `blackOut`: fundido desde/hacia NEGRO en los cambios
 *   de capítulo (plan-edicion.md: fundido a negro ENTRE actos, corte
 *   seco dentro de un acto). 12 f a negro + 12 f desde negro.
 */
export const SceneShell: React.FC<{
  durationInFrames: number;
  hardIn?: boolean;
  hardOut?: boolean;
  blackIn?: boolean;
  blackOut?: boolean;
  bg?: string;
  fullBleed?: boolean;
  videoBg?: string;
  children: React.ReactNode;
}> = ({
  durationInFrames,
  hardIn = false,
  hardOut = false,
  blackIn = false,
  blackOut = false,
  bg = COLORS.paper,
  fullBleed = false,
  videoBg,
  children,
}) => {
  const frame = useCurrentFrame();
  const opacity =
    fadeIn(frame, hardIn || blackIn ? 0 : 10) *
    fadeOut(frame, durationInFrames, hardOut || blackOut ? 0 : 10);
  const rise =
    hardIn || blackIn
      ? 0
      : interpolate(frame, [0, 14], [18, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
  const black = Math.max(
    blackIn
      ? interpolate(frame, [0, 12], [1, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
      : 0,
    blackOut
      ? interpolate(frame, [durationInFrames - 12, durationInFrames], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
      : 0,
  );
  return (
    <AbsoluteFill style={{background: videoBg ? '#000' : bg}}>
      {/* Video de fondo (B-roll): pantalla completa con velo oscuro
          para la legibilidad; funde con la escena (misma opacidad). */}
      {videoBg ? (
        <AbsoluteFill style={{opacity}}>
          <OffthreadVideo
            src={videoSrc(videoBg)}
            muted
            style={{width: '100%', height: '100%', objectFit: 'cover'}}
          />
          <AbsoluteFill style={{background: 'rgba(0,0,0,0.55)'}} />
        </AbsoluteFill>
      ) : null}
      <div
        style={
          fullBleed
            ? {
                position: 'absolute',
                inset: 0,
                opacity,
              }
            : {
                position: 'absolute',
                left: CONTENT.side,
                right: CONTENT.side,
                top: CONTENT.top,
                bottom: 1080 - CONTENT.bottom,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                opacity,
                transform: `translateY(${rise}px)`,
              }
        }
      >
        {children}
      </div>
      {black > 0 ? (
        <AbsoluteFill style={{background: '#000', opacity: black}} />
      ) : null}
    </AbsoluteFill>
  );
};

/** Regla roja corta que corona titulares y afirmaciones. */
export const RedRule: React.FC<{width?: number}> = ({width = 120}) => (
  <div
    style={{
      width,
      height: 6,
      background: COLORS.red,
      borderRadius: 3,
      marginBottom: 36,
      marginLeft: 'auto',
      marginRight: 'auto',
    }}
  />
);
