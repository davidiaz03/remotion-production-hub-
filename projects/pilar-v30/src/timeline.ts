// Timeline data for REEL PILAR V30 — frame counts verified with ffprobe.
// 30 fps, 1080x1920. Total 2261 frames = 75.37 s.
export const FPS = 30;
export const TOTAL_FRAMES = 2261;
export const END_CARD_FROM = 2216; // 73.87 s
export const END_CARD_DUR = 45;

export type SegmentDef = {
  id: number;
  from: number; // start frame in the composition
  dur: number; // frames of video
  file: string; // in public/video/
  punches: number[]; // local frames where a punch-in peaks (keyword words)
  pushEnd: number; // slow push-in end scale
  fadeOut: number; // crossfade-out length (frames) into the next segment
  fadeIn: number; // crossfade-in length (frames) from the previous segment
};

export const SEGMENTS: SegmentDef[] = [
  {id: 1, from: 0, dur: 116, file: 'seg01.mp4', punches: [21, 98], pushEnd: 1.06, fadeOut: 6, fadeIn: 0},
  {id: 2, from: 116, dur: 196, file: 'seg02.mp4', punches: [89, 177], pushEnd: 1.06, fadeOut: 6, fadeIn: 6},
  {id: 3, from: 312, dur: 310, file: 'seg03.mp4', punches: [83, 129, 295], pushEnd: 1.08, fadeOut: 10, fadeIn: 6},
  {id: 4, from: 622, dur: 121, file: 'seg04.mp4', punches: [85], pushEnd: 1.06, fadeOut: 10, fadeIn: 6},
  // seg05 = testimony: no punch-ins, gentle zoom only, longer fades (register change)
  {id: 5, from: 743, dur: 403, file: 'seg05.mp4', punches: [], pushEnd: 1.08, fadeOut: 10, fadeIn: 10},
  {id: 6, from: 1146, dur: 135, file: 'seg06.mp4', punches: [111], pushEnd: 1.06, fadeOut: 6, fadeIn: 10},
  {id: 7, from: 1281, dur: 145, file: 'seg07.mp4', punches: [41, 119], pushEnd: 1.06, fadeOut: 6, fadeIn: 6},
  {id: 8, from: 1426, dur: 161, file: 'seg08.mp4', punches: [25, 139], pushEnd: 1.06, fadeOut: 6, fadeIn: 6},
  {id: 9, from: 1587, dur: 198, file: 'seg09.mp4', punches: [51, 190], pushEnd: 1.06, fadeOut: 6, fadeIn: 6},
  {id: 10, from: 1785, dur: 112, file: 'seg10.mp4', punches: [17, 93], pushEnd: 1.06, fadeOut: 6, fadeIn: 6},
  {id: 11, from: 1897, dur: 183, file: 'seg11.mp4', punches: [39, 96], pushEnd: 1.06, fadeOut: 6, fadeIn: 6},
  {id: 12, from: 2080, dur: 136, file: 'seg12.mp4', punches: [10, 119], pushEnd: 1.06, fadeOut: 8, fadeIn: 6},
];

// Overlay windows (absolute frames). All graphics sit in the top band
// (y ~70-560) to never cover the presenters' faces (faces at y ~500-960).
export const OVERLAYS = {
  logoFrom: 30, // watermark appears after the hook lands
  logoTo: END_CARD_FROM,
  // seg03: map -> date -> portrait -> embassy
  mapCard: {from: 312, dur: 45}, // 10.40-11.90 s "LIMA, PERÚ"
  dateCard: {from: 357, dur: 84}, // 11.90-14.70 s "5 DE FEBRERO DE 1974"
  portraitCard: {from: 442, dur: 93}, // 14.73-17.83 s Pilar + MINREX
  embassyCard: {from: 535, dur: 87}, // 17.83-20.73 s Embajada (ILUSTRATIVA)
  // seg04: letter-bomb mockup (ILUSTRATIVA) + red pulse on "ESTALLA"
  letterCard: {from: 622, dur: 121},
  redPulse: {from: 707, dur: 12}, // "ESTALLA" at f707 (23.57 s)
  // seg05: testimony labels
  testimonyLabels: {from: 743, dur: 403},
  // seg06: "ES TERRORISMO"
  terrorCard: {from: 1238, dur: 43}, // 41.27-42.70 s
  // seg07: "NO ERA MILITAR" -> "SEDE DIPLOMÁTICA"
  noMilitarCard: {from: 1313, dur: 37}, // 43.77-45.00 s
  sedeCard: {from: 1383, dur: 43}, // 46.10-47.53 s
  // seg08: kinetic lines
  cubanoLine: {from: 1464, dur: 37}, // 48.80-50.03 s
  embajadaLine: {from: 1501, dur: 52}, // 50.03-51.77 s
  // seg09: Bosch portrait -> Bosch B-roll (muted)
  boschCard: {from: 1629, dur: 40}, // 54.30-55.63 s
  boschBroll: {from: 1669, dur: 116}, // 55.63-59.50 s (clip is 120 f)
  // seg10: "PILAR SOBREVIVIÓ"
  sobrevivioCard: {from: 1785, dur: 112},
  // seg11: question card
  questionCard: {from: 1897, dur: 183},
  // seg12: Memorial sala B-roll (muted, banners shot, 120 f)
  salaBroll: {from: 2080, dur: 120},
};

// Music bed (Flow, original of the project): ducked during the testimony.
export const MUSIC_VOLUME_KEYFRAMES: Array<[number, number]> = [
  [0, 0.12],
  [743, 0.12],
  [770, 0.02], // duck in over the testimony fade
  [1146, 0.02],
  [1175, 0.12], // back up after the testimony
  [2216, 0.12],
  [2261, 0.0], // fade out on the end card
];

export const COLORS = {
  red: '#ED1C24',
  ivory: '#F7F7F2',
  ink: '#0A0E11',
  yellow: '#FFC107',
};
