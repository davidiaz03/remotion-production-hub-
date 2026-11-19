/**
 * Encodes de entrega desde el máster (CRF, un solo pase).
 *
 * Lección de modern-wisdom-aprende (19-nov-2026): la 360p en 2-pass
 * con bitrate fijo (500k) pesó MÁS (104 MB) que la 720p en CRF 21
 * (62 MB). El contenido plano (láminas, texto, diagramas) no necesita
 * los bits del presupuesto fijo: el 2-pass los gasta igual. CRF
 * (calidad constante) da archivos más pequeños Y mejor calidad, en
 * UN pase en vez de dos (~2x más rápido).
 *
 * Regla: para contenido plano/diagramas, CRF siempre. El bitrate fijo
 * (2-pass) solo tiene sentido cuando hay un tope de tamaño estricto
 * (p. ej. límite de subida de una plataforma).
 *
 * Preset por defecto: medium. Medido 19-nov-2026 en una muestra de
 * 60 s del máster MW (720p CRF 21): medium 41 s / SSIM 0,99904,
 * fast 43 s / 0,99898, veryfast 34 s / 0,99803 — fast no gana nada
 * y veryfast solo un 17% con pérdida despreciable; para contenido
 * plano el preset apenas importa. veryfast es la opción si el
 * tiempo manda.
 *
 * Uso:
 *   node scripts/encode-delivery.mjs <proyecto> --master out/<p>-MASTER.mp4
 *     [--720p] [--360p] [--preset fast] [--crf720 21] [--crf360 24]
 *     [--force]
 * Sin --720p/--360p genera ambas. Salidas:
 *   out/<proyecto>-720p.mp4 (1280x720, CRF 21, AAC 128k)
 *   out/<proyecto>-360p.mp4 (640x360, CRF 24, AAC 96k)
 * Cada salida se verifica con ffprobe (resolución, duración ±1 s
 * frente al máster, pista de audio si el máster la tiene).
 */
import {existsSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {ROOT, loadProject, parseArgs} from './lib.mjs';

const {pos, opts} = parseArgs(process.argv.slice(2));
const projectId = pos[0];
if (!projectId) {
	throw Error(
		'Use: node scripts/encode-delivery.mjs <proyecto> --master out/<p>-MASTER.mp4 [--720p] [--360p] [--preset fast] [--force]',
	);
}
const {home, data} = loadProject(projectId);
const master = path.resolve(home, String(opts.master || ''));
if (!master.startsWith(path.join(home, 'out') + path.sep) || !existsSync(master)) {
	throw Error(`--master debe ser un MP4 dentro de ${projectId}/out/`);
}
const preset = String(opts.preset ?? 'medium');
const crf720 = String(opts.crf720 ?? 21);
const crf360 = String(opts.crf360 ?? 24);
const audio720 = String(opts.audio720 ?? '128k');
const audio360 = String(opts.audio360 ?? '96k');
const force = opts.force === true || opts.force === 'true';
const want720 = opts['720p'] !== false && opts['720p'] !== 'false' && opts['360p'] === undefined
	? true
	: opts['720p'] === true || opts['720p'] === 'true';
const want360 = opts['360p'] !== false && opts['360p'] !== 'false' && opts['720p'] === undefined
	? true
	: opts['360p'] === true || opts['360p'] === 'true';

function probe(file) {
	const r = spawnSync(
		'ffprobe',
		['-v', 'error', '-show_entries', 'stream=codec_type,width,height',
			'-show_entries', 'format=duration,size', '-of', 'json', file],
		{encoding: 'utf8'},
	);
	if (r.status !== 0) throw Error(`ffprobe falló sobre ${file}: ${r.stderr}`);
	return JSON.parse(r.stdout);
}

function run(cmd, args, label) {
	const r = spawnSync(cmd, args, {stdio: 'inherit'});
	if (r.error) throw r.error;
	if (r.status !== 0) throw Error(`${label} falló (código ${r.status})`);
}

const mProbe = probe(master);
const mVid = mProbe.streams.find((s) => s.codec_type === 'video');
const mAud = mProbe.streams.find((s) => s.codec_type === 'audio');
const mDur = Number(mProbe.format.duration);
const isVertical = mVid.height > mVid.width;
// Dimensiones de salida según el aspecto del máster (no se asume vertical).
const dims720 = isVertical ? '720:1280' : '1280:720';
const dims360 = isVertical ? '360:640' : '640:360';

const jobs = [];
if (want720) {
	jobs.push({
		name: '720p', out: path.join(home, 'out', `${projectId}-720p.mp4`),
		scale: dims720, crf: crf720, audio: audio720,
	});
}
if (want360) {
	jobs.push({
		name: '360p', out: path.join(home, 'out', `${projectId}-360p.mp4`),
		scale: dims360, crf: crf360, audio: audio360,
	});
}
if (!jobs.length) throw Error('Nada que codificar: pide --720p y/o --360p');

const report = {project: projectId, master: path.basename(master), preset, outputs: []};
for (const job of jobs) {
	if (existsSync(job.out) && !force) {
		console.log(`[${job.name}] ${path.basename(job.out)} ya existe — salto (usa --force)`);
		const pr = probe(job.out);
		report.outputs.push({
			name: job.name, file: path.basename(job.out),
			bytes: Number(pr.format.size), skipped: true,
		});
		continue;
	}
	const t0 = Date.now();
	const args = ['-y', '-v', 'error', '-i', master,
		'-vf', `scale=${job.scale}`, '-c:v', 'libx264', '-crf', job.crf,
		'-preset', preset, '-pix_fmt', 'yuv420p'];
	if (mAud) args.push('-c:a', 'aac', '-b:a', job.audio, '-ar', '48000');
	args.push('-movflags', '+faststart', job.out);
	console.log(`[${job.name}] CRF ${job.crf} preset ${preset} → ${path.basename(job.out)}`);
	run('ffmpeg', args, `encode ${job.name}`);
	const secs = Math.round((Date.now() - t0) / 1000);
	const pr = probe(job.out);
	const vid = pr.streams.find((s) => s.codec_type === 'video');
	const [ew, eh] = job.scale.split(':').map(Number);
	if (vid.width !== ew || vid.height !== eh) {
		throw Error(`[${job.name}] resolución ${vid.width}x${vid.height} != ${job.scale}`);
	}
	const dur = Number(pr.format.duration);
	if (Math.abs(dur - mDur) > 1.0) {
		throw Error(`[${job.name}] duración ${dur}s difiere del máster ${mDur}s en más de 1 s`);
	}
	if (mAud && !pr.streams.some((s) => s.codec_type === 'audio')) {
		throw Error(`[${job.name}] sin pista de audio (el máster sí la tiene)`);
	}
	const mb = (Number(pr.format.size) / 1048576).toFixed(1);
	console.log(`[${job.name}] OK ${mb} MB en ${secs}s (verificado: ${vid.width}x${vid.height}, ${dur.toFixed(1)}s)`);
	report.outputs.push({
		name: job.name, file: path.basename(job.out),
		bytes: Number(pr.format.size), seconds: secs, crf: Number(job.crf),
	});
}
const reportPath = path.join(home, 'out', `${projectId}-delivery.json`);
writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
console.log(`Informe: ${path.relative(ROOT, reportPath)}`);
console.log(`ENCODE_DELIVERY_OK project=${projectId} outputs=${report.outputs.map((o) => o.name).join(',')}`);
