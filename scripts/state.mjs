/**
 * Guardado en tiempo real del pipeline por proyecto (STATE.json).
 *
 * STATE.json ya existía (esquema remotion-hub.state/v1, usado por
 * operate.mjs / revisions.mjs para snapshots y aprobaciones). Este
 * módulo añade, SIN tocar esos campos, un objeto `pipeline` con el
 * estado del trabajo en curso: fases, hitos con marca de tiempo y
 * artefactos producidos. Un agente nuevo que lea SOLO STATE.json +
 * `git log` debe saber dónde quedó el trabajo y qué falta.
 *
 * Fases (en orden): assets, vo, captions, mix, render, qa, delivery.
 * Cada fase: {status, startedAt, updatedAt, artifacts[], note}.
 * `render` añade `chunks`: {total, done, completed[], framesDone,
 * framesTotal, percent, chunkSize, resumeCommand}.
 * `milestones`: [{at, phase, event, artifacts[]}] — registro
 * cronológico de cada hito.
 *
 * Uso desde Node:
 *   import {recordMilestone, updateRender, setPhase} from './state.mjs';
 *   recordMilestone(ROOT, 'mi-reel', 'vo', 'VO de previsualización generada',
 *     {artifacts: ['public/vo.wav'], status: 'done'});
 *
 * Uso desde shell (los scripts de audio en Python lo llaman así):
 *   node scripts/state.mjs <proyecto> milestone vo "VO generada" \
 *     --artifact public/vo.wav --status done
 *   node scripts/state.mjs <proyecto> phase mix in_progress
 *   node scripts/state.mjs <proyecto> render --chunk 2 --total 5 \
 *     --frames-done 300 --frames-total 750 --chunk-file out/chunks/chunk_02.mp4
 *   node scripts/state.mjs <proyecto> show [--json]
 *
 * --root <dir> (o REMOTION_HUB_ROOT) sustituye la raíz del repo; solo
 * para pruebas. La escritura es atómica (temporal + rename) para que
 * matar un proceso a mitad de hito no corrompa STATE.json.
 */
