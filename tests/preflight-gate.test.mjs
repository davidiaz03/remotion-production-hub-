import {test} from 'node:test';
import assert from 'node:assert/strict';
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	utimesSync,
	writeFileSync,
} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {
	checkPreflightGate,
	defaultReportPath,
	newestLayoutInput,
} from '../scripts/preflight-gate.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Proyecto falso en /tmp con entradas de layout controladas. Todas
// las mtimes se fijan explícitamente (utimesSync) para que la
// frescura sea determinista y no dependa del reloj.
const T_LAYOUT = new Date('2026-11-21T05:00:00.000Z');
const T_FRESH = new Date('2026-11-21T06:00:00.000Z');
const T_STALE = new Date('2026-11-21T04:00:00.000Z');

function fixture() {
	const home = mkdtempSync(path.join(tmpdir(), 'hub-gate-'));
	mkdirSync(path.join(home, 'src'), {recursive: true});
	mkdirSync(path.join(home, 'public'), {recursive: true});
	mkdirSync(path.join(home, 'out'), {recursive: true});
	writeFileSync(path.join(home, 'src', 'Video.tsx'), 'export {};\n');
	writeFileSync(
		path.join(home, 'src', 'captions-v1.ts'),
		'export const CAPTIONS = [];\n',
	);
	writeFileSync(
		path.join(home, 'project.json'),
		JSON.stringify({id: 'gate-proj', compositionId: 'MainReel'}),
	);
	writeFileSync(path.join(home, 'public', 'img.png'), 'fake-png');
	writeFileSync(path.join(home, 'public', 'vo.wav'), 'fake-wav');
	for (const f of [
		'src/Video.tsx',
		'src/captions-v1.ts',
		'project.json',
		'public/img.png',
		'public/vo.wav',
	]) {
		utimesSync(path.join(home, f), T_LAYOUT, T_LAYOUT);
	}
	return home;
}

function writeReport(home, report, {mtime = T_FRESH} = {}) {
	const p = defaultReportPath(home);
	writeFileSync(p, JSON.stringify(report, null, 2) + '\n');
	utimesSync(p, mtime, mtime);
	return p;
}

const baseReport = (over = {}) => ({
	reportVersion: 1,
	project: 'gate-proj',
	composition: 'MainReel',
	generatedAt: T_FRESH.toISOString(),
	frames: 3,
	scenes: 1,
	flagged_frames: 0,
	blocking_frames: 0,
	results: [],
	...over,
});

const gateArgs = (home, over = {}) => ({
	home,
	projectId: 'gate-proj',
	compositionId: 'MainReel',
	...over,
});

test('puerta: sin informe bloquea (missing)', () => {
	const home = fixture();
	try {
		const g = checkPreflightGate(gateArgs(home));
		assert.equal(g.ok, false);
		assert.equal(g.reason, 'missing');
		assert.match(g.detail, /sin informe de pre-vuelo/);
	} finally {
		rmSync(home, {recursive: true, force: true});
	}
});

test('puerta: informe ilegible o sin results[] bloquea (invalid)', () => {
	const home = fixture();
	try {
		writeFileSync(defaultReportPath(home), 'esto no es json{');
		assert.equal(checkPreflightGate(gateArgs(home)).reason, 'invalid');
		writeReport(home, {project: 'gate-proj'});
		assert.equal(checkPreflightGate(gateArgs(home)).reason, 'invalid');
	} finally {
		rmSync(home, {recursive: true, force: true});
	}
});

test('puerta: informe de otro proyecto o composición bloquea', () => {
	const home = fixture();
	try {
		writeReport(home, baseReport({project: 'otro-proyecto'}));
		assert.equal(
			checkPreflightGate(gateArgs(home)).reason,
			'wrong-project',
		);
		writeReport(home, baseReport({composition: 'OtraComposicion'}));
		assert.equal(
			checkPreflightGate(gateArgs(home)).reason,
			'wrong-composition',
		);
		// Sin proyecto/composición declarados (informes viejos): no se
		// puede comprobar la identidad, pero tampoco se bloquea por eso.
		writeReport(home, baseReport({project: undefined, composition: undefined}));
		assert.equal(checkPreflightGate(gateArgs(home)).ok, true);
	} finally {
		rmSync(home, {recursive: true, force: true});
	}
});

test('puerta: bloqueantes (campo o flag legacy) bloquean', () => {
	const home = fixture();
	try {
		writeReport(home, baseReport({blocking_frames: 1, flagged_frames: 1}));
		assert.equal(checkPreflightGate(gateArgs(home)).reason, 'blocking');
		const legacy = baseReport();
		delete legacy.blocking_frames;
		delete legacy.flagged_frames;
		legacy.results = [
			{
				frame: 'S1.jpg',
				scene: 'S1',
				flags: [{check: 'logo-missing', severity: 'BLOCK', detail: 'x'}],
				metrics: {},
			},
		];
		writeReport(home, legacy);
		assert.equal(checkPreflightGate(gateArgs(home)).reason, 'blocking');
	} finally {
		rmSync(home, {recursive: true, force: true});
	}
});

