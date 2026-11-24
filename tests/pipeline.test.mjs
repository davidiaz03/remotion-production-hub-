import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {existsSync, mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {ROOT} from '../scripts/lib.mjs';

// pipeline.mjs resuelve el proyecto bajo ROOT/projects (sin --root),
// así que el fixture vive en el repo durante el test y se borra en
// finally. Los tests corren con --test-concurrency=1.
const ID = `pipeline-test-${process.pid}`;
const HOME = path.join(ROOT, 'projects', ID);

function fixtureProject() {
	mkdirSync(path.join(HOME, 'out'), {recursive: true});
	writeFileSync(path.join(HOME, 'project.json'), JSON.stringify({
		id: ID, title: 'Pipeline test', compositionId: 'MainReel',
		durationInFrames: 60, fps: 30, width: 1920, height: 1080, crf: 19,
	}));
	writeFileSync(path.join(HOME, 'pipeline.json'), JSON.stringify({
		voice: {manifest: 'vo-manifest.json', seconds: 120},
		captions: {script: 'vo-captions.json'},
		music: {beds: ['calm-documentary-a']},
		mix: {},
		preflight: {enabled: true},
		render: {},
		master: {},
		encode: {},
		qa: {audit: false},
	}));
}

function runPipeline(args) {
	return spawnSync(process.execPath,
		[path.join(ROOT, 'scripts/pipeline.mjs'), ID, ...args],
		{encoding: 'utf8', timeout: 120000});
}

test('pipeline: --dry-run lista los pasos sin ejecutar nada', () => {
	fixtureProject();
	try {
		const r = runPipeline(['--from', 'vo', '--to', 'music', '--dry-run']);
		assert.equal(r.status, 0, r.stderr);
		assert.match(r.stdout, /PIPELINE_OK/);
		assert.match(r.stdout, /vo-batch\.py/);
		assert.match(r.stdout, /merge-vo\.py/);
		assert.match(r.stdout, /transcribe-vo\.py/);
		assert.match(r.stdout, /bed-loop\.py/);
		assert.doesNotMatch(r.stdout, /render-chunks\.mjs/);
	} finally {
		rmSync(HOME, {recursive: true, force: true});
	}
});

test('pipeline: sin pipeline.json falla con mensaje claro', () => {
	mkdirSync(path.join(HOME, 'out'), {recursive: true});
	writeFileSync(path.join(HOME, 'project.json'), JSON.stringify({
		id: ID, title: 'Pipeline test', compositionId: 'MainReel',
		durationInFrames: 60, fps: 30, width: 1920, height: 1080, crf: 19,
	}));
	try {
		const r = runPipeline(['--dry-run']);
		assert.notEqual(r.status, 0);
		assert.match(r.stderr + r.stdout, /pipeline\.json/);
	} finally {
		rmSync(HOME, {recursive: true, force: true});
	}
});

test('pipeline: --estimate imprime la estimación por fase y sale', () => {
	fixtureProject();
	try {
		const r = runPipeline(['--estimate']);
		assert.equal(r.status, 0, r.stderr);
		assert.match(r.stdout, /Estimación del pipeline/);
		assert.match(r.stdout, /vo\s+.*min|vo\s+\d+ s/);
		assert.match(r.stdout, /render/);
		assert.match(r.stdout, /TOTAL:/);
		assert.doesNotMatch(r.stdout, /PIPELINE_OK/);
	} finally {
		rmSync(HOME, {recursive: true, force: true});
	}
});

test('pipeline: --dry-run completo lista los pasos nuevos', () => {
	fixtureProject();
	try {
		const r = runPipeline(['--dry-run']);
		assert.equal(r.status, 0, r.stderr);
		assert.match(r.stdout, /align-captions\.py/);
		assert.match(r.stdout, /build-timeline\.mjs/);
		assert.match(r.stdout, /chapters\.mjs/);
		assert.match(r.stdout, /render-chunks\.mjs/);
		assert.match(r.stdout, /--video-only/);
		assert.match(r.stdout, /--lock/);
		assert.match(r.stdout, /visual-preflight\.py/);
		assert.match(r.stdout, /--manifest/);
		assert.match(r.stdout, /--trailing-silence-max/);
		assert.match(r.stdout, /PIPELINE_OK/);
	} finally {
		rmSync(HOME, {recursive: true, force: true});
	}
});

test('pipeline: fase inválida se rechaza', () => {
	fixtureProject();
	try {
		const r = runPipeline(['--from', 'inventada', '--dry-run']);
		assert.notEqual(r.status, 0);
		assert.match(r.stderr + r.stdout, /fases válidas/);
	} finally {
		rmSync(HOME, {recursive: true, force: true});
	}
});

// --- Agilidad P0 (23-nov-2026, docs/LONGFORM-PIPELINE-P0.md) ---

function writePipelineCfg(cfg) {
	writeFileSync(path.join(HOME, 'pipeline.json'), JSON.stringify(cfg));
}

function baseCfg() {
	return {
		voice: {manifest: 'vo-manifest.json', seconds: 120},
		captions: {script: 'vo-captions.json'},
		music: {beds: ['calm-documentary-a']},
		mix: {},
		preflight: {enabled: true},
		render: {},
		master: {},
		encode: {},
		qa: {audit: false},
	};
}

test('pipeline: --estimate usa las tasas recalibradas (libreto 23-nov)', () => {
	// Fixture: 120 s de VO, sin timeline -> 120*30+90 = 3690 f.
	// render 3690 f * 0,11 s/f = 406 s; pre-vuelo 10 escenas * 12 s;
	// encode 120 s * 1,0x.
	fixtureProject();
	try {
		const r = runPipeline(['--estimate']);
		assert.equal(r.status, 0, r.stderr);
		assert.match(r.stdout, /render\s+6 min 46 s/);
		assert.match(r.stdout, /preflight\s+2 min 00 s/);
		assert.match(r.stdout, /encode\s+2 min 00 s/);
	} finally {
		rmSync(HOME, {recursive: true, force: true});
	}
});

test('pipeline: --max-minutes 0 pausa tras el primer paso (dry-run)', () => {
	fixtureProject();
	try {
		const r = runPipeline(['--from', 'vo', '--to', 'music', '--dry-run', '--max-minutes', '0']);
		assert.equal(r.status, 0, r.stderr);
		assert.match(r.stdout, /PIPELINE_PAUSED/);
		assert.match(r.stdout, /--from merge/);
		assert.doesNotMatch(r.stdout, /PIPELINE_OK/);
	} finally {
		rmSync(HOME, {recursive: true, force: true});
	}
});

test('pipeline: --max-minutes inválido se rechaza', () => {
	fixtureProject();
	try {
		const r = runPipeline(['--dry-run', '--max-minutes', '-3']);
		assert.notEqual(r.status, 0);
		assert.match(r.stderr + r.stdout, /max-minutes/);
	} finally {
		rmSync(HOME, {recursive: true, force: true});
	}
});

test('pipeline: cada corrida real queda en pipeline-runs.jsonl', () => {
	fixtureProject();
	// timeline.json presente y sin script: el paso timeline salta por
	// frescura (rápido, sin ejecutar nada pesado).
	mkdirSync(path.join(HOME, 'src'), {recursive: true});
	writeFileSync(path.join(HOME, 'src', 'timeline.json'), '{}');
	try {
		const r = runPipeline(['--from', 'timeline', '--to', 'timeline']);
		assert.equal(r.status, 0, r.stderr);
		assert.match(r.stdout, /PIPELINE_OK/);
		const logPath = path.join(HOME, 'reports', 'pipeline-runs.jsonl');
		assert.ok(existsSync(logPath), 'falta pipeline-runs.jsonl');
		const lines = readFileSync(logPath, 'utf8').trim().split('\n');
		assert.equal(lines.length, 1);
		const entry = JSON.parse(lines[0]);
		assert.equal(entry.status, 'done');
		assert.deepEqual(entry.range, ['timeline']);
		assert.equal(entry.steps[0].name, 'timeline');
		assert.equal(entry.steps[0].status, 'skipped');
	} finally {
		rmSync(HOME, {recursive: true, force: true});
	}
});

test('pipeline: qa pasa --no-whisper por defecto y audita el 720p', () => {
	fixtureProject();
	const cfg = baseCfg();
	cfg.qa = {audit: true};
	writePipelineCfg(cfg);
	try {
		const r = runPipeline(['--from', 'qa', '--to', 'qa', '--dry-run']);
		assert.equal(r.status, 0, r.stderr);
		assert.match(r.stdout, /--no-whisper/);
		assert.match(r.stdout, /technical-qa-720p\.json/);
		assert.match(r.stdout, /technical-qa-360p\.json/);
	} finally {
		rmSync(HOME, {recursive: true, force: true});
	}
});

test('pipeline: qa.auditWhisper true quita el --no-whisper', () => {
	fixtureProject();
	const cfg = baseCfg();
	cfg.qa = {audit: true, auditWhisper: true};
	writePipelineCfg(cfg);
	try {
		const r = runPipeline(['--from', 'qa', '--to', 'qa', '--dry-run']);
		assert.equal(r.status, 0, r.stderr);
		assert.doesNotMatch(r.stdout, /--no-whisper/);
	} finally {
		rmSync(HOME, {recursive: true, force: true});
	}
});

test('pipeline: captions.transcript pasa --transcript a transcribe-vo.py', () => {
	fixtureProject();
	const cfg = baseCfg();
	cfg.captions = {script: 'vo-captions.json', transcript: 'research/vo/vo-edited-transcript.json'};
	writePipelineCfg(cfg);
	try {
		const r = runPipeline(['--from', 'captions', '--to', 'captions', '--dry-run']);
		assert.equal(r.status, 0, r.stderr);
		assert.match(r.stdout, /--transcript/);
		assert.match(r.stdout, /vo-edited-transcript\.json/);
	} finally {
		rmSync(HOME, {recursive: true, force: true});
	}
});

test('pipeline: preflight.incremental pasa --incremental al pre-vuelo', () => {
	fixtureProject();
	const cfg = baseCfg();
	cfg.preflight = {enabled: true, incremental: true};
	writePipelineCfg(cfg);
	try {
		const r = runPipeline(['--from', 'preflight', '--to', 'preflight', '--dry-run']);
		assert.equal(r.status, 0, r.stderr);
		assert.match(r.stdout, /--incremental/);
	} finally {
		rmSync(HOME, {recursive: true, force: true});
	}
});
