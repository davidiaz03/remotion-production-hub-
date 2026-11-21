/**
 * Tipos del timeline (src/timeline.json, generado por
 * scripts/build-timeline.mjs) y de las escenas (scenes.json).
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
