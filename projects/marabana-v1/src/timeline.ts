// Timeline data for REEL MARABANA V1.1 — 30 fps, 1080x1920.
// Total 1347 frames = 44.9 s (41.90 s contenido + 3 s sting oficial a 2x).
// RE-TIMING 15-nov-2026: la voz en off manda el ritmo. Los beats siguen
// las líneas de la VO (vo-lines.json, voz Piper ald-medium, 41.44 s).
// V1.1: la línea 5 cambió «cuarenta» → «cuadragésima» (+0.557 s), así que
// todos los beats desde la 5K en adelante se desplazan +17 fotogramas;
// el corte salida→número cae en «casi» (14.98 s = frame 449). El sting
// pasa de 6 s a 3 s (2x) por la auditoría de retención.
// Estrategia completa en STRATEGY.md §6 (tabla maestra).
export const FPS = 30;
export const TOTAL_FRAMES = 1347;
export const CONTENT_END = 1257; // 41.90 s — aquí empieza el sting
export const STING_FROM = 1257;
export const STING_DUR = 90; // 3 s: sting oficial a 2x (ver EDIT_NOTES.md)

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
  giro: {from: 353, dur: 44}, // 11.77-13.22 s: whip + foto multitud (VO L4)
  salida: {from: 397, dur: 52}, // 13.22-14.97 s: video salida masiva (VO L5, inicio)
  numero: {from: 449, dur: 148}, // 14.97-19.90 s: count-up 3.000 (VO L5, "casi…")
  cincoK: {from: 597, dur: 117}, // 19.90-23.80 s: 5K + foto nocturna (VO L6)
  voz: {from: 714, dur: 125}, // 23.80-27.97 s: cita Yuraldi Cava (VO L7)
  ganadores: {from: 839, dur: 148}, // 27.97-32.90 s: ganadores + foto tuneros (VO L8)
  ernesto: {from: 987, dur: 154}, // 32.90-38.03 s: Ernesto (VO L9a+L9b)
  cierre: {from: 1141, dur: 116}, // 38.03-41.90 s: HOY LA HABANA CORRIÓ… (VO L10)
  sting: {from: STING_FROM, dur: STING_DUR},
};

// Momentos internos de montaje (fotogramas absolutos, de transcribe-vo.py).
export const STAMP_FRAME = 133; // "canceló" (4.42 s): el sello cae aquí
export const BASTON_FRAME = 1094; // "con un bastón" (36.46 s): remate de Ernesto

// Líneas de la VO en segundos (vo-lines.json). El ducking de la música
// se calcula a partir de estos intervalos: música baja mientras habla.
export const VO_LINES: Array<{start: number; end: number}> = [
  {start: 0.0, end: 2.7},
  {start: 2.9, end: 8.23},
  {start: 8.43, end: 11.57},
  {start: 11.77, end: 12.77},
  {start: 13.22, end: 19.69},
  {start: 19.89, end: 23.59},
  {start: 23.79, end: 27.78},
  {start: 27.98, end: 32.71},
  {start: 32.91, end: 35.81},
  {start: 36.46, end: 37.78},
  {start: 38.03, end: 41.44},
];

// Marca de agua: aparece tras el gancho (frame 30) y se retira antes del sting.
export const LOGO_FROM = 30;
export const LOGO_TO = CONTENT_END;
