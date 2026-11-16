/**
 * Render por tramos con verificación (Fase B, R12).
 *
 * Camino de producción para reels 1080p con shaders: un pase único puede
 * superar el timeout de fotograma (33 s por defecto) en transiciones WebGL
 * bajo SwiftShader (verificado en la auditoría de readiness, Fase A:
 * motion-demo murió en el f87 del pase único). Los tramos de 150
 * fotogramas con --concurrency 2 --timeout 120000 son el patrón probado.
 *
 * Uso:
 *   node scripts/render-chunks.mjs <proyecto>
 *     [--composition MainReel] [--frames 0-1439] [--chunk 150]
 *     [--concurrency 2] [--timeout 120000] [--crf 19]
 *     [--out out/chunks] [--concat-out out/<proyecto>-chunks.mp4]
 *     [--resume] [--no-concat]
 *
 * - Cada tramo se renderiza con el CLI directo de Remotion y se verifica
 *   con ffprobe (nb_read_frames exacto); un tramo que falle aborta.
 * - --resume salta los tramos ya renderizados y verificados.
 * - Al final concatena con ffmpeg -c copy, verifica el total de
 *   fotogramas y escribe <out>/manifest.json con los tramos y SHAs.
 * - El audio va muxado por Remotion en cada tramo (igual que en el flujo
 *   manual de Marabana V1.3 / motion-demo); el máster final se compone
 *   con scripts/audio/master.py como siempre.
 * - Tamaño de tramo: 150 f es el defecto (probado en motion-demo, Fase
 *   A). Marabana V1.3 usó 240 f con concurrencia 1 por OOM en Chromium
 *   (ver projects/marabana-v1/render-chunks.sh): si un render muere por
 *   memoria, sube --chunk y baja --concurrency a 1.
 */
import {
	existsSync,
	mkdirSync,
	readFileSync,
	writeFileSync,
} from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {ROOT, loadProject, parseArgs, requireFile} from './lib.mjs';
import {recordMilestone, setPhase, updateRender} from './state.mjs';

const {pos, opts} = parseArgs(process.argv.slice(2));
const projectId = pos[0];
if (!projectId) {
	throw Error(
		'Use: node scripts/render-chunks.mjs <proyecto> [--frames 0-N] [--chunk 150] [--resume]',
	);
}
const {home, data} = loadProject(projectId);
const compositionId = opts.composition || data.compositionId;
const range = String(opts.frames ?? `0-${data.durationInFrames - 1}`);
const m = range.match(/^(\d+)-(\d+)$/);
if (!m) throw Error(`--frames debe ser DESDE-HASTA, recibido: ${range}`);
const [start, end] = [Number(m[1]), Number(m[2])];
if (start < 0 || end < start || end >= data.durationInFrames) {
	throw Error(`Rango ${range} fuera de 0-${data.durationInFrames - 1}`);
}
const chunkSize = Number(opts.chunk ?? 150);
if (!Number.isInteger(chunkSize) || chunkSize < 1) {
	throw Error(`--chunk debe ser un entero >= 1, recibido: ${opts.chunk}`);
}
const concurrency = String(opts.concurrency ?? 2);
const timeout = String(opts.timeout ?? 120000);
const crf = String(opts.crf ?? data.crf ?? 19);
const outDir = path.resolve(home, String(opts['out'] ?? 'out/chunks'));
const concatOut = path.resolve(
	home,
	String(opts['concat-out'] ?? `out/${projectId}-chunks.mp4`),
);
const resume = opts.resume === true || opts.resume === 'true';
const doConcat = opts['no-concat'] !== true && opts['no-concat'] !== 'true';
mkdirSync(outDir, {recursive: true});
mkdirSync(path.dirname(concatOut), {recursive: true});

// Guardado en tiempo real (STATE.json): cada tramo verificado queda
// registrado para que otro agente pueda reanudar con --resume sin
// contexto. El guardado nunca debe tumbar el render: cualquier fallo
// de estado se avisa y se sigue.
let renderStarted = false;
function safeState(fn, label) {
	try {
		fn();
	} catch (e) {
		console.warn(`[state] no se pudo registrar (${label}): ${e.message}`);
	}
}
process.on('uncaughtException', (err) => {
	if (renderStarted) {
		safeState(
			() =>
				setPhase(ROOT, projectId, 'render', 'failed', {
					note: `Render interrumpido: ${err.message}`,
				}),
			'marcar render fallido',
		);
	}
	console.error(err);
	process.exit(1);
});

// Comando exacto para reanudar este mismo render (queda guardado en
// STATE.json tras cada tramo, para resume.mjs y para un agente en frío).
const resumeParts = [
	`node scripts/render-chunks.mjs ${projectId}`,
	`--frames ${start}-${end}`,
	`--chunk ${chunkSize}`,
	'--resume',
];
if (opts.composition) resumeParts.push(`--composition ${compositionId}`);
if (concurrency !== '2') resumeParts.push(`--concurrency ${concurrency}`);
if (timeout !== '120000') resumeParts.push(`--timeout ${timeout}`);
if (opts.out) resumeParts.push(`--out ${opts.out}`);
if (opts['concat-out']) resumeParts.push(`--concat-out ${opts['concat-out']}`);
const resumeCommand = resumeParts.join(' ');
const totalChunks = Math.ceil((end - start + 1) / chunkSize);
const totalFramesPlanned = end - start + 1;

const entry = requireFile(path.join(home, 'src/index.ts'));
const publicDir = path.join(home, 'public');
const cli = requireFile(
	path.join(ROOT, 'node_modules/@remotion/cli/remotion-cli.js'),
);

