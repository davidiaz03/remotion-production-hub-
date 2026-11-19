/**
 * Orquestador del pipeline de video largo (voz → karaoke → música →
 * mezcla → render → máster → encodes → QA) en UN solo comando, con
 * reanudación y STATE.json fiable.
 *
 * En modern-wisdom-aprende (19-nov-2026) cada fase la lanzó un agente
 * a mano: entre fases hubo esperas, STATE.json quedó desactualizado
 * (captions/mix en pending con el trabajo hecho) y la música se
 * regeneró desde cero. Este orquestador ejecuta las fases en orden,
 * salta las que ya tienen sus artefactos verificados, registra cada
 * paso en STATE.json con su estado real y, si algo falla, para y
 * imprime el comando exacto para reanudar desde esa fase.
 *
 * Configuración: projects/<id>/pipeline.json (ver templates/pipeline.json).
 * El orquestador NO escribe guiones ni compone escenas: eso sigue
 * siendo trabajo creativo del agente. Empieza cuando existen el guion
 * de VO (vo-manifest.json + vo-chapters/), el guion de captions
 * (vo-captions.json) y la composición (src/, project.json).
 *
 * Uso:
 *   node scripts/pipeline.mjs <proyecto> [--from vo] [--to qa]
 *     [--force] [--dry-run]
 *   node scripts/pipeline.mjs modern-wisdom-aprende --from music
 *
 * Fases: vo, merge, captions, music, mix, render, master, encode, qa.
 * --from/--to seleccionan el rango. --force rehace desde --from
 * (borra los artefactos de esas fases antes de empezar). Sin --force,
 * cada fase salta si sus artefactos ya existen.
 */
import {existsSync, readFileSync, rmSync} from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {ROOT, loadProject, parseArgs} from './lib.mjs';
import {recordMilestone, setPhase} from './state.mjs';

const HUB = path.resolve(ROOT, '..');
const HOME = process.env.HOME || '';
const VENV_PY = process.env.HUB_PY || path.join(HUB, '.venv/bin/python');
const STT_PY = path.join(HOME, 'workspace/.stt-env/bin/python');
const SYS_PY = 'python3';

const STEPS = ['vo', 'merge', 'captions', 'music', 'mix', 'render', 'master', 'encode', 'qa'];
// Fase de STATE.json que marca cada paso del pipeline.
const STEP_PHASE = {
	vo: 'vo', merge: 'vo', captions: 'captions', music: 'mix', mix: 'mix',
	render: 'render', master: 'qa', encode: 'delivery', qa: 'qa',
};

