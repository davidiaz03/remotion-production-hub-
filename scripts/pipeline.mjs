/**
 * Orquestador del pipeline de video largo en UN solo comando, con
 * reanudación, estimación de tiempo e informe de progreso por etapa.
 *
 * En modern-wisdom-aprende (19-nov-2026) cada fase la lanzó un agente
 * a mano: entre fases hubo esperas, STATE.json quedó desactualizado
 * y la música se regeneró desde cero. Este orquestador ejecuta las
 * fases en orden, salta las que ya tienen sus artefactos verificados
 * (y más recientes que sus entradas), registra cada paso en
 * STATE.json con su estado real y, si algo falla, para e imprime el
 * comando exacto para reanudar desde esa fase.
 *
 * Configuración: projects/<id>/pipeline.json (ver templates/pipeline.json).
 * El orquestador NO escribe guiones ni compone escenas: eso sigue
 * siendo trabajo creativo del agente. Empieza cuando existen el guion
 * de VO (vo-manifest.json + vo-chapters/), el guion de captions
 * (vo-captions.json), la composición (src/, project.json) y las
 * escenas (scenes.json + chapters.json).
 *
 * Uso:
 *   node scripts/pipeline.mjs <proyecto> [--from vo] [--to qa]
 *     [--force] [--dry-run] [--estimate]
 *   node scripts/pipeline.mjs modern-wisdom-aprende --from music
 *   node scripts/pipeline.mjs modern-wisdom-aprende --estimate
 *
 * Fases: vo, merge, captions, align, timeline, music, mix, preflight,
 * render, master, encode, chapters, qa.
 * --from/--to seleccionan el rango. --force rehace desde --from
 * (borra los artefactos de esas fases antes de empezar). Sin --force,
 * cada fase salta si sus artefactos existen y son más recientes que
 * sus entradas (así, re-correr desde captions re-alinea y
 * re-construye la timeline, pero no re-sintetiza la VO).
 * --estimate imprime la estimación por fase y sale sin ejecutar.
 * --dry-run lista los pasos (con estimación) sin ejecutar nada.
 *
 * Candados: los pasos pesados (vo, captions, render, master, encode,
 * qa, preflight) se serializan con otros trabajos si está definido
 * HUB_HEAVY_LOCK (ruta de un archivo flock, p. ej.
 * /tmp/noche-ecosistemas-heavy.lock). El render toma ADEMÁS el
 * candado único de render (render-chunks --lock). Orden de
 * adquisición siempre: heavy-lock (externo) → render-lock (interno);
 * nunca al revés (evita interbloqueo).
 *
 * Informe de progreso: reports/pipeline-progress.json (+ .md) se
 * actualiza tras cada paso con estado, tiempo real y estimado.
 */
