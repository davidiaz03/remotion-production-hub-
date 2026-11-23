/**
 * Orquestador de reels en UN solo comando (P0-1, LESSONS-v4.md).
 *
 * En negacion-embargo (22-nov-2026) cada fase la lanzó un agente a
 * mano: entre fases hubo esperas, la pre-auditoría se hizo tarde y
 * el re-trabajo evitable fue ~3 h 40 min (46% del total). Este
 * orquestador ejecuta las fases en orden, salta las que ya tienen
 * sus artefactos verificados (y más recientes que sus entradas) y,
 * si algo falla, para e imprime el comando exacto para reanudar
 * desde esa fase. Modelado en scripts/pipeline.mjs (video largo).
 *
 * Configuración: projects/<id>/reel.json (ver templates/reel/reel.json).
 * El orquestador NO escribe guiones ni compone escenas: eso sigue
 * siendo trabajo creativo del agente. Empieza cuando existen la
 * composición (src/, project.json), la VO grabada, la timeline
 * (research/timeline.json) y los scripts de audio del proyecto.
 *
 * Uso:
 *   node scripts/reel.mjs <proyecto> --tag vN [--from audio] [--to audit]
 *     [--force] [--dry-run] [--estimate] [--deliver] [--skip-ghost]
 *   node scripts/reel.mjs negacion-embargo --tag v5 --estimate
 *   node scripts/reel.mjs negacion-embargo --tag v5 --to pre-audit
 *   node scripts/reel.mjs negacion-embargo --tag v5 --deliver
 *
 * Pasos: audio, mix, audit-inputs, pre-audit, preflight, render,
 * master, qa, ghost, audit, deliver.
 * --from/--to seleccionan el rango. --force rehace desde --from
 * (borra los artefactos de esas fases antes de empezar). Sin --force,
 * cada paso salta si sus artefactos existen y son más recientes que
 * sus entradas. --estimate imprime la estimación por paso y sale sin
 * ejecutar. --dry-run lista los pasos (con estimación) sin ejecutar
 * nada.
 *
 * Puertas duras (FAIL = parada, no entrega):
 * - pre-audit: la auditoría sobre insumos (sin máster) debe dar 0 FAIL
 *   antes de renderizar (P0-2). Un FAIL aquí cuesta minutos; después
 *   del render, horas.
 * - preflight: un fotograma bloqueante (texto sobre cara, duplicado,
 *   logo ausente) para el pipeline: corregir el layout y reanudar.
 * - qa: qa-media --mode full sobre el máster (exit 1 = fallo).
 * - ghost: un fotograma fantasma o REVISAR en un corte para el
 *   pipeline (P0-4). Tras revisar las tiras, --skip-ghost reanuda.
 * - audit: la auditoría final sobre el máster debe dar 0 FAIL.
 * La entrega (deliver) NUNCA corre sola: exige --deliver en cada
 * corrida (sube a Drive y publica enlaces Muse, que son públicos).
 *
 * Frescura: los artefactos y las entradas pueden ser carpetas
 * (p. ej. public/audio/sfx-mix/, src/): para una carpeta-artefacto
 * vale su archivo MÁS ANTIGUO y para una carpeta-entrada su archivo
 * MÁS RECIENTE (así un cambio en cualquier archivo invalida).
 * REGLA: una carpeta-artefacto debe ser de uso EXCLUSIVO del paso
 * (el paso produce TODOS sus archivos y limpia los rancios al
 * correr); si la carpeta mezcla archivos de varios pasos, declarar
 * los archivos uno a uno. En negacion-embargo, sfx-mix/ mezclaba 14
 * archivos de build-audio.sh con 15 copias a mano y un --force las
 * borró (la mezcla falló): build-audio.sh ahora genera los 29 desde
 * timeline.json (uvo_db) y limpia el directorio primero.
 * El render además invalida por hash fino (P0-3): si el orquestador
 * lo re-ejecuta, render-chunks --resume solo re-renderiza los
 * tramos cuyos insumos cambiaron.
 *
 * Candados: los pasos pesados se serializan con otros trabajos si
 * está definido HUB_HEAVY_LOCK (ruta de un archivo flock). El render
 * toma ADEMÁS el candado único de render (render-chunks --lock).
 * Orden de adquisición siempre: heavy-lock (externo) → render-lock
 * (interno); nunca al revés (evita interbloqueo).
 *
 * Informe de progreso: reports/reel-progress.json (+ .md) se
 * actualiza tras cada paso con estado, tiempo real y estimado.
 */
import {existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync, copyFileSync} from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {HUB, ROOT, loadProject, parseArgs, assertDrivePath} from './lib.mjs';
import {recordMilestone, setPhase} from './state.mjs';

const HOME = process.env.HOME || '';
const VENV_PY = process.env.HUB_PY || path.join(HUB, '.venv/bin/python');
const HEAVY_LOCK = process.env.HUB_HEAVY_LOCK || '';
const REMOTE_STORAGE = '/opt/hatch/bin/remote-storage';

