import {test, before, after} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync, mkdirSync, readFileSync, rmSync, statSync, utimesSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const REEL = path.join(ROOT, 'scripts/reel.mjs');
const STEPS = ['audio', 'mix', 'audit-inputs', 'pre-audit', 'preflight', 'render', 'master', 'qa', 'ghost', 'audit', 'deliver'];

function reel(args) {
	return spawnSync(process.execPath, [REEL, ...args], {cwd: ROOT, encoding: 'utf8'});
}

test('dry-run sobre negacion-embargo lista los 11 pasos sin ejecutar nada', () => {
	const progress = path.join(ROOT, 'projects/negacion-embargo/reports/reel-progress.json');
	const before = existsSync(progress) ? statSync(progress).mtimeMs : null;
	const r = reel(['negacion-embargo', '--tag', 'vTEST', '--dry-run']);
	assert.equal(r.status, 0, r.stderr);
	for (const s of STEPS) assert.match(r.stdout, new RegExp(s), `falta el paso ${s}`);
	assert.match(r.stdout, /TOTAL:/);
	assert.match(r.stdout, /dry-run: no se ejecuta nada/);
	// El dry-run no escribe informes.
	const after = existsSync(progress) ? statSync(progress).mtimeMs : null;
	assert.equal(after, before);
});

test('--estimate imprime la estimación y sale sin ejecutar', () => {
	const r = reel(['negacion-embargo', '--tag', 'vTEST', '--estimate']);
	assert.equal(r.status, 0, r.stderr);
	assert.match(r.stdout, /Estimación del reel/);
	assert.match(r.stdout, /TOTAL:/);
	assert.doesNotMatch(r.stdout, /REEL_OK/);
});

test('validación de rango y de --tag', () => {
	// Rango vacío (--from después de --to).
	let r = reel(['negacion-embargo', '--tag', 'vTEST', '--from', 'master', '--to', 'audio']);
	assert.notEqual(r.status, 0);
	assert.match(r.stderr + r.stdout, /Rango vacío/);
	// Paso inexistente.
	r = reel(['negacion-embargo', '--tag', 'vTEST', '--from', 'foo']);
	assert.notEqual(r.status, 0);
	assert.match(r.stderr + r.stdout, /pasos válidos/);
	// Sin --tag cuando el rango incluye pasos con tag.
	r = reel(['negacion-embargo', '--to', 'master']);
	assert.notEqual(r.status, 0);
	assert.match(r.stderr + r.stdout, /--tag vN es obligatorio/);
	// Sin --tag hasta pre-audit sí vale (ningún nombre lleva tag).
	r = reel(['negacion-embargo', '--to', 'pre-audit', '--dry-run']);
	assert.equal(r.status, 0, r.stderr);
});

// --- Proyecto sintético para la frescura E2E ---
// Los scripts de audio son ficticios (escriben archivos vacíos): el
// orquestador solo comprueba frescura por mtime, no contenido.
const TMP_ID = `reel-orch-test-tmp-${process.pid}`;
const TMP_HOME = path.join(ROOT, 'projects', TMP_ID);

function writeTmpProject() {
	mkdirSync(path.join(TMP_HOME, 'scripts'), {recursive: true});
	mkdirSync(path.join(TMP_HOME, 'src'), {recursive: true});
	writeFileSync(path.join(TMP_HOME, 'project.json'), JSON.stringify({
		id: TMP_ID, durationInFrames: 300, fps: 30, width: 720, height: 1280,
	}, null, 2));
	writeFileSync(path.join(TMP_HOME, 'reel.json'), JSON.stringify({
		project: TMP_ID,
		audio: {
			buildScript: 'scripts/build-audio.sh',
			stems: ['public/audio/voice-placed.wav', 'public/audio/music-bed.wav'],
			inputs: ['src/input.txt'],
			mixScript: 'scripts/run-mix.py',
			mix: 'public/audio/mix.wav',
			auditInputs: [],
			auditInputsScript: 'scripts/build-audit-inputs.py',
			auditScript: 'scripts/run-audit.py',
		},
		preflight: {manifest: 'preflight-scenes.json'},
		render: {concatOut: 'out/chunks.mkv'},
		ghost: {enabled: true},
		deliver: {drive: false, museStorage: false},
	}, null, 2));
	writeFileSync(path.join(TMP_HOME, 'src/input.txt'), 'fuente\n');
	writeFileSync(path.join(TMP_HOME, 'scripts/build-audio.sh'),
		'#!/bin/bash\nmkdir -p public/audio\ntouch public/audio/voice-placed.wav public/audio/music-bed.wav\n');
	writeFileSync(path.join(TMP_HOME, 'scripts/run-mix.py'),
		'import os\nos.makedirs("public/audio", exist_ok=True)\nopen("public/audio/mix.wav", "w").close()\n');
}

before(() => {
	rmSync(TMP_HOME, {recursive: true, force: true});
	writeTmpProject();
});

after(() => {
	rmSync(TMP_HOME, {recursive: true, force: true});
});

