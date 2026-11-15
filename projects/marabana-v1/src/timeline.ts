// Timeline data for REEL MARABANA V1 — 30 fps, 1080x1920.
// Total 1380 frames = 46.0 s (40 s contenido + 6 s sting oficial).
// Estrategia completa en STRATEGY.md §6 (tabla maestra).
export const FPS = 30;
export const TOTAL_FRAMES = 1380;
export const CONTENT_END = 1200; // 40.0 s — aquí empieza el sting
export const STING_FROM = 1200;
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
export const BEATS = {
  hook: {from: 0, dur: 105}, // 0-3.5 s: foto héroe + pregunta
  dato2012: {from: 105, dur: 180}, // 3.5-9.5 s: tarjeta 2012 + sello (fondo continuo)
  stamp: {from: 210, dur: 75}, // 7-9.5 s: sello CANCELADO sobre la tarjeta 2012
  contraste: {from: 285, dur: 75}, // 9.5-12 s: línea de tiempo 2011->2012 + 21
  giro: {from: 360, dur: 90}, // 12-15 s: whip + foto multitud + PERO A PESAR DE ELLO
  salida: {from: 450, dur: 105}, // 15-18.5 s: video salida masiva
  numero: {from: 555, dur: 90}, // 18.5-21.5 s: count-up 3.000 + foto carrera
  cincoK: {from: 645, dur: 90}, // 21.5-24.5 s: 5K + foto nocturna
  voz: {from: 735, dur: 90}, // 24.5-27.5 s: cita Yuraldi Cava + foto MINREX
  ganadores: {from: 825, dur: 90}, // 27.5-30.5 s: tarjeta de datos + foto tuneros
  ernesto: {from: 915, dur: 165}, // 30.5-36 s: Ernesto (beat más largo, 5.5 s)
  cierre: {from: 1080, dur: 120}, // 36-40 s: HOY LA HABANA CORRIÓ...
  sting: {from: STING_FROM, dur: STING_DUR},
};

// Marca de agua: aparece tras el gancho (frame 30) y se retira antes del sting.
export const LOGO_FROM = 30;
export const LOGO_TO = CONTENT_END;