const {pos, opts} = parseArgs(process.argv.slice(2));
const projectId = pos[0];
if (!projectId) {
	throw Error('Use: node scripts/pipeline.mjs <proyecto> [--from vo] [--to qa] [--force] [--dry-run]');
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
if (!STEPS.includes(from) || !STEPS.includes(to)) {
	throw Error(`--from/--to deben ser fases válidas: ${STEPS.join(', ')}`);
}
const range = STEPS.slice(STEPS.indexOf(from), STEPS.indexOf(to) + 1);
if (!range.length) throw Error(`Rango vacío: --from ${from} está después de --to ${to}`);

const P = (rel) => path.join(home, rel);
const stamp = () => new Date().toISOString().slice(11, 19);
const timings = [];

function safeState(fn, label) {
	try {
		fn();
	} catch (e) {
		console.warn(`[state] no se pudo registrar (${label}): ${e.message}`);
	}
}

function run(cmd, args, label, cwd = home) {
	console.log(`[${stamp()}] $ ${cmd} ${args.join(' ')}`);
	if (dryRun) return;
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

function step(name, artifacts, fn) {
	if (!range.includes(name)) return;
	const phase = STEP_PHASE[name];
	const present = artifacts.filter((a) => existsSync(P(a)));
	const missing = artifacts.filter((a) => !existsSync(P(a)));
	if (!force && missing.length === 0 && artifacts.length > 0) {
		console.log(`[${stamp()}] == ${name}: salto (artefactos presentes: ${artifacts.join(', ')})`);
		safeState(() => recordMilestone(ROOT, projectId, phase, `${name}: artefactos ya presentes (salto)`, {status: 'done', artifacts}), `salto ${name}`);
		return;
	}
	if (force) {
		for (const a of artifacts) rmSync(P(a), {force: true});
	}
	console.log(`[${stamp()}] == ${name}: inicio`);
	safeState(() => setPhase(ROOT, projectId, phase, 'in_progress', {note: `${name} en curso (pipeline)`}), `inicio ${name}`);
	const t0 = Date.now();
	try {
		fn();
	} catch (e) {
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
	console.log(`[${stamp()}] == ${name}: OK en ${secs}s`);
	safeState(() => recordMilestone(ROOT, projectId, phase, `${name} completado por pipeline (${secs}s)`, {status: 'done', artifacts}), `fin ${name}`);
}

const voManifest = cfg.voice?.manifest ?? 'vo-manifest.json';
const voFull = 'public/audio/vo-full.wav';
const voLines = 'vo-chapters/vo-full-lines.json';
const musicBed = 'public/audio/music-bed.wav';
const mixWav = 'public/audio/mix.wav';
const chunksMp4 = `out/${projectId}-chunks.mp4`;
const masterMp4 = `out/${projectId}-MASTER.mp4`;

// Duración de la VO (la necesitan música y mezcla). Se mide del WAV
// fusionado; si aún no existe, se estima del manifiesto (la mezcla la
// vuelve a medir, así que un error aquí no rompe nada).
function voDuration() {
	if (existsSync(P(voFull))) return probeDuration(P(voFull));
	return Number(cfg.voice?.seconds ?? 0);
}

step('vo', [], () => {
	// vo-batch.py salta solo los capítulos ya hechos; sin artefactos
	// declarados, este paso siempre se ejecuta (barato si no hay nada
	// que hacer: no carga el modelo).
	run(VENV_PY, [path.join(ROOT, 'scripts/audio/vo-batch.py'),
		'--manifest', voManifest, '--root', home], 'vo-batch');
});

step('merge', [voFull, voLines], () => {
	run(SYS_PY, [path.join(ROOT, 'scripts/audio/merge-vo.py'),
		'--manifest', voManifest, '--root', home,
		'--out', P(voFull), '--lines-out', P(voLines)], 'merge-vo');
});

step('captions', [cfg.captions?.out ?? 'src/captions.ts', cfg.captions?.outJson ?? 'src/captions.json', `out/${projectId}.srt`], () => {
	const args = [path.join(ROOT, 'scripts/audio/transcribe-vo.py'),
		'--vo', P(voFull), '--lines-json', P(voLines),
		'--script', P(cfg.captions?.script ?? 'vo-captions.json'),
		'--out', P(cfg.captions?.out ?? 'src/captions.ts'),
		'--out-json', P(cfg.captions?.outJson ?? 'src/captions.json'),
		'--threads', String(cfg.captions?.threads ?? 2)];
	if (force) args.push('--force');
	run(STT_PY, args, 'transcribe-vo');
	run(process.execPath, [path.join(ROOT, 'scripts/export-srt.mjs'), projectId], 'export-srt');
});

step('music', [musicBed], () => {
	const beds = cfg.music?.beds ?? [];
	if (!beds.length) throw Error('pipeline.json: music.beds vacío (elige camas de la biblioteca o genera una con gen-music.py)');
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
});

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
});

step('render', [chunksMp4], () => {
	const r = cfg.render ?? {};
	const args = [path.join(ROOT, 'scripts/render-chunks.mjs'), projectId,
		'--chunk', String(r.chunk ?? 450),
		'--concurrency', String(r.concurrency ?? 2),
		'--crf', String(r.crf ?? data.crf ?? 19),
		'--resume'];
	run(process.execPath, args, 'render-chunks');
});

step('master', [masterMp4], () => {
	const muxed = P('out/muxed-temp.mp4');
	run('ffmpeg', ['-y', '-v', 'error', '-i', P(chunksMp4), '-i', P(mixWav),
		'-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'pcm_s16le',
		'-ar', '48000', muxed], 'mux mix+video');
	const m = cfg.master ?? {};
	const args = [path.join(ROOT, 'scripts/audio/master.py'),
		'--input', muxed, '--out-master', P(masterMp4),
		'--no-trim', '--no-boost'];
	if (m.noLight !== false) args.push('--no-light');
	else args.push('--out-light', P(`out/${projectId}-light.mp4`));
	if (m.atempo) args.push('--atempo', String(m.atempo));
	if (force) args.push('--force');
	try {
		run(VENV_PY, args, 'master');
	} finally {
		if (!dryRun) rmSync(muxed, {force: true});
	}
});

step('encode', [`out/${projectId}-720p.mp4`, `out/${projectId}-360p.mp4`], () => {
	const e = cfg.encode ?? {};
	const args = [path.join(ROOT, 'scripts/encode-delivery.mjs'), projectId,
		'--master', P(masterMp4),
		'--preset', String(e.preset ?? 'medium'),
		'--crf720', String(e.crf720 ?? 21),
		'--crf360', String(e.crf360 ?? 24)];
	if (force) args.push('--force');
	run(process.execPath, args, 'encode-delivery');
});

step('qa', [`reports/technical-qa.json`], () => {
	run(process.execPath, [path.join(ROOT, 'scripts/qa-media.mjs'),
		'--project', projectId, '--file', P(masterMp4), '--mode', 'full',
		'--report', 'technical-qa-master.json'], 'qa-media master');
	const isVertical = data.height > data.width;
	const expect = isVertical ? '360x640' : '640x360';
	run(process.execPath, [path.join(ROOT, 'scripts/qa-media.mjs'),
		'--project', projectId, '--file', P(`out/${projectId}-360p.mp4`),
		'--mode', 'full', '--expect', expect,
		'--report', 'technical-qa-360p.json'], 'qa-media 360p');
	if (cfg.qa?.audit) {
		const seconds = voDuration();
		const args = [path.join(ROOT, 'scripts/audio/audit-audio.py'),
			'--project', projectId, '--tag', String(cfg.qa.tag ?? 'v1'),
			'--master', P(masterMp4), '--mix', P(mixWav),
			'--voice-edited', P(voFull), '--captions', P(cfg.captions?.outJson ?? 'src/captions.json'),
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
		run(VENV_PY, args, 'audit-audio');
	}
});

const total = timings.reduce((s, t) => s + t.seconds, 0);
console.log(`\nPIPELINE_OK proyecto=${projectId} pasos=${range.join(',')}`);
for (const t of timings) console.log(`  ${t.step}: ${t.seconds}s`);
console.log(`  TOTAL (solo pasos ejecutados): ${total}s`);
console.log(`Reanudar desde una fase: node scripts/pipeline.mjs ${projectId} --from <fase>`);
