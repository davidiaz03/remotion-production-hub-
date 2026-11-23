/**
 * Identidad visual EL LIBRETO — «La página que engañó a 62.000 personas»
 * (marca bloqueada en CREATIVE_BRIEF.md §4).
 *
 * Papel claro de fondo, tinta oscura, lápiz rojo para el veredicto y
 * resaltador amarillo SOLO como fondo de resaltado (nunca como color
 * de texto). Azul oficial para documentos oficiales.
 */
import {interpolate} from 'remotion';

export const COLORS = {
  /** Papel — fondo claro principal. */
  paper: '#F5F1E8',
  /** Tinta — texto, bandas y fondos oscuros. */
  ink: '#1A1A2E',
  /** Lápiz rojo — veredicto, énfasis, sellos. */
  red: '#C0392B',
  /** Resaltador — fondo de resaltado, NUNCA color de texto. */
  highlighter: '#FFD60A',
  /** Azul oficial — documentos oficiales. */
  official: '#1F4E79',
  /** Superficies sobre papel. */
  surface: '#FFFFFF',
  surfaceWarm: '#EDE7D8',
  border: '#D8D0BC',
  /** Texto secundario sobre papel. */
  gray: '#55556B',
  dim: '#8A8A9A',
  /** Banda del karaoke: tinta semitransparente. */
  karaokeBand: 'rgba(26,26,46,0.78)',
} as const;

/** Noto Sans (sistema, /usr/share/fonts/truetype/noto/): Regular + Bold. */
export const FONT = "'Noto Sans', sans-serif";
/**
 * Noto Serif Display Black (sistema, NotoSerifDisplay-Black.ttf):
 * titulares grandes. Si falta el peso Black, el navegador sintetiza
 * el grosor desde Bold; Archivo Black (~/.fonts/) es el respaldo.
 */
export const FONT_DISPLAY = "'Noto Serif Display', 'Archivo Black', serif";

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

/** Zoom lento Ken Burns 100→108% repartido por la duración de la escena. */
export const kenBurns = (frame: number, durationInFrames: number, to = 1.08) =>
  interpolate(frame, [0, Math.max(durationInFrames - 1, 1)], [1, to], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
