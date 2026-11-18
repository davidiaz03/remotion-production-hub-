/**
 * STATE.json por pieza de contenido estático.
 *
 * Espejo del esquema del hub de video (scripts/state.mjs): mismo objeto
 * `pipeline` con fases y `milestones` cronológicos, para que un agente en
 * frío que lea SOLO STATE.json + `git log` sepa dónde quedó la pieza.
 *
 * Fases (en orden): brief, draft, review, export, delivery.
 * Cada fase: {status, startedAt, updatedAt, artifacts[], note}.
 * `milestones`: [{at, phase, event, artifacts[]}].
 *
 * Uso desde Node:
 *   import {initPiece, setPhase, recordMilestone, readState} from './state.mjs';
 * Uso desde shell:
 *   node content/scripts/state.mjs <piece-dir> show [--json]
 *   node content/scripts/state.mjs <piece-dir> phase draft done --note "..."
 *   node content/scripts/state.mjs <piece-dir> milestone draft "Borrador renderizado" --artifact out/post.png
 */
import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export const PHASES = ['brief', 'draft', 'review', 'export', 'delivery'];
export const PHASE_LABELS = {
	brief: 'Brief',
	draft: 'Borrador',
	review: 'Revisión',
	export: 'Exportación',
	delivery: 'Entrega',
};

export function statePath(pieceDir) {
	return path.join(pieceDir, 'STATE.json');
}

export function readState(pieceDir) {
	const p = statePath(pieceDir);
	if (!existsSync(p)) return null;
	return JSON.parse(readFileSync(p, 'utf8'));
}

function writeAtomic(p, obj) {
	const tmp = `${p}.tmp`;
	writeFileSync(tmp, `${JSON.stringify(obj, null, 2)}\n`);
	renameSync(tmp, p);
}

export function initPiece(pieceDir, { slug, template, title }) {
	const now = new Date().toISOString();
	const state = {
		schema: 'content-hub.state/v1',
		slug,
		template,
		title: title ?? '',
		createdAt: now,
		pipeline: {
			phases: Object.fromEntries(PHASES.map((ph) => [ph, {
				status: ph === 'brief' ? 'in_progress' : 'pending',
				startedAt: ph === 'brief' ? now : null,
				updatedAt: now,
				artifacts: [],
				note: '',
			}])),
			milestones: [{ at: now, phase: 'brief', event: 'Pieza creada', artifacts: [] }],
		},
	};
	writeAtomic(statePath(pieceDir), state);
	return state;
}

export function setPhase(pieceDir, phase, status, { note = '', artifacts = [] } = {}) {
	if (!PHASES.includes(phase)) throw new Error(`Fase desconocida: ${phase}`);
	const state = readState(pieceDir);
	if (!state) throw new Error(`No hay STATE.json en ${pieceDir}`);
	const now = new Date().toISOString();
	const ph = state.pipeline.phases[phase];
	ph.status = status;
	ph.updatedAt = now;
	if (!ph.startedAt) ph.startedAt = now;
	if (note) ph.note = note;
	for (const a of artifacts) if (!ph.artifacts.includes(a)) ph.artifacts.push(a);
	writeAtomic(statePath(pieceDir), state);
	return state;
}

export function recordMilestone(pieceDir, phase, event, { artifacts = [], status = null } = {}) {
	const state = readState(pieceDir);
	if (!state) throw new Error(`No hay STATE.json en ${pieceDir}`);
	const now = new Date().toISOString();
	state.pipeline.milestones.push({ at: now, phase, event, artifacts });
	if (status) {
		const ph = state.pipeline.phases[phase];
		ph.status = status;
		ph.updatedAt = now;
		if (!ph.startedAt) ph.startedAt = now;
		for (const a of artifacts) if (!ph.artifacts.includes(a)) ph.artifacts.push(a);
	}
	writeAtomic(statePath(pieceDir), state);
	return state;
}

export function showState(pieceDir, json = false) {
	const state = readState(pieceDir);
	if (!state) {
		console.log(`Sin STATE.json en ${pieceDir}`);
		return;
	}
	if (json) {
		console.log(JSON.stringify(state, null, 2));
		return;
	}
	console.log(`${state.slug} — ${state.title} [${state.template}]`);
	for (const ph of PHASES) {
		const p = state.pipeline.phases[ph];
		const mark = p.status === 'done' ? '✓' : p.status === 'in_progress' ? '→' : '·';
		console.log(`  ${mark} ${PHASE_LABELS[ph]}: ${p.status}${p.note ? ` — ${p.note}` : ''}`);
		if (p.artifacts.length) console.log(`      ${p.artifacts.join(', ')}`);
	}
}

// CLI mínimo
if (import.meta.url === `file://${process.argv[1]}`) {
	const [dir, cmd, ...rest] = process.argv.slice(2);
	if (!dir || cmd === 'show') {
		showState(dir ?? process.cwd(), rest.includes('--json'));
	} else if (cmd === 'phase') {
		const [phase, status] = rest;
		const noteIdx = rest.indexOf('--note');
		setPhase(dir, phase, status, { note: noteIdx >= 0 ? rest[noteIdx + 1] : '' });
		console.log(`Fase ${phase} -> ${status}`);
	} else if (cmd === 'milestone') {
		const [phase, ...eventParts] = rest;
		const artIdx = rest.indexOf('--artifact');
		const event = eventParts.slice(0, artIdx >= 0 ? artIdx - 1 : undefined).join(' ');
		const artifacts = artIdx >= 0 ? rest.slice(artIdx + 1).filter((a) => !a.startsWith('--')) : [];
		recordMilestone(dir, phase, event, { artifacts });
		console.log(`Hito: ${event}`);
	} else {
		console.error('Uso: state.mjs <piece-dir> <show|phase|milestone> ...');
		process.exit(1);
	}
}
