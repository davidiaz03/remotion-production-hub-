import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {COLORS, FONT} from '../theme';

const Column: React.FC<{
  title: string;
  items: string[];
  index: number;
  accent?: boolean;
}> = ({title, items, index, accent}) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [index * 8, index * 8 + 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        flex: 1,
        background: COLORS.surface,
        border: `2px solid ${accent ? COLORS.amber : COLORS.border}`,
        borderRadius: 28,
        padding: '40px 44px 36px',
        opacity: enter,
        transform: `translateY(${interpolate(enter, [0, 1], [20, 0])}px)`,
      }}
    >
      <div
        style={{
          fontFamily: FONT,
          fontSize: 44,
          fontWeight: 700,
          color: accent ? COLORS.amber : COLORS.bone,
          marginBottom: 24,
        }}
      >
        {title}
      </div>
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: 16,
            marginBottom: i < items.length - 1 ? 18 : 0,
          }}
        >
          <div
            style={{
              fontFamily: FONT,
              fontSize: 38,
              fontWeight: 700,
              color: COLORS.amber,
              lineHeight: 1.3,
            }}
          >
            —
          </div>
          <div
            style={{
              fontFamily: FONT,
              fontSize: 38,
              fontWeight: 500,
              lineHeight: 1.3,
              color: COLORS.bone,
            }}
          >
            {item}
          </div>
        </div>
      ))}
    </div>
  );
};

/** Dos columnas enfrentadas (fortaleza/debilidad, quédate/desecha…). */
export const TwoCol: React.FC<{
  leftTitle: string;
  leftItems: string[];
  rightTitle: string;
  rightItems: string[];
}> = ({leftTitle, leftItems, rightTitle, rightItems}) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'row',
      gap: 28,
      width: '100%',
      alignItems: 'stretch',
    }}
  >
    <Column title={leftTitle} items={leftItems} index={0} />
    <Column title={rightTitle} items={rightItems} index={1} />
  </div>
);