const STEPS = ['audio', 'mix', 'audit-inputs', 'pre-audit', 'preflight', 'render', 'master', 'qa', 'ghost', 'audit', 'deliver'];
// Fase de STATE.json que marca cada paso.
const STEP_PHASE = {
	audio: 'vo', mix: 'mix', 'audit-inputs': 'mix', 'pre-audit': 'qa',
	preflight: 'render', render: 'render', master: 'qa', qa: 'qa',
	ghost: 'qa', audit: 'qa', deliver: 'delivery',
};
// Pasos que necesitan --tag (el tag entra en nombres de archivo).
const TAG_STEPS = new Set(['master', 'qa', 'ghost', 'audit', 'deliver']);

// --- Estimación (tasas medidas) ---
// audioS = segundos del reel; frames = fotogramas a renderizar;
// scenes = escenas del manifiesto; cuts = cortes del manifiesto.
export const RATES = {
	audioFixedS: 40, // build-audio.sh: VO + cama + 29 SFX + 3 paneles (smoke reel 23-nov: 25 s)
	mixFixedS: 40, // run-mix.py: mezcla fixed-gain 77 SFX (smoke reel 23-nov: 25 s)
	auditInputsFixedS: 50, // build-audit-inputs.py + Whisper sobre la VO editada (smoke reel 23-nov: 32 s)
	preAuditFixedS: 20, // run-audit.py --pre (smoke reel 23-nov: 13 s)
	preflightPerSceneS: 15, // 1 still por escena (smoke longform: 12,4 s/escena)
	renderPerFrameS: 0.08, // tramos 150 f: medido 19-nov (72 s/900 f) y smoke (0,077)
	masterPerAudioS: 0.66, // máster + ligera: encode x264 + loudnorm (smoke longform)
	qaPerAudioS: 0.34, // qa-media --mode full sobre el máster (smoke longform)
	qaFixedS: 60, // + sonda ffprobe/decode de la ligera
	ghostPerCutS: 8, // ghost-frames.py: smoke v4, 85 s / 11 cortes
	auditFixedS: 60, // audit-audio: base (cargas + checks sin Whisper)
	auditPerAudioS: 0.3, // audit-audio: Whisper sobre el máster
	deliverFixedS: 120, // 2 subidas a Drive (rclone + check) + 2 a Muse storage
};

export function estimateSteps({audioS, frames, scenes, cuts}) {
	return {
		audio: RATES.audioFixedS,
		mix: RATES.mixFixedS,
		'audit-inputs': RATES.auditInputsFixedS,
		'pre-audit': RATES.preAuditFixedS,
		preflight: Math.round((scenes ?? 10) * RATES.preflightPerSceneS),
		render: Math.round(frames * RATES.renderPerFrameS),
		master: Math.round(audioS * RATES.masterPerAudioS + 30),
		qa: Math.round(audioS * RATES.qaPerAudioS + RATES.qaFixedS),
		ghost: Math.round((cuts ?? 10) * RATES.ghostPerCutS),
		audit: Math.round(RATES.auditFixedS + audioS * RATES.auditPerAudioS),
		deliver: RATES.deliverFixedS,
	};
}

export function formatDuration(totalS) {
	const s = Math.max(0, Math.round(totalS));
	const h = Math.floor(s / 3600);
	const m = Math.floor((s % 3600) / 60);
	const sec = s % 60;
	if (h > 0) return `${h} h ${String(m).padStart(2, '0')} min`;
	if (m > 0) return `${m} min ${String(sec).padStart(2, '0')} s`;
	return `${sec} s`;
}

const {pos, opts} = parseArgs(process.argv.slice(2));
const projectId = pos[0];
if (!projectId) {
	throw Error('Uso: node scripts/reel.mjs <proyecto> --tag vN [--from audio] [--to audit] [--force] [--dry-run] [--estimate] [--deliver] [--skip-ghost]');
}
const {home, data} = loadProject(projectId);
const cfgPath = path.join(home, 'reel.json');
if (!existsSync(cfgPath)) {
	throw Error(`Falta ${path.relative(ROOT, cfgPath)} (copia templates/reel/reel.json y ajústalo)`);
}
const cfg = JSON.parse(readFileSync(cfgPath, 'utf8'));
const from = String(opts.from ?? STEPS[0]);
const to = String(opts.to ?? STEPS[STEPS.length - 1]);
const force = opts.force === true || opts.force === 'true';
const dryRun = opts['dry-run'] === true || opts['dry-run'] === 'true';
const estimateOnly = opts.estimate === true || opts.estimate === 'true';
const deliverFlag = opts.deliver === true || opts.deliver === 'true';
const skipGhost = opts['skip-ghost'] === true || opts['skip-ghost'] === 'true';
if (!STEPS.includes(from) || !STEPS.includes(to)) {
	throw Error(`--from/--to deben ser pasos válidos: ${STEPS.join(', ')}`);
}
const range = STEPS.slice(STEPS.indexOf(from), STEPS.indexOf(to) + 1);
if (!range.length) throw Error(`Rango vacío: --from ${from} está después de --to ${to}`);
const tag = String(opts.tag ?? '');
if (!tag && range.some((s) => TAG_STEPS.has(s))) {
	throw Error(`--tag vN es obligatorio cuando el rango incluye ${[...TAG_STEPS].join(', ')} (el tag entra en los nombres de archivo)`);
}

