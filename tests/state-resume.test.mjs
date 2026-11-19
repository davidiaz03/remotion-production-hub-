import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {ROOT} from '../scripts/lib.mjs';
import {
	PHASES,
	defaultPipeline,
	loadState,
	recordMilestone,
	setPhase,
	syncFromArtifacts,
	updateRender,
} from '../scripts/state.mjs';

const ID = 'state-test';

function fixtureRoot({legacy = false, render = null} = {}) {
	const root = mkdtempSync(path.join(os.tmpdir(), 'hub-state-test-'));
	const home = path.join(root, 'projects', ID);
	mkdirSync(home, {recursive: true});
	writeFileSync(
		path.join(home, 'project.json'),
		JSON.stringify({
			id: ID,
			title: 'Proyecto de prueba de estado',
			compositionId: 'MainReel',
			durationInFrames: 750,
			fps: 30,
			width: 1080,
			height: 1920,
			crf: 19,
		}),
	);
	const state = {
		schema: 'remotion-hub.state/v1',
		id: ID,
		title: 'Proyecto de prueba de estado',
		objective: 'Probar guardado y reanudación',
		phase: 'editing',
		compositionId: 'MainReel',
		latestSnapshot: null,
		approvedRevision: null,
		completed: ['hito previo que debe sobrevivir'],
		pending: ['pendiente previo'],
		nextTask: 'Seguir con el pipeline',
		updatedAt: '2026-11-16T00:00:00.000Z',
	};
	if (!legacy) {
		// Pipeline con las fases previas al render ya hechas, como en
		// un proyecto real interrumpido a mitad del render.
		state.pipeline = defaultPipeline();
		for (const p of ['assets', 'vo', 'captions', 'mix']) {
			state.pipeline.phases[p] = {
				status: 'done',
				startedAt: '2026-11-16T00:00:00.000Z',
				updatedAt: '2026-11-16T01:00:00.000Z',
				artifacts: [`public/${p}.wav`],
				note: '',
			};
		}
		if (render) Object.assign(state.pipeline.phases.render.chunks, render);
	}
	writeFileSync(path.join(home, 'STATE.json'), JSON.stringify(state, null, 2) + '\n');
	return root;
}

function runNode(root, script, args, extraEnv = {}) {
	const r = spawnSync(process.execPath, [path.join(ROOT, 'scripts', script), ...args], {
		cwd: root,
		encoding: 'utf8',
		env: {...process.env, ...extraEnv},
	});
	if (r.error) throw r.error;
	return r;
}

function readState(root) {
	return JSON.parse(readFileSync(path.join(root, 'projects', ID, 'STATE.json'), 'utf8'));
}

test('state: recordMilestone migra un STATE.json v1 sin pipeline y conserva sus campos', () => {
	const root = fixtureRoot({legacy: true});
	try {
		const state = recordMilestone(root, ID, 'assets', 'Assets recopilados', {
			artifacts: ['public/foto.jpg'],
			status: 'done',
			note: '3 fotos en public/',
		});
		assert.equal(state.pipeline.phases.assets.status, 'done');
		assert.deepEqual(state.pipeline.phases.assets.artifacts, ['public/foto.jpg']);
		assert.equal(state.pipeline.phases.assets.note, '3 fotos en public/');
		assert.equal(state.pipeline.milestones.length, 1);
		assert.equal(state.pipeline.milestones[0].event, 'Assets recopilados');
		assert.ok(state.pipeline.milestones[0].at);
		// Campos v1 intactos.
		assert.equal(state.phase, 'editing');
		assert.deepEqual(state.completed, ['hito previo que debe sobrevivir']);
		assert.equal(state.nextTask, 'Seguir con el pipeline');
		// El resto de fases sigue pendiente.
		assert.equal(state.pipeline.phases.vo.status, 'pending');
		assert.deepEqual(Object.keys(state.pipeline.phases), PHASES);
		// Persistido en disco.
		assert.equal(readState(root).pipeline.milestones.length, 1);
	} finally {
		rmSync(root, {recursive: true, force: true});
	}
});

