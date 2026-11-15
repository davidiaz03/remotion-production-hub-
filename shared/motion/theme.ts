/**
 * Tema del módulo motion — gramática del explainer animado (ver ANALISIS.md
 * en ~/workspace/marabana/research/motion-ref-fb/).
 *
 * Paleta adaptada al Memorial: tinta + rojo corporativo, con el sistema de
 * acentos del estilo de referencia (verde = seguro, azul = palabra clave,
 * amarillo = dato, naranja = curiosidad). Los acentos son un SISTEMA, no la
 * marca del creador de referencia.
 */

/** Sans geométrica redondeada (instalada en ~/.fonts/, como Archivo/Roboto). */
export const POPPINS = "'Poppins', sans-serif";

export const MOTION_COLORS = {
  ink: '#050507',
  inkSoft: '#0A0E11',
  /** Rojo corporativo del Memorial (peligro / énfasis). */
  red: '#ED1C24',
  redSoft: '#FF3B30',
  /** Verde: seguro / solución. */
  green: '#2EE06F',
  greenDeep: '#0E5C2E',
  /** Azul: palabra clave (recuadro). */
  blue: '#2E7CF6',
  /** Amarillo: dato / número resaltado. */
  yellow: '#FFD60A',
  /** Naranja: curiosidad / bonus. */
  orange: '#FF7A1A',
  white: '#FFFFFF',
  /** Gris de palabra no activa (karaoke). */
  gray: '#9CA3AF',
  grayDim: '#6B7280',
} as const;

/** Resplandores de acto: el color emocional del fondo por escena. */
export const GLOW_PRESETS = {
  danger: {glow: 'rgba(237,28,36,0.55)', edge: 'rgba(120,10,16,0.35)'},
  safe: {glow: 'rgba(46,224,111,0.45)', edge: 'rgba(10,90,45,0.30)'},
  neutral: {glow: 'rgba(46,124,246,0.35)', edge: 'rgba(20,50,110,0.30)'},
  curiosity: {glow: 'rgba(255,122,26,0.45)', edge: 'rgba(120,55,5,0.30)'},
  ink: {glow: 'rgba(60,70,85,0.40)', edge: 'rgba(10,14,17,0.30)'},
} as const;

export type GlowPreset = keyof typeof GLOW_PRESETS;

/** Pseudoaleatorio determinista (sin Math.random en render: mismo frame = mismo resultado). */
export const seeded = (seed: number) => {
  let t = seed + 0x6d2b79f5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
