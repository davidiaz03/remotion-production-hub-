import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {existsSync,mkdtempSync,readFileSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {ROOT} from '../scripts/lib.mjs';

// mix.py solo usa la stdlib de Python + ffmpeg/ffprobe, así que vale
// el python3 del sistema; HUB_PY (activate.sh) lo anula si está definido.
const PYTHON = process.env.HUB_PY || 'python3';
const MIX = path.join(ROOT, 'scripts/audio/mix.py');

function available(t) {
  for (const [bin, args] of [[PYTHON, ['--version']], ['ffmpeg', ['-version']], ['ffprobe', ['-version']]]) {
    const r = spawnSync(bin, args, {encoding: 'utf8'});
    if (r.error || r.status !== 0) t.skip(`falta ${bin} en el entorno`);
  }
}

function genTone(dir, name, freq) {
  const out = path.join(dir, name);
  const r = spawnSync('ffmpeg', ['-y', '-hide_banner', '-v', 'error', '-f', 'lavfi',
    '-i', `sine=frequency=${freq}:sample_rate=48000`, '-t', '3', out], {encoding: 'utf8'});
  assert.equal(r.status, 0, r.stderr);
  return out;
}

function genSilence(dir, name) {
  const out = path.join(dir, name);
  const r = spawnSync('ffmpeg', ['-y', '-hide_banner', '-v', 'error', '-f', 'lavfi',
    '-i', 'anullsrc=r=48000:cl=stereo', '-t', '3', out], {encoding: 'utf8'});
  assert.equal(r.status, 0, r.stderr);
  return out;
}

function runMix(dir, voice, music) {
  const out = path.join(dir, 'mix.wav');
  const report = path.join(dir, 'mix.json');
  const r = spawnSync(PYTHON, [MIX, '--voice', voice, '--music', music,
    '--seconds', '3', '--out', out, '--report', report],
    {encoding: 'utf8', timeout: 120000});
  return {r, out, report};
}

test('mezcla silenciosa: WAV válido + informe con silent=true (no RuntimeError)', (t) => {
  available(t);
  const dir = mkdtempSync(path.join(os.tmpdir(), 'mix-sil-'));
  try {
    const voice = genSilence(dir, 'vo.wav');
    const music = genSilence(dir, 'music.wav');
    const {r, out, report} = runMix(dir, voice, music);
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stderr, /silencio digital/);
    assert.ok(existsSync(out), 'el WAV de salida debe existir');
    const j = JSON.parse(readFileSync(report, 'utf8'));
    assert.equal(j.status, 'PASS_SILENT');
    assert.equal(j.silent, true);
    assert.equal(j.integrated_lufs, null);
    assert.equal(j.true_peak_dbtp, null);
    assert.ok(Math.abs(j.duration_observed - 3) < 0.05, `duración ${j.duration_observed}`);
  } finally {
    rmSync(dir, {recursive: true, force: true});
  }
});

test('mezcla con tono: no regresión (PASS_REAL con LUFS medidos)', (t) => {
  available(t);
  const dir = mkdtempSync(path.join(os.tmpdir(), 'mix-tone-'));
  try {
    const voice = genTone(dir, 'vo.wav', 440);
    const music = genTone(dir, 'music.wav', 220);
    const {r, out, report} = runMix(dir, voice, music);
    assert.equal(r.status, 0, r.stderr);
    assert.ok(existsSync(out), 'el WAV de salida debe existir');
    const j = JSON.parse(readFileSync(report, 'utf8'));
    assert.equal(j.status, 'PASS_REAL');
    assert.equal(j.silent, false);
    assert.equal(typeof j.integrated_lufs, 'number');
    assert.equal(typeof j.true_peak_dbtp, 'number');
    assert.ok(Math.abs(j.duration_observed - 3) < 0.05, `duración ${j.duration_observed}`);
  } finally {
    rmSync(dir, {recursive: true, force: true});
  }
});