test('state: updateRender calcula % y tramos, sin duplicar el mismo chunk', () => {
	const root = fixtureRoot();
	try {
		const resumeCommand = `node scripts/render-chunks.mjs ${ID} --frames 0-749 --chunk 150 --resume`;
		let s = updateRender(root, ID, {
			totalChunks: 5,
			chunkSize: 150,
			framesTotal: 750,
			framesDone: 150,
			chunkFile: 'out/chunks/chunk_01.mp4',
			resumeCommand,
			event: 'Tramo 1/5 verificado',
		});
		assert.equal(s.pipeline.phases.render.status, 'in_progress');
		assert.equal(s.pipeline.phases.render.chunks.done, 1);
		assert.equal(s.pipeline.phases.render.chunks.percent, 20);
		assert.equal(s.pipeline.phases.render.chunks.resumeCommand, resumeCommand);
		// Mismo tramo otra vez (re-render tras --resume): no duplica.
		s = updateRender(root, ID, {
			totalChunks: 5,
			framesTotal: 750,
			framesDone: 150,
			chunkFile: 'out/chunks/chunk_01.mp4',
			resumeCommand,
		});
		assert.equal(s.pipeline.phases.render.chunks.done, 1);
		assert.deepEqual(s.pipeline.phases.render.chunks.completed, ['out/chunks/chunk_01.mp4']);
		s = updateRender(root, ID, {
			totalChunks: 5,
			framesTotal: 750,
			framesDone: 750,
			chunkFile: 'out/chunks/chunk_05.mp4',
			resumeCommand,
			done: true,
			event: 'Render completo',
		});
		assert.equal(s.pipeline.phases.render.status, 'done');
		assert.equal(s.pipeline.phases.render.chunks.percent, 100);
	} finally {
		rmSync(root, {recursive: true, force: true});
	}
});

test('state: fases y estados desconocidos se rechazan', () => {
	const root = fixtureRoot();
	try {
		assert.throws(() => setPhase(root, ID, 'montaje', 'done'), /Fase desconocida/);
		assert.throws(() => setPhase(root, ID, 'vo', 'casi'), /Estado desconocido/);
		assert.throws(() => recordMilestone(root, ID, 'vo', ''), /evento/);
		assert.throws(() => loadState(root, 'no-existe'), /Missing STATE\.json/);
	} finally {
		rmSync(root, {recursive: true, force: true});
	}
});

test('state CLI: milestone, render y show funcionan desde shell', () => {
	const root = fixtureRoot({legacy: true});
	try {
		const m = runNode(root, 'state.mjs', [
			ID,
			'milestone',
			'vo',
			'VO generada',
			'--artifact',
			'public/vo.wav,vo-lines.json',
			'--status',
			'done',
			'--root',
			root,
		]);
		assert.equal(m.status, 0, m.stderr);
		assert.match(m.stdout, /STATE_OK state-test \[vo\] VO generada/);
		const r = runNode(root, 'state.mjs', [
			ID,
			'render',
			'--total',
			'5',
			'--frames-done',
			'300',
			'--frames-total',
			'750',
			'--chunk-file',
			'out/chunks/chunk_02.mp4',
			'--root',
			root,
		]);
		assert.equal(r.status, 0, r.stderr);
		assert.match(r.stdout, /1\/5 tramos \(40%\)/);
		const s = readState(root);
		assert.deepEqual(s.pipeline.phases.vo.artifacts, ['public/vo.wav', 'vo-lines.json']);
		const show = runNode(root, 'state.mjs', [ID, 'show', '--root', root]);
		assert.equal(show.status, 0, show.stderr);
		assert.match(show.stdout, /Voz en off: done/);
		assert.match(show.stdout, /Render por tramos: in_progress \(1\/5 tramos, 40%\)/);
	} finally {
		rmSync(root, {recursive: true, force: true});
	}
});

