import React from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {MOTION_COLORS, POPPINS} from './theme';

export type CountUpProps = {
  /** Valor final al que llega el contador (aterriza exacto). */
  to: number;
  /** Valor inicial (0 por defecto). */
  from?: number;
  /** Fotograma en el que empieza a contar. */
  delay?: number;
  /** Duración del conteo en fotogramas (8–18 según las reglas de
   *  movimiento; por defecto 15). */
  durationInFrames?: number;
  /** Etiqueta pequeña bajo el número. */
  label?: string;
  /** Prefijo (p. ej. "$") y sufijo (p. ej. "+", "%", "K"). */
  prefix?: string;
  suffix?: string;
  /** Decimales a mostrar (0 por defecto). */
  decimals?: number;
  /** Separador de miles (".", por defecto; "" lo desactiva). */
  thousandsSep?: string;
  /** Tamaño del número. */
  size?: number;
  /** Tamaño de la etiqueta. */
  labelSize?: number;
  /** Color del número. */
  color?: string;
  /** Color de la etiqueta. */
  labelColor?: string;
  fontFamily?: string;
  /** Alineación del bloque. */
  align?: 'center' | 'left';
};

/**
 * Contador animado (mecánica adaptada de remotion-video-templates
 * —BarChartRace/LineChart, MIT, AleBrito124356— y de las reglas de
 * conteo de facecammaxxing —glass-graph, MIT, aaksa—: el número sube
 * en 8–18 fotogramas y ATERRIZA EXACTO en el valor final, sin
 * arrastre ni casi-acierto).
 *
 * Para cifras del Memorial que deben leerse en el móvil: el número
 * héroe mide al menos el 4 % de la altura del fotograma (~77 px a
 * 1920). Un solo héroe por tarjeta; el resto pequeño y callado.
 *
 * Números reales, siempre: si la cifra es un ejemplo o una
 * aproximación, dilo en la etiqueta o en el copy del reel.
 */
export const CountUp: React.FC<CountUpProps> = ({
  to,
  from = 0,
  delay = 0,
  durationInFrames = 15,
  label,
  prefix = '',
  suffix = '',
  decimals = 0,
  thousandsSep = '.',
  size = 120,
  labelSize = 30,
  color = MOTION_COLORS.white,
  labelColor = MOTION_COLORS.gray,
  fontFamily = POPPINS,
  align = 'center',
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Entrada: pop corto desde 1.15 (nunca desde 0).
  const enter = spring({
    frame: frame - delay,
    fps,
    config: {damping: 200, stiffness: 300},
    durationInFrames: 8,
  });

  // Conteo con ease-out: rápido al principio, aterriza exacto en `to`.
  const t = interpolate(
    frame,
    [delay, delay + durationInFrames],
    [0, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  const eased = Easing.out(Easing.ease)(t);
  const value = from + (to - from) * eased;
  // En el último fotograma, el valor exacto (sin error de coma flotante).
  const shown = frame >= delay + durationInFrames ? to : value;

  const formatted = shown.toLocaleString('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  const display = thousandsSep === '.' ? formatted : formatted.replace(/\./g, thousandsSep === '' ? '' : thousandsSep);

  return (
    <div
      style={{
        textAlign: align,
        opacity: enter,
        transform: `scale(${interpolate(enter, [0, 1], [1.15, 1])})`,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          fontFamily,
          fontSize: size,
          fontWeight: 800,
          letterSpacing: -2,
          lineHeight: 1,
          color,
          textShadow: '0 4px 24px rgba(0,0,0,0.55)',
        }}
      >
        {prefix}
        {display}
        {suffix}
      </div>
      {label ? (
        <div
          style={{
            fontFamily,
            fontSize: labelSize,
            fontWeight: 600,
            color: labelColor,
            marginTop: Math.round(size * 0.12),
            letterSpacing: 1,
            textTransform: 'uppercase',
          }}
        >
          {label}
        </div>
      ) : null}
    </div>
  );
};