const P = (rel) => path.join(home, rel);
const stamp = () => new Date().toISOString().slice(11, 19);
const timings = [];
const progressSteps = {};
for (const s of STEPS) {
	progressSteps[s] = {name: s, status: range.includes(s) ? 'pending' : 'out_of_range', seconds: null, estimatedSeconds: null};
}
const progressStartedAt = new Date().toISOString();
let progressStatus = 'running';

function safeState(fn, label) {
	if (dryRun) return; // un dry-run no escribe estado
	try {
		fn();
	} catch (e) {
		console.warn(`[state] no se pudo registrar (${label}): ${e.message}`);
	}
}

function shellQuote(arg) {
	return `'${String(arg).replace(/'/g, `'\\''`)}'`;
}

function run(cmd, args, label, cwd = home, heavy = false) {
	const full = `${cmd} ${args.map(shellQuote).join(' ')}`;
	console.log(`[${stamp()}] $ ${full}`);
	if (dryRun) return;
	if (heavy && HEAVY_LOCK) {
		const r = spawnSync('flock', [HEAVY_LOCK, '-c', full], {cwd, stdio: 'inherit'});
		if (r.error) throw r.error;
		if (r.status !== 0) throw Error(`${label} falló (código ${r.status})`);
		return;
	}
	const r = spawnSync(cmd, args, {cwd, stdio: 'inherit'});
	if (r.error) throw r.error;
	if (r.status !== 0) throw Error(`${label} falló (código ${r.status})`);
}

// Captura la salida (para parsear enlaces); lanza si el comando falla.
function runCapture(cmd, args, label, cwd = home) {
	const full = `${cmd} ${args.map(shellQuote).join(' ')}`;
	console.log(`[${stamp()}] $ ${full}`);
	if (dryRun) return '';
	const r = spawnSync(cmd, args, {cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024});
	if (r.error) throw r.error;
	if (r.status !== 0) throw Error(`${label} falló (código ${r.status}): ${(r.stderr || '').slice(0, 500)}`);
	return (r.stdout || '') + (r.stderr || '');
}

// mtime de un archivo, o de una carpeta: min (artefacto: el archivo
// más antiguo manda) o max (entrada: el más reciente invalida).
// null si no existe o si la carpeta está vacía (artefacto vacío = falta).
function dirMtime(rel, mode) {
	const abs = P(rel);
	let st;
	try {
		st = statSync(abs);
	} catch {
		return null;
	}
	if (!st.isDirectory()) return st.mtimeMs;
	const acc = mode === 'min' ? Infinity : -Infinity;
	const walk = (d) => {
		let best = acc;
		for (const e of readdirSync(d, {withFileTypes: true})) {
			const p = path.join(d, e.name);
			if (e.isDirectory()) best = mode === 'min' ? Math.min(best, walk(p)) : Math.max(best, walk(p));
			else if (e.isFile()) best = mode === 'min' ? Math.min(best, statSync(p).mtimeMs) : Math.max(best, statSync(p).mtimeMs);
		}
		return best;
	};
	const v = walk(abs);
	return Number.isFinite(v) ? v : null;
}

// Un paso está hecho si existen TODOS sus artefactos y son más
// recientes que TODAS sus entradas.
function artifactsFresh(artifacts, inputs) {
	if (!artifacts.length) return false;
	for (const a of artifacts) {
		if (dirMtime(a, 'min') === null) return false;
	}
	const oldestArtifact = Math.min(...artifacts.map((a) => dirMtime(a, 'min')));
	for (const input of inputs) {
		const im = dirMtime(input, 'max');
		if (im !== null && im > oldestArtifact) return false;
	}
	return true;
}

function writeProgress() {
	if (dryRun) return; // un dry-run no escribe informes
	const dir = P('reports');
	mkdirSync(dir, {recursive: true});
	const steps = STEPS.filter((s) => range.includes(s)).map((s) => progressSteps[s]);
	const elapsed = timings.reduce((sum, t) => sum + t.seconds, 0);
	const estimated = steps.reduce((sum, s) => sum + (s.estimatedSeconds ?? 0), 0);
	const payload = {
		project: projectId, tag: tag || null, status: progressStatus,
		startedAt: progressStartedAt, updatedAt: new Date().toISOString(),
		range, elapsedSeconds: elapsed, estimatedSeconds: estimated,
		steps,
	};
	writeFileSync(path.join(dir, 'reel-progress.json'), JSON.stringify(payload, null, 2) + '\n');
	const lines = [`# Progreso del reel — ${projectId}${tag ? ` (${tag})` : ''}`, '', `Estado: **${progressStatus}** · actualizado ${payload.updatedAt}`, `Rango: ${range.join(' → ')}`, `Tiempo: ${formatDuration(elapsed)} transcurrido de ${formatDuration(estimated)} estimados`, '', '| Paso | Estado | Estimado | Real |', '|---|---|---|---|'];
	for (const s of steps) {
		lines.push(`| ${s.name} | ${s.status} | ${s.estimatedSeconds != null ? formatDuration(s.estimatedSeconds) : '—'} | ${s.seconds != null ? formatDuration(s.seconds) : '—'} |`);
	}
	lines.push('', `Reanudar: \`node scripts/reel.mjs ${projectId}${tag ? ` --tag ${tag}` : ''} --from <paso>\``);
	writeFileSync(path.join(dir, 'reel-progress.md'), lines.join('\n') + '\n');
}

