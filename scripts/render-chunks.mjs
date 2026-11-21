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
 *     [--out out/chunks] [--concat-out out/<proyecto>-chunks.mkv]
 *     [--audio-codec pcm-16] [--resume] [--no-concat]
 *     [--video-only] [--scale 1] [--x264-preset medium] [--draft]
 *     [--lock] [--lock-timeout <s>] [--lock-path <ruta>]
 *
 * - --lock toma el candado único de render (/tmp/hub-speed-v5-render.lock,
 *   propiedad por PID, ver scripts/render-lock.mjs) antes de renderizar
 *   y lo suelta al terminar o al fallar: en una caja de 1,5 CPU dos
 *   renders en paralelo se estorban. El orquestador (pipeline.mjs) lo
 *   pasa siempre; en manual, úsalo cuando otro trabajo pueda estar
 *   renderizando. Sin --lock no hay protección.
 *
 * - Cada tramo se renderiza con el CLI directo de Remotion y se verifica
 *   con ffprobe (nb_read_frames exacto); un tramo que falle aborta.
 * - --resume salta los tramos ya renderizados y verificados.
 * - TRAMOS INCREMENTALES (hub-speed-v5, pieza 2): cada tramo lleva un
 *   hash de sus entradas (parámetros de render + código de la
 *   composición + assets + tiempos de captions que solapan el tramo)
 *   guardado en <out>/manifest.json (inputHash por tramo). Con
 *   --resume, un tramo se salta solo si sus fotogramas verifican Y su
 *   hash no cambió: tocar un tiempo de caption re-renderiza solo los
 *   tramos afectados; cambiar código o assets re-renderiza todo (lo
 *   seguro). Sin hash previo (manifiesto antiguo), el tramo se
 *   re-renderiza una vez. El manifiesto se reescribe tras cada tramo.
 * - Al final concatena con ffmpeg -c copy, verifica el total de
 *   fotogramas y escribe <out>/manifest.json con los tramos y SHAs.
 * - El audio va muxado por Remotion en cada tramo (igual que en el flujo
 *   manual de Marabana V1.3 / motion-demo); el máster final se compone
 *   con scripts/audio/master.py como siempre.
 * - VÍDEO-SOLO (hub-speed-v5, 21-nov-2026): con --video-only los tramos
 *   se renderizan SIN pista de audio (.mkv solo-video) y la mezcla se
 *   muxa en el máster con master.py --mix <wav>. El video de un tramo
 *   vídeo-solo es idéntico bit a bit al del tramo con audio
 *   (verificación con framemd5 en docs/HUB-SPEED-V5-RENDER.md), y un
 *   cambio de mezcla ya NO obliga a re-renderizar el video: solo se
 *   re-ensambla el máster (~2 min). Camino recomendado para renders
 *   nuevos.
 *   IMPLEMENTACIÓN: NO se usa Remotion --muted. Medido en
 *   marti-fidel V5: --muted produce video LIGERAMENTE distinto al
 *   del flujo con audio PCM (3 de 14 tramos difieren; PSNR medio
 *   52 dB, invisible a ojo pero real; un render con audio AAC en
 *   .mp4 coincide con el mudo, no con el V5 — la vía de
 *   codificación con audio PCM es la que da el video de
 *   referencia). En su lugar, el audio se renderiza a PCM-16 con
 *   --separate-audio-to a un temporal que se descarta: el tramo
 *   queda solo con video (.mkv) y sus fotogramas son bit a bit
 *   idénticos a los del tramo con audio. Coste: la extracción de
 *   audio por tramo (~1-2 s). El archivo de mezcla debe existir en
 *   public/ (el render extrae el audio aunque se descarte); un
 *   cambio de mezcla NO invalida los tramos (el hash excluye los
 *   audios en modo vídeo-solo).
 * - MODO BORRADOR (hub-speed-v5, pieza 3): --draft renderiza a 540p
 *   (scale 0.5), preset x264 veryfast, CRF 23 y vídeo-solo, para
 *   revisión creativa rápida (tiempo medido en marti-fidel: ver
 *   docs/HUB-SPEED-V5-RENDER.md). Por defecto escribe en
 *   out/chunks-draft (no pisa los tramos 1080p). El máster borrador
 *   se ensambla con master.py --mix <wav> --draft (sin ligera).
 *   --scale/--crf/--x264-preset explícitos prevalecen sobre los
 *   valores del borrador.
 * - AUDIO PCM POR DEFECTO (V4.1, 20-nov-2026): con AAC, cada frontera
 *   de tramo inyectaba ~55 ms de deriva (priming+padding) Y un agujero
 *   de 34-55 ms hasta silencio digital en el máster (13 agujeros en
 *   marti-fidel V4, medidos; el usuario los oía como microcortes).
 *   Con `--audio-codec pcm-16` el concat es exacto a la muestra
 *   (deriva 0 ms, corr 1,0000, diff RMS -96 dBFS en 3 tramos de
 *   prueba) y master.py ya NO necesita --atempo ni --trim-start ni
 *   --boost (usar --clean-audio). Remotion exige .mkv/.mov para
 *   h264+pcm-16, así que los tramos y el concat son .mkv.
 *   `--audio-codec aac` restaura el comportamiento anterior (.mp4)
 *   con sus agujeros de frontera: solo para compatibilidad.
 * - Tamaño de tramo: 150 f es el defecto (probado en motion-demo, Fase
 *   A). Marabana V1.3 usó 240 f con concurrencia 1 por OOM en Chromium
 *   (ver projects/marabana-v1/render-chunks.sh): si un render muere por
 *   memoria, sube --chunk y baja --concurrency a 1.
 */