import {existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {HUB, ROOT, loadProject, parseArgs} from './lib.mjs';
import {recordMilestone, setPhase} from './state.mjs';

const HOME = process.env.HOME || '';
const VENV_PY = process.env.HUB_PY || path.join(HUB, '.venv/bin/python');
const STT_PY = path.join(HOME, 'workspace/.stt-env/bin/python');
const SYS_PY = 'python3';
const HEAVY_LOCK = process.env.HUB_HEAVY_LOCK || '';

const STEPS = ['vo', 'merge', 'captions', 'align', 'timeline', 'music', 'mix', 'preflight', 'render', 'master', 'encode', 'chapters', 'qa'];
// Fase de STATE.json que marca cada paso del pipeline.
const STEP_PHASE = {
	vo: 'vo', merge: 'vo', captions: 'captions', align: 'captions',
	timeline: 'render', music: 'mix', mix: 'mix', preflight: 'render',
	render: 'render', master: 'qa', encode: 'delivery',
	chapters: 'delivery', qa: 'qa',
};
// Pasos que cargan la CPU de forma sostenida (se serializan con
// HUB_HEAVY_LOCK cuando está definido).
const HEAVY_STEPS = new Set(['vo', 'captions', 'preflight', 'render', 'master', 'encode', 'qa']);

// --- Estimación (tasas medidas, docs/SPEED-2026-11-19.md + longform-v2) --
// audioS = segundos de VO; frames = fotogramas a renderizar; chars =
// caracteres del guion de VO. Cada tasa anota su fuente.
export const RATES = {
	voRtf: 1.6, // Kokoro 1 proceso/2 hilos, RTF 1,57 medido 19-nov
	voLoadS: 40, // carga del modelo (~30 s) + arranque
	charsPerAudioS: 15.45, // MW: 30.262 car -> 1.958,6 s de audio
	captionsPerAudioS: 0.3, // Whisper small int8, ~0,15-0,3x (SPEED §5)
	alignPerAudioS: 0.05, // envolvente numpy, sin Whisper
	musicFixedS: 90, // bed-loop + 2 pases loudnorm sobre la salida
	mixFixedS: 60, // numpy + loudnorm sobre la mezcla
	preflightPerSceneS: 20, // 1 still por escena (Chromium + análisis)
	renderPerFrameS: 0.08, // tramos 900 f: 72 s/900 f medidos 19-nov
	masterPerAudioS: 0.15, // copia de video + encode AAC
	encodePerAudioS: 0.66, // 720p CRF21 0,42x + 360p CRF24 0,24x
	qaPerAudioS: 0.18, // qa-media un pase: 363 s / 1.959 s medidos
	auditFixedS: 180, // audit-audio sobre video largo (~2-3 min)
};

export function estimateSteps({audioS, frames, chars, scenes, audit}) {
	const voAudioS = audioS || (chars ? chars / RATES.charsPerAudioS : 0);
	const est = {
		vo: Math.round(voAudioS * RATES.voRtf + RATES.voLoadS),
		merge: 10,
		captions: Math.round(voAudioS * RATES.captionsPerAudioS + 30),
		align: Math.round(voAudioS * RATES.alignPerAudioS + 10),
		timeline: 10,
		music: RATES.musicFixedS,
		mix: RATES.mixFixedS,
		preflight: Math.round((scenes ?? 10) * RATES.preflightPerSceneS),
		render: Math.round(frames * RATES.renderPerFrameS),
		master: Math.round(voAudioS * RATES.masterPerAudioS + 30),
		encode: Math.round(voAudioS * RATES.encodePerAudioS),
		chapters: 5,
		qa: Math.round(voAudioS * RATES.qaPerAudioS + 120 + (audit ? RATES.auditFixedS : 0)),
	};
	return est;
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
	throw Error('Use: node scripts/pipeline.mjs <proyecto> [--from vo] [--to qa] [--force] [--dry-run] [--estimate]');
}
const {home, data} = loadProject(projectId);
const cfgPath = path.join(home, 'pipeline.json');
if (!existsSync(cfgPath)) {
	throw Error(`Falta ${path.relative(ROOT, cfgPath)} (copia templates/pipeline.json y ajústalo)`);
}
const cfg = JSON.parse(readFileSync(cfgPath, 'utf8'));
const from = String(opts.from ?? STEPS[0]);
const to = String(opts.to ?? STEPS[STEPS.length - 1]);
const force = opts.force === true || opts.force === 'true';
const dryRun = opts['dry-run'] === true || opts['dry-run'] === 'true';
const estimateOnly = opts.estimate === true || opts.estimate === 'true';
if (!STEPS.includes(from) || !STEPS.includes(to)) {
	throw Error(`--from/--to deben ser fases válidas: ${STEPS.join(', ')}`);
}
const range = STEPS.slice(STEPS.indexOf(from), STEPS.indexOf(to) + 1);
if (!range.length) throw Error(`Rango vacío: --from ${from} está después de --to ${to}`);

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

function probeDuration(file) {
	const r = spawnSync('ffprobe', ['-v', 'error', '-show_entries',
		'format=duration', '-of', 'csv=p=0', file], {encoding: 'utf8'});
	if (r.status !== 0) throw Error(`ffprobe falló sobre ${file}`);
	return Number(r.stdout.trim());
}

function mtimeOrNull(rel) {
	try {
		return statSync(P(rel)).mtimeMs;
	} catch {
		return null;
	}
}

// Un paso está hecho si existen TODOS sus artefactos y son más
// recientes que TODAS sus entradas (así un re-render desde captions
// re-alinea, pero no re-sintetiza la VO intacta).
function artifactsFresh(artifacts, inputs) {
	if (!artifacts.length) return false;
	for (const a of artifacts) {
		if (!existsSync(P(a))) return false;
	}
	const oldestArtifact = Math.min(...artifacts.map((a) => mtimeOrNull(a)));
	for (const input of inputs) {
		const im = mtimeOrNull(input);
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
		project: projectId, status: progressStatus,
		startedAt: progressStartedAt, updatedAt: new Date().toISOString(),
		range, elapsedSeconds: elapsed, estimatedSeconds: estimated,
		steps,
	};
	writeFileSync(path.join(dir, 'pipeline-progress.json'), JSON.stringify(payload, null, 2) + '\n');
	const lines = [`# Progreso del pipeline — ${projectId}`, '', `Estado: **${progressStatus}** · actualizado ${payload.updatedAt}`, `Rango: ${range.join(' → ')}`, `Tiempo: ${formatDuration(elapsed)} transcurrido de ${formatDuration(estimated)} estimados`, '', '| Paso | Estado | Estimado | Real |', '|---|---|---|---|'];
	for (const s of steps) {
		lines.push(`| ${s.name} | ${s.status} | ${s.estimatedSeconds != null ? formatDuration(s.estimatedSeconds) : '—'} | ${s.seconds != null ? formatDuration(s.seconds) : '—'} |`);
	}
	lines.push('', 'Reanudar: `node scripts/pipeline.mjs ' + projectId + ' --from <fase>`');
	writeFileSync(path.join(dir, 'pipeline-progress.md'), lines.join('\n') + '\n');
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
		for (const a of artifacts) rmSync(P(a), {force: true});
	}
	console.log(`[${stamp()}] == ${name}: inicio (estimado ${formatDuration(estimates[name] ?? 0)})`);
	safeState(() => setPhase(ROOT, projectId, phase, 'in_progress', {note: `${name} en curso (pipeline)`}), `inicio ${name}`);
	writeProgress();
	const t0 = Date.now();
	try {
		fn(heavy);
	} catch (e) {
		progressSteps[name].status = 'failed';
		progressStatus = 'failed';
		writeProgress();
		safeState(() => setPhase(ROOT, projectId, phase, 'failed', {note: `${name}: ${e.message}`}), `fallo ${name}`);
		console.error(`\nPIPELINE_FAILED paso=${name} proyecto=${projectId}`);
		console.error(`Reanudar: node scripts/pipeline.mjs ${projectId} --from ${name}`);
		throw e;
	}
	const secs = Math.round((Date.now() - t0) / 1000);
	const stillMissing = artifacts.filter((a) => !existsSync(P(a)));
	if (stillMissing.length && !dryRun) {
		throw Error(`${name} terminó sin producir: ${stillMissing.join(', ')}`);
	}
	timings.push({step: name, seconds: secs});
	progressSteps[name].status = 'done';
	progressSteps[name].seconds = secs;
	console.log(`[${stamp()}] == ${name}: OK en ${secs}s (estimado ${formatDuration(estimates[name] ?? 0)})`);
	safeState(() => recordMilestone(ROOT, projectId, phase, `${name} completado por pipeline (${secs}s)`, {status: 'done', artifacts}), `fin ${name}`);
	writeProgress();
}

