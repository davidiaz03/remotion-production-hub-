import React from 'react';
import {Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {COLORS, FONT} from '../theme';

/**
 * Ilustración 16:9 (public/img/) en marco redondeado, con flotación suave
 * determinista (seno, periodo ~4 s, ±10 px) + caption debajo.
 * Las imágenes son RGB sin alfa: se presentan enmarcadas, no recortadas.
 */
export const Illustration: React.FC<{img: string; caption?: string}> = ({
  img,
  caption,
}) => {
  const frame = useCurrentFrame();
  const floatY = Math.sin((frame / 30) * ((2 * Math.PI) / 4)) * 10;
  const enter = interpolate(frame, [0, 14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        opacity: enter,
        transform: `translateY(${floatY}px)`,
      }}
    >
      <Img
        src={staticFile(`img/${img}`)}
        style={{
          width: 1080,
          height: 608,
          objectFit: 'cover',
          borderRadius: 24,
          border: `2px solid ${COLORS.border}`,
        }}
      />
      {caption ? (
        <div
          style={{
            fontFamily: FONT,
            fontSize: 36,
            fontWeight: 500,
            lineHeight: 1.35,
            color: COLORS.gray,
            textAlign: 'center',
            maxWidth: 1300,
            marginTop: 28,
          }}
        >
          {caption}
        </div>
      ) : null}
    </div>
  );
};