import {
	existsSync,
	mkdirSync,
	readFileSync,
	readdirSync,
	statSync,
	unlinkSync,
	writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {ROOT, loadProject, parseArgs, requireFile} from './lib.mjs';
import {recordMilestone, setPhase, updateRender} from './state.mjs';
import {acquireRenderLock, DEFAULT_LOCK_PATH} from './render-lock.mjs';

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
// Modo borrador (pieza 3): 540p, preset rápido, CRF 23, vídeo-solo.
// Los flags explícitos prevalecen sobre los valores del borrador.
const draft = opts.draft === true || opts.draft === 'true';
const crf = String(opts.crf ?? (draft ? '23' : (data.crf ?? 19)));
// Escala y preset x264: solo se pasan a Remotion si el usuario los
// fija explícitamente o con --draft; el hash usa siempre los valores
// resueltos, así que un --scale 1 explícito no invalida los tramos
// de una corrida por defecto.
const scale = String(opts.scale ?? (draft ? '0.5' : '1'));
const x264Preset = String(opts['x264-preset'] ?? (draft ? 'veryfast' : 'medium'));
// Vídeo-solo (hub-speed-v5): tramos sin pista de audio; la mezcla se
// muxa en el máster (master.py --mix). Incompatible con --audio-codec.
// El borrador es vídeo-solo por definición.
const videoOnly =
	draft || opts['video-only'] === true || opts['video-only'] === 'true';
if (videoOnly && opts['audio-codec'] !== undefined) {
	throw Error(
		'--video-only/--draft no admite --audio-codec (el audio se renderiza siempre a PCM-16 separado y se descarta)',
	);
}
// Audio PCM por defecto (V4.1): AAC inyecta ~55 ms de deriva y un
// agujero de 34-55 ms por frontera (ver cabecera). Remotion exige
// .mkv/.mov para h264+pcm-16 (y para opus/vorbis); aac/mp3 van en .mp4.
// Vídeo-solo: el audio se renderiza igual (PCM-16) pero a un archivo
// separado que se descarta (--separate-audio-to): --muted produce
// video ligeramente distinto al del flujo con audio (medido, ver
// cabecera), así que el tramo vídeo-solo sale por la vía con audio
// y queda bit-idéntico. El temporal se reutiliza por tramo.
const audioCodec = String(opts['audio-codec'] ?? 'pcm-16');
const chunkExt = audioCodec === 'aac' || audioCodec === 'mp3' ? 'mp4' : 'mkv';
const sepAudioFile = path.join(
	os.tmpdir(),
	`render-chunks-sep-${process.pid}.wav`,
);
const outDir = path.resolve(
	home,
	String(opts['out'] ?? (draft ? 'out/chunks-draft' : 'out/chunks')),
);
const concatOut = path.resolve(
	home,
	String(
		opts['concat-out'] ??
			`out/${projectId}-chunks${draft ? '-draft' : ''}.${chunkExt}`,
	),
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
if (opts['audio-codec']) {
	resumeParts.push(`--audio-codec ${audioCodec}`);
}
if (draft) resumeParts.push('--draft');
else if (videoOnly) resumeParts.push('--video-only');
if (opts.crf !== undefined) resumeParts.push(`--crf ${crf}`);
if (opts.scale !== undefined) resumeParts.push(`--scale ${scale}`);
if (opts['x264-preset'] !== undefined) {
	resumeParts.push(`--x264-preset ${x264Preset}`);
}
if (opts.out) resumeParts.push(`--out ${opts.out}`);
if (opts['concat-out']) resumeParts.push(`--concat-out ${opts['concat-out']}`);
if (opts.lock === true || opts.lock === 'true') resumeParts.push('--lock');
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

function hashText(s) {
	return createHash('sha256').update(s, 'utf8').digest('hex');
}

// --- Tramos incrementales (hub-speed-v5, pieza 2) --------------------
// Cada tramo lleva un hash de sus entradas. En un re-render con
// --resume se saltan los tramos cuyo hash no cambió (el --resume
// anterior solo miraba si el archivo existía y tenía los fotogramas,
// sin detectar cambios de entrada).
//
// El hash de un tramo combina:
// - params: composición, fps, dimensiones, chunkSize, crf, scale,
//   preset x264, modo de audio (pcm/aac/vídeo-solo) y versión de
//   Remotion. Cambiar cualquiera invalida todos los tramos.
// - code: contenido de src/ (excepto los captions, ver abajo) +
//   shared/ + project.json. Un cambio de código invalida todo.
// - assets: contenido de public/ limitado a los assets REFERENCIADOS
//   por el código (staticFile() literales, plantillas staticFile(`...`)
//   como globs, y literales de ruta con extensión de asset — estos
//   últimos cubren las rutas que llegan por variables de datos, como
//   v.file/c.file/c.flag). Un archivo NUEVO no referenciado (p. ej.
//   assets de otra versión del reel añadidos a public/) NO invalida
//   ningún tramo; un asset referenciado modificado invalida todos
//   (no hay mapa escena→asset; es la opción segura). En modo
//   vídeo-solo se excluyen los audios: la mezcla no afecta al video
//   y un cambio de mezcla no debe invalidar ningún tramo (ese es el
//   punto de la pieza 1). Si el código no referencia ningún asset,
//   se vuelve al hash de todo public/ (proyectos con carga dinámica).
//   Los assets referenciados pero ausentes entran como marcadores
//   MISSING:<ruta>: añadir el archivo después invalida (correcto:
//   el render pasaría de roto a completo).
//   v2 (21-nov-2026): la v1 hasheaba TODO public/ y cualquier archivo
//   añadido (p. ej. los arbol-s5-*.png de V6, en plena construcción)
//   invalidaba los 14 tramos. Cambio de esquema → re-render de
//   migración una sola vez (inputHashVersion).
// - captions(tramo): solo las entradas de captions cuya visualización
//   solapa el rango temporal del tramo (palabra visible desde su
//   inicio hasta el inicio de la siguiente; el karaoke es pegajoso).
//   Un cambio de tiempo de caption solo invalida los tramos
//   afectados. Los archivos de captions se detectan por los imports
//   de la composición; si uno no se puede parsear, su contenido
//   entero entra en `code` (cambio → re-render completo, seguro).
// Los hashes quedan en <out>/manifest.json (inputHash por tramo +
// hashes globales) y el manifiesto se reescribe tras cada tramo,
// así que un render interrumpido conserva los hashes de lo hecho.
// Primera corrida tras actualizar: sin hash previo, los tramos se
// re-renderizan una vez (coste de migración, documentado).
const INPUT_HASH_VERSION = 2;
const AUDIO_EXTS = new Set([
	'.wav',
	'.mp3',
	'.aac',
	'.ogg',
	'.flac',
	'.m4a',
	'.opus',
]);

function hashDir(dir, {excludeFiles = new Set(), excludeAudio = false} = {}) {
	const h = createHash('sha256');
	const walk = (d) => {
		let entries;
		try {
			entries = readdirSync(d).sort();
		} catch {
			return;
		}
		for (const name of entries) {
			const p = path.join(d, name);
			const st = statSync(p, {throwIfNoEntry: false});
			if (!st) continue;
			if (st.isDirectory()) {
				walk(p);
			} else if (st.isFile()) {
				if (excludeFiles.has(p)) continue;
				if (excludeAudio && AUDIO_EXTS.has(path.extname(name).toLowerCase())) {
					continue;
				}
				h.update(path.relative(dir, p));
				h.update('\0');
				h.update(readFileSync(p));
				h.update('\0');
			}
		}
	};
	walk(dir);
	return h.digest('hex');
}

// --- Assets referenciados (hash v2) ---------------------------------
// Solo los assets que el código puede cargar entran en el hash, para
// que añadir archivos no referenciados a public/ no invalide tramos.
const ASSET_EXTS = new Set([
	'.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif',
	'.mp4', '.webm', '.mov', '.wav', '.mp3', '.aac', '.ogg', '.flac',
	'.m4a', '.opus', '.ttf', '.otf', '.woff', '.woff2',
]);
const CODE_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);

// Lee el texto de todos los archivos de código bajo los directorios
// dados (para escanear referencias a assets).
function readCodeText(dirs) {
	let text = '';
	const walk = (d) => {
		let entries;
		try {
			entries = readdirSync(d).sort();
		} catch {
			return;
		}
		for (const name of entries) {
			const p = path.join(d, name);
			const st = statSync(p, {throwIfNoEntry: false});
			if (!st) continue;
			if (st.isDirectory()) walk(p);
			else if (st.isFile() && CODE_EXTS.has(path.extname(name).toLowerCase())) {
				try {
					text += readFileSync(p, 'utf8') + '\n';
				} catch {
					// Archivo ilegible: el codeHash ya lo cubre (o falla antes).
				}
			}
		}
	};
	for (const d of dirs) walk(d);
	return text;
}

// Rutas de assets referenciadas por el código: literales exactos y
// globs (plantillas staticFile(`...${...}...`)). Devuelve
// {literals: Set<string>, globs: Set<string>}.
function referencedAssetPaths(codeText) {
	const literals = new Set();
	const globs = new Set();
	// staticFile('...') / staticFile("...")
	for (const m of codeText.matchAll(/staticFile\(\s*['"]([^'"]+)['"]\s*\)/g)) {
		literals.add(m[1]);
	}
	// staticFile(`...`): sin ${} es un literal; con ${} es un glob.
	for (const m of codeText.matchAll(/staticFile\(\s*`([^`]*)`\s*\)/g)) {
		const tpl = m[1];
		if (tpl.includes('${')) globs.add(tpl.replace(/\$\{[^}]*\}/g, '*'));
		else literals.add(tpl);
	}
	// Literales de ruta con extensión de asset ('img/...png'): cubren
	// las rutas que llegan por variables de datos (v.file, c.flag...).
	const extAlt = [...ASSET_EXTS].map((e) => e.slice(1)).join('|');
	const litRe = new RegExp(
		`['"]([^'"]*\\/[^'"]*\\.(${extAlt}))['"]`,
		'gi',
	);
	for (const m of codeText.matchAll(litRe)) {
		const p = m[1];
		if (/^(https?:|data:|\/)/i.test(p) || p.includes('..')) continue;
		literals.add(p);
	}
	return {literals, globs};
}

function globToRegExp(glob) {
	const esc = glob.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*');
	return new RegExp(`^${esc}$`);
}

// Lista de archivos (relativos) bajo un directorio.
function listFiles(dir) {
	const out = [];
	const walk = (d) => {
		let entries;
		try {
			entries = readdirSync(d).sort();
		} catch {
			return;
		}
		for (const name of entries) {
			const p = path.join(d, name);
			const st = statSync(p, {throwIfNoEntry: false});
			if (!st) continue;
			if (st.isDirectory()) walk(p);
			else if (st.isFile()) out.push(path.relative(dir, p));
		}
	};
	walk(dir);
	return out;
}

// Hash de los assets referenciados por el código. Devuelve
// {hash, count, missing} (count = archivos existentes hasheados).
// Si el código no referencia ningún asset, devuelve null: el que
// llama usa hashDir(publicDir) completo (carga dinámica).
function hashReferencedAssets(publicDir, refs, {excludeAudio = false} = {}) {
	const {literals, globs} = refs;
	if (literals.size === 0 && globs.size === 0) return null;
	const files = listFiles(publicDir);
	const fileSet = new Set(files);
	const matched = new Set();
	const missing = [];
	for (const lit of literals) {
		const norm = lit.replace(/\\/g, '/');
		if (fileSet.has(norm)) matched.add(norm);
		else missing.push(norm);
	}
	for (const g of globs) {
		const re = globToRegExp(g);
		for (const f of files) {
			if (re.test(f.replace(/\\/g, '/'))) matched.add(f);
		}
	}
	const h = createHash('sha256');
	let count = 0;
	for (const rel of [...matched].sort()) {
		if (excludeAudio && AUDIO_EXTS.has(path.extname(rel).toLowerCase())) continue;
		h.update(rel);
		h.update('\0');
		h.update(readFileSync(path.join(publicDir, rel)));
		h.update('\0');
		count++;
	}
	for (const m of missing.sort()) {
		h.update(`MISSING:${m}`);
		h.update('\0');
	}
	return {hash: h.digest('hex'), count, missing};
}

// Extrae el literal array de `export const CAPTIONS ... = [...]` con
// un escaneo que respeta strings y anidado (los textos pueden llevar
// comillas o corchetes). Devuelve el array parseado o null.
function parseCaptionsFile(file) {
	const src = readFileSync(file, 'utf8');
	// Anclar en la declaración CAPTIONS: el primer `=` del archivo es
	// el de `export type CapWord = ...` y el primer `[` el de
	// `CapSegment[]` (sin este anclaje se parsea "[]" vacío).
	const anchor = src.indexOf('CAPTIONS');
	if (anchor < 0) return null;
	const eq = src.indexOf('=', anchor);
	if (eq < 0) return null;
	const start = src.indexOf('[', eq);
	if (start < 0) return null;
	let depth = 0;
	let quote = null;
	let escaped = false;
	for (let i = start; i < src.length; i++) {
		const c = src[i];
		if (quote) {
			if (escaped) escaped = false;
			else if (c === '\\') escaped = true;
			else if (c === quote) quote = null;
			continue;
		}
		if (c === '"' || c === "'" || c === '`') {
			quote = c;
			continue;
		}
		if (c === '[') depth++;
		else if (c === ']') {
			depth--;
			if (depth === 0) {
				try {
					const arr = JSON.parse(src.slice(start, i + 1));
					return Array.isArray(arr) ? arr : null;
				} catch {
					return null;
				}
			}
		}
	}
	return null;
}

// Archivos de captions que usa la composición: los que importa el
// archivo que define la composición (from './captions-...'); si no
// se encuentra ninguno, todos los captions*.ts de src/.
function findCaptionsFiles(home, compositionId) {
	const srcDir = path.join(home, 'src');
	const files = readdirSync(srcDir).filter((f) => /\.(tsx?|mts|cts)$/.test(f));
	let compFile = null;
	for (const f of files) {
		const txt = readFileSync(path.join(srcDir, f), 'utf8');
		if (
			txt.includes(`export const ${compositionId}`) ||
			txt.includes(`export function ${compositionId}`)
		) {
			compFile = path.join(srcDir, f);
			break;
		}
	}
	const found = new Set();
	if (compFile) {
		const txt = readFileSync(compFile, 'utf8');
		for (const m of txt.matchAll(/from\s+['"]\.\/(captions[^'"]*)['"]/g)) {
			for (const ext of ['.ts', '.tsx', '']) {
				const cand = path.join(srcDir, m[1] + ext);
				if (existsSync(cand) && statSync(cand).isFile()) {
					found.add(cand);
					break;
				}
			}
		}
	}
	if (found.size === 0) {
		for (const f of files) {
			if (/^captions.*\.ts$/.test(f)) found.add(path.join(srcDir, f));
		}
	}
	return [...found].sort();
}

// Entradas de captions (segmentos, chunks y palabras) cuya
// visualización solapa [t0, t1] segundos. La palabra se muestra
// desde su inicio hasta el inicio de la siguiente (karaoke
// pegajoso); el segmento cubre [start, start+frames/fps].
function captionEntriesForRange(segments, t0, t1, fps) {
	const out = [];
	const overlaps = (a0, a1) => a0 < t1 && a1 > t0;
	for (const seg of segments) {
		if (!seg || typeof seg.start !== 'number') continue;
		const segEnd = seg.start + (seg.frames || 0) / fps;
		const segHit = overlaps(seg.start, segEnd);
		const chunksOut = [];
		for (const ch of seg.chunks || []) {
			if (typeof ch.start !== 'number' || typeof ch.end !== 'number') continue;
			const words = ch.words || [];
			const wordsOut = [];
			for (let i = 0; i < words.length; i++) {
				const w = words[i];
				if (typeof w.s !== 'number') continue;
				const dispEnd =
					i + 1 < words.length && typeof words[i + 1].s === 'number'
						? words[i + 1].s
						: typeof w.e === 'number'
							? w.e
							: w.s;
				if (overlaps(w.s, dispEnd)) wordsOut.push(w);
			}
			if (wordsOut.length > 0 || overlaps(ch.start, ch.end)) {
				chunksOut.push({start: ch.start, end: ch.end, words: wordsOut});
			}
		}
		if (segHit || chunksOut.length > 0) {
			out.push({id: seg.id, start: seg.start, frames: seg.frames, chunks: chunksOut});
		}
	}
	return out;
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

// Candado único de render (opcional, --lock): se adquiere ANTES de
// cualquier render y se suelta al terminar o al fallar (el handler
// de 'exit' cubre process.exit(1) del uncaughtException; la
// liberación explícita al final cubre el camino normal). Solo el
// proceso que lo creó puede borrarlo (propiedad por PID).
let renderLock = null;
if (opts.lock === true || opts.lock === 'true') {
	const lockPath = String(opts['lock-path'] ?? DEFAULT_LOCK_PATH);
	const lockTimeoutMs =
		Number(opts['lock-timeout'] ?? 0) > 0
			? Number(opts['lock-timeout']) * 1000
			: 0;
	console.log(`[render] esperando candado ${lockPath}…`);
	renderLock = await acquireRenderLock(lockPath, lockTimeoutMs);
	console.log('[render] candado adquirido');
	process.on('exit', () => {
		if (renderLock) renderLock.release();
	});
}

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

// Hashes de entradas (pieza 2): se calculan una sola vez por corrida.
const hashT0 = Date.now();
const fps = Number(data.fps ?? 30);
let remotionVersion = 'unknown';
try {
	remotionVersion = JSON.parse(
		readFileSync(
			path.join(ROOT, 'node_modules/@remotion/cli/package.json'),
			'utf8',
		),
	).version;
} catch {
	// Sin versión legible: el hash sigue siendo válido dentro de esta caja.
}
const paramsHash = hashText(
	JSON.stringify({
		composition: compositionId,
		fps,
		width: data.width,
		height: data.height,
		chunkSize,
		crf: Number(crf),
		scale,
		x264Preset,
		audioCodec,
		videoOnly,
		remotionVersion,
	}),
);
const captionsFiles = findCaptionsFiles(home, compositionId);
const captionSegments = [];
const unparsedCaptions = new Set();
for (const f of captionsFiles) {
	const parsed = parseCaptionsFile(f);
	if (parsed) captionSegments.push(...parsed);
	else {
		console.warn(
			`[hash] no se pudo parsear ${path.relative(home, f)}: su contenido entra en el hash global`,
		);
		unparsedCaptions.add(f);
	}
}
const parsedCaptions = new Set(
	captionsFiles.filter((f) => !unparsedCaptions.has(f)),
);
const codeHash = hashText(
	hashDir(path.join(home, 'src'), {excludeFiles: parsedCaptions}) +
		hashDir(path.join(ROOT, 'shared')) +
		sha256(path.join(home, 'project.json')),
);
const assetsRefs = referencedAssetPaths(
	readCodeText([path.join(home, 'src'), path.join(ROOT, 'shared')]),
);
const assetsRefHash = hashReferencedAssets(publicDir, assetsRefs, {
	excludeAudio: videoOnly,
});
let assetsHash;
let assetsNote;
if (assetsRefHash) {
	assetsHash = assetsRefHash.hash;
	assetsNote = `${assetsRefHash.count} referenciados` +
		(assetsRefHash.missing.length
			? `, ${assetsRefHash.missing.length} ausentes`
			: '');
} else {
	console.warn(
		'[hash] el código no referencia ningún asset: hash de todo public/ (carga dinámica)',
	);
	assetsHash = hashDir(publicDir, {excludeAudio: videoOnly});
	assetsNote = 'todo public/';
}
console.log(
	`[hash] params=${paramsHash.slice(0, 12)} code=${codeHash.slice(0, 12)} ` +
		`assets=${assetsHash.slice(0, 12)} (${assetsNote}) captions=${
			captionsFiles.map((f) => path.basename(f)).join(',') || 'ninguno'
		} (${Date.now() - hashT0} ms)`,
);

// Manifiesto previo (para --resume con hashes): por rango de
// fotogramas, solo las entradas que traen inputHash.
const manifestPath = path.join(outDir, 'manifest.json');
const prevHashes = new Map();
let prevHashVersion = null;
if (existsSync(manifestPath)) {
	try {
		const prev = JSON.parse(readFileSync(manifestPath, 'utf8'));
		prevHashVersion = prev.inputHashVersion ?? null;
		for (const c of prev.chunks || []) {
			if (c.inputHash) prevHashes.set(`${c.from}-${c.to}`, c);
		}
	} catch (e) {
		console.warn(
			`[hash] manifiesto previo ilegible (${e.message}): se re-renderiza todo`,
		);
	}
}

function inputHashForChunk(from, to) {
	const t0 = from / fps;
	const t1 = (to + 1) / fps;
	const caps = captionEntriesForRange(captionSegments, t0, t1, fps);
	return hashText(
		[paramsHash, codeHash, assetsHash, JSON.stringify(caps), `${from}-${to}`].join(
			'\n',
		),
	);
}

// El manifiesto se reescribe tras cada tramo (con concat=null hasta
// el final): un render interrumpido conserva los hashes de lo hecho
// y el siguiente --resume los aprovecha.
function writeManifest(concat) {
	const manifest = {
		project: projectId,
		composition: compositionId,
		frames: `${start}-${end}`,
		chunkSize,
		concurrency: Number(concurrency),
		timeoutMs: Number(timeout),
		crf: Number(crf),
		scale: Number(scale),
		x264Preset,
		audioCodec,
		videoOnly,
		draft,
		inputHashVersion: INPUT_HASH_VERSION,
		hashes: {params: paramsHash, code: codeHash, assets: assetsHash},
		chunks,
		totalFrames: chunks.reduce((s, c) => s + c.frames, 0),
		concat,
		createdAt: new Date().toISOString(),
	};
	writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
}

for (let from = start; from <= end; from += chunkSize) {
	const to = Math.min(from + chunkSize - 1, end);
	const idx = chunks.length + 1;
	const name = `chunk_${String(idx).padStart(2, '0')}.${chunkExt}`;
	const file = path.join(outDir, name);
	const expected = to - from + 1;
	const inputHash = inputHashForChunk(from, to);
	if (resume && existsSync(file)) {
		const have = countFrames(file);
		const prev = prevHashes.get(`${from}-${to}`);
		if (
			have === expected &&
			prev &&
			prevHashVersion === INPUT_HASH_VERSION &&
			prev.inputHash === inputHash
		) {
			console.log(`[tramo ${idx}] ${name} sin cambios (${have} f, hash ${inputHash.slice(0, 12)}) — salto`);
			chunks.push({
				file: name,
				from,
				to,
				frames: have,
				sha256: sha256(file),
				inputHash,
			});
			recordChunkProgress(idx, name, chunks.reduce((s, c) => s + c.frames, 0));
			writeManifest(null);
			continue;
		}
		if (have !== expected) {
			console.log(
				`[tramo ${idx}] ${name} incompleto (${have}/${expected} f) — re-render`,
			);
		} else if (!prev) {
			console.log(
				`[tramo ${idx}] ${name} sin hash previo (manifiesto antiguo o ausente) — re-render`,
			);
		} else if (prevHashVersion !== INPUT_HASH_VERSION) {
			console.log(
				`[tramo ${idx}] ${name} esquema de hash cambiado (v${prevHashVersion ?? '?'} → v${INPUT_HASH_VERSION}, migración) — re-render`,
			);
		} else {
			console.log(
				`[tramo ${idx}] ${name} entradas cambiadas (hash ${prev.inputHash.slice(0, 12)} → ${inputHash.slice(0, 12)}) — re-render`,
			);
		}
	}
	console.log(`[tramo ${idx}] fotogramas ${from}-${to} → ${name}`);
	const renderArgs = [
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
	];
	if (videoOnly) {
		// Audio a un temporal que se descarta: el tramo queda solo
		// con video pero por la vía de codificación con audio PCM
		// (bit-idéntico al tramo con audio; --muted no lo es).
		renderArgs.push('--audio-codec', 'pcm-16', '--separate-audio-to', sepAudioFile);
	} else {
		renderArgs.push('--audio-codec', audioCodec);
	}
	if (opts.scale !== undefined || draft) renderArgs.push('--scale', scale);
	if (opts['x264-preset'] !== undefined || draft) {
		renderArgs.push('--x264-preset', x264Preset);
	}
	try {
		runCmd(process.execPath, renderArgs, `render tramo ${idx}`);
	} finally {
		if (videoOnly) {
			try {
				unlinkSync(sepAudioFile);
			} catch {
				// Si el render falló antes de escribirlo, no hay nada que borrar.
			}
		}
	}
	const have = countFrames(file);
	if (have !== expected) {
		throw Error(
			`Tramo ${idx} incompleto: ${have}/${expected} fotogramas (${name})`,
		);
	}
	console.log(`[tramo ${idx}] verificado: ${have}/${expected} fotogramas`);
	chunks.push({file: name, from, to, frames: have, sha256: sha256(file), inputHash});
	recordChunkProgress(idx, name, chunks.reduce((s, c) => s + c.frames, 0));
	writeManifest(null);
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

writeManifest(concat);
console.log(
	`RENDER_CHUNKS_OK project=${projectId} chunks=${chunks.length} frames=${totalFrames}` +
		(concat ? ` output=${concat.file}` : ''),
);
if (renderLock) renderLock.release();