const voManifest = cfg.voice?.manifest ?? 'vo-manifest.json';
const voFull = 'public/audio/vo-full.wav';
const voLines = 'vo-chapters/vo-full-lines.json';
const musicBed = 'public/audio/music-bed.wav';
const mixWav = 'public/audio/mix.wav';
const captionsJson = cfg.captions?.outJson ?? 'src/captions.json';
const captionsTs = cfg.captions?.out ?? 'src/captions.ts';
const timelineJson = 'src/timeline.json';
// Concat de tramos: .mkv salvo audio-codec aac/mp3 (v5: PCM por
// defecto). Antes el pipeline esperaba siempre .mp4 y el paso
// render fallaba tras la fusión (ver docs/LONGFORM-V2-2026-11-21.md).
const renderAudioCodec = String(cfg.render?.audioCodec ?? 'pcm-16');
const chunksExt = (renderAudioCodec === 'aac' || renderAudioCodec === 'mp3') ? 'mp4' : 'mkv';
const chunksFile = `out/${projectId}-chunks.${chunksExt}`;
const masterMp4 = `out/${projectId}-MASTER.mp4`;

// Duración de la VO (la necesitan música y mezcla). Se mide del WAV
// fusionado; si aún no existe, se estima del manifiesto (la mezcla la
// vuelve a medir, así que un error aquí no rompe nada).
function voDuration() {
	if (existsSync(P(voFull))) return probeDuration(P(voFull));
	return Number(cfg.voice?.seconds ?? 0);
}

