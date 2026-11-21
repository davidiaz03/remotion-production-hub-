/**
 * Identidad visual de aprendizaje — modern-wisdom-aprende (BLOQUEADA en
 * CREATIVE_BRIEF.md). Un solo acento ámbar; SIN rojo Memorial #ED1C24,
 * sin logo, sin marca de agua.
 */
import {interpolate} from 'remotion';

export const COLORS = {
  bg: '#12100E',
  surface: '#1E1B18',
  surfaceRaised: '#26221E',
  border: '#33302B',
  bone: '#F2EDE4',
  gray: '#A8A099',
  dim: '#6E675F',
  amber: '#F0A832',
  amberDim: 'rgba(240,168,50,0.16)',
} as const;

/** Poppins (instalada en ~/.fonts/). Pesos disponibles: 400/500/600/700/800. */
export const FONT = "'Poppins', sans-serif";

/** Área segura de contenido: por debajo de la barra de progreso y por
 * encima del karaoke (que ocupa ~y 900–990). */
export const CONTENT = {
  top: 104,
  bottom: 884,
  side: 140,
} as const;

/** Fundido de entrada en N fotogramas (0 = corte directo). */
export const fadeIn = (frame: number, dur = 12) =>
  dur <= 0
    ? 1
    : interpolate(frame, [0, dur], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });

/** Fundido de salida en los últimos N fotogramas (0 = corte directo). */
export const fadeOut = (frame: number, durationInFrames: number, dur = 12) =>
  dur <= 0
    ? 1
    : interpolate(
        frame,
        [durationInFrames - dur, durationInFrames],
        [1, 0],
        {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
      );

/** Tamaño de titular según la longitud del texto (nunca < 56 px). */
export const headlineSize = (text: string): number => {
  const n = text.length;
  if (n <= 45) return 92;
  if (n <= 75) return 78;
  if (n <= 120) return 68;
  return 60;
};
