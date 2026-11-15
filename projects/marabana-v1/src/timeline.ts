// Timeline data for REEL MARABANA V1 — 30 fps, 1080x1920.
// Total 1425 frames = 47.5 s (41.5 s contenido + 6 s sting oficial).
// RE-TIMING 15-nov-2026: la voz en off manda el ritmo. Los beats siguen
// las líneas de la VO (vo-lines.json, voz Piper ald-medium, 40.89 s).
// Estrategia completa en STRATEGY.md §6 (tabla maestra).
export const FPS = 30;
export const TOTAL_FRAMES = 1425;
export const CONTENT_END = 1245; // 41.5 s — aquí empieza el sting
export const STING_FROM = 1245;
export const STING_DUR = 180;

export const COLORS = {
  red: '#ED1C24', // rojo corporativo MD (PANTONE 485 C)
  ivory: '#F7F7F2',
  ink: '#0A0E11',
  gray: '#9AA0A6',
  darkCard: '#141A1F',
};

// Beats (fotogramas absolutos). Cada beat es una Sequence con fade in/out
// de 6-8 fotogramas salvo indicación contraria.
// El sello CANCELADO ya no es un beat propio: cae DENTRO del beat 2012,
// en la palabra "canceló" (4.42 s = frame 133).
export const BEATS = {
  hook: {from: 0, dur: 87}, // 0-2.90 s: foto héroe + gancho (VO L1)
  dato2012: {from: 87, dur: 166}, // 2.90-8.43 s: vector 2012 + sello (VO L2)
  contraste: {from: 253, dur: 100}, // 8.43-11.77 s: 21 + línea de tiempo (VO L3)
  giro: {from: 353, dur: 44}, // 11.77-13.22 s: whip + PERO A PESAR DE ELLO (VO L4)
  salida: {from: 397, dur: 55}, // 13.22-15.08 s: video salida masiva (VO L5, inicio)
  numero: {from: 452, dur: 128}, // 15.08-19.33 s: count-up 3.000 (VO L5, "tres mil…")
  cincoK: {from: 580, dur: 117}, // 19.33-23.23 s: 5K + foto nocturna (VO L6)
  voz: {from: 697, dur: 126}, // 23.23-27.42 s: cita Yuraldi Cava (VO L7)
  ganadores: {from: 823, dur: 148}, // 27.42-32.35 s: ganadores + foto tuneros (VO L8)
  ernesto: {from: 971, dur: 153}, // 32.35-37.47 s: Ernesto (VO L9a+L9b)
  cierre: {from: 1124, dur: 121}, // 37.47-41.50 s: HOY LA HABANA CORRIÓ… (VO L10)
  sting: {from: STING_FROM, dur: STING_DUR},
};

// Momentos internos de montaje (fotogramas absolutos, de transcribe-vo.py).
export const STAMP_FRAME = 133; // "canceló" (4.42 s): el sello cae aquí
export const BASTON_FRAME = 1077; // "con un bastón" (35.90 s): remate de Ernesto

// Líneas de la VO en segundos (vo-lines.json). El ducking de la música
// se calcula a partir de estos intervalos: música baja mientras habla.
export const VO_LINES: Array<{start: number; end: number}> = [
  {start: 0.0, end: 2.7},
  {start: 2.9, end: 8.23},
  {start: 8.43, end: 11.57},
  {start: 11.77, end: 12.77},
  {start: 13.22, end: 19.13},
  {start: 19.33, end: 23.03},
  {start: 23.23, end: 27.22},
  {start: 27.42, end: 32.15},
  {start: 32.35, end: 35.25},
  {start: 35.9, end: 37.22},
  {start: 37.47, end: 40.89},
];

// Marca de agua: aparece tras el gancho (frame 30) y se retira antes del sting.
export const LOGO_FROM = 30;
export const LOGO_TO = CONTENT_END;
