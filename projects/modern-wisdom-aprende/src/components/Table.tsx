import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {COLORS, FONT} from '../theme';

/** Tabla simple de 2 columnas con título. Las filas entran escalonadas. */
export const Table: React.FC<{title?: string; rows: string[][]}> = ({
  title,
  rows,
}) => {
  const frame = useCurrentFrame();
  return (
    <div style={{width: '100%', maxWidth: 1560}}>
      {title ? (
        <div
          style={{
            fontFamily: FONT,
            fontSize: 56,
            fontWeight: 800,
            lineHeight: 1.15,
            color: COLORS.bone,
            marginBottom: 32,
          }}
        >
          {title}
        </div>
      ) : null}
      <div
        style={{
          background: COLORS.surface,
          border: `2px solid ${COLORS.border}`,
          borderRadius: 24,
          overflow: 'hidden',
        }}
      >
        {rows.map((row, i) => {
          const enter = interpolate(frame, [i * 7, i * 7 + 10], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'row',
                borderBottom:
                  i < rows.length - 1 ? `2px solid ${COLORS.border}` : 'none',
                opacity: enter,
              }}
            >
              <div
                style={{
                  width: 330,
                  flexShrink: 0,
                  padding: '26px 32px',
                  fontFamily: FONT,
                  fontSize: 40,
                  fontWeight: 700,
                  lineHeight: 1.3,
                  color: COLORS.amber,
                }}
              >
                {row[0]}
              </div>
              <div
                style={{
                  flex: 1,
                  padding: '26px 32px 26px 8px',
                  fontFamily: FONT,
                  fontSize: 40,
                  fontWeight: 500,
                  lineHeight: 1.3,
                  color: COLORS.bone,
                }}
              >
                {row[1]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
