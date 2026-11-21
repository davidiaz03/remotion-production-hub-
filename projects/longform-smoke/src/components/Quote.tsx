import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {COLORS, FONT} from '../theme';

/** Cita con autor y episodio. */
export const Quote: React.FC<{
  text: string;
  author?: string;
  episode?: string;
}> = ({text, author, episode}) => {
  const frame = useCurrentFrame();
  const markOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const textOpacity = interpolate(frame, [4, 16], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const attrOpacity = interpolate(frame, [14, 26], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const size = text.length <= 70 ? 72 : text.length <= 110 ? 64 : 58;
  return (
    <div style={{textAlign: 'center', maxWidth: 1500}}>
      <div
        style={{
          fontFamily: FONT,
          fontSize: 140,
          fontWeight: 800,
          lineHeight: 0.6,
          color: COLORS.amber,
          opacity: markOpacity,
          marginBottom: 28,
        }}
      >
        “
      </div>
      <div
        style={{
          fontFamily: FONT,
          fontSize: size,
          fontWeight: 600,
          lineHeight: 1.25,
          color: COLORS.bone,
          opacity: textOpacity,
        }}
      >
        {text}
      </div>
      {author ? (
        <div
          style={{
            fontFamily: FONT,
            fontSize: 38,
            fontWeight: 600,
            color: COLORS.gray,
            marginTop: 36,
            opacity: attrOpacity,
          }}
        >
          — {author}
          {episode ? ` · episodio ${episode}` : ''}
        </div>
      ) : null}
    </div>
  );
};
