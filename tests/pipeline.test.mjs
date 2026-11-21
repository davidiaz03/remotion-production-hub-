import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdirSync, rmSync, writeFileSync} from 'node:fs';
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