test('puerta: informe fresco pasa; cambio de layout lo caduca (stale)', () => {
	const home = fixture();
	try {
		writeReport(home, baseReport());
		const fresh = checkPreflightGate(gateArgs(home));
		assert.equal(fresh.ok, true);
		assert.equal(fresh.reason, 'ok');
		assert.match(fresh.detail, /pre-vuelo PASS/);
		// Tocar el código después del pre-vuelo caduca la puerta.
		utimesSync(
			path.join(home, 'src', 'Video.tsx'),
			T_FRESH,
			new Date(T_FRESH.getTime() + 1000),
		);
		const stale = checkPreflightGate(gateArgs(home));
		assert.equal(stale.ok, false);
		assert.equal(stale.reason, 'stale');
		assert.match(stale.detail, /Video\.tsx/);
	} finally {
		rmSync(home, {recursive: true, force: true});
	}
});

test('puerta: cambiar solo captions o solo audio NO caduca la puerta', () => {
	const home = fixture();
	try {
		writeReport(home, baseReport());
		const after = new Date(T_FRESH.getTime() + 60_000);
		utimesSync(path.join(home, 'src', 'captions-v1.ts'), after, after);
		utimesSync(path.join(home, 'public', 'vo.wav'), after, after);
		assert.equal(checkPreflightGate(gateArgs(home)).ok, true);
		// Pero una imagen de public/ sí caduca (cambia píxeles).
		utimesSync(path.join(home, 'public', 'img.png'), after, after);
		assert.equal(checkPreflightGate(gateArgs(home)).reason, 'stale');
	} finally {
		rmSync(home, {recursive: true, force: true});
	}
});

test('puerta: generatedAt manda sobre la mtime del archivo', () => {
	const home = fixture();
	try {
		// Archivo copiado (mtime nueva) con generatedAt viejo: miente
		// por mtime, pero la puerta usa generatedAt y bloquea.
		writeReport(home, baseReport({generatedAt: T_STALE.toISOString()}), {
			mtime: new Date(T_FRESH.getTime() + 60_000),
		});
		assert.equal(checkPreflightGate(gateArgs(home)).reason, 'stale');
	} finally {
		rmSync(home, {recursive: true, force: true});
	}
});

test('puerta: newestLayoutInput ignora captions y audios', () => {
	const home = fixture();
	try {
		const after = new Date(T_FRESH.getTime() + 60_000);
		utimesSync(path.join(home, 'src', 'captions-v1.ts'), after, after);
		utimesSync(path.join(home, 'public', 'vo.wav'), after, after);
		const newest = newestLayoutInput(home);
		assert.ok(newest);
		// La entrada más reciente sigue siendo de T_LAYOUT (o shared/,
		// más viejo aún): ni captions ni audio cuentan.
		assert.ok(newest.mtimeMs <= T_LAYOUT.getTime());
	} finally {
		rmSync(home, {recursive: true, force: true});
	}
});

// --- Integración con render-chunks.mjs (sin renderizar nada) --------

function makeRepoProject() {
	const home = path.join(ROOT, 'projects', 'gate-test-tmp');
	rmSync(home, {recursive: true, force: true});
	mkdirSync(path.join(home, 'src'), {recursive: true});
	mkdirSync(path.join(home, 'public'), {recursive: true});
	writeFileSync(
		path.join(home, 'project.json'),
		JSON.stringify({
			id: 'gate-test-tmp',
			title: 'GATE TEST (temporal)',
			compositionId: 'MainReel',
			fps: 30,
			width: 1080,
			height: 1920,
			durationInFrames: 90,
			audioRequired: false,
			crf: 19,
		}),
	);
	writeFileSync(path.join(home, 'src', 'Video.tsx'), 'export {};\n');
	writeFileSync(path.join(home, 'public', '.gitkeep'), '');
	return home;
}

function runRenderChunks(...args) {
	return spawnSync(
		process.execPath,
		[path.join(ROOT, 'scripts', 'render-chunks.mjs'), ...args],
		{cwd: ROOT, encoding: 'utf8', timeout: 30000},
	);
}

test('render-chunks: sin informe se niega con código 2 antes de renderizar', () => {
	const home = makeRepoProject();
	try {
		const r = runRenderChunks('gate-test-tmp');
		assert.equal(r.status, 2);
		assert.match(r.stderr, /RENDER BLOQUEADO \(missing\)/);
		assert.match(r.stderr, /visual-preflight\.py --stills/);
		assert.match(r.stderr, /--skip-preflight/);
		assert.equal(existsSync(path.join(home, 'out')), false);
	} finally {
		rmSync(home, {recursive: true, force: true});
	}
});

test('render-chunks: con informe PASS y fresco pasa la puerta (falla después, por falta de entry)', () => {
	const home = makeRepoProject();
	try {
		mkdirSync(path.join(home, 'out'), {recursive: true});
		// Informe fresco: generatedAt en el futuro respecto a las
		// mtimes del fixture (creadas ahora mismo).
		const future = new Date(Date.now() + 60_000).toISOString();
		writeFileSync(
			path.join(home, 'out', 'preflight.json'),
			JSON.stringify({
				reportVersion: 1,
				project: 'gate-test-tmp',
				composition: 'MainReel',
				generatedAt: future,
				frames: 1,
				scenes: 1,
				flagged_frames: 0,
				blocking_frames: 0,
				results: [],
			}),
		);
		const r = runRenderChunks('gate-test-tmp');
		// La puerta pasa (stdout lo dice); el fallo posterior es por
		// falta de src/index.ts, no por la puerta. No se renderiza
		// nada: el fallo es antes del primer tramo.
		assert.match(r.stdout, /puerta OK/);
		assert.notEqual(r.status, 2);
		assert.match(r.stderr, /Missing required file.*index\.ts/);
	} finally {
		rmSync(home, {recursive: true, force: true});
	}
});