function runCmd(cmd, args, label) {
	const r = spawnSync(cmd, args, {cwd: ROOT, stdio: 'inherit'});
	if (r.error) throw r.error;
	if (r.status !== 0) {
		throw Error(`${label} falló (código ${r.status ?? 'señal'})`);
	}
}

function countFrames(file) {
	const r = spawnSync(
		'ffprobe',
		[
			'-v',
			'error',
			'-count_frames',
			'-select_streams',
			'v:0',
			'-show_entries',
			'stream=nb_read_frames',
			'-of',
			'csv=p=0',
			file,
		],
		{encoding: 'utf8'},
	);
	if (r.status !== 0) throw Error(`ffprobe falló sobre ${file}`);
	return Number(r.stdout.trim());
}

function sha256(file) {
	return createHash('sha256').update(readFileSync(file)).digest('hex');
}

safeState(
	() =>
		recordMilestone(ROOT, projectId, 'render', `Render iniciado: fotogramas ${start}-${end} en ${totalChunks} tramos de ${chunkSize}`, {
			status: 'in_progress',
			note: resumeCommand,
		}),
	'inicio del render',
);
renderStarted = true;

function recordChunkProgress(idx, name, framesSoFar) {
	safeState(
		() =>
			updateRender(ROOT, projectId, {
				totalChunks,
				chunkSize,
				framesTotal: totalFramesPlanned,
				framesDone: framesSoFar,
				chunkFile: `out/chunks/${name}`,
				resumeCommand,
				event: `Tramo ${idx}/${totalChunks} verificado (${name})`,
			}),
		`tramo ${idx}`,
	);
}

const chunks = [];
for (let from = start; from <= end; from += chunkSize) {
	const to = Math.min(from + chunkSize - 1, end);
	const idx = chunks.length + 1;
	const name = `chunk_${String(idx).padStart(2, '0')}.mp4`;
	const file = path.join(outDir, name);
	const expected = to - from + 1;
	if (resume && existsSync(file)) {
		const have = countFrames(file);
		if (have === expected) {
			console.log(`[tramo ${idx}] ${name} ya verificado (${have} f) — salto`);
			chunks.push({file: name, from, to, frames: have, sha256: sha256(file)});
			recordChunkProgress(idx, name, chunks.reduce((s, c) => s + c.frames, 0));
			continue;
		}
		console.log(
			`[tramo ${idx}] ${name} incompleto (${have}/${expected} f) — re-render`,
		);
	}
	console.log(`[tramo ${idx}] fotogramas ${from}-${to} → ${name}`);
	runCmd(
		process.execPath,
		[
			cli,
			'render',
			entry,
			compositionId,
			file,
			'--public-dir',
			publicDir,
			'--codec',
			'h264',
			'--pixel-format',
			'yuv420p',
			'--crf',
			crf,
			'--frames',
			`${from}-${to}`,
			'--concurrency',
			concurrency,
			'--timeout',
			timeout,
			'--log',
			'info',
		],
		`render tramo ${idx}`,
	);
	const have = countFrames(file);
	if (have !== expected) {
		throw Error(
			`Tramo ${idx} incompleto: ${have}/${expected} fotogramas (${name})`,
		);
	}
	console.log(`[tramo ${idx}] verificado: ${have}/${expected} fotogramas`);
	chunks.push({file: name, from, to, frames: have, sha256: sha256(file)});
	recordChunkProgress(idx, name, chunks.reduce((s, c) => s + c.frames, 0));
}

const totalFrames = chunks.reduce((s, c) => s + c.frames, 0);
let concat = null;
if (doConcat) {
	const listFile = path.join(outDir, 'list.txt');
	writeFileSync(
		listFile,
		chunks.map((c) => `file '${c.file}'`).join('\n') + '\n',
	);
	runCmd(
		'ffmpeg',
		[
			'-v',
			'error',
			'-y',
			'-f',
			'concat',
			'-safe',
			'0',
			'-i',
			listFile,
			'-c',
			'copy',
			concatOut,
		],
		'concatenación',
	);
	const have = countFrames(concatOut);
	if (have !== totalFrames) {
		throw Error(
			`Concatenado incompleto: ${have}/${totalFrames} fotogramas`,
		);
	}
	concat = {
		file: path.relative(home, concatOut),
		frames: have,
		sha256: sha256(concatOut),
	};
	console.log(
		`[concat] ${concat.file}: ${have}/${totalFrames} fotogramas ✓`,
	);
}

safeState(
	() =>
		updateRender(ROOT, projectId, {
			totalChunks,
			chunkSize,
			framesTotal: totalFrames,
			framesDone: totalFrames,
			resumeCommand,
			done: true,
			event: concat
				? `Render completo: ${totalChunks} tramos concatenados (${concat.file})`
				: `Render completo: ${totalChunks} tramos (sin concatenar)`,
			note: concat ? concat.file : 'tramos en out/chunks/ sin concatenar',
		}),
	'fin del render',
);

const manifest = {
	project: projectId,
	composition: compositionId,
	frames: `${start}-${end}`,
	chunkSize,
	concurrency: Number(concurrency),
	timeoutMs: Number(timeout),
	crf: Number(crf),
	chunks,
	totalFrames,
	concat,
	createdAt: new Date().toISOString(),
};
writeFileSync(
	path.join(outDir, 'manifest.json'),
	JSON.stringify(manifest, null, 2) + '\n',
);
console.log(
	`RENDER_CHUNKS_OK project=${projectId} chunks=${chunks.length} frames=${totalFrames}` +
		(concat ? ` output=${concat.file}` : ''),
);
