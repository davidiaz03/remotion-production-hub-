#!/usr/bin/env node
/**
 * build-timeline.mjs — longform-smoke (copiado de modern-wisdom-aprende)
 *
 * Combina los tiempos REALES de VO por línea (vo-chapters/chNN-lines.json,
 * generados por gen-vo-kokoro.py) con las duraciones ESTIMADAS de
 * chapters.json para los capítulos cuya VO aún no existe, y produce
 * src/timeline.json:
 *
 *   lines    [{line, chapter, text, startFrame, endFrame}]  (1-based)
 *   chapters [{number, title, shortTitle, startFrame, endFrame, real}]
 *   scenes   [cada escena de scenes.json + startFrame/endFrame/durationFrames]
 *   totalFrames = fin del último capítulo + 90 fotogramas de cola
 *                 (pantalla final «Aprender es actuar.»)
 *
 * MODO PLACEHOLDER: un capítulo sin chNN-lines.json se reparte con su
 * estimated_s de chapters.json, proporcional al peso de cada línea
 * (caracteres/800 por minuto + pause_after, la misma fórmula que generó
 * estimated_s). Al llegar la VO real, re-ejecutar este script: el formato
 * de salida es idéntico y project.json se actualiza solo.
 *
 * Uso:  node scripts/build-timeline.mjs   (desde la raíz del proyecto)
 *       node scripts/build-timeline.mjs --real-only   (falla si falta algún
 *       capítulo de VO; para el montaje final con la VO completa)
 *
 * También actualiza project.json durationInFrames.
 */
import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FPS = 30;
const TAIL_FRAMES = 90; // Pantalla final «Aprender es actuar.»
const CHARS_PER_MIN = 800; // Ritmo pausado (misma fórmula que chapters.json).

const readJson = (p) => JSON.parse(readFileSync(path.join(ROOT, p), 'utf8'));

const script = readJson('vo-script.json');
const chaptersMeta = readJson('chapters.json').chapters;
const scenes = readJson('scenes.json').scenes;

const realOnly = process.argv.includes('--real-only');

// Fragmentos del guion agrupados por capítulo (orden de aparición).
const fragsByChapter = new Map();
script.fragments.forEach((f, i) => {
  const line = i + 1; // 1-based, como scenes.json (fromLine/toLine).
  if (!fragsByChapter.has(f.chapter)) fragsByChapter.set(f.chapter, []);
  fragsByChapter.get(f.chapter).push({...f, line});
});

const lines = [];
const chapters = [];
const realChapters = [];
let cursorFrame = 0;

for (const meta of chaptersMeta) {
  const n = meta.number;
  const frags = fragsByChapter.get(n) ?? [];
  const linesPath = `vo-chapters/ch${String(n).padStart(2, '0')}-lines.json`;
  const hasReal = existsSync(path.join(ROOT, linesPath));
  const chapterStart = cursorFrame;

  if (hasReal) {
    const vo = readJson(linesPath);
    if (vo.lines.length !== frags.length) {
      throw new Error(
        `ch${String(n).padStart(2, '0')}: ${vo.lines.length} líneas de VO ` +
          `≠ ${frags.length} fragmentos del guion. Regenera la VO o el guion.`,
      );
    }
    vo.lines.forEach((vl, i) => {
      const frag = frags[i];
      if (vl.text.trim() !== frag.text.trim()) {
        throw new Error(
          `ch${String(n).padStart(2, '0')} línea ${frag.line}: el texto de ` +
            `la VO no coincide con vo-script.json («${vl.text.slice(0, 40)}…»).`,
        );
      }
      lines.push({
        line: frag.line,
        chapter: n,
        text: frag.text,
        startFrame: chapterStart + Math.round(vl.start * FPS),
        endFrame: chapterStart + Math.round(vl.end * FPS),
      });
    });
    const durationFrames = Math.round(vo.total_duration * FPS);
    chapters.push({
      number: n,
      title: meta.title,
      shortTitle: meta.short_title,
      startFrame: chapterStart,
      endFrame: chapterStart + durationFrames,
      real: true,
    });
    realChapters.push(n);
    cursorFrame += durationFrames;
  } else {
    if (realOnly) {
      throw new Error(
        `Falta la VO del capítulo ${n} (${linesPath}). Genera la VO de todos los capítulos antes de --real-only.`,
      );
    }
    // Placeholder: reparte estimated_s proporcional al peso de cada línea.
    const weights = frags.map(
      (f) => (f.text.length / CHARS_PER_MIN) * 60 + (f.pause_after ?? 0),
    );
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const durationFrames = Math.round(meta.estimated_s * FPS);
    const scale = durationFrames / totalWeight;
    let t = chapterStart;
    frags.forEach((frag, i) => {
      const speechFrames = Math.round(
        ((frag.text.length / CHARS_PER_MIN) * 60) * scale,
      );
      lines.push({
        line: frag.line,
        chapter: n,
        text: frag.text,
        startFrame: t,
        endFrame: t + speechFrames,
      });
      t += Math.round(weights[i] * scale);
    });
    chapters.push({
      number: n,
      title: meta.title,
      shortTitle: meta.short_title,
      startFrame: chapterStart,
      endFrame: chapterStart + durationFrames,
      real: false,
    });
    cursorFrame += durationFrames;
  }
}

lines.sort((a, b) => a.line - b.line);

// Escenas: startFrame = inicio de la primera línea; endFrame = inicio de la
// siguiente escena (las escenas embaldosan sin huecos); la última termina
// al final del último capítulo (incluye la pausa final de la última línea).
const byLine = new Map(lines.map((l) => [l.line, l]));
const timelineScenes = scenes.map((s, i) => {
  const first = byLine.get(s.fromLine);
  const next = scenes[i + 1];
  const startFrame = first.startFrame;
  const endFrame = next
    ? byLine.get(next.fromLine).startFrame
    : chapters[chapters.length - 1].endFrame;
  return {...s, startFrame, endFrame, durationFrames: endFrame - startFrame};
});

const lastSpeechEnd = chapters[chapters.length - 1].endFrame;
const totalFrames = lastSpeechEnd + TAIL_FRAMES;

const timeline = {
  fps: FPS,
  tailFrames: TAIL_FRAMES,
  totalFrames,
  mode:
    realChapters.length === chaptersMeta.length
      ? 'real'
      : realChapters.length === 0
        ? 'placeholder'
        : 'mixed',
  realChapters,
  generatedAt: new Date().toISOString(),
  lines,
  chapters,
  scenes: timelineScenes,
};

writeFileSync(
  path.join(ROOT, 'src/timeline.json'),
  JSON.stringify(timeline, null, 2) + '\n',
);

// Actualiza project.json durationInFrames (Root.tsx lo lee).
const pjPath = path.join(ROOT, 'project.json');
const pj = readJson('project.json');
pj.durationInFrames = totalFrames;
writeFileSync(pjPath, JSON.stringify(pj, null, 2) + '\n');

const min = (totalFrames / FPS / 60).toFixed(1);
console.log(
  `timeline.json: ${lines.length} líneas, ${timelineScenes.length} escenas, ` +
    `${totalFrames} fotogramas (${min} min) — modo ${timeline.mode} ` +
    `(VO real: capítulos ${realChapters.join(', ') || 'ninguno'}).`,
);
console.log(`project.json durationInFrames = ${totalFrames}.`);
