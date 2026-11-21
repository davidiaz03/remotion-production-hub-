import React from 'react';
import {COLORS, FONT} from '../../theme';

/** Marco común de diagramas: título arriba, notas al pie (32 px). */
export const DiagramShell: React.FC<{
  title?: string;
  notes?: string;
  children: React.ReactNode;
}> = ({title, notes, children}) => (
  <div
    style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    {title ? (
      <div
        style={{
          fontFamily: FONT,
          fontSize: 56,
          fontWeight: 800,
          lineHeight: 1.15,
          color: COLORS.bone,
          textAlign: 'center',
          marginBottom: 36,
        }}
      >
        {title}
      </div>
    ) : null}
    <div
      style={{
        flex: 1,
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </div>
    {notes ? (
      <div
        style={{
          fontFamily: FONT,
          fontSize: 32,
          fontWeight: 500,
          lineHeight: 1.4,
          color: COLORS.gray,
          textAlign: 'center',
          maxWidth: 1560,
          marginTop: 32,
        }}
      >
        {notes}
      </div>
    ) : null}
  </div>
);

/** Flecha horizontal SVG (evita depender del glifo → de la fuente). */
export const Arrow: React.FC<{width?: number; color?: string}> = ({
  width = 110,
  color = COLORS.gray,
}) => (
  <svg
    width={width}
    height={36}
    viewBox={`0 0 ${width} 36`}
    style={{flexShrink: 0}}
  >
    <line x1={0} y1={18} x2={width - 18} y2={18} stroke={color} strokeWidth={4} />
    <polygon
      points={`${width - 20},6 ${width},18 ${width - 20},30`}
      fill={color}
    />
  </svg>
);
