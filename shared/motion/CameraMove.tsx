import React from 'react';
import {Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {noise2D} from '@remotion/noise';

/**
 * Movimientos de cámara para fotos e ilustraciones (arquetipos adaptados
 * de free-remotion-pipeline —DynamicScene.tsx, MIT según su README,
 * ItzSaurav— reescritos para el hub con nuestra API).
 *
 * Cada arquetipo mueve DOS capas con velocidades distintas (parallax
 * 2.5D): el fondo (bg) se mueve menos que el primer plano (fg). Sin
 * recorte no hay parallax: el fg es la imagen recortada (PNG con alfa,
 * ver el flujo de assets en el README del módulo).
 *
 * El zoom máximo se limita según la resolución de la fuente: una imagen
 * de 576 px ampliada a 1080 ya va al 1,87×, así que el zoom de cámara
 * se aprieta (1,24×) para no pixelar; con fuente nativa 1080 se permite
 * hasta 1,40×.
 */

export type CameraMoveKind =
  | 'push-in' // Acercamiento lento y continuo (el de diario).
  | 'snap-zoom' // Salto brusco con asentamiento de spring.
  | 'extreme-closeup' // Macro: zoom fuerte y sostenido.
  | 'lateral-pan' // Travelling lateral suave.
  | 'low-angle-hero' // Contrapicado: sube y empuja (revelado heroico).
  | 'dolly-zoom'; // Vértigo: el fg empuja y el bg retrocede.

export type CameraMove = {
  bgScale: number;
  bgX: number; // % de desplazamiento
  bgY: number;
  fgScale: number;
  fgX: number;
  fgY: number;
  /** Micro-deriva orgánica (ruido) aplicada a toda la escena. */
  driftX: number;
  driftY: number;
  driftRot: number;
};

/** Calcula el movimiento de cámara para el fotograma actual. */
export const cameraMove = (
  kind: CameraMoveKind,
  frame: number,
  durationInFrames: number,
  fps: number,
  opts?: {sourceWidth?: number; seed?: number; drift?: boolean},
): CameraMove => {
  const sourceW = opts?.sourceWidth ?? 1080;
  const seed = opts?.seed ?? 1;
  const drift = opts?.drift ?? true;
  const duration = Math.max(1, durationInFrames);

  // Límite de zoom según la resolución de la fuente.
  const baseEnlargement = 1080 / sourceW;
  const maxFg = baseEnlargement > 1.5 ? 1.24 : 1.4;
  const maxBg = baseEnlargement > 1.5 ? 1.16 : 1.25;

  const lerp = (a: number, b: number) =>
    interpolate(frame, [0, duration], [a, b], {extrapolateRight: 'clamp'});

  let bgScale = 1;
  let bgX = 0;
  let bgY = 0;
  let fgScale = 1.04;
  let fgX = 0;
  let fgY = 0;

  switch (kind) {
    case 'snap-zoom': {
      const s = spring({frame, fps, config: {damping: 12, mass: 0.4, stiffness: 220}});
      const snap = interpolate(s, [0, 1], [1, maxBg]);
      const slow = lerp(1, 1.04);
      bgScale = snap * slow;
      fgScale = snap * 1.06 * slow;
      break;
    }
    case 'extreme-closeup':
      bgScale = lerp(1.08, maxBg);
      fgScale = lerp(1.12, maxFg);
      fgY = lerp(-3, 3);
      break;
    case 'lateral-pan':
      bgScale = 1.06;
      bgX = lerp(3.5, -3.5);
      fgScale = 1.12;
      fgX = lerp(6.5, -6.5);
      break;
    case 'low-angle-hero':
      bgScale = lerp(1.02, maxBg);
      bgY = lerp(3.5, -3.5);
      fgScale = lerp(1.06, maxFg);
      fgY = lerp(5.5, -5.5);
      break;
    case 'dolly-zoom':
      bgScale = lerp(maxBg, 1.02);
      fgScale = lerp(1.02, maxFg);
      break;
    case 'push-in':
    default:
      bgScale = lerp(1, maxBg);
      fgScale = lerp(1.04, maxFg);
      break;
  }

  // Micro-deriva orgánica con ruido determinista (nada de Math.random).
  const driftX = drift ? noise2D('camX', frame / 45, seed) * 8 : 0;
  const driftY = drift ? noise2D('camY', frame / 45, seed + 10) * 5 : 0;
  const driftRot = drift ? noise2D('camRot', frame / 60, seed + 20) * 0.4 : 0;

  return {bgScale, bgX, bgY, fgScale, fgX, fgY, driftX, driftY, driftRot};
};

export type ParallaxStillProps = {
  /** Foto de fondo (ruta public/ o URL). */
  bg: string;
  /** Recorte con alfa para el primer plano (opcional). */
  fg?: string;
  /** Arquetipo de movimiento. */
  move?: CameraMoveKind;
  /** Duración de la escena en fotogramas. */
  durationInFrames: number;
  /** Ancho real de la imagen de fondo (para limitar el zoom). */
  sourceWidth?: number;
  /** Semilla de la deriva (cambia por escena). */
  seed?: number;
  /** Tinte ambiental sobre la foto (p. ej. 'rgba(15,35,65,0.28)'). */
  tint?: string;
  /** Oscurecer el fondo para que el texto lea encima (0–1). */
  dim?: number;
  children?: React.ReactNode;
};

/**
 * Foto fija con movimiento de cámara y parallax 2.5D. Úsala para fotos
 * de archivo del Memorial y para ilustraciones generadas: el fondo se
 * mueve despacio y el recorte (fg) más rápido, lo que da profundidad
 * real sin vídeo. Si no hay recorte, el fg se omite y queda un Ken
 * Burns con arquetipos.
 */
export const ParallaxStill: React.FC<ParallaxStillProps> = ({
  bg,
  fg,
  move = 'push-in',
  durationInFrames,
  sourceWidth = 1080,
  seed = 1,
  tint,
  dim = 0,
  children,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const m = cameraMove(move, frame, durationInFrames, fps, {sourceWidth, seed});

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        transform: `translate3d(${m.driftX}px, ${m.driftY}px, 0) rotate(${m.driftRot}deg)`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `scale(${m.bgScale}) translate(${m.bgX}%, ${m.bgY}%)`,
        }}
      >
        <Img
          src={bg.startsWith('http') ? bg : staticFile(bg)}
          style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.88) contrast(1.08) saturate(1.06)'}}
        />
      </div>
      {fg ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: `scale(${m.fgScale}) translate(${m.fgX}%, ${m.fgY}%)`,
          }}
        >
          <Img
            src={fg.startsWith('http') ? fg : staticFile(fg)}
            style={{width: '100%', height: '100%', objectFit: 'cover'}}
          />
        </div>
      ) : null}
      {tint ? <div style={{position: 'absolute', inset: 0, background: tint}} /> : null}
      {dim > 0 ? <div style={{position: 'absolute', inset: 0, background: `rgba(0,0,0,${dim})`}} /> : null}
      {children}
    </div>
  );
};
