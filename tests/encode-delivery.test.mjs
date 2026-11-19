import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {existsSync, mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {ROOT} from '../scripts/lib.mjs';

// encode-delivery.mjs resuelve el proyecto bajo ROOT/projects (sin
// --root), así que el fixture vive en el repo durante el test y se
// borra en finally. Los tests corren con --test-concurrency=1.
const ID = `encode-test-${process.pid}`;
const HOME = path.join(ROOT, 'projects', ID);

function fixtureProject() {
	mkdirSync(path.join(HOME, 'out'), {recursive: true});
	writeFileSync(path.join(HOME, 'project.json'), JSON.stringify({
		id: ID, title: 'Encode test', compositionId: 'MainReel',
		durationInFrames: 60, fps: 30, width: 1920, height: 1080, crf: 19,
	}));
	const master = path.join(HOME, 'out', `${ID}-MASTER.mp4`);
	const g = spawnSync('ffmpeg', ['-y', '-hide_banner', '-v', 'error',
		'-f', 'lavfi', '-i', 'testsrc2=size=1920x1080:rate=30:duration=2',
		'-f', 'lavfi', '-i', 'sine=frequency=440:duration=2',
		'-c:v', 'libx264', '-crf', '19', '-pix_fmt', 'yuv420p',
		'-c:a', 'aac', '-shortest', master], {encoding: 'utf8'});
	assert.equal(g.status, 0, g.stderr);
	return master;
}

function runEncode(args) {
	return spawnSync(process.execPath,
		[path.join(ROOT, 'scripts/encode-delivery.mjs'), ID, ...args],
		{encoding: 'utf8', timeout: 300000});
}

function probe(file) {
	const r = spawnSync('ffprobe', ['-v', 'error', '-show_entries',
		'stream=codec_type,width,height', '-show_entries', 'format=duration',
		'-of', 'json', file], {encoding: 'utf8'});
	assert.equal(r.status, 0, r.stderr);
	return JSON.parse(r.stdout);
}

test('encode-delivery: genera 720p y 360p horizontales en CRF y las verifica', () => {
	fixtureProject();
	try {
		const master = path.join(HOME, 'out', `${ID}-MASTER.mp4`);
		const r = runEncode(['--master', master, '--preset', 'veryfast']);
		assert.equal(r.status, 0, r.stderr);
		assert.match(r.stdout, /ENCODE_DELIVERY_OK/);
		const p720 = probe(path.join(HOME, 'out', `${ID}-720p.mp4`));
		const v720 = p720.streams.find((s) => s.codec_type === 'video');
		assert.equal(v720.width, 1280);
		assert.equal(v720.height, 720);
		const p360 = probe(path.join(HOME, 'out', `${ID}-360p.mp4`));
		const v360 = p360.streams.find((s) => s.codec_type === 'video');
		assert.equal(v360.width, 640);
		assert.equal(v360.height, 360);
		assert.ok(p360.streams.some((s) => s.codec_type === 'audio'), 'la 360p conserva el audio');
		const report = JSON.parse(readFileSync(path.join(HOME, 'out', `${ID}-delivery.json`), 'utf8'));
		assert.equal(report.outputs.length, 2);
		// Segunda pasada sin --force: salta ambas (reanudación).
		const r2 = runEncode(['--master', master, '--preset', 'veryfast']);
		assert.equal(r2.status, 0, r2.stderr);
		assert.match(r2.stdout, /ya existe — salto/);
	} finally {
		rmSync(HOME, {recursive: true, force: true});
	}
});

test('encode-delivery: --360p solo genera la 360p', () => {
	fixtureProject();
	try {
		const master = path.join(HOME, 'out', `${ID}-MASTER.mp4`);
		const r = runEncode(['--master', master, '--360p', '--preset', 'veryfast']);
		assert.equal(r.status, 0, r.stderr);
		assert.ok(existsSync(path.join(HOME, 'out', `${ID}-360p.mp4`)));
		assert.ok(!existsSync(path.join(HOME, 'out', `${ID}-720p.mp4`)));
	} finally {
		rmSync(HOME, {recursive: true, force: true});
	}
});