test('frescura: ejecuta, salta, re-ejecuta al cambiar una entrada, --force rehace', () => {
	// 1ª corrida: ejecuta audio + mix.
	let r = reel([TMP_ID, '--to', 'mix']);
	assert.equal(r.status, 0, r.stderr + r.stdout);
	assert.match(r.stdout, /audio: OK/);
	assert.match(r.stdout, /mix: OK/);
	assert.equal(existsSync(path.join(TMP_HOME, 'public/audio/mix.wav')), true);
	assert.match(r.stdout, /REEL_OK/);
	// 2ª corrida: ambos saltan por frescura.
	r = reel([TMP_ID, '--to', 'mix']);
	assert.equal(r.status, 0, r.stderr + r.stdout);
	assert.match(r.stdout, /audio: salto/);
	assert.match(r.stdout, /mix: salto/);
	// Tocar la entrada: audio se re-ejecuta (y mix, porque los stems
	// quedan más recientes que la mezcla).
	const later = new Date(Date.now() + 5000);
	utimesSync(path.join(TMP_HOME, 'src/input.txt'), later, later);
	r = reel([TMP_ID, '--to', 'mix']);
	assert.equal(r.status, 0, r.stderr + r.stdout);
	assert.match(r.stdout, /audio: OK/);
	assert.match(r.stdout, /mix: OK/);
	// --force rehace aunque todo esté fresco.
	r = reel([TMP_ID, '--to', 'mix', '--force']);
	assert.equal(r.status, 0, r.stderr + r.stdout);
	assert.match(r.stdout, /audio: OK/);
	assert.match(r.stdout, /mix: OK/);
});

test('ghost: --skip-ghost escribe marcador, la 2ª vez salta, sin flag intenta correr', () => {
	mkdirSync(path.join(TMP_HOME, 'out'), {recursive: true});
	writeFileSync(path.join(TMP_HOME, 'out/MASTER-vT.mp4'), '');
	writeFileSync(path.join(TMP_HOME, 'preflight-scenes.json'), JSON.stringify({
		project: TMP_ID, fps: 30,
		scenes: [{name: 'A', start: 0, end: 149}, {name: 'B', start: 150, end: 299}],
	}));
	// Con --skip-ghost: escribe el marcador de omitido.
	let r = reel([TMP_ID, '--from', 'ghost', '--to', 'ghost', '--tag', 'vT', '--skip-ghost']);
	assert.equal(r.status, 0, r.stderr + r.stdout);
	const marker = JSON.parse(readFileSync(path.join(TMP_HOME, 'reports/ghost-frames.json'), 'utf8'));
	assert.equal(marker.skipped, true);
	// 2ª vez con --skip-ghost: salta por frescura.
	r = reel([TMP_ID, '--from', 'ghost', '--to', 'ghost', '--tag', 'vT', '--skip-ghost']);
	assert.equal(r.status, 0, r.stderr + r.stdout);
	assert.match(r.stdout, /ghost: salto/);
	// Sin --skip-ghost: el marcador de omitido NO vale y el paso
	// intenta correr ghost-frames.py, que falla sobre el máster vacío.
	r = reel([TMP_ID, '--from', 'ghost', '--to', 'ghost', '--tag', 'vT']);
	assert.notEqual(r.status, 0);
	assert.match(r.stdout + r.stderr, /REEL_FAILED paso=ghost/);
});

test('deliver sin --deliver escribe marcador de omitido y no sube nada', () => {
	mkdirSync(path.join(TMP_HOME, 'out'), {recursive: true});
	mkdirSync(path.join(TMP_HOME, 'research/audit-vT'), {recursive: true});
	writeFileSync(path.join(TMP_HOME, 'out/MASTER-vT.mp4'), '');
	writeFileSync(path.join(TMP_HOME, 'out/LIGERA-vT.mp4'), '');
	writeFileSync(path.join(TMP_HOME, 'research/audit-vT/audio-audit-vT.json'), '{}');
	let r = reel([TMP_ID, '--from', 'deliver', '--to', 'deliver', '--tag', 'vT']);
	assert.equal(r.status, 0, r.stderr + r.stdout);
	assert.match(r.stdout, /deliver: omitido/);
	const marker = JSON.parse(readFileSync(path.join(TMP_HOME, 'reports/delivery-vT.json'), 'utf8'));
	assert.equal(marker.skipped, true);
	// 2ª vez sin --deliver: salta por frescura.
	r = reel([TMP_ID, '--from', 'deliver', '--to', 'deliver', '--tag', 'vT']);
	assert.equal(r.status, 0, r.stderr + r.stdout);
	assert.match(r.stdout, /deliver: salto/);
	// Con --deliver y drive/museStorage desactivados en reel.json:
	// el marcador de omitido NO vale y el paso escribe el informe
	// real (sin subir nada, porque ambos destinos están apagados).
	r = reel([TMP_ID, '--from', 'deliver', '--to', 'deliver', '--tag', 'vT', '--deliver']);
	assert.equal(r.status, 0, r.stderr + r.stdout);
	const real = JSON.parse(readFileSync(path.join(TMP_HOME, 'reports/delivery-vT.json'), 'utf8'));
	assert.equal(real.skipped, undefined);
	assert.equal(real.tag, 'vT');
});