function step(name, artifacts, fn, {inputs = [], heavy = false, skipIf = null} = {}) {
	if (!range.includes(name)) return;
	const phase = STEP_PHASE[name];
	progressSteps[name].status = 'running';
	progressSteps[name].estimatedSeconds = estimates[name] ?? null;
	const skip = !force && (skipIf ? skipIf() : artifactsFresh(artifacts, inputs));
	if (skip) {
		console.log(`[${stamp()}] == ${name}: salto (artefactos presentes y recientes: ${artifacts.join(', ')})`);
		progressSteps[name].status = 'skipped';
		safeState(() => recordMilestone(ROOT, projectId, phase, `${name}: artefactos ya presentes (salto)`, {status: 'done', artifacts}), `salto ${name}`);
		writeProgress();
		return;
	}
	if (force) {
		for (const a of artifacts) rmSync(P(a), {force: true, recursive: true});
	}
	console.log(`[${stamp()}] == ${name}: inicio (estimado ${formatDuration(estimates[name] ?? 0)})`);
	// Sin note: setPhase con note SOBRESCRIBE la nota curada de la
	// fase (p. ej. «-16,2 LUFS, TP -2,1 dBTP» en qa) por un «en
	// curso» transitorio. El hito de fin registra el evento.
	safeState(() => setPhase(ROOT, projectId, phase, 'in_progress'), `inicio ${name}`);
	writeProgress();
	const t0 = Date.now();
	try {
		fn(heavy);
	} catch (e) {
		progressSteps[name].status = 'failed';
		progressStatus = 'failed';
		writeProgress();
		// Sin note en setPhase (ver inicio): el hito registra el
		// motivo del fallo sin borrar la nota curada de la fase.
		safeState(() => setPhase(ROOT, projectId, phase, 'failed'), `fallo ${name}`);
		safeState(() => recordMilestone(ROOT, projectId, phase, `${name}: falló — ${e.message}`, {status: 'failed'}), `fallo ${name}`);
		console.error(`\nREEL_FAILED paso=${name} proyecto=${projectId}${tag ? ` tag=${tag}` : ''}`);
		console.error(`Reanudar: node scripts/reel.mjs ${projectId}${tag ? ` --tag ${tag}` : ''} --from ${name}`);
		throw e;
	}
	const secs = Math.round((Date.now() - t0) / 1000);
	const stillMissing = artifacts.filter((a) => dirMtime(a, 'min') === null);
	if (stillMissing.length && !dryRun) {
		throw Error(`${name} terminó sin producir: ${stillMissing.join(', ')}`);
	}
	timings.push({step: name, seconds: secs});
	progressSteps[name].status = 'done';
	progressSteps[name].seconds = secs;
	console.log(`[${stamp()}] == ${name}: OK en ${secs}s (estimado ${formatDuration(estimates[name] ?? 0)})`);
	safeState(() => recordMilestone(ROOT, projectId, phase, `${name} completado por reel (${secs}s)`, {status: 'done', artifacts}), `fin ${name}`);
	writeProgress();
}

// --- Rutas derivadas de la configuración ---
const audioCfg = cfg.audio ?? {};
const stems = audioCfg.stems ?? [];
const mixWav = audioCfg.mix ?? 'public/audio/mix.wav';
const auditInputs = audioCfg.auditInputs ?? [];
const preflightManifest = cfg.preflight?.manifest ?? 'preflight-scenes.json';
const renderCfg = cfg.render ?? {};
const chunksFile = renderCfg.concatOut ?? `out/${projectId}-chunks.mkv`;
const masterMp4 = `out/MASTER-${tag}.mp4`;
const lightMp4 = `out/LIGERA-${tag}.mp4`;
const preAuditReport = 'research/audit-pre/audio-audit-pre.json';
const auditReport = `research/audit-${tag}/audio-audit-${tag}.json`;
const frames = Number(data.durationInFrames ?? 0);
const fps = Number(data.fps ?? 30);
const audioS = frames ? frames / fps : 0;

