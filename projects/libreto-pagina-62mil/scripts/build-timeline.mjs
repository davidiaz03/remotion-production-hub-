#!/usr/bin/env node
/**
 * build-timeline.mjs — libreto-pagina-62mil (El Libreto, video largo)
 *
 * A diferencia del smoke (VO por capítulos TTS), aquí la VO es UN solo
 * archivo real del usuario (public/audio/vo-full.wav, 545,29 s) y las
 * unidades de tiempo son las 128 FRASES de research/sentences.json
 * (tiempos reales de los word_timestamps de la VO editada; ver
 * research/vo/build-sentence-table.py). Las escenas de scenes.json
 * referencian frases (fromLine/toLine = nº de frase, 1-128).
 *
 * Produce src/timeline.json (mismo formato que longform-smoke):
 *   lines    [{line, chapter, text, startFrame, endFrame}]  (1-based)
 *   chapters [{number, title, shortTitle, startFrame, endFrame, real}]
 *   scenes   [cada escena de scenes.json + startFrame/endFrame/durationFrames]
 *   totalFrames = fin de la VO (16359 f) + 90 f de cola (pantalla final)
 *
 * Las escenas embaldosan sin huecos: endFrame = inicio de la siguiente
 * escena; la primera empieza en el fotograma 0 (cold open desde el
 * primer fotograma) y la última termina al final de la VO.
 *
 * Uso: node scripts/build-timeline.mjs [--real-only] [--force]
 *   --real-only: falla si falta research/sentences.json (sin VO real).
 *   --force: aceptado por compatibilidad con el pipeline (el script
 *   siempre sobrescribe src/timeline.json).
 * También actualiza project.json durationInFrames (igual que el smoke).
 */
import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FPS = 30;
const TAIL_FRAMES = 90; // Pantalla final (3 s).
const VO_SECONDS = 545.29; // Duración de public/audio/vo-full.wav.

const readJson = (p) => JSON.parse(readFileSync(path.join(ROOT, p), 'utf8'));

const realOnly = process.argv.includes('--real-only');

if (realOnly && !existsSync(path.join(ROOT, 'research/sentences.json'))) {
  throw new Error('Falta research/sentences.json (tiempos reales de la VO).');
}
const sentences = readJson('research/sentences.json');
const chaptersMeta = readJson('chapters.json').chapters;
const scenes = readJson('scenes.json').scenes;
const project = readJson('project.json');
const fps = Number(project.fps ?? FPS);
if (fps !== FPS) throw new Error(`fps inesperado en project.json: ${fps}`);

// Validación: las escenas cubren las frases 1..N sin huecos ni solapes.
let cursor = 0;
for (const [i, s] of scenes.entries()) {
  if (s.fromLine !== cursor + 1 || s.toLine < s.fromLine) {
    throw new Error(
      `Escena ${i + 1}: rango ${s.fromLine}-${s.toLine} no continúa ` +
        `en ${cursor + 1} (hueco o solape).`,
    );
  }
  cursor = s.toLine;
}
if (cursor !== sentences.length) {
  throw new Error(
    `Las escenas cubren hasta la frase ${cursor}, pero hay ` +
      `${sentences.length} frases.`,
  );
}

const lines = sentences.map((s) => ({
  line: s.n,
  chapter: s.chapter,
  text: s.text,
  startFrame: Math.round(s.start * FPS),
  endFrame: Math.round(s.end * FPS),
}));
const byLine = new Map(lines.map((l) => [l.line, l]));

// Capítulos: inicio = primera frase del capítulo (cap 0 = fotograma 0);
// fin = inicio del siguiente capítulo; el último termina al final de la VO.
const voEndFrame = Math.round(VO_SECONDS * FPS);
const chapters = chaptersMeta.map((meta, i) => {
  const first = lines.find((l) => l.chapter === meta.number);
  const next = chaptersMeta[i + 1];
  const nextFirst = next
    ? lines.find((l) => l.chapter === next.number)
    : null;
  if (!first) throw new Error(`Capítulo ${meta.number} sin frases.`);
  return {
    number: meta.number,
    title: meta.title,
    shortTitle: meta.short_title,
    startFrame: meta.number === 0 ? 0 : first.startFrame,
    endFrame: nextFirst ? nextFirst.startFrame : voEndFrame,
    real: true,
  };
});

// Escenas: startFrame = inicio de la primera frase (la 1ª en el f0);
// endFrame = inicio de la siguiente escena; la última, al final de la VO.
const timelineScenes = scenes.map((s, i) => {
  const first = byLine.get(s.fromLine);
  const next = scenes[i + 1];
  const startFrame = i === 0 ? 0 : first.startFrame;
  const endFrame = next ? byLine.get(next.fromLine).startFrame : voEndFrame;
  return {...s, startFrame, endFrame, durationFrames: endFrame - startFrame};
});

const totalFrames = voEndFrame + TAIL_FRAMES;

const timeline = {
  fps: FPS,
  tailFrames: TAIL_FRAMES,
  totalFrames,
  mode: 'real',
  realChapters: chaptersMeta.map((c) => c.number),
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
project.durationInFrames = totalFrames;
writeFileSync(
  path.join(ROOT, 'project.json'),
  JSON.stringify(project, null, 2) + '\n',
);

const min = (totalFrames / FPS / 60).toFixed(1);
console.log(
  `timeline.json: ${lines.length} frases, ${timelineScenes.length} escenas, ` +
    `${totalFrames} fotogramas (${min} min) — modo real.`,
);
console.log(`project.json durationInFrames = ${totalFrames}.`);
