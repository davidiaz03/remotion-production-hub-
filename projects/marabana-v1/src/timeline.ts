// Timeline data for REEL MARABANA V1.3 — 30 fps, 1080x1920.
// Total 1439 frames = 47.97 s (44.97 s contenido + 3 s sting oficial a 2x).
// RE-TIMING 15-nov-2026: la voz en off manda el ritmo. Los beats siguen
// las líneas de la VO (vo-lines.json, voz Piper ald-medium, 44.51 s).
// V1.1: la línea 5 cambió «cuarenta» → «cuadragésima» (+0.557 s), así que
// todos los beats desde la 5K en adelante se desplazan +17 fotogramas;
// el corte salida→número cae en «casi» (14.98 s = frame 449). El sting
// pasa de 6 s a 3 s (2x) por la auditoría de retención.
// V1.2: línea nueva de BUCLE ABIERTO tras el giro (+3.067 s = +92 f):
// «Quédate hasta el final. Hay una historia que lo resume todo.»
// (13.224–16.091 s). El beat del giro se alarga para cubrirla (44→136 f)
// y todos los beats desde la salida se desplazan +92 f. El corte
// salida→número cae en «casi» según la transcripción V1.2 (17.80 s =
// frame 534; el count-up arranca con «tres», 18.18 s).
// V1.3: correcciones de arranque (sin cambios de guion, beats ni VO):
// LOGO_FROM = 0 (la marca blanca transparente entra desde el fotograma 0;
// en la V1.2 entraba en f30), el ducking de la primera ventana baja a 0.25
// a los 0.52 s en vez de desde el fotograma 0 (ver Video.tsx), y la música
// se alarga a 47.97 s con una cola baja bajo el sting.
// Estrategia completa en STRATEGY.md §6 (tabla maestra).
export const FPS = 30;
export const TOTAL_FRAMES = 1439;
export const CONTENT_END = 1349; // 44.97 s — aquí empieza el sting
export const STING_FROM = 1349;
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
  giro: {from: 353, dur: 136}, // 11.77-16.30 s: whip + foto multitud + BUCLE ABIERTO (VO L4 + L5 nueva)
  salida: {from: 489, dur: 45}, // 16.30-17.80 s: video salida masiva (VO L6, inicio)
  numero: {from: 534, dur: 155}, // 17.80-22.97 s: count-up 3.000 (VO L6, "casi…")
  cincoK: {from: 689, dur: 117}, // 22.97-26.87 s: 5K + foto nocturna + 2ª ventana video (VO L7)
  voz: {from: 806, dur: 125}, // 26.87-31.03 s: cita Yuraldi Cava (VO L8)
  ganadores: {from: 931, dur: 148}, // 31.03-35.97 s: ganadores + foto tuneros (VO L9)
  ernesto: {from: 1079, dur: 154}, // 35.97-41.10 s: Ernesto (VO L10a+L10b)
  cierre: {from: 1233, dur: 116}, // 41.10-44.97 s: HOY LA HABANA CORRIÓ… + CTA (VO L11)
  sting: {from: STING_FROM, dur: STING_DUR},
};

// Momentos internos de montaje (fotogramas absolutos, de transcribe-vo.py).
export const STAMP_FRAME = 133; // "canceló" (4.42 s): el sello cae aquí
export const BASTON_FRAME = 1186; // "con un bastón" (39.53 s): remate de Ernesto

// Momentos de los SFX (V1.2, fotogramas absolutos).
export const SFX_STAMP_FRAME = STAMP_FRAME; // golpe seco con el sello
export const SFX_WHOOSH_FRAME = BEATS.giro.from; // whoosh con el whip (11.77 s)
export const RISER_END_FRAME = BEATS.ernesto.from; // la subida resuelve en Ernesto
export const RISER_DUR_FRAMES = 54; // 1.8 s de subida antes de Ernesto

// Líneas de la VO en segundos (vo-lines.json). El ducking de la música
// se calcula a partir de estos intervalos: música baja mientras habla.
export const VO_LINES: Array<{start: number; end: number}> = [
  {start: 0.0, end: 2.705},
  {start: 2.905, end: 8.234},
  {start: 8.434, end: 11.57},
  {start: 11.77, end: 12.774},
  {start: 13.224, end: 16.091},
  {start: 16.291, end: 22.757},
  {start: 22.958, end: 26.659},
  {start: 26.859, end: 30.848},
  {start: 31.048, end: 35.776},
  {start: 35.976, end: 38.876},
  {start: 39.526, end: 40.848},
  {start: 41.098, end: 44.511},
];

// Marca de agua: desde el fotograma 0 (V1.3; en la V1.2 entraba en f30
// y el usuario notó el principio «medio tarde») y se retira antes del sting.
export const LOGO_FROM = 0;
export const LOGO_TO = CONTENT_END;