// Caracteres del guion de VO (para estimar antes de sintetizar).
function voChars() {
	try {
		const man = JSON.parse(readFileSync(P(voManifest), 'utf8'));
		let total = 0;
		for (const ch of man.chapters ?? []) {
			const script = JSON.parse(readFileSync(P(ch.script), 'utf8'));
			for (const f of script.fragments ?? []) total += (f.text ?? '').length;
		}
		return total;
	} catch {
		return 0;
	}
}

function estimateFrames() {
	// La timeline (si existe) manda: es el total real. Si no, la VO
	// estimada en fotogramas + cola de 90 f.
	try {
		const tl = JSON.parse(readFileSync(P(timelineJson), 'utf8'));
		if (tl.totalFrames) return tl.totalFrames;
	} catch { /* sin timeline todavía */ }
	const audioS = voDuration() || voChars() / RATES.charsPerAudioS;
	return Math.round(audioS * Number(data.fps ?? 30)) + 90;
}

function preflightScenes() {
	try {
		const scenes = JSON.parse(readFileSync(P('preflight-scenes.json'), 'utf8'));
		return Array.isArray(scenes) ? scenes.length : (scenes.scenes?.length ?? 10);
	} catch {
		return 10;
	}
}

const estimates = estimateSteps({
	audioS: voDuration(),
	frames: estimateFrames(),
	chars: voChars(),
	scenes: preflightScenes(),
	audit: cfg.qa?.audit === true,
});

if (estimateOnly || dryRun) {
	const total = range.reduce((s, n) => s + (estimates[n] ?? 0), 0);
	console.log(`Estimación del pipeline — ${projectId} (rango ${range.join(' → ')})`);
	for (const n of range) {
		console.log(`  ${n.padEnd(10)} ${formatDuration(estimates[n] ?? 0)}`);
	}
	console.log(`  TOTAL: ${formatDuration(total)}`);
	console.log('Tasas medidas: docs/SPEED-2026-11-19.md (VO RTF 1,6; render 0,08 s/f a 900 f; QA 0,18x; encodes 0,66x).');
	if (estimateOnly) process.exit(0);
	console.log('(dry-run: no se ejecuta nada)\n');
}

step('vo', [], (heavy) => {
	// vo-batch.py salta solo los capítulos ya hechos; sin artefactos
	// declarados, este paso siempre se ejecuta (barato si no hay nada
	// que hacer: no carga el modelo).
	run(VENV_PY, [path.join(ROOT, 'scripts/audio/vo-batch.py'),
		'--manifest', voManifest, '--root', home], 'vo-batch', home, heavy);
}, {heavy: true});

step('merge', [voFull, voLines], () => {
	run(SYS_PY, [path.join(ROOT, 'scripts/audio/merge-vo.py'),
		'--manifest', voManifest, '--root', home,
		'--out', P(voFull), '--lines-out', P(voLines)], 'merge-vo');
}, {inputs: [voManifest]});

step('captions', [captionsTs, captionsJson, `out/${projectId}.srt`], (heavy) => {
	const args = [path.join(ROOT, 'scripts/audio/transcribe-vo.py'),
		'--vo', P(voFull), '--lines-json', P(voLines),
		'--script', P(cfg.captions?.script ?? 'vo-captions.json'),
		'--out', P(captionsTs),
		'--out-json', P(captionsJson),
		'--threads', String(cfg.captions?.threads ?? 2)];
	if (force) args.push('--force');
	run(STT_PY, args, 'transcribe-vo', home, heavy);
	run(process.execPath, [path.join(ROOT, 'scripts/export-srt.mjs'), projectId], 'export-srt');
}, {inputs: [voFull, voLines], heavy: true});