import {existsSync, readFileSync, renameSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {ROOT, SLUG_RE, parseArgs} from './lib.mjs';

export const PHASES = ['assets', 'vo', 'captions', 'mix', 'render', 'qa', 'delivery'];
export const PHASE_LABELS = {
	assets: 'Assets',
	vo: 'Voz en off',
	captions: 'Subtítulos karaoke',
	mix: 'Mezcla de audio',
	render: 'Render por tramos',
	qa: 'QA (sonoridad + video)',
	delivery: 'Entrega',
};
export const PHASE_STATUS = ['pending', 'in_progress', 'done', 'failed'];

export function projectHome(root, slug) {
	if (!SLUG_RE.test(slug ?? '')) {
		throw Error('Invalid project ID: lowercase letters, digits and hyphens only');
	}
	return path.join(root, 'projects', slug);
}

export function statePath(root, slug) {
	return path.join(projectHome(root, slug), 'STATE.json');
}

function freshPhase() {
	return {status: 'pending', startedAt: null, updatedAt: null, artifacts: [], note: ''};
}

export function defaultPipeline() {
	const phases = {};
	for (const p of PHASES) phases[p] = freshPhase();
	phases.render.chunks = {
		total: 0,
		done: 0,
		completed: [],
		framesDone: 0,
		framesTotal: 0,
		percent: 0,
		chunkSize: 150,
		resumeCommand: '',
	};
	return {phases, milestones: []};
}

/** Añade el pipeline a un STATE.json v1 que aún no lo tiene (migración perezosa). */
export function ensurePipeline(state) {
	if (!state.pipeline || typeof state.pipeline !== 'object') {
		state.pipeline = defaultPipeline();
		return state.pipeline;
	}
	if (!state.pipeline.phases || typeof state.pipeline.phases !== 'object') {
		state.pipeline.phases = {};
	}
	for (const p of PHASES) {
		const cur = state.pipeline.phases[p];
		if (!cur || typeof cur !== 'object') {
			state.pipeline.phases[p] = freshPhase();
		} else {
			if (!PHASE_STATUS.includes(cur.status)) cur.status = 'pending';
			if (!Array.isArray(cur.artifacts)) cur.artifacts = [];
		}
	}
	if (!state.pipeline.phases.render.chunks) {
		state.pipeline.phases.render.chunks = defaultPipeline().phases.render.chunks;
	}
	if (!Array.isArray(state.pipeline.milestones)) state.pipeline.milestones = [];
	return state.pipeline;
}

export function loadState(root, slug) {
	const p = statePath(root, slug);
	if (!existsSync(p)) throw Error(`Missing STATE.json for ${slug} (${p})`);
	const state = JSON.parse(readFileSync(p, 'utf8'));
	ensurePipeline(state);
	return state;
}

export function saveState(root, slug, state) {
	state.updatedAt = new Date().toISOString();
	const p = statePath(root, slug);
	const tmp = `${p}.tmp-${process.pid}`;
	writeFileSync(tmp, JSON.stringify(state, null, 2) + '\n');
	renameSync(tmp, p);
	return state;
}

function checkPhase(phase) {
	if (!PHASES.includes(phase)) {
		throw Error(`Fase desconocida: ${phase} (válidas: ${PHASES.join(', ')})`);
	}
}

function checkStatus(status) {
	if (!PHASE_STATUS.includes(status)) {
		throw Error(`Estado desconocido: ${status} (válidos: ${PHASE_STATUS.join(', ')})`);
	}
}

function touchPhase(phaseState, now, status) {
	if (status) {
		checkStatus(status);
		if (status === 'in_progress' && !phaseState.startedAt) phaseState.startedAt = now;
		phaseState.status = status;
	}
	phaseState.updatedAt = now;
}

function addArtifacts(phaseState, artifacts) {
	for (const a of artifacts || []) {
		if (typeof a === 'string' && a && !phaseState.artifacts.includes(a)) {
			phaseState.artifacts.push(a);
		}
	}
}

/**
 * Registra un hito: lo añade al registro cronológico y actualiza la
 * fase (estado, artefactos, nota). `status` es opcional.
 */
export function recordMilestone(root, slug, phase, event, opts = {}) {
	checkPhase(phase);
	if (!event || typeof event !== 'string') throw Error('El hito necesita un evento (texto)');
	const state = loadState(root, slug);
	const now = new Date().toISOString();
	const phaseState = state.pipeline.phases[phase];
	touchPhase(phaseState, now, opts.status);
	addArtifacts(phaseState, opts.artifacts);
	if (typeof opts.note === 'string' && opts.note) phaseState.note = opts.note;
	state.pipeline.milestones.push({
		at: now,
		phase,
		event,
		artifacts: [...(opts.artifacts || [])],
	});
	return saveState(root, slug, state);
}

export function setPhase(root, slug, phase, status, opts = {}) {
	checkPhase(phase);
	checkStatus(status);
	const state = loadState(root, slug);
	const now = new Date().toISOString();
	const phaseState = state.pipeline.phases[phase];
	touchPhase(phaseState, now, status);
	addArtifacts(phaseState, opts.artifacts);
	if (typeof opts.note === 'string' && opts.note) phaseState.note = opts.note;
	return saveState(root, slug, state);
}

/**
 * Progreso del render por tramos. Se llama tras cada tramo verificado
 * (render-chunks.mjs lo hace solo). `done: true` marca la fase
 * completa (tras el concatenado o con --no-concat).
 */
export function updateRender(root, slug, progress) {
	const state = loadState(root, slug);
	const now = new Date().toISOString();
	const render = state.pipeline.phases.render;
	const chunks = render.chunks;
	if (!render.startedAt) render.startedAt = now;
	render.status = progress.done ? 'done' : 'in_progress';
	render.updatedAt = now;
	if (Number.isInteger(progress.totalChunks) && progress.totalChunks > 0) {
		chunks.total = progress.totalChunks;
	}
	if (Number.isInteger(progress.chunkSize) && progress.chunkSize > 0) {
		chunks.chunkSize = progress.chunkSize;
	}
	if (Number.isInteger(progress.framesTotal) && progress.framesTotal > 0) {
		chunks.framesTotal = progress.framesTotal;
	}
	if (Number.isInteger(progress.framesDone) && progress.framesDone >= 0) {
		chunks.framesDone = progress.framesDone;
	}
	if (progress.chunkFile && !chunks.completed.includes(progress.chunkFile)) {
		chunks.completed.push(progress.chunkFile);
	}
	chunks.done = chunks.completed.length;
	chunks.percent =
		chunks.framesTotal > 0
			? Math.round((1000 * chunks.framesDone) / chunks.framesTotal) / 10
			: chunks.total > 0
				? Math.round((1000 * chunks.done) / chunks.total) / 10
				: 0;
	if (typeof progress.resumeCommand === 'string' && progress.resumeCommand) {
		chunks.resumeCommand = progress.resumeCommand;
	}
	if (typeof progress.note === 'string' && progress.note) render.note = progress.note;
	if (progress.event) {
		state.pipeline.milestones.push({
			at: now,
			phase: 'render',
			event: progress.event,
			artifacts: progress.chunkFile ? [progress.chunkFile] : [],
		});
	}
	return saveState(root, slug, state);
}

function resolveRoot(opts) {
	return opts.root ? path.resolve(String(opts.root)) : process.env.REMOTION_HUB_ROOT || ROOT;
}

function collectArtifacts(opts) {
	// parseArgs no acumula flags repetidas: varios artefactos van
	// separados por coma (--artifact a.wav,b.wav).
	const raw = opts.artifact ?? opts.artifacts ?? '';
	return String(raw)
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
	const {pos, opts} = parseArgs(process.argv.slice(2));
	const [slug, action, ...rest] = pos;
	const root = resolveRoot(opts);
	if (!slug || !action) {
		throw Error(
			'Use: node scripts/state.mjs <proyecto> show|milestone|phase|render [...]',
		);
	}
	if (action === 'show') {
		const state = loadState(root, slug);
		if (opts.json === true || opts.json === 'true') {
			console.log(JSON.stringify(state, null, 2));
		} else {
			console.log(`${state.id} — ${state.title}`);
			console.log(`fase editorial: ${state.phase} · actualizado: ${state.updatedAt}`);
			for (const p of PHASES) {
				const s = state.pipeline.phases[p];
				const extra =
					p === 'render' && s.chunks.total
						? ` (${s.chunks.done}/${s.chunks.total} tramos, ${s.chunks.percent}%)`
						: '';
				console.log(`  ${PHASE_LABELS[p]}: ${s.status}${extra}`);
			}
			const last = state.pipeline.milestones.slice(-5);
			for (const m of last) console.log(`  · ${m.at} [${m.phase}] ${m.event}`);
		}
	} else if (action === 'milestone') {
		const [phase, ...eventParts] = rest;
		const event = eventParts.join(' ');
		const state = recordMilestone(root, slug, phase, event, {
			artifacts: collectArtifacts(opts),
			note: opts.note ? String(opts.note) : undefined,
			status: opts.status ? String(opts.status) : undefined,
		});
		console.log(
			`STATE_OK ${slug} [${phase}] ${event} (fase: ${state.pipeline.phases[phase].status})`,
		);
	} else if (action === 'phase') {
		const [phase, status] = rest;
		const state = setPhase(root, slug, phase, status, {
			artifacts: collectArtifacts(opts),
			note: opts.note ? String(opts.note) : undefined,
		});
		console.log(`STATE_OK ${slug} fase ${phase} → ${status}`);
	} else if (action === 'render') {
		const state = updateRender(root, slug, {
			totalChunks: opts.total ? Number(opts.total) : undefined,
			chunkSize: opts['chunk-size'] ? Number(opts['chunk-size']) : undefined,
			framesTotal: opts['frames-total'] ? Number(opts['frames-total']) : undefined,
			framesDone: opts['frames-done'] ? Number(opts['frames-done']) : undefined,
			chunkFile: opts['chunk-file'] ? String(opts['chunk-file']) : undefined,
			resumeCommand: opts['resume-command'] ? String(opts['resume-command']) : undefined,
			note: opts.note ? String(opts.note) : undefined,
			event: opts.event ? String(opts.event) : undefined,
			done: opts.done === true || opts.done === 'true',
		});
		const c = state.pipeline.phases.render.chunks;
		console.log(
			`STATE_OK ${slug} render ${c.done}/${c.total} tramos (${c.percent}%)`,
		);
	} else {
		throw Error(`Acción desconocida: ${action} (show|milestone|phase|render)`);
	}
}
