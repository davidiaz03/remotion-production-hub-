import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const esbuild = path.join(root, 'node_modules', '.bin', 'esbuild');

// Compila los módulos puros de shared/captions (sin React) con esbuild
// y devuelve sus exports. El bundle se borra al final de cada test.
function loadCaptions() {
  const dir = mkdtempSync(path.join(tmpdir(), 'captions-test-'));
  const entry = path.join(dir, 'entry.ts');
  const out = path.join(dir, 'bundle.mjs');
  writeFileSync(
    entry,
    `export * from ${JSON.stringify(path.join(root, 'shared/captions/whisper.ts'))};\n` +
      `export * from ${JSON.stringify(path.join(root, 'shared/captions/srt.ts'))};\n` +
      `export * from ${JSON.stringify(path.join(root, 'shared/captions/legacy.ts'))};\n`,
  );
  const r = spawnSync(
    esbuild,
    [entry, '--bundle', '--platform=node', '--format=esm', `--outfile=${out}`, '--log-level=error'],
    {encoding: 'utf8'},
  );
  assert.equal(r.status, 0, r.stderr);
  return import(out).finally(() => rmSync(dir, {recursive: true, force: true}));
}

const WORDS = [
  {word: '¿Sabías', start: 0.0, end: 0.38, probability: 0.9},
  {word: ' que', start: 0.38, end: 0.62},
  {word: ' el', start: 0.62, end: 0.78},
  {word: ' bloqueo', start: 0.78, end: 1.22},
  {word: ' llegó', start: 1.22, end: 1.52},
  {word: ' hasta', start: 1.52, end: 1.78},
  {word: ' el', start: 1.78, end: 1.96},
  {word: ' maratón?', start: 1.96, end: 2.705},
];

test('whisperWordsToCaptions: espacios iniciales, ms, kw y pageBreakAfter', async () => {
  const {whisperWordsToCaptions} = await loadCaptions();
  const caps = whisperWordsToCaptions(WORDS, {
    keywordIndices: [3, 7],
    chunkEndIndices: [3, 7],
  });
  assert.equal(caps.length, 8);
  // Primera palabra sin espacio inicial; el resto con espacio.
  assert.equal(caps[0].text, '¿Sabías');
  assert.equal(caps[1].text, ' que');
  assert.equal(caps[4].text, ' llegó');
  // Tiempos en ms redondeados.
  assert.equal(caps[0].startMs, 0);
  assert.equal(caps[0].endMs, 380);
  assert.equal(caps[7].endMs, 2705);
  assert.equal(caps[0].timestampMs, 0);
  assert.equal(caps[0].confidence, 0.9);
  assert.equal(caps[1].confidence, null);
  // Keywords y cortes de chunk.
  assert.equal(caps[3].kw, true);
  assert.equal(caps[7].kw, true);
  assert.equal(caps[0].kw, undefined);
  assert.equal(caps[3].pageBreakAfter, true);
  assert.equal(caps[7].pageBreakAfter, true);
  assert.equal(caps[2].pageBreakAfter, undefined);
});

test('whisperWordsToCaptions: keywords por texto (insensible a mayúsculas)', async () => {
  const {whisperWordsToCaptions} = await loadCaptions();
  const caps = whisperWordsToCaptions(WORDS, {keywordWords: ['BLOQUEO', 'maratón']});
  assert.equal(caps[3].kw, true);
  assert.equal(caps[7].kw, true);
  assert.equal(caps[0].kw, undefined);
});

test('captionsToLines: reproduce los chunks manuales y conserva kw', async () => {
  const {whisperWordsToCaptions, captionsToLines} = await loadCaptions();
  const caps = whisperWordsToCaptions(WORDS, {
    keywordIndices: [3, 7],
    chunkEndIndices: [3, 7],
  });
  const lines = captionsToLines(caps);
  assert.equal(lines.length, 2);
  assert.deepEqual(
    lines[0].words.map((w) => w.t),
    ['¿Sabías', 'que', 'el', 'bloqueo'],
  );
  assert.deepEqual(
    lines[1].words.map((w) => w.t),
    ['llegó', 'hasta', 'el', 'maratón?'],
  );
  assert.equal(lines[0].words[3].kw, true);
  assert.equal(lines[1].words[3].kw, true);
  assert.equal(lines[0].words[0].kw, undefined);
  // Tiempos en segundos, preservados.
  assert.equal(lines[0].words[0].s, 0);
  assert.equal(lines[0].words[3].e, 1.22);
  assert.equal(lines[1].words[3].e, 2.705);
});

test('captionsToLines: sin chunks manuales agrupa por duración/silencio', async () => {
  const {whisperWordsToCaptions, captionsToLines} = await loadCaptions();
  const caps = whisperWordsToCaptions(WORDS);
  const lines = captionsToLines(caps);
  assert.ok(lines.length >= 1);
  const all = lines.flatMap((l) => l.words.map((w) => w.t));
  assert.deepEqual(all, ['¿Sabías', 'que', 'el', 'bloqueo', 'llegó', 'hasta', 'el', 'maratón?']);
});

test('linesToSrt: formato SRT válido con tiempos correctos', async () => {
  const {whisperWordsToCaptions, captionsToLines, linesToSrt} = await loadCaptions();
  const caps = whisperWordsToCaptions(WORDS, {chunkEndIndices: [3, 7]});
  const srt = linesToSrt(captionsToLines(caps));
  assert.match(srt, /^1\n00:00:00,000 --> 00:00:01,220\n¿Sabías que el bloqueo\n/);
  assert.match(srt, /\n2\n00:00:01,220 --> 00:00:02,705\nllegó hasta el maratón\?/);
});

test('capSegmentsToLines: aplana CapSegment conservando orden y kw', async () => {
  const {capSegmentsToLines} = await loadCaptions();
  const lines = capSegmentsToLines([
    {
      id: 1,
      start: 0,
      frames: 81,
      chunks: [
        {
          start: 0,
          end: 1.22,
          words: [
            {t: 'A', s: 0, e: 0.3, kw: false},
            {t: 'B', s: 0.3, e: 1.22, kw: true},
          ],
        },
        {start: 1.22, end: 2, words: [{t: 'C', s: 1.22, e: 2, kw: false}]},
      ],
    },
  ]);
  assert.equal(lines.length, 2);
  assert.equal(lines[0].words[1].kw, true);
  assert.equal(lines[1].words[0].t, 'C');
  assert.equal(lines[1].words[0].s, 1.22);
});

test('resolveKaraokeLines: lines manda; sin entrada lanza', async () => {
  const {resolveKaraokeLines} = await loadCaptions();
  const lines = [{words: [{t: 'X', s: 0, e: 1}]}];
  assert.equal(resolveKaraokeLines(lines, undefined), lines);
  assert.throws(() => resolveKaraokeLines(undefined, undefined), /pasa `lines`/);
});