step('align', ['reports/align-captions.json'], () => {
	// Re-temporiza los inicios de palabra tras silencio desde los
	// onsets acústicos (Whisper los adelanta ~0,2 s de mediana).
	// Se alinean JSON (lo que renderiza la composición) y TS (lo
	// que lee export-srt.mjs) y se regenera el SRT. Sin --verify:
	// algunas palabras sin onset limpio quedarían sin corregir y
	// el gate de sincronía es la auditoría (g), no este paso.
	const report = P('reports/align-captions.json');
	if (!dryRun) mkdirSync(P('reports'), {recursive: true});
	run(VENV_PY, [path.join(ROOT, 'scripts/audio/align-captions.py'),
		'--voice', P(voFull), '--captions', P(captionsJson),
		'--out', P(captionsJson), '--report', report], 'align-captions json');
	run(VENV_PY, [path.join(ROOT, 'scripts/audio/align-captions.py'),
		'--voice', P(voFull), '--captions', P(captionsTs),
		'--out', P(captionsTs)], 'align-captions ts');
	run(process.execPath, [path.join(ROOT, 'scripts/export-srt.mjs'), projectId], 'export-srt');
}, {inputs: [captionsJson, voFull]});

step('timeline', [timelineJson], () => {
	const script = cfg.timeline?.script ?? 'scripts/build-timeline.mjs';
	if (dryRun) {
		// En dry-run no se valida nada: solo se muestra el comando.
		run(process.execPath, [P(script), '--real-only'], 'build-timeline');
		return;
	}
	if (!existsSync(P(script))) {
		if (existsSync(P(timelineJson))) {
			console.log(`[${stamp()}] == timeline: sin script ${script}, uso ${timelineJson} existente`);
			return;
		}
		throw Error(`falta ${script} y no existe ${timelineJson}: el proyecto necesita un constructor de timeline (ver templates/build-timeline.mjs)`);
	}
	run(process.execPath, [P(script), '--real-only'], 'build-timeline');
}, {inputs: [voLines]});

step('music', [musicBed], () => {
	const beds = cfg.music?.beds ?? [];
	if (!beds.length) throw Error('pipeline.json: music.beds vacío (elige camas de la biblioteca o importa una con scripts/audio/bed-import.py)');
	const args = [path.join(ROOT, 'scripts/audio/bed-loop.py')];
	for (const b of beds) args.push('--bed', String(b));
	const seconds = voDuration();
	if (!seconds) throw Error('no se pudo medir la duración de la VO para la cama musical');
	args.push('--seconds', String(seconds),
		'--xfade', String(cfg.music?.xfade ?? 3.0),
		'--target-lufs', String(cfg.music?.targetLufs ?? -16),
		'--out', P(musicBed));
	if (force) args.push('--force');
	run(VENV_PY, args, 'bed-loop');
}, {inputs: [voFull]});

step('mix', [mixWav], () => {
	const m = cfg.mix ?? {};
	const seconds = voDuration();
	if (!seconds) throw Error('no se pudo medir la duración de la VO para la mezcla');
	const args = [path.join(ROOT, 'scripts/audio/mix.py'),
		'--voice', P(voFull), '--music', P(musicBed),
		'--seconds', String(seconds), '--out', P(mixWav),
		'--target-lufs', String(m.targetLufs ?? -14.5),
		'--duck-threshold', String(m.duckThreshold ?? 0.08),
		'--duck-ratio', String(m.duckRatio ?? 5),
		'--duck-release', String(m.duckRelease ?? 180)];
	if (m.musicVolume !== undefined) args.push('--music-volume', String(m.musicVolume));
	if (force) args.push('--force');
	run(SYS_PY, args, 'mix');
}, {inputs: [voFull, musicBed]});

