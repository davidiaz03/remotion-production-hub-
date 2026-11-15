import React from 'react';
import {
  AbsoluteFill,
  OffthreadVideo,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {MOTION_COLORS} from './theme';

export type PhoneFrameProps = {
  /** Ancho del teléfono (1080×1920). */
  width?: number;
  /** Alto del teléfono. */
  height?: number;
  /** Distancia desde arriba. Por defecto el teléfono se centra
   *  verticalmente (top = (1920 - height) / 2). Con karaoke superior
   *  (TopKaraoke ocupa hasta ~y 510 con 2 líneas), pasa top={580}
   *  para que el marco no tape los subtítulos — y recalcula los
   *  puntos de TapHand/Magnifier: un elemento a `y` px dentro de la
   *  pantalla queda en `top + 9 + y` absolutos. */
  top?: number;
  /** Inclinación en grados. */
  tilt?: number;
  /** Entrada con spring desde `delay` (fotogramas). */
  delay?: number;
  /** Flotación suave (bob vertical). */
  float?: boolean;
  /** Hora de la barra de estado. */
  time?: string;
  /** Mostrar barra de estado (hora + iconos). */
  statusBar?: boolean;
  /** Color del resplandor tras el teléfono. */
  glow?: string;
  /** Video de grabación de pantalla (ruta public/). Si se pasa, se usa
   *  en vez de `children` como contenido de la pantalla. */
  video?: string;
  /** Fotograma de inicio del video. */
  videoFrom?: number;
  children?: React.ReactNode;
};

/**
 * Marco de teléfono para grabaciones de pantalla o UI simulada (técnica T5
 * del estilo de referencia): bordes redondeados metálicos, cámara frontal,
 * botones laterales, barra de estado y reflejo de cristal. El marco flota
 * sobre el fondo con sombra suave y deja respirar el subtítulo superior.
 *
 * Contenido: pasa `video` (grabación real, p. ej. public/video/ajustes.mp4)
 * o `children` (una UI simulada construida con divs).
 */
export const PhoneFrame: React.FC<PhoneFrameProps> = ({
  width = 560,
  height = 1130,
  top,
  tilt = 0,
  delay = 0,
  float = true,
  time = '10:10',
  statusBar = true,
  glow = 'rgba(120,140,180,0.35)',
  video,
  videoFrom = 0,
  children,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;

  const enter = interpolate(frame, [delay, delay + 14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const enterScale = interpolate(enter, [0, 1], [0.92, 1]);
  const enterY = interpolate(enter, [0, 1], [40, 0]);
  const bob = float ? Math.sin(t * 1.1) * 7 : 0;

  const radius = Math.round(width * 0.085);
  const screenRadius = radius - 10;
  // Centrado vertical por defecto; `top` lo fija en absoluto.
  const topStyle = top === undefined ? '50%' : top;
  const marginTop = top === undefined ? -height / 2 : 0;

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: topStyle,
        width,
        height,
        marginLeft: -width / 2,
        marginTop,
        opacity: enter,
        transform: `translateY(${enterY + bob}px) rotate(${tilt}deg) scale(${enterScale})`,
      }}
    >
      {/* Resplandor tras el teléfono */}
      <div
        style={{
          position: 'absolute',
          inset: -60,
          borderRadius: '50%',
          background: `radial-gradient(ellipse at center, ${glow} 0%, transparent 65%)`,
        }}
      />
      {/* Carcasa */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: radius,
          background: 'linear-gradient(145deg, #4A5058 0%, #17191D 30%, #2C3036 70%, #101215 100%)',
          padding: 9,
          boxShadow: '0 30px 80px rgba(0,0,0,0.75), 0 4px 18px rgba(0,0,0,0.6)',
        }}
      >
        {/* Botones laterales */}
        <div style={{position: 'absolute', right: -4, top: 190, width: 5, height: 90, borderRadius: 3, background: '#3A3F46'}} />
        <div style={{position: 'absolute', right: -4, top: 300, width: 5, height: 60, borderRadius: 3, background: '#3A3F46'}} />
        {/* Pantalla */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            borderRadius: screenRadius,
            overflow: 'hidden',
            background: '#000',
          }}
        >
          {video ? (
            <OffthreadVideo
              src={video}
              style={{width: '100%', height: '100%', objectFit: 'cover'}}
              startFrom={videoFrom}
            />
          ) : (
            children
          )}
          {/* Barra de estado */}
          {statusBar && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 28px',
                pointerEvents: 'none',
              }}
            >
              <span style={{fontFamily: "'Poppins', sans-serif", fontSize: 22, fontWeight: 600, color: MOTION_COLORS.white, textShadow: '0 1px 4px rgba(0,0,0,0.8)'}}>
                {time}
              </span>
              <span style={{display: 'flex', gap: 8, alignItems: 'center'}}>
                <span style={{width: 20, height: 12, border: '1.5px solid #fff', borderRadius: 3, position: 'relative', opacity: 0.9}}>
                  <span style={{position: 'absolute', inset: 2, right: 5, background: '#fff', borderRadius: 1}} />
                </span>
              </span>
            </div>
          )}
          {/* Cámara frontal */}
          <div
            style={{
              position: 'absolute',
              top: 14,
              left: '50%',
              marginLeft: -7,
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: '#000',
              border: '2px solid #1c1e22',
            }}
          />
          {/* Reflejo de cristal */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(115deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.02) 28%, transparent 45%)',
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>
    </div>
  );
};
