/**
 * Tipos del timeline (src/timeline.json, generado por
 * scripts/build-timeline.mjs) y de las escenas (scenes.json).
 *
 * build-timeline vuelca cada escena de scenes.json TAL CUAL en
 * timeline.json (spread {...s} + startFrame/endFrame/durationFrames),
 * así que todo campo que un componente necesite se declara aquí en
 * SceneData y se puede añadir a scenes.json sin tocar el constructor.
 */

export type TimelineLine = {
  line: number; // 1-based, como scenes.json
  chapter: number;
  text: string;
  startFrame: number;
  endFrame: number; // fin del habla (sin la pausa posterior)
};

export type TimelineChapter = {
  number: number;
  title: string;
  shortTitle: string;
  startFrame: number;
  endFrame: number;
  real: boolean; // true = tiempos de la VO real; false = estimado
};

export type DataItem = {label: string; value: string};

/** Ítem de checklist: marca ✓ (verificado) o ✗ (ausencia). */
export type ChecklistItem = {
  label: string;
  mark: 'check' | 'cross';
};

/** Hito de la línea de tiempo del patrón (G2). */
export type TimelineMilestone = {
  date: string;
  label: string;
};

/** Círculo de lápiz rojo sobre la diferencia (coords relativas 0–1). */
export type CircleMark = {x: number; y: number; r: number};

export type SceneData = {
  chapter: number;
  fromLine: number;
  toLine: number;
  type: string;
  title?: string;
  subtitle?: string;
  kicker?: string;
  text?: string;
  source?: string;
  author?: string;
  episode?: string;
  items?: Array<string | DataItem>;
  leftTitle?: string;
  leftItems?: string[];
  rightTitle?: string;
  rightItems?: string[];
  img?: string;
  caption?: string;
  rows?: string[][];
  diagram?: string;
  notes?: string;
  highlight?: number;
  /** Nombres de archivo en public/images|video, o ids F1–F14 del
   *  asset-manifest (ver assetMap.ts). Puede venir vacío (plan B). */
  assets?: string[];
  /** Métricas del contador (document-counter): píldoras bajo el número. */
  metrics?: Array<{label: string; value: string}>;
  /** Valor final del contador (document-counter). Por defecto 62000. */
  countTo?: number;
  /** Cita textual en tarjeta (document-quote, plan B sin imagen). */
  quote?: string;
  /** Medio y fecha de la cita (document-quote). */
  outlet?: string;
  date?: string;
  /** URL de la barra de navegador FALSA (document-zoom, escena F11:
   *  el PDF no tiene barra de direcciones). */
  urlBar?: string;
  /** Inicio del clip en SEGUNDOS (document-photo-video; plan: 14 s). */
  videoStartFrom?: number;
  /** Ítems del checklist (document-checklist). */
  checklist?: ChecklistItem[];
  /** Hitos de la línea de tiempo (overlay G2 en cualquier escena). */
  timelineMilestones?: TimelineMilestone[];
  /** Índice del hito activo en la línea de tiempo. */
  timelineActive?: number;
  /** Palabra a resaltar con Resaltador (big-statement). */
  highlightWord?: string;
  /** Escala final del zoom lento (document-zoom). Por defecto 1.08. */
  zoomTo?: number;
  /** Centro del zoom (coords relativas 0–1 sobre la zona visible).
   *  La lupa de Gemini (3.6) apunta a GEMINI_MARK en assetMap.ts. */
  focus?: {x: number; y: number};
  /** Píldora de overlay gráfico bajo la imagen (document-quote).
   *  Si no se pasa, sale de overlayForAsset (F8: fecha del juicio). */
  overlay?: string;
  /** Círculo de lápiz rojo (document-comparison). */
  circle?: CircleMark;
  /** Texto del sello (document-comparison, p. ej. «2022»). */
  stamp?: string;
  /** Rótulo de la tarjeta (summary-card). */
  label?: string;
  /** Placa de contexto bajo/sobre la imagen (document-comparison,
   *  document-photo-video). */
  plate?: string;
  /** Sincronía voz↔imagen (fotogramas RELATIVOS a la escena, 30 fps,
   *  calculados desde research/sentences.json v3 + word_timestamps de
   *  la VO; fijado 23-nov-2026). Si un componente no recibe su campo,
   *  usa el reparto uniforme anterior (fallback). */
  /** document-counter: fotograma en que el contador aterriza (la
   *  palabra «62.000» de la VO). */
  countLandAt?: number;
  /** document-counter: fotograma de aparición de cada píldora de
   *  métrica (una por frase: «3.300 compartidos», «5.000 comentarios»). */
  metricAt?: number[];
  /** document-photo-video: fotograma en que entra el video (la frase
   *  que lo presenta). Sin él, el video ocupa el final de la escena. */
  videoAt?: number;
  /** document-photo-video: duración de la ventana de video (180 f =
   *  6 s). La foto vuelve al terminar la ventana. */
  videoFrames?: number;
  /** growth/formula/list/checklist: fotograma de aparición de cada
   *  ítem (uno por frase de VO). */
  itemAt?: number[];
  /** document-checklist: fotograma del pop de cada marca ✗/✓. */
  markAt?: number[];
  /** formula: fotograma del pop del sello final (VIRAL). */
  viralAt?: number;
  /** Video de fondo de la escena (ruta bajo public/video/, p. ej.
   *  «broll/b2-apagon-ciudad.mp4»): SceneShell lo pone a pantalla
   *  completa con velo oscuro y el texto pasa a Papel. */
  videoBg?: string;
};

export type TimelineScene = SceneData & {
  startFrame: number;
  endFrame: number;
  durationFrames: number;
};

export type Timeline = {
  fps: number;
  tailFrames: number;
  totalFrames: number;
  mode: 'real' | 'placeholder' | 'mixed';
  realChapters: number[];
  generatedAt: string;
  lines: TimelineLine[];
  chapters: TimelineChapter[];
  scenes: TimelineScene[];
};

export type ChaptersMeta = {
  chapters: Array<{
    number: number;
    title: string;
    short_title: string;
    key_idea: string;
    estimated_s: number;
  }>;
};