step('preflight', ['reports/preflight.json'], (heavy) => {
	if (cfg.preflight?.enabled !== true) {
		console.log(`[${stamp()}] == preflight: desactivado (pipeline.json: preflight.enabled)`);
		if (!dryRun) {
			mkdirSync(P('reports'), {recursive: true});
			writeFileSync(P('reports/preflight.json'), JSON.stringify({project: projectId, enabled: false, skipped: true}, null, 2) + '\n');
		}
		return;
	}
	if (dryRun) {
		run(VENV_PY, [path.join(ROOT, 'scripts/visual-preflight.py'),
			'--project', projectId, '--stills',
			'--manifest', P(cfg.preflight?.manifest ?? 'preflight-scenes.json'),
			'--out', P('reports/preflight.json')], 'visual-preflight', home, heavy);
		return;
	}
	const manifestRel = cfg.preflight?.manifest ?? 'preflight-scenes.json';
	if (!existsSync(P(manifestRel))) {
		// Sin manifiesto: se deriva de la timeline (las escenas ya
		// traen startFrame/endFrame). Así un proyecto largo no tiene
		// que mantener a mano unos límites que la timeline ya conoce.
		if (!existsSync(P(timelineJson))) {
			throw Error(`preflight activado pero falta ${manifestRel} y no hay ${timelineJson} del que derivarlo`);
		}
		const tl = JSON.parse(readFileSync(P(timelineJson), 'utf8'));
		const scenes = (tl.scenes ?? []).map((s, i) => ({
			name: `S${i + 1}-${s.type}`,
			start: s.startFrame,
			end: s.endFrame,
		}));
		if (!scenes.length) throw Error(`${timelineJson} no trae escenas para el pre-vuelo`);
		writeFileSync(P(manifestRel), JSON.stringify({project: projectId, fps: Number(data.fps ?? 30), scenes, logo_skip_scenes: []}, null, 2) + '\n');
		console.log(`[${stamp()}] == preflight: manifiesto derivado de ${timelineJson} (${scenes.length} escenas)`);
	}
	const args = [path.join(ROOT, 'scripts/visual-preflight.py'),
		'--project', projectId, '--stills',
		'--manifest', P(manifestRel),
		'--out', P('reports/preflight.json')];
	if (cfg.preflight?.args) args.push(...cfg.preflight.args.map(String));
	run(VENV_PY, args, 'visual-preflight', home, heavy);
}, {inputs: [timelineJson, captionsJson], heavy: true,
	skipIf: () => {
		// El marcador vale solo si coincide con la configuración
		// actual: un informe real (sin campo enabled) solo vale con
		// preflight activado; un marcador de desactivado solo vale
		// si sigue desactivado. Así cambiar preflight.enabled
		// re-ejecuta el paso aunque el archivo exista.
		const marker = P('reports/preflight.json');
		if (!existsSync(marker)) return false;
		if (!artifactsFresh(['reports/preflight.json'], [timelineJson, captionsJson])) return false;
		try {
			const m = JSON.parse(readFileSync(marker, 'utf8'));
			const enabled = cfg.preflight?.enabled === true;
			return m.enabled === undefined ? enabled : m.enabled === enabled;
		} catch {
			return false;
		}
	}});

step('render', [chunksFile], (heavy) => {
	const r = cfg.render ?? {};
	const args = [path.join(ROOT, 'scripts/render-chunks.mjs'), projectId,
		'--chunk', String(r.chunk ?? 900),
		'--concurrency', String(r.concurrency ?? 2),
		'--crf', String(r.crf ?? data.crf ?? 19),
		'--concat-out', P(chunksFile),
		'--resume'];
	if (r.videoOnly !== false) args.push('--video-only');
	else if (r.audioCodec) args.push('--audio-codec', renderAudioCodec);
	if (r.lock !== false) args.push('--lock');
	if (r.draft === true) args.push('--draft');
	run(process.execPath, args, 'render-chunks', home, heavy);
}, {inputs: [timelineJson, captionsJson], heavy: true});