function manifestScenes() {
	try {
		const m = JSON.parse(readFileSync(P(preflightManifest), 'utf8'));
		const scenes = Array.isArray(m) ? m : (m.scenes ?? []);
		return scenes;
	} catch {
		return [];
	}
}

const estimates = estimateSteps({
	audioS, frames,
	scenes: manifestScenes().length || 10,
	cuts: Math.max(0, (manifestScenes().length || 10) - 1),
});

if (estimateOnly || dryRun) {
	const total = range.reduce((s, n) => s + (estimates[n] ?? 0), 0);
	console.log(`Estimación del reel — ${projectId}${tag ? ` (${tag})` : ''} (rango ${range.join(' → ')})`);
	for (const n of range) {
		console.log(`  ${n.padEnd(12)} ${formatDuration(estimates[n] ?? 0)}`);
	}
	console.log(`  TOTAL: ${formatDuration(total)}`);
	console.log('Tasas medidas: v4 negacion-embargo + docs/SPEED-2026-11-19.md (render 0,08 s/f; máster 0,66x; QA 0,34x + auditoría 0,3x; fantasma 8 s/corte).');
	if (estimateOnly) process.exit(0);
	console.log('(dry-run: no se ejecuta nada)\n');
}

step('audio', stems, () => {
	const script = audioCfg.buildScript ?? 'scripts/build-audio.sh';
	if (!existsSync(P(script))) throw Error(`falta ${script} (reel.json: audio.buildScript)`);
	run('bash', [P(script)], 'build-audio', home);
}, {inputs: audioCfg.inputs ?? []});

step('mix', [mixWav], () => {
	const script = audioCfg.mixScript ?? 'scripts/run-mix.py';
	if (!existsSync(P(script))) throw Error(`falta ${script} (reel.json: audio.mixScript)`);
	// --force siempre: el paso solo corre cuando el artefacto falta o
	// está rancio (frescura); la herramienta rechaza sobrescribir sin
	// él y la frescura del orquestador es el único mecanismo de salto.
	run(VENV_PY, [P(script), '--force'], 'run-mix', home);
}, {inputs: stems});

step('audit-inputs', auditInputs, () => {
	const script = audioCfg.auditInputsScript ?? 'scripts/build-audit-inputs.py';
	if (!existsSync(P(script))) throw Error(`falta ${script} (reel.json: audio.auditInputsScript)`);
	run(VENV_PY, [P(script)], 'build-audit-inputs', home);
	// La transcripción de la VO editada (P0-1): en v4 se generó ad-hoc,
	// sin script. Incluye la corrección de snaps de frontera.
	run(VENV_PY, [P(script), '--transcribe-edited'], 'transcribe-edited', home);
}, {inputs: [...stems, 'src/captions.ts', 'research/timeline.json',
	'research/vo/l1-words-small.json', 'research/vo/vo-transcription-small.json']});

step('pre-audit', [preAuditReport], () => {
	const script = audioCfg.auditScript ?? 'scripts/run-audit.py';
	if (!existsSync(P(script))) throw Error(`falta ${script} (reel.json: audio.auditScript)`);
	// Puerta dura P0-2: 0 FAIL sobre insumos antes de renderizar.
	run(VENV_PY, [P(script), '--pre', '--tag', 'pre'], 'pre-auditoría', home);
}, {inputs: [...auditInputs, mixWav]});

step('preflight', ['reports/preflight.json'], (heavy) => {
	if (dryRun) {
		run(VENV_PY, [path.join(ROOT, 'scripts/visual-preflight.py'),
			'--project', projectId, '--stills',
			'--manifest', P(preflightManifest),
			'--out', P('reports/preflight.json')], 'visual-preflight', home, heavy);
		return;
	}
	if (!existsSync(P(preflightManifest))) {
		throw Error(`falta ${preflightManifest}: el pre-vuelo necesita un manifiesto de escenas {name, start, end} (derivarlo de research/timeline.json o escribirlo a mano)`);
	}
	run(VENV_PY, [path.join(ROOT, 'scripts/visual-preflight.py'),
		'--project', projectId, '--stills',
		'--manifest', P(preflightManifest),
		'--out', P('reports/preflight.json')], 'visual-preflight', home, heavy);
	// Puerta dura: un fotograma bloqueante para el pipeline. El
	// informe trae la muestra limpia por escena para el ojo humano.
	const rep = JSON.parse(readFileSync(P('reports/preflight.json'), 'utf8'));
	if (Number(rep.blocking_frames ?? 0) > 0) {
		const flags = (rep.results ?? []).flatMap((r) => (r.flags ?? [])
			.filter((f) => f.severity === 'BLOCK')
			.map((f) => `  ${r.frame} [${r.scene}] ${f.check}: ${f.detail}`));
		throw Error(`pre-vuelo bloqueante (${rep.blocking_frames} fotograma(s)):\n${flags.join('\n')}\nCorregir el layout y reanudar con --from preflight. Stills en out/preflight-stills/.`);
	}
}, {inputs: ['research/timeline.json', 'src', 'public'], heavy: true});