test('state CLI: --artifact repetido acumula todos los artefactos (no solo el último)', () => {
	const root = fixtureRoot({legacy: true});
	try {
		const m = runNode(root, 'state.mjs', [
			ID,
			'milestone',
			'assets',
			'Assets recopilados',
			'--artifact',
			'public/foto1.jpg',
			'--artifact',
			'public/foto2.jpg',
			'--artifact=public/foto3.jpg,public/foto4.jpg',
			'--status',
			'done',
			'--root',
			root,
		]);
		assert.equal(m.status, 0, m.stderr);
		assert.deepEqual(readState(root).pipeline.phases.assets.artifacts, [
			'public/foto1.jpg',
			'public/foto2.jpg',
			'public/foto3.jpg',
			'public/foto4.jpg',
		]);
		// phase con --artifact repetido también acumula (y no duplica).
		const p = runNode(root, 'state.mjs', [
			ID,
			'phase',
			'vo',
			'done',
			'--artifact',
			'public/vo.wav',
			'--artifact',
			'public/vo.wav',
			'--artifact',
			'vo-lines.json',
			'--root',
			root,
		]);
		assert.equal(p.status, 0, p.stderr);
		assert.deepEqual(readState(root).pipeline.phases.vo.artifacts, [
			'public/vo.wav',
			'vo-lines.json',
		]);
	} finally {
		rmSync(root, {recursive: true, force: true});
	}
});

test('resume: ante un render interrumpido muestra el estado y el comando exacto', () => {
	const resumeCommand = `node scripts/render-chunks.mjs ${ID} --frames 0-749 --chunk 150 --resume`;
	const root = fixtureRoot({
		render: {
			total: 5,
			done: 2,
			completed: ['out/chunks/chunk_01.mp4', 'out/chunks/chunk_02.mp4'],
			framesDone: 300,
			framesTotal: 750,
			percent: 40,
			chunkSize: 150,
			resumeCommand,
		},
	});
	try {
		// La fase render debe estar en curso, no pendiente.
		setPhase(root, ID, 'render', 'in_progress');
		const r = runNode(root, 'resume.mjs', [ID, '--root', root]);
		assert.equal(r.status, 0, r.stderr);
		assert.match(r.stdout, /Render por tramos: in_progress — 2\/5 tramos, 300\/750 f \(40%\)/);
		assert.match(r.stdout, /último: out\/chunks\/chunk_02\.mp4/);
		assert.match(r.stdout, /SIGUIENTE PASO \(render\)/);
		assert.ok(r.stdout.includes(`COMANDO: ${resumeCommand}`), r.stdout);
		const j = runNode(root, 'resume.mjs', [ID, '--json', '--root', root]);
		assert.equal(j.status, 0, j.stderr);
		const data = JSON.parse(j.stdout);
		assert.equal(data.legacy, false);
		assert.equal(data.nextStep.phase, 'render');
		assert.equal(data.nextStep.command, resumeCommand);
		assert.equal(data.phases.render.chunks.percent, 40);
	} finally {
		rmSync(root, {recursive: true, force: true});
	}
});

test('resume: con QA pendiente y sin máster pide master.py antes del gate', () => {
	const root = fixtureRoot();
	try {
		for (const p of ['render']) setPhase(root, ID, p, 'done');
		const r = runNode(root, 'resume.mjs', [ID, '--root', root]);
		assert.equal(r.status, 0, r.stderr);
		assert.match(r.stdout, /SIGUIENTE PASO \(qa\)/);
		assert.match(r.stdout, /master\.py --input projects\/state-test\/out\/state-test-chunks\.mp4/);
	} finally {
		rmSync(root, {recursive: true, force: true});
	}
});

