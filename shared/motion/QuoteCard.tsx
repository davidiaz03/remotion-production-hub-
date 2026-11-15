import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {MOTION_COLORS, POPPINS} from './theme';

export type QuoteCardProps = {
  /** Texto de la cita (sin comillas: el componente pone la marca). */
  quote: string;
  /** Quién lo dice (nombre). */
  attribution: string;
  /** Cargo o contexto de la persona (p. ej. «Sobreviviente, caso Lima»). */
  role?: string;
  /** Distancia desde arriba. */
  top?: number;
  /** Fotograma en el que empieza la entrada. */
  delay?: number;
  /** Tamaño del texto de la cita. */
  size?: number;
  /** Color de la marca de comillas y del acento. */
  accentColor?: string;
  /** Mostrar como tarjeta de cristal (true) o solo texto (false). */
  card?: boolean;
};

/**
 * Tarjeta de cita / testimonio (mecánica adaptada de
 * reactvideoeditor/remotion-templates —quote-card.tsx, MIT—: entrada
 * escalonada marca → texto → atribución deslizante, reescrita como
 * componente con props para la identidad del Memorial).
 *
 * Para testimonios y citas de documentos del Memorial: la marca de
 * comillas entra con pop, el texto aparece palabra a palabra en
 * cascada suave, y la atribución se desliza desde la derecha. La
 * cita va en serif itálica (voz del documento); la atribución, en
 * Poppins (voz del Memorial).
 *
 * Citas reales, siempre: transcribe literal y cita la fuente en el
 * guion; si se recorta, marca la elipsis […] en el texto.
 */
export const QuoteCard: React.FC<QuoteCardProps> = ({
  quote,
  attribution,
  role,
  top = 620,
  delay = 0,
  size = 54,
  accentColor = MOTION_COLORS.red,
  card = true,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const markPop = spring({
    frame: frame - delay,
    fps,
    config: {damping: 11, stiffness: 260, mass: 0.8},
  });
  const textIn = interpolate(frame, [delay + 8, delay + 22], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const attrIn = interpolate(frame, [delay + 26, delay + 40], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const attrX = interpolate(attrIn, [0, 1], [40, 0]);

  const words = quote.split(' ');

  return (
    <div
      style={{
        position: 'absolute',
        top,
        left: 72,
        right: 72,
        padding: card ? '44px 48px 40px' : 0,
        borderRadius: card ? 28 : 0,
        background: card ? 'rgba(255,255,255,0.06)' : 'transparent',
        border: card ? '1px solid rgba(255,255,255,0.16)' : 'none',
        boxShadow: card ? '0 18px 50px rgba(0,0,0,0.4)' : 'none',
        backdropFilter: card ? 'blur(6px)' : 'none',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          fontFamily: 'Georgia, serif',
          fontSize: 110,
          fontWeight: 700,
          lineHeight: 0.6,
          color: accentColor,
          opacity: markPop,
          transform: `scale(${interpolate(markPop, [0, 1], [0.6, 1])})`,
          height: 62,
        }}
      >
        &ldquo;
      </div>
      <div
        style={{
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
          fontSize: size,
          lineHeight: 1.45,
          color: MOTION_COLORS.white,
          opacity: textIn,
          transform: `translateY(${interpolate(textIn, [0, 1], [16, 0])}px)`,
        }}
      >
        {words.map((w, i) => (
          <span
            key={i}
            style={{
              display: 'inline-block',
              opacity: interpolate(
                frame,
                [delay + 8 + i * 2, delay + 14 + i * 2],
                [0, 1],
                {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
              ),
            }}
          >
            {w}
            {i < words.length - 1 ? ' ' : ''}
          </span>
        ))}
      </div>
      <div
        style={{
          marginTop: 28,
          opacity: attrIn,
          transform: `translateX(${attrX}px)`,
        }}
      >
        <div
          style={{
            fontFamily: POPPINS,
            fontSize: 30,
            fontWeight: 700,
            color: MOTION_COLORS.white,
          }}
        >
          — {attribution}
        </div>
        {role ? (
          <div
            style={{
              fontFamily: POPPINS,
              fontSize: 24,
              fontWeight: 500,
              color: MOTION_COLORS.gray,
              marginTop: 4,
            }}
          >
            {role}
          </div>
        ) : null}
      </div>
    </div>
  );
};
