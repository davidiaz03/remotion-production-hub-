import React from 'react';
import {COLORS, FONT} from '../theme';
import {sourceLabel} from '../assetMap';

/**
 * Píldora de fuente (CREATIVE_BRIEF §4: en cada documento, mín. 24 px
 * a 1080p). Texto Papel sobre Tinta semitransparente. Si se pasa `asset`
 * (nombre de archivo o id F1–F14), la etiqueta sale de assetMap.ts;
 * si se pasa `text`, manda el texto explícito.
 */
export const SourcePill: React.FC<{
  asset?: string;
  text?: string;
  bg?: string;
  color?: string;
  fontSize?: number;
  style?: React.CSSProperties;
}> = ({
  asset,
  text,
  bg = 'rgba(26,26,46,0.88)',
  color = COLORS.paper,
  fontSize = 26,
  style,
}) => {
  const label = text ?? (asset ? sourceLabel(asset) : '');
  if (!label) return null;
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: bg,
        color,
        fontFamily: FONT,
        fontWeight: 700,
        fontSize,
        lineHeight: 1.2,
        letterSpacing: 1,
        padding: '10px 22px',
        borderRadius: 999,
        textAlign: 'center',
        boxShadow: '0 6px 24px rgba(0,0,0,0.35)',
        ...style,
      }}
    >
      {label}
    </div>
  );
};