test('resume: STATE.json v1 sin pipeline cae al modo legado sin romper', () => {
	const root = fixtureRoot({legacy: true});
	try {
		const r = runNode(root, 'resume.mjs', [ID, '--root', root]);
		assert.equal(r.status, 0, r.stderr);
		assert.match(r.stdout, /sin pipeline \(v1 puro\)/);
		assert.match(r.stdout, /Seguir con el pipeline/);
		assert.match(r.stdout, /pendiente: pendiente previo/);
		const j = JSON.parse(runNode(root, 'resume.mjs', [ID, '--json', '--root', root]).stdout);
		assert.equal(j.legacy, true);
		assert.equal(j.nextTask, 'Seguir con el pipeline');
	} finally {
		rmSync(root, {recursive: true, force: true});
	}
});

test('checkpoint: commitea con el mensaje esperado y sin cambios no commitea', () => {
	const root = fixtureRoot();
	try {
		const git = (...args) => {
			const r = spawnSync('git', args, {cwd: root, encoding: 'utf8'});
			assert.equal(r.status, 0, r.stderr || r.stdout);
			return r.stdout.trim();
		};
		git('init', '-q');
		git('config', 'user.name', 'State Test');
		git('config', 'user.email', 'state@example.invalid');
		git('checkout', '-qb', 'work/state-test');
		git('add', '-A');
		git('commit', '-qm', 'baseline');
		// Un cambio real en el proyecto.
		writeFileSync(path.join(root, 'projects', ID, 'nota.txt'), 'cambio de prueba\n');
		const first = runNode(root, 'checkpoint.mjs', [ID, '--phase', 'render', '--root', root]);
		assert.equal(first.status, 0, first.stderr);
		assert.match(first.stdout, /CHECKPOINT_OK state-test [0-9a-f]+ "checkpoint: render /);
		assert.match(first.stdout, /sin upstream configurado/);
		assert.match(git('log', '--format=%s', '-1'), /^checkpoint: render 20\d\d-\d\d-\d\dT/);
		// El hito del checkpoint quedó en STATE.json dentro del commit.
		assert.ok(
			readState(root).pipeline.milestones.some((m) => m.event.startsWith('checkpoint render')),
		);
		// Sin cambios: no commitea y sale 0.
		const second = runNode(root, 'checkpoint.mjs', [ID, '--phase', 'render', '--root', root]);
		assert.equal(second.status, 0, second.stderr);
		assert.match(second.stdout, /sin cambios que guardar/);
		assert.equal(git('rev-list', '--count', 'HEAD'), '2');
		// Fuera de una rama work/* se niega.
		git('checkout', '-qb', 'main');
		writeFileSync(path.join(root, 'projects', ID, 'nota2.txt'), 'otro cambio\n');
		const refused = runNode(root, 'checkpoint.mjs', [ID, '--phase', 'render', '--root', root]);
		assert.notEqual(refused.status, 0);
		assert.match(refused.stderr, /solo en ramas work\/\*/);
	} finally {
		rmSync(root, {recursive: true, force: true});
	}
});

test('resume: en modo pipeline no muestra la fase editorial obsoleta (phase/nextTask son legado)', () => {
	const root = fixtureRoot();
	try {
		// El fixture trae phase:'editing' obsoleto con el pipeline ya
		// en render: un agente en frío no debe ver 'editing'.
		setPhase(root, ID, 'render', 'in_progress');
		const r = runNode(root, 'resume.mjs', [ID, '--root', root]);
		assert.equal(r.status, 0, r.stderr);
		assert.doesNotMatch(r.stdout, /fase editorial/);
		assert.match(r.stdout, /fase actual \(pipeline\): Render por tramos/);
		const j = JSON.parse(runNode(root, 'resume.mjs', [ID, '--json', '--root', root]).stdout);
		assert.equal(j.phase, 'render');
		// state.mjs show: igual, fase del pipeline, no la editorial.
		const s = runNode(root, 'state.mjs', [ID, 'show', '--root', root]);
		assert.equal(s.status, 0, s.stderr);
		assert.match(s.stdout, /fase actual \(pipeline\): Render por tramos/);
		assert.doesNotMatch(s.stdout, /fase editorial/);
	} finally {
		rmSync(root, {recursive: true, force: true});
	}
});

test('resume: proyecto completo no pide ningún comando', () => {
	const root = fixtureRoot();
	try {
		for (const p of PHASES) setPhase(root, ID, p, 'done');
		const r = runNode(root, 'resume.mjs', [ID, '--root', root]);
		assert.equal(r.status, 0, r.stderr);
		assert.match(r.stdout, /Proyecto completo/);
		assert.match(r.stdout, /Sin comando pendiente/);
		assert.equal(existsSync(path.join(root, 'projects', ID, 'STATE.json')), true);
	} finally {
		rmSync(root, {recursive: true, force: true});
	}
});

test('state sync: deriva fases done desde artefactos en disco (repara STATE desactualizado)', () => {
	const root = fixtureRoot({legacy: true});
	try {
		const home = path.join(root, 'projects', ID);
		// STATE v1 puro (sin pipeline): todo pending tras la migración.
		// Artefactos de un proyecto casi completo en disco.
		for (const dir of ['public/img', 'public/audio/vo', 'out/chunks', 'reports', 'src']) {
			mkdirSync(path.join(home, dir), {recursive: true});
		}
		writeFileSync(path.join(home, 'public/img/ill.png'), 'x');
		writeFileSync(path.join(home, 'public/audio/vo-full.wav'), 'x');
		writeFileSync(path.join(home, 'src/captions.json'), '{}');
		writeFileSync(path.join(home, 'public/audio/mix.wav'), 'x');
		writeFileSync(path.join(home, 'out/chunks/manifest.json'), JSON.stringify({chunks: [{}, {}], totalFrames: 300, chunkSize: 150}));
		writeFileSync(path.join(home, `out/${ID}-chunks.mp4`), 'x');
		writeFileSync(path.join(home, 'reports/technical-qa.json'), JSON.stringify({technicalStatus: 'passed', file: 'x.mp4'}));
		const {changes} = syncFromArtifacts(root, ID);
		const s = readState(root);
		assert.equal(s.pipeline.phases.assets.status, 'done');
		assert.equal(s.pipeline.phases.vo.status, 'done');
		assert.equal(s.pipeline.phases.captions.status, 'done');
		assert.equal(s.pipeline.phases.mix.status, 'done');
		assert.equal(s.pipeline.phases.render.status, 'done');
		assert.equal(s.pipeline.phases.render.chunks.percent, 100);
		assert.equal(s.pipeline.phases.qa.status, 'done');
		assert.equal(s.pipeline.phases.delivery.status, 'pending');
		assert.ok(changes.length >= 6);
		// Segunda pasada: sin cambios (idempotente).
		const again = syncFromArtifacts(root, ID);
		assert.deepEqual(again.changes, []);
	} finally {
		rmSync(root, {recursive: true, force: true});
	}
});

test('state sync CLI: marca qa failed cuando el informe dice failed', () => {
	const root = fixtureRoot({legacy: true});
	try {
		const home = path.join(root, 'projects', ID);
		mkdirSync(path.join(home, 'reports'), {recursive: true});
		writeFileSync(path.join(home, 'reports/technical-qa.json'), JSON.stringify({technicalStatus: 'failed', file: 'x.mp4'}));
		const r = runNode(root, 'state.mjs', [ID, 'sync', '--root', root]);
		assert.equal(r.status, 0, r.stderr);
		assert.match(r.stdout, /qa → failed/);
		assert.equal(readState(root).pipeline.phases.qa.status, 'failed');
	} finally {
		rmSync(root, {recursive: true, force: true});
	}
});
