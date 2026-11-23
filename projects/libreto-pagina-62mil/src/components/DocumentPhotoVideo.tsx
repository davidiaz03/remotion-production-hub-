import React from 'react';
import {AbsoluteFill, interpolate, OffthreadVideo, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS, FONT, CONTENT} from '../theme';
import {expandAssets, imageSrc, isVideoAsset, videoSrc} from '../assetMap';
import {DocumentImage} from './DocumentImage';
import {SourcePill} from './SourcePill';

/**
 * Núcleo real (plan 0.5): foto DT-1261 a pantalla completa con fondo
 * difuminado + clip Postcard con su audio ambiente.
 *
 * - La foto va primero (Ken Burns 100→106%); el video entra después,
 *   en la ventana 14–20 s del Postcard (videoStartFrom en segundos,
 *   14 por defecto; NOTAS-RECURSOS.md). El clip dura 6 s (180 f):
 *   si la escena es larga, la foto ocupa el resto; si es corta, el
 *   video se recorta al 55% de la escena.
 * - El video va MUDO en el render: el ambiente entra por la mezcla
 *   (public/audio/postcard-ambient.wav, J-cut) y el pipeline renderiza
 *   vídeo-solo de todos modos.
 * - La foto de la Casa Blanca se muestra TAL CUAL (condiciones de la
 *   Oficina de Fotografía): sin recortes dentro de ella, sin gráficos
 *   sobre caras. La placa va abajo, fuera de la foto.
 * - Sin foto: solo video. Sin video: solo foto. Sin nada: placa.
 */
export const DocumentPhotoVideo: React.FC<{
  assets: string[];
  videoStartFrom?: number;
  videoAt?: number;
  videoFrames?: number;
  plate?: string;
  durationInFrames: number;
}> = ({
  assets,
  videoStartFrom = 14,
  videoAt,
  videoFrames: videoWindow,
  plate,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const files = expandAssets(assets);
  const photo = files.find((f) => !isVideoAsset(f));
  const video = files.find((f) => isVideoAsset(f));

  // Ventana del clip: con videoAt, el video entra en ese fotograma
  // (la frase que lo presenta) y dura videoFrames (180 f = 6 s); la
  // foto vuelve al terminar la ventana. Sin videoAt, el video ocupa
  // el final de la escena (6 s o 55% si la escena es corta).
  const clipFrames =
    videoWindow ??
    (photo && video
      ? Math.min(180, Math.floor(durationInFrames * 0.55))
      : video
        ? durationInFrames
        : 0);
  const videoStart = videoAt ?? durationInFrames - clipFrames;
  const showVideo =
    !!video && frame >= videoStart && frame < videoStart + clipFrames;

  // El zoom abarca toda la escena para que la foto continúe sin salto
  // cuando vuelve tras la ventana de video.
  const photoZoom = interpolate(frame, [0, Math.max(durationInFrames - 1, 1)], [1, 1.06], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const videoEnter = showVideo
    ? interpolate(frame - videoStart, [0, 10], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 0;

  if (!photo && !video) {
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
          {plate ?? 'El núcleo real: Messi estuvo en la Casa Blanca el 5 de marzo de 2026.'}
        </div>
      </div>
    );
  }

  const currentAsset = showVideo ? video! : photo!;
  const contentW = 1920 - CONTENT.side * 2;
  const contentH = CONTENT.bottom - CONTENT.top;
  // La placa va FUERA de la foto: se reserva su franja debajo del plano.
  const mediaH = plate ? contentH - 90 : contentH;

  return (
    <div style={{position: 'relative', width: contentW, height: contentH}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: mediaH}}>
        {!showVideo && photo ? (
          <>
            {/* Fondo difuminado de la propia foto (nunca bandas negras). */}
            <AbsoluteFill
              style={{
                backgroundImage: `url(${imageSrc(photo)})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(40px) brightness(0.5)',
                transform: 'scale(1.15)',
              }}
            />
            <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
              <DocumentImage
                asset={photo}
                width={contentW}
                height={mediaH}
                zoom={photoZoom}
              />
            </AbsoluteFill>
          </>
        ) : null}

        {showVideo && video ? (
          <AbsoluteFill style={{opacity: videoEnter, background: '#000'}}>
            {/* Fondo difuminado: un fotograma del propio Postcard (P1). */}
            <AbsoluteFill
              style={{
                backgroundImage: `url(${imageSrc('casa-blanca-messi-sonrie-trump.jpg')})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(40px) brightness(0.4)',
                transform: 'scale(1.15)',
              }}
            />
            <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
              <OffthreadVideo
                src={videoSrc(video)}
                startFrom={Math.round(videoStartFrom * fps)}
                muted
                style={{
                  width: contentW,
                  height: mediaH,
                  objectFit: 'contain',
                }}
              />
            </AbsoluteFill>
          </AbsoluteFill>
        ) : null}
      </div>

      {/* Píldora de fuente del plano actual. */}
      <div style={{position: 'absolute', top: 0, left: 0}}>
        <SourcePill asset={currentAsset} />
      </div>

      {/* Placa de contexto, abajo y fuera de la foto. */}
      {plate ? (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              background: 'rgba(26,26,46,0.88)',
              color: COLORS.paper,
              fontFamily: FONT,
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: 2,
              padding: '12px 28px',
              borderRadius: 999,
            }}
          >
            {plate}
          </div>
        </div>
      ) : null}
    </div>
  );
};