step('render', [chunksFile], (heavy) => {
	const r = renderCfg;
	const args = [path.join(ROOT, 'scripts/render-chunks.mjs'), projectId,
		'--composition', String(cfg.composition ?? 'MainReel'),
		'--frames', `0-${frames - 1}`,
		'--chunk', String(r.chunk ?? 150),
		'--concurrency', String(r.concurrency ?? 2),
		'--timeout', String(r.timeout ?? 120000),
		'--crf', String(r.crf ?? data.crf ?? 19),
		'--out', String(r.chunksDir ?? 'out/chunks'),
		'--concat-out', chunksFile,
		'--resume'];
	if (r.videoOnly === true) args.push('--video-only');
	else if (r.audioCodec) args.push('--audio-codec', String(r.audioCodec));
	if (r.lock !== false) args.push('--lock');
	if (r.draft === true) args.push('--draft');
	run(process.execPath, args, 'render-chunks', home, heavy);
}, {inputs: ['research/timeline.json', 'src/captions.ts', 'src', 'public'], heavy: true});

step('master', [masterMp4, lightMp4], (heavy) => {
	const m = cfg.master ?? {};
	const args = [path.join(ROOT, 'scripts/audio/master.py'),
		'--input', chunksFile];
	if (renderCfg.videoOnly === true) args.push('--mix', mixWav);
	args.push('--out-master', masterMp4, '--out-light', lightMp4);
	if (m.cleanAudio !== false) args.push('--clean-audio');
	if (m.gainDb) args.push('--gain-db', String(m.gainDb));
	if (m.lightWidth) args.push('--light-width', String(m.lightWidth));
	if (m.lightCrf) args.push('--light-crf', String(m.lightCrf));
	args.push('--force'); // ver mix: la frescura del orquestador manda
	run(VENV_PY, args, 'master', home, heavy);
}, {inputs: renderCfg.videoOnly === true ? [chunksFile, mixWav] : [chunksFile], heavy: true});

step('qa', ['reports/technical-qa-master.json', 'reports/technical-qa-light.json'], (heavy) => {
	const trailingMax = String(cfg.qa?.trailingSilenceMax ?? 3.5);
	run(process.execPath, [path.join(ROOT, 'scripts/qa-media.mjs'),
		projectId, '--file', P(masterMp4), '--mode', 'full',
		'--trailing-silence-max', trailingMax], 'qa-media master', home, heavy);
	if (!dryRun) {
		// qa-media escribe un solo reports/technical-qa.json: se
		// congela una copia por archivo antes del siguiente paso.
		copyFileSync(P('reports/technical-qa.json'), P('reports/technical-qa-master.json'));
		// La ligera: sonda ffprobe + decodificación completa. Sin
		// qa-media: su audio se re-codifica a AAC 128k y la puerta
		// de sonoridad (-16,5..-12 LUFS) tiene solo 0,3 LUFS de
		// margen sobre el máster v4 (-16,2); un FAIL de sonoridad
		// en la ligera sería un falso positivo de re-codificación,
		// no un defecto del reel. El máster sí pasa la puerta.
		const probe = runCapture('ffprobe', ['-v', 'error', '-count_frames',
			'-show_entries', 'stream=codec_type,width,height,nb_read_frames,duration',
			'-show_entries', 'format=duration', '-of', 'json', P(lightMp4)], 'ffprobe ligera');
		const obj = JSON.parse(probe);
		const vid = (obj.streams ?? []).find((s) => s.codec_type === 'video');
		const aud = (obj.streams ?? []).find((s) => s.codec_type === 'audio');
		if (!vid) throw Error('la ligera no tiene stream de video');
		const lightWidth = Number(cfg.master?.lightWidth ?? 720);
		const lightHeight = Math.round(lightWidth * data.height / data.width);
		const lightFrames = Number(vid.nb_read_frames || 0);
		const lightDur = Number(obj.format?.duration || 0);
		const failures = [];
		if (vid.width !== lightWidth || vid.height !== lightHeight) failures.push(`ligera ${vid.width}x${vid.height} != ${lightWidth}x${lightHeight}`);
		if (lightFrames !== frames) failures.push(`ligera ${lightFrames} fotogramas != ${frames}`);
		if (!Number.isFinite(lightDur) || Math.abs(lightDur - audioS) > 0.5) failures.push(`ligera ${lightDur}s difiere de ${audioS}s en más de 0,5 s`);
		if (data.audioRequired && !aud) failures.push('la ligera no tiene audio');
		runCapture('ffmpeg', ['-hide_banner', '-v', 'error', '-xerror',
			'-i', P(lightMp4), '-f', 'null', '-'], 'decode ligera');
		const lightReport = {engine: 'reel-qa-light', project: projectId, tag,
			file: path.basename(lightMp4), width: vid.width, height: vid.height,
			frames: lightFrames, expectedFrames: frames, durationSeconds: lightDur,
			expectedDurationSeconds: audioS, hasAudio: !!aud, decodeOkay: true,
			technicalStatus: failures.length ? 'failed' : 'passed', failures};
		writeFileSync(P('reports/technical-qa-light.json'), JSON.stringify(lightReport, null, 2) + '\n');
		if (failures.length) throw Error(`QA ligera: ${failures.join('; ')}`);
	}
}, {inputs: [masterMp4, lightMp4], heavy: true});