step('master', [masterMp4], (heavy) => {
	// Tramos vídeo-solo + mezcla en el máster (v5): sin mux temporal.
	// --clean-audio: tramos PCM sin priming ni deriva (V4.1).
	const m = cfg.master ?? {};
	const args = [path.join(ROOT, 'scripts/audio/master.py'),
		'--input', P(chunksFile), '--mix', P(mixWav),
		'--out-master', P(masterMp4), '--clean-audio'];
	if (m.noLight !== false) args.push('--no-light');
	else {
		args.push('--out-light', P(`out/${projectId}-light.mp4`));
		if (m.lightAspect) args.push('--light-aspect', String(m.lightAspect));
		if (m.lightPreset) args.push('--light-preset', String(m.lightPreset));
	}
	if (m.gainDb) args.push('--gain-db', String(m.gainDb));
	if (force) args.push('--force');
	run(VENV_PY, args, 'master', home, heavy);
}, {inputs: [chunksFile, mixWav], heavy: true});

step('encode', [`out/${projectId}-720p.mp4`, `out/${projectId}-360p.mp4`], (heavy) => {
	const e = cfg.encode ?? {};
	const args = [path.join(ROOT, 'scripts/encode-delivery.mjs'), projectId,
		'--master', P(masterMp4),
		'--preset', String(e.preset ?? 'medium'),
		'--crf720', String(e.crf720 ?? 21),
		'--crf360', String(e.crf360 ?? 24)];
	if (force) args.push('--force');
	run(process.execPath, args, 'encode-delivery', home, heavy);
}, {inputs: [masterMp4], heavy: true});

step('chapters', [`out/${projectId}-chapters.txt`, `out/${projectId}-chapters.json`], () => {
	run(process.execPath, [path.join(ROOT, 'scripts/chapters.mjs'), projectId], 'chapters');
}, {inputs: [timelineJson, 'chapters.json']});

step('qa', ['reports/technical-qa-master.json', 'reports/technical-qa-360p.json'], (heavy) => {
	run(process.execPath, [path.join(ROOT, 'scripts/qa-media.mjs'),
		'--project', projectId, '--file', P(masterMp4), '--mode', 'full',
		'--report', 'technical-qa-master.json'], 'qa-media master', home, heavy);
	const isVertical = data.height > data.width;
	const expect = isVertical ? '360x640' : '640x360';
	run(process.execPath, [path.join(ROOT, 'scripts/qa-media.mjs'),
		'--project', projectId, '--file', P(`out/${projectId}-360p.mp4`),
		'--mode', 'full', '--expect', expect,
		'--report', 'technical-qa-360p.json'], 'qa-media 360p', home, heavy);
	if (cfg.qa?.audit) {
		const seconds = voDuration();
		const args = [path.join(ROOT, 'scripts/audio/audit-audio.py'),
			'--project', projectId, '--tag', String(cfg.qa.tag ?? 'v1'),
			'--master', P(masterMp4), '--mix', P(mixWav),
			'--voice-edited', P(voFull), '--captions', P(captionsJson),
			'--vo-lines', P(voLines), '--seconds', String(seconds),
			// La cama bucleada como UNA sección: check (f) mide suelo,
			// recuperación y bombeo sobre la cama real. Los crossfades
			// internos del bucle son de potencia igual por construcción
			// (bed-loop.py) y no se re-miden aquí.
			'--section', `${P(musicBed)}@0@${seconds}`,
			'--duck-release', String(cfg.mix?.duckRelease ?? 180),
			'--duck-threshold', String(cfg.mix?.duckThreshold ?? 0.08),
			'--duck-ratio', String(cfg.mix?.duckRatio ?? 5),
			'--no-spectrograms'];
		if (cfg.qa.auditArgs) args.push(...cfg.qa.auditArgs.map(String));
		run(VENV_PY, args, 'audit-audio', home, heavy);
	}
}, {inputs: [masterMp4, `out/${projectId}-360p.mp4`], heavy: true});

progressStatus = 'done';
writeProgress();
const total = timings.reduce((s, t) => s + t.seconds, 0);
console.log(`\nPIPELINE_OK proyecto=${projectId} pasos=${range.join(',')}`);
for (const t of timings) console.log(`  ${t.step}: ${t.seconds}s (estimado ${formatDuration(estimates[t.step] ?? 0)})`);
console.log(`  TOTAL (solo pasos ejecutados): ${total}s`);
console.log(`Progreso: projects/${projectId}/reports/pipeline-progress.md`);
console.log(`Reanudar desde una fase: node scripts/pipeline.mjs ${projectId} --from <fase>`);
