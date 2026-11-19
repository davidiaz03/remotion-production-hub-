import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {existsSync, mkdtempSync, readFileSync, rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {ROOT} from '../scripts/lib.mjs';

// master.py solo usa la stdlib de Python + ffmpeg/ffprobe, así que vale
// el python3 del sistema; HUB_PY (activate.sh) lo anula si está definido.
const PYTHON = process.env.HUB_PY || 'python3';
const MASTER = path.join(ROOT, 'scripts/audio/master.py');

function available(t) {
	for (const [bin, args] of [
		[PYTHON, ['--version']],
		['ffmpeg', ['-version']],
		['ffprobe', ['-version']],
	]) {
		const r = spawnSync(bin, args, {encoding: 'utf8'});
		if (r.error || r.status !== 0) t.skip(`falta ${bin} en el entorno`);
	}
}

function genVideo(dir, name, withAudio) {
	const out = path.join(dir, name);
	const args = [
		'-y',
		'-hide_banner',
		'-v',
		'error',
		'-f',
		'lavfi',
		'-i',
		'testsrc2=size=1080x1920:rate=30:duration=1',
	];
	if (withAudio) {
		args.push('-f', 'lavfi', '-i', 'sine=frequency=440:duration=1');
	}
	args.push('-c:v', 'libx264', '-crf', '19', '-pix_fmt', 'yuv420p');
	if (withAudio) args.push('-c:a', 'aac', '-shortest');
	args.push(out);
	const r = spawnSync('ffmpeg', args, {encoding: 'utf8'});
	assert.equal(r.status, 0, r.stderr);
	return out;
}

function runMaster(dir, input) {
	const master = path.join(dir, 'master.mp4');
	const light = path.join(dir, 'light.mp4');
	const r = spawnSync(
		PYTHON,
		[
			MASTER,
			'--input',
			input,
			'--out-master',
			master,
			'--out-light',
			light,
			'--no-trim',
			'--no-boost',
		],
		{encoding: 'utf8', timeout: 180000},
	);
	return {r, master, light, report: `${master}.json`};
}

test('master: proyecto mudo escribe máster + ligera + informe con audio absent (sin crash en ebur128)', (t) => {
	available(t);
	const dir = mkdtempSync(path.join(os.tmpdir(), 'master-mute-'));
	try {
		const input = genVideo(dir, 'mute.mp4', false);
		const {r, master, light, report} = runMaster(dir, input);
		assert.equal(r.status, 0, r.stderr);
		assert.ok(existsSync(master), 'el máster debe existir');
		assert.ok(existsSync(light), 'la ligera debe existir');
		assert.ok(existsSync(report), 'el informe JSON debe existir');
		const j = JSON.parse(readFileSync(report, 'utf8'));
		assert.equal(j.audio, 'absent');
		assert.equal(j.master.has_audio, false);
		assert.equal(j.master.integrated_lufs, null);
		assert.equal(j.master.true_peak_dbtp, null);
		assert.equal(j.light.has_audio, false);
		assert.equal(j.master.frames, 30);
	} finally {
		rmSync(dir, {recursive: true, force: true});
	}
});

test('master: proyecto con audio mide LUFS/TP como antes (regresión)', (t) => {
	available(t);
	const dir = mkdtempSync(path.join(os.tmpdir(), 'master-aud-'));
	try {
		const input = genVideo(dir, 'audio.mp4', true);
		const {r, report} = runMaster(dir, input);
		assert.equal(r.status, 0, r.stderr);
		const j = JSON.parse(readFileSync(report, 'utf8'));
		assert.equal(j.audio, 'present');
		assert.equal(j.master.has_audio, true);
		assert.equal(typeof j.master.integrated_lufs, 'number');
		assert.equal(typeof j.master.true_peak_dbtp, 'number');
	} finally {
		rmSync(dir, {recursive: true, force: true});
	}
});

test('master: proyecto horizontal produce ligera 720x405 (aspecto auto) y --no-light la omite', (t) => {
	available(t);
	const dir = mkdtempSync(path.join(os.tmpdir(), 'master-horiz-'));
	try {
		// Entrada horizontal 1920x1080 con audio.
		const input = path.join(dir, 'horiz.mp4');
		const g = spawnSync('ffmpeg', ['-y', '-hide_banner', '-v', 'error',
			'-f', 'lavfi', '-i', 'testsrc2=size=1920x1080:rate=30:duration=1',
			'-f', 'lavfi', '-i', 'sine=frequency=440:duration=1',
			'-c:v', 'libx264', '-crf', '19', '-pix_fmt', 'yuv420p',
			'-c:a', 'aac', '-shortest', input], {encoding: 'utf8'});
		assert.equal(g.status, 0, g.stderr);
		const master = path.join(dir, 'master.mp4');
		const light = path.join(dir, 'light.mp4');
		const r = spawnSync(PYTHON, [MASTER, '--input', input,
			'--out-master', master, '--out-light', light,
			'--no-trim', '--no-boost'], {encoding: 'utf8', timeout: 180000});
		assert.equal(r.status, 0, r.stderr);
		const j = JSON.parse(readFileSync(`${master}.json`, 'utf8'));
		assert.equal(j.light.width, 720);
		assert.equal(j.light.height, 404);
		// --no-light: sin ligera y sin error por falta de --out-light.
		const master2 = path.join(dir, 'master2.mp4');
		const r2 = spawnSync(PYTHON, [MASTER, '--input', input,
			'--out-master', master2, '--no-light',
			'--no-trim', '--no-boost'], {encoding: 'utf8', timeout: 180000});
		assert.equal(r2.status, 0, r2.stderr);
		const j2 = JSON.parse(readFileSync(`${master2}.json`, 'utf8'));
		assert.equal(j2.light, null);
		assert.equal(j2.master.width, 1920);
	} finally {
		rmSync(dir, {recursive: true, force: true});
	}
});