step('ghost', ['reports/ghost-frames.json'], (heavy) => {
	if (cfg.ghost?.enabled === false || skipGhost) {
		const reason = cfg.ghost?.enabled === false ? 'desactivado en reel.json' : '--skip-ghost (revisado a mano)';
		console.log(`[${stamp()}] == ghost: omitido (${reason})`);
		if (!dryRun) {
			mkdirSync(P('reports'), {recursive: true});
			writeFileSync(P('reports/ghost-frames.json'), JSON.stringify({project: projectId, tag, enabled: false, skipped: true, reason}, null, 2) + '\n');
		}
		return;
	}
	if (dryRun) {
		run(VENV_PY, [path.join(ROOT, 'scripts/ghost-frames.py'),
			P(masterMp4), '--scenes', P(preflightManifest),
			'--out', P('reports/ghost-frames.json'),
			'--mark-dir', P('reports/ghost-frames')], 'ghost-frames', home, heavy);
		return;
	}
	// Puerta dura P0-4: exit 1 si hay GHOST o REVISAR en un corte.
	run(VENV_PY, [path.join(ROOT, 'scripts/ghost-frames.py'),
		P(masterMp4), '--scenes', P(preflightManifest),
		'--out', P('reports/ghost-frames.json'),
		'--mark-dir', P('reports/ghost-frames')], 'ghost-frames', home, heavy);
}, {inputs: [masterMp4, preflightManifest], heavy: true,
	skipIf: () => {
		// El marcador vale solo si coincide con la configuración
		// actual: un informe real solo vale con el check activado;
		// un marcador de omitido solo vale si sigue omitido.
		const marker = P('reports/ghost-frames.json');
		if (!existsSync(marker)) return false;
		if (!artifactsFresh(['reports/ghost-frames.json'], [masterMp4, preflightManifest])) return false;
		try {
			const m = JSON.parse(readFileSync(marker, 'utf8'));
			const enabled = cfg.ghost?.enabled !== false && !skipGhost;
			return m.enabled === undefined ? enabled : m.enabled === enabled;
		} catch {
			return false;
		}
	}});

step('audit', [auditReport], (heavy) => {
	const script = audioCfg.auditScript ?? 'scripts/run-audit.py';
	if (!existsSync(P(script))) throw Error(`falta ${script} (reel.json: audio.auditScript)`);
	// Puerta dura: 0 FAIL sobre el máster (AGENTS.md: ningún reel se
	// entrega sin pasar la auditoría).
	run(VENV_PY, [P(script), masterMp4, '--tag', tag], 'auditoría final', home, heavy);
}, {inputs: [masterMp4, ...auditInputs, mixWav], heavy: true});

