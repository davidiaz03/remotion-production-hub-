import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {existsSync, mkdtempSync, rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {ROOT} from '../scripts/lib.mjs';

// bed-loop.py necesita numpy: vale el venv del hub (o HUB_PY).
const PYTHON = process.env.HUB_PY || path.join(ROOT, '..', '.venv/bin/python');
const BED_LOOP = path.join(ROOT, 'scripts/audio/bed-loop.py');

function available(t) {
	for (const [bin, args] of [
		[PYTHON, ['-c', 'import numpy']],
		['ffmpeg', ['-version']],
		['ffprobe', ['-version']],
	]) {
		const r = spawnSync(bin, args, {encoding: 'utf8'});
		if (r.error || r.status !== 0) t.skip(`falta ${bin} (o numpy) en el entorno`);
	}
}

function genBed(dir) {
	// Cama de prueba: 3 s de seno 220 Hz + ruido suave (estéreo no: mono).
	const out = path.join(dir, 'bed.wav');
	const r = spawnSync('ffmpeg', ['-y', '-hide_banner', '-v', 'error',
		'-f', 'lavfi', '-i', 'sine=frequency=220:duration=3',
		'-af', 'volume=0.5', '-ar', '32000', '-ac', '1', out],
	{encoding: 'utf8'});
	assert.equal(r.status, 0, r.stderr);
	return out;
}

function probeWav(file) {
	const r = spawnSync('ffprobe', ['-v', 'error', '-show_entries',
		'stream=sample_rate,channels', '-show_entries', 'format=duration',
		'-of', 'json', file], {encoding: 'utf8'});
	assert.equal(r.status, 0, r.stderr);
	return JSON.parse(r.stdout);
}

test('bed-loop: buclea una cama a la duración pedida, 48 kHz mono, a -16 LUFS', (t) => {
	available(t);
	const dir = mkdtempSync(path.join(os.tmpdir(), 'bed-loop-'));
	try {
		const bed = genBed(dir);
		const out = path.join(dir, 'loop.wav');
		const r = spawnSync(PYTHON, [BED_LOOP, '--bed', bed,
			'--seconds', '7', '--xfade', '0.5', '--out', out],
		{encoding: 'utf8', timeout: 120000});
		assert.equal(r.status, 0, r.stderr);
		assert.match(r.stdout, /OK .*loop.wav/);
		const pr = probeWav(out);
		assert.equal(Number(pr.format.duration), 7);
		assert.equal(pr.streams[0].sample_rate, '48000');
		assert.equal(pr.streams[0].channels, 1);
		// Sonoridad medida del bucle: -16 LUFS ±1.
		const loud = spawnSync('ffmpeg', ['-v', 'info', '-i', out, '-af',
			'loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'],
		{encoding: 'utf8'});
		const m = loud.stderr.match(/"input_i"\s*:\s*"([-+\d.]+)"/);
		assert.ok(m, 'loudnorm debe medir input_i');
		assert.ok(Math.abs(Number(m[1]) - -16) < 1.0, `LUFS ${m[1]} fuera de -16 ±1`);
	} finally {
		rmSync(dir, {recursive: true, force: true});
	}
});

test('bed-loop: sin cama válida falla con mensaje claro', (t) => {
	available(t);
	const dir = mkdtempSync(path.join(os.tmpdir(), 'bed-loop-err-'));
	try {
		const r = spawnSync(PYTHON, [BED_LOOP, '--bed', 'cama-inexistente',
			'--seconds', '7', '--out', path.join(dir, 'x.wav')],
		{encoding: 'utf8', timeout: 60000});
		assert.notEqual(r.status, 0);
		assert.match(r.stderr + r.stdout, /cama no encontrada/);
	} finally {
		rmSync(dir, {recursive: true, force: true});
	}
});