step('deliver', [`reports/delivery-${tag}.json`], () => {
	if (!deliverFlag) {
		// Sin --deliver no se sube nada. Si ya existe una entrega real
		// para este tag, se conserva (no se sobrescribe con un
		// marcador de omitido); si no, se deja un marcador para que
		// la frescura no re-ejecute el paso en cada corrida.
		const marker = P(`reports/delivery-${tag}.json`);
		let real = false;
		try {
			real = existsSync(marker) && !JSON.parse(readFileSync(marker, 'utf8')).skipped;
		} catch { /* marcador corrupto: se re-escribe abajo */ }
		if (real) {
			console.log(`[${stamp()}] == deliver: ya entregado (${tag}), nada que hacer`);
			return;
		}
		console.log(`[${stamp()}] == deliver: omitido (pasa --deliver para subir a Drive + Muse storage)`);
		if (!dryRun) {
			mkdirSync(P('reports'), {recursive: true});
			writeFileSync(marker, JSON.stringify({project: projectId, tag,
				createdAt: new Date().toISOString(), skipped: true,
				reason: 'sin --deliver'}, null, 2) + '\n');
		}
		return;
	}
	const d = cfg.deliver ?? {};
	const report = {project: projectId, tag, createdAt: new Date().toISOString(), drive: {}, muse: {}};
	const driveUpload = (file) => {
		if (!data.drivePath) throw Error('reel.json: deliver.drive activado pero project.json no tiene drivePath');
		const driveBase = assertDrivePath(data.drivePath);
		const base = path.basename(file);
		const remoteDir = `media:${driveBase}/masters`;
		const dest = `${remoteDir}/${base}`;
		// Reanudable: si el archivo ya está en Drive (entrega parcial
		// anterior), no se re-sube; se reutiliza y se toma el enlace.
		// En dry-run no se toca la red: solo se muestra el comando.
		if (!dryRun) {
			const ls = spawnSync('rclone', ['lsf', dest], {encoding: 'utf8'});
			if (ls.status === 0 && (ls.stdout || '').trim()) {
				console.log(`[${stamp()}] == deliver: ${base} ya existe en Drive, se reutiliza`);
				const lk = spawnSync('rclone', ['link', dest], {encoding: 'utf8'});
				return {file: base, status: 'already_exists',
					driveUrl: lk.status === 0 ? lk.stdout.trim() : null};
			}
		}
		run(process.execPath, [path.join(ROOT, 'scripts/drive-upload.mjs'),
			projectId, '--file', P(file)], `drive-upload ${base}`, home);
		if (!dryRun) {
			copyFileSync(P('reports/drive-delivery.json'),
				P(`reports/drive-delivery-${base.replace(/\.mp4$/, '')}.json`));
			return JSON.parse(readFileSync(P('reports/drive-delivery.json'), 'utf8'));
		}
		return {file: base, status: 'dry-run'};
	};
	const museUpload = (file) => {
		const out = runCapture(REMOTE_STORAGE, ['upload-file', '--path', P(file)], `muse-storage ${path.basename(file)}`);
		if (dryRun) return {file: path.basename(file), status: 'dry-run'};
		// La salida trae el enlace (y su vencimiento); se extrae el
		// primer https:// aunque el formato cambie.
		const url = (out.match(/https:\/\/\S+/) || [])[0] || null;
		const expires = (out.match(/expir\w*[^0-9A-Za-z]*([0-9T:+-]+)/i) || [])[1] || null;
		if (!url) console.warn(`[deliver] no se pudo extraer el enlace Muse de: ${out.slice(0, 300)}`);
		return {file: path.basename(file), status: url ? 'uploaded' : 'uploaded_no_link', url, expiresAt: expires};
	};
	if (d.drive !== false) {
		report.drive.master = driveUpload(masterMp4);
		report.drive.light = driveUpload(lightMp4);
	}
	if (d.museStorage !== false) {
		report.muse.master = museUpload(masterMp4);
		report.muse.light = museUpload(lightMp4);
	}
	if (!dryRun) {
		writeFileSync(P(`reports/delivery-${tag}.json`), JSON.stringify(report, null, 2) + '\n');
	}
}, {inputs: [masterMp4, lightMp4, auditReport],
	skipIf: () => {
		// El marcador vale según su estado: una entrega real vale
		// siempre; un marcador de omitido solo vale sin --deliver
		// (con --deliver, una corrida posterior SÍ debe subir).
		const marker = P(`reports/delivery-${tag}.json`);
		if (!existsSync(marker)) return false;
		if (!artifactsFresh([`reports/delivery-${tag}.json`], [masterMp4, lightMp4, auditReport])) return false;
		try {
			const m = JSON.parse(readFileSync(marker, 'utf8'));
			return m.skipped ? !deliverFlag : true;
		} catch {
			return false;
		}
	}});

progressStatus = 'done';
writeProgress();
const total = timings.reduce((s, t) => s + t.seconds, 0);
console.log(`\nREEL_OK proyecto=${projectId}${tag ? ` tag=${tag}` : ''} pasos=${range.join(',')}`);
for (const t of timings) console.log(`  ${t.step}: ${t.seconds}s (estimado ${formatDuration(estimates[t.step] ?? 0)})`);
console.log(`  TOTAL (solo pasos ejecutados): ${total}s`);
console.log(`Progreso: projects/${projectId}/reports/reel-progress.md`);
console.log(`Reanudar desde una fase: node scripts/reel.mjs ${projectId}${tag ? ` --tag ${tag}` : ''} --from <paso>`);
const deliveryPath = tag ? P(`reports/delivery-${tag}.json`) : null;
if (deliveryPath && existsSync(deliveryPath)) {
	try {
		const rep = JSON.parse(readFileSync(deliveryPath, 'utf8'));
		if (rep.muse?.master?.url) console.log(`Enlace máster: ${rep.muse.master.url}`);
		if (rep.muse?.light?.url) console.log(`Enlace ligera: ${rep.muse.light.url}`);
		if (rep.drive?.master?.driveUrl) console.log(`Drive máster: ${rep.drive.master.driveUrl}`);
		if (rep.drive?.light?.driveUrl) console.log(`Drive ligera: ${rep.drive.light.driveUrl}`);
	} catch { /* el informe de entrega es informativo */ }
}
