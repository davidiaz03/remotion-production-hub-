/**
 * Andamiaje de reel nuevo (hub-v6).
 *
 * Del guion + VO al esqueleto completo en un comando: proyecto,
 * captions alineados, composición con escenas por línea, plan de
 * edición, manifiesto de pre-vuelo, ganchos y runbook con los
 * siguientes pasos exactos. Antes, arrancar un reel era copiar la
 * plantilla de 90 fotogramas y escribir a mano captions, escenas y
 * manifiesto (el flujo de marti-fidel necesitó un build-vo-real.py
 * por versión).
 *
 * Uso:
 *   node scripts/new-reel.mjs <slug> --title "..." --script GUION.md --vo vo.wav
 *     [--platform instagram-reels|tiktok|youtube-shorts|facebook-reels]
 *     [--karaoke classic|pill] [--caption-safe]
 *     [--key-words "gigante,patria"] [--handle @memorialdenuncia]
 *     [--subtitle "..."] [--logo img/logo-white.png]
 *     [--captions captions.json | --timings estimate]
 *
 * - --script: guion, una línea de VO por línea de texto (# = comentario).
 * - --vo: voz en off en un solo archivo (se copia a public/audio/vo.wav).
 * - Captions (tres vías, en orden):
 *   1. Por defecto: transcribe-vo-file.py (Whisper + alineación al
 *      guion). TRABAJO PESADO: envolver la llamada con flock si otros
 *      trabajadores renderizan (ver docs/HUB-V6.md).
 *   2. --captions <json>: CapSegment[] ya alineados (p. ej. de una
 *      corrida anterior); no corre Whisper.
 *   3. --timings estimate: tiempos estimados por reparto uniforme
 *      (sin Whisper). El captions.ts queda marcado ESTIMADO y el
 *      runbook exige transcribir antes del máster.
 * - La composición es un ESQUELETO: cada escena muestra su línea como
 *   tarjeta sobre degradado (storyboard legible en el borrador), con
 *   TODOs para sustituirla por el asset real. El karaoke, el audio,
 *   la tarjeta de cierre y la guía de zonas seguras ya van cableados.
 * - La duración es la VO + 2,5 s de cierre.
 */
import {
	copyFileSync,
	existsSync,
	mkdirSync,
	readFileSync,
	writeFileSync,
} from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {ROOT, SLUG_RE, parseArgs, projectPath} from './lib.mjs';

const FPS = 30;
const CLOSING_FRAMES = 75; // 2,5 s de tarjeta de cierre.
const STT_PYTHON = '/home/hatch/workspace/.stt-env/bin/python';
const PLATFORMS = new Set([
	'instagram-reels',
	'tiktok',
	'youtube-shorts',
	'facebook-reels',
]);
// Fondos del esqueleto (degradados de la casa, en rotación).
const BACKGROUNDS = [
	'linear-gradient(160deg, #0A1628 0%, #132238 100%)',
	'linear-gradient(160deg, #1C0A0A 0%, #3A1010 100%)',
	'linear-gradient(160deg, #0A1F1C 0%, #123B34 100%)',
	'linear-gradient(160deg, #141414 0%, #2B2B2B 100%)',
];

const {pos, opts} = parseArgs(process.argv.slice(2));
const slug = pos[0];
if (!slug || !SLUG_RE.test(slug)) {
	throw Error(
		'Use: node scripts/new-reel.mjs <slug> --title "..." --script GUION.md --vo vo.wav\n' +
			'El slug usa solo minúsculas, dígitos y guiones.',
	);
}
const title = String(opts.title ?? slug.replaceAll('-', ' ').toUpperCase());
const scriptPath = opts.script ? path.resolve(String(opts.script)) : null;
const voPath = opts.vo ? path.resolve(String(opts.vo)) : null;
if (!scriptPath || !existsSync(scriptPath)) {
	throw Error(`--script obligatorio y debe existir: ${opts.script ?? '(ausente)'}`);
}
if (!voPath || !existsSync(voPath)) {
	throw Error(`--vo obligatorio y debe existir: ${opts.vo ?? '(ausente)'}`);
}
const platform = String(opts.platform ?? 'instagram-reels');
if (!PLATFORMS.has(platform)) {
	throw Error(
		`--platform debe ser una de: ${[...PLATFORMS].join(', ')} (recibido: ${platform})`,
	);
}
const karaokeVariant = String(opts['karaoke'] ?? 'classic');
if (!['classic', 'pill'].includes(karaokeVariant)) {
	throw Error(`--karaoke debe ser classic o pill (recibido: ${karaokeVariant})`);
}
const captionSafe = opts['caption-safe'] === true || opts['caption-safe'] === 'true';
const keyWords = String(opts['key-words'] ?? '');
const handle = opts.handle ? String(opts.handle) : null;
const subtitle = opts.subtitle ? String(opts.subtitle) : null;
const logoArg = opts.logo ? String(opts.logo) : null;
const captionsArg = opts.captions ? path.resolve(String(opts.captions)) : null;
const estimateTimings =
	opts.timings === 'estimate' || opts['timings'] === 'estimate';
if (captionsArg && estimateTimings) {
	throw Error('--captions y --timings estimate son excluyentes');
}
if (captionsArg && !existsSync(captionsArg)) {
	throw Error(`--captions no existe: ${captionsArg}`);
}
const home = projectPath(slug);
if (existsSync(home)) {
	throw Error(`El proyecto ${slug} ya existe; new-reel nunca sobrescribe`);
}

function run(cmd, args, label) {
	const r = spawnSync(cmd, args, {cwd: ROOT, encoding: 'utf8'});
	if (r.error) throw r.error;
	if (r.status !== 0) {
		throw Error(`${label} falló (código ${r.status}):\n${r.stdout}\n${r.stderr}`);
	}
	return r.stdout;
}

function parseScript(file) {
	return readFileSync(file, 'utf8')
		.split('\n')
		.map((l) => l.trim())
		.filter((l) => l && !l.startsWith('#'));
}

function voDuration(file) {
	const r = spawnSync(
		'ffprobe',
		['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file],
		{encoding: 'utf8'},
	);
	if (r.status !== 0) throw Error(`ffprobe falló sobre ${file}`);
	const d = Number(r.stdout.trim());
	if (!Number.isFinite(d) || d <= 0) {
		throw Error(`No se pudo medir la duración de ${file}`);
	}
	return d;
}

function capSegmentsToTS(segments, note) {
	const lines = [
		'// Auto-generated by scripts/new-reel.mjs. Do not edit by hand.',
	];
	if (note) lines.push(`// ${note}`);
	lines.push(
		'export type CapWord = {t: string; s: number; e: number; kw: boolean};',
		'export type CapChunk = {start: number; end: number; words: CapWord[]};',
		'export type CapSegment = {id: number; start: number; frames: number; chunks: CapChunk[]};',
		`export const CAPTIONS: CapSegment[] = ${JSON.stringify(segments)};`,
	);
	return lines.join('\n') + '\n';
}

// Tiempos estimados: reparto uniforme de las palabras en la duración
// de la VO (8% reservado a pausas entre líneas). Solo para arrancar
// el esqueleto sin Whisper; el runbook exige transcribir antes del
// máster y el archivo queda marcado ESTIMADO.
function estimateSegments(lines, duration) {
	const lineWords = lines.map((l) => l.split(/\s+/).filter(Boolean));
	const total = lineWords.reduce((s, w) => s + w.length, 0);
	const usable = duration * 0.92;
	const perWord = usable / total;
	const gap = (duration * 0.08) / lines.length;
	let t = 0;
	return lineWords.map((words, li) => {
		const start = t;
		const chunks = [];
		for (let i = 0; i < words.length; i += 4) {
			const slice = words.slice(i, i + 4);
			const cwords = slice.map((w, j) => {
				const s = t + (i + j) * perWord;
				return {t: w.toUpperCase(), s: round3(s), e: round3(s + perWord), kw: false};
			});
			chunks.push({start: cwords[0].s, end: cwords[cwords.length - 1].e, words: cwords});
		}
		t += words.length * perWord + gap;
		const nextStart = li + 1 < lines.length ? t : duration;
		return {
			id: li + 1,
			start: round3(start),
			frames: Math.max(1, Math.round((nextStart - start) * FPS)),
			chunks,
		};
	});
}

function round3(x) {
	return Math.round(x * 1000) / 1000;
}

function validateCapSegments(data) {
	if (!Array.isArray(data) || data.length === 0) {
		throw Error('--captions debe ser un JSON con un array CapSegment[] no vacío');
	}
	for (const seg of data) {
		if (
			typeof seg.start !== 'number' ||
			typeof seg.frames !== 'number' ||
			!Array.isArray(seg.chunks) ||
			seg.chunks.length === 0
		) {
			throw Error('--captions: segmento sin start/frames/chunks válidos');
		}
		for (const ch of seg.chunks) {
			if (!Array.isArray(ch.words) || ch.words.length === 0) {
				throw Error('--captions: chunk sin words');
			}
			for (const w of ch.words) {
				if (typeof w.t !== 'string' || typeof w.s !== 'number') {
					throw Error('--captions: palabra sin t/s');
				}
			}
		}
	}
	return data;
}

function fmtTime(sec) {
	const m = Math.floor(sec / 60);
	const s = sec - m * 60;
	return `${m}:${s.toFixed(1).padStart(4, '0')}`;
}

function escTs(s) {
	return s.replaceAll('\\', '\\\\').replaceAll("'", "\\'");
}

// --- 1. Proyecto base (plantilla reel) -------------------------------
console.log(`[new-reel] creando ${slug} (${title})...`);
run(
	process.execPath,
	[path.join(ROOT, 'scripts', 'project.mjs'), 'create', slug, title],
	'project.mjs create',
);

// --- 2. Guion + VO ----------------------------------------------------
const lines = parseScript(scriptPath);
const duration = voDuration(voPath);
const voFrames = Math.ceil(duration * FPS);
const totalFrames = voFrames + CLOSING_FRAMES;
mkdirSync(path.join(home, 'public', 'audio'), {recursive: true});
copyFileSync(voPath, path.join(home, 'public', 'audio', 'vo.wav'));
writeFileSync(path.join(home, 'GUION.md'), readFileSync(scriptPath, 'utf8'));
console.log(
	`[new-reel] guion: ${lines.length} líneas; VO: ${duration.toFixed(2)} s (${voFrames} f); total: ${totalFrames} f`,
);

// --- 3. Captions ------------------------------------------------------
const captionsTsPath = path.join(home, 'src', 'captions.ts');
let segments;
let captionsNote;
if (captionsArg) {
	segments = validateCapSegments(JSON.parse(readFileSync(captionsArg, 'utf8')));
	writeFileSync(
		captionsTsPath,
		capSegmentsToTS(segments, `Captions importados de ${captionsArg}.`),
	);
	captionsNote = `captions importados de ${path.basename(captionsArg)}`;
} else if (estimateTimings) {
	segments = estimateSegments(lines, duration);
	writeFileSync(
		captionsTsPath,
		capSegmentsToTS(
			segments,
			'ESTIMADO: tiempos por reparto uniforme, NO alineados a la VO. ' +
				'Transcribir con transcribe-vo-file.py antes del máster.',
		),
	);
	captionsNote = 'captions ESTIMADOS (sin Whisper)';
} else {
	console.log('[new-reel] transcribiendo VO con Whisper (trabajo pesado)...');
	const args = [
		path.join(ROOT, 'scripts', 'audio', 'transcribe-vo-file.py'),
		'--vo',
		path.join(home, 'public', 'audio', 'vo.wav'),
		'--script',
		scriptPath,
		'--out',
		captionsTsPath,
		'--out-json',
		path.join(home, 'research', 'captions.json'),
		'--fps',
		String(FPS),
	];
	if (keyWords) args.push('--key-words', keyWords);
	mkdirSync(path.join(home, 'research'), {recursive: true});
	const out = run(STT_PYTHON, args, 'transcribe-vo-file.py');
	process.stdout.write(out);
	// Releer los segmentos del .ts generado (parseo del literal
	// CAPTIONS, mismo anclaje que render-chunks.mjs).
	const src = readFileSync(captionsTsPath, 'utf8');
	const anchor = src.indexOf('CAPTIONS');
	const eq = src.indexOf('=', anchor);
	const start = src.indexOf('[', eq);
	segments = JSON.parse(src.slice(start, src.lastIndexOf(']') + 1));
	captionsNote = 'captions transcritos con Whisper y alineados al guion';
}
console.log(`[new-reel] captions: ${captionsNote}`);

// --- 4. Escenas y plan -----------------------------------------------
// Una escena por línea del guion; los límites vienen de los segmentos
// (si hay más líneas que segmentos, las últimas comparten la cola).
const scenes = lines.map((line, i) => {
	const seg = segments[Math.min(i, segments.length - 1)];
	const startSec = i < segments.length ? seg.start : duration;
	const endSec =
		i + 1 < segments.length
			? segments[i + 1].start
			: duration;
	const from = Math.round(startSec * FPS);
	const to = Math.min(voFrames, Math.round(endSec * FPS));
	return {
		id: i + 1,
		name: `S${i + 1}`,
		line,
		startSec: round3(startSec),
		endSec: round3(endSec),
		from,
		durationInFrames: Math.max(1, to - from),
		bg: BACKGROUNDS[i % BACKGROUNDS.length],
		asset: null,
	};
});
const closingFrom = voFrames;

const editPlan = {
	project: slug,
	title,
	platform,
	fps: FPS,
	voFile: 'audio/vo.wav',
	voDurationSec: round3(duration),
	voFrames,
	closingFrames: CLOSING_FRAMES,
	durationInFrames: totalFrames,
	karaoke: karaokeVariant,
	captionSafe,
	captions: captionsNote,
	scenes: scenes.map((s) => ({
		id: s.id,
		name: s.name,
		line: s.line,
		startSec: s.startSec,
		endSec: s.endSec,
		startFrame: s.from,
		durationInFrames: s.durationInFrames,
		asset: s.asset,
		notes: 'TODO: sustituir la tarjeta por el asset real (foto, KenBurnsStill, motion).',
	})),
	closing: {
		name: 'CLOSING',
		startFrame: closingFrom,
		durationInFrames: CLOSING_FRAMES,
	},
};
mkdirSync(path.join(home, 'research'), {recursive: true});
writeFileSync(
	path.join(home, 'research', 'edit-plan.json'),
	JSON.stringify(editPlan, null, 2) + '\n',
);
writeFileSync(
	path.join(home, 'research', 'hooks.json'),
	JSON.stringify(
		{
			project: slug,
			note: 'Variantes del gancho (primeros 3 s). La variante 0 es la primera línea del guion; añade variantes y pruébalas con scripts/hook-test.mjs.',
			variants: [{text: lines[0], style: 'title'}],
		},
		null,
		2,
	) + '\n',
);
writeFileSync(
	path.join(home, 'preflight-scenes.json'),
	JSON.stringify(
		{
			project: slug,
			fps: FPS,
			scenes: [
				...scenes.map((s) => ({
					name: s.name,
					start: s.from,
					end: s.from + s.durationInFrames - 1,
				})),
				{
					name: 'CLOSING',
					start: closingFrom,
					end: closingFrom + CLOSING_FRAMES - 1,
				},
			],
			logo_skip_scenes: ['CLOSING'],
		},
		null,
		2,
	) + '\n',
);

// --- 5. Composición esqueleto ----------------------------------------
const logoFile = logoArg ? path.join(home, 'public', logoArg) : null;
let useLogo = false;
if (logoArg) {
	if (existsSync(logoFile)) {
		useLogo = true;
	} else {
		console.warn(
			`[new-reel] AVISO: --logo ${logoArg} no existe en public/: sin marca de agua (copia el logo a public/${logoArg} y añade <BrandFrame logo="${logoArg}" />)`,
		);
	}
}
const sceneRows = scenes
	.map(
		(s) =>
			`\t{name: '${s.name}', from: ${s.from}, dur: ${s.durationInFrames}, line: '${escTs(s.line)}', bg: '${s.bg}'},`,
	)
	.join('\n');
const bottomProp = captionSafe
	? 'preset.caption.bottomStrict'
	: 'preset.caption.bottom';
const videoTsx = `import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {BottomKaraoke} from '../../../shared/captions/BottomKaraoke';
import {capSegmentsToLines} from '../../../shared/captions/legacy';
import {ClosingCard} from '../../../shared/ClosingCard';
import {SafeZoneOverlay} from '../../../shared/SafeZoneOverlay';
import {getPlatformPreset} from '../../../shared/platforms';
${useLogo ? "import {BrandFrame} from '../../../shared/BrandFrame';\n" : ''}import {CAPTIONS} from './captions';
import hooksData from '../research/hooks.json';

// Esqueleto generado por scripts/new-reel.mjs (${slug}).
// Cada escena es una TARJETA con su línea del guion sobre degradado:
// el borrador se lee como un storyboard. TODO por escena: sustituir
// la tarjeta por el asset real (foto, KenBurnsStill, motion graphics)
// y borrar el rótulo. El karaoke, el audio, el cierre y la guía de
// zonas seguras ya van cableados.
const PLATFORM = '${platform}';
const SCENES = [
${sceneRows}
];
const CLOSING_FROM = ${closingFrom};
const CLOSING_DUR = ${CLOSING_FRAMES};
// Ganchos (research/hooks.json, editable): la variante 0 es la
// primera línea del guion. hook-test.mjs renderiza los primeros 3 s
// por variante pasando --props {"hookVariant": N}.
const HOOKS: {text: string; style?: string}[] =
\t(hooksData as {variants?: {text: string; style?: string}[]}).variants?.length
\t\t? (hooksData as {variants: {text: string; style?: string}[]}).variants
\t\t: [{text: '${escTs(lines[0])}', style: 'title'}];

const SceneCard: React.FC<{scene: (typeof SCENES)[number]; hookText?: string}> = ({scene, hookText}) => {
\tconst f = useCurrentFrame();
\tconst fade = interpolate(f, [0, 8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
\treturn (
\t\t<AbsoluteFill style={{background: scene.bg, justifyContent: 'center', alignItems: 'center', opacity: fade}}>
\t\t\t<div style={{position: 'absolute', top: 64, left: 48, fontFamily: 'monospace', fontSize: 28, color: 'rgba(255,255,255,0.55)'}}>
\t\t\t\t{scene.name} · {hookText ? 'GANCHO' : 'ESQUELETO — sustituir por el asset real'}
\t\t\t</div>
\t\t\t<div style={{fontFamily: "'Archivo Black', sans-serif", fontSize: 56, lineHeight: 1.2, color: '#FFFFFF', textAlign: 'center', padding: '0 80px', textTransform: 'uppercase'}}>
\t\t\t\t{hookText ?? scene.line}
\t\t\t</div>
\t\t</AbsoluteFill>
\t);
};

export const MainReel: React.FC<{hookVariant?: number; debugSafeZones?: boolean}> = ({hookVariant = 0, debugSafeZones = false}) => {
\tconst preset = getPlatformPreset(PLATFORM);
\tconst hook = HOOKS[hookVariant] ?? HOOKS[0];
\tconst lines = React.useMemo(() => capSegmentsToLines(CAPTIONS), []);
\treturn (
\t\t<AbsoluteFill style={{background: '#0A1628'}}>
\t\t\t<Audio src={staticFile('audio/vo.wav')} />
${useLogo ? `\t\t\t<BrandFrame logo="${logoArg}" />\n` : ''}\t\t\t{SCENES.map((s, i) => (
\t\t\t\t<Sequence key={s.name} from={s.from} durationInFrames={s.dur} name={s.name}>
\t\t\t\t\t<SceneCard scene={s} hookText={i === 0 ? hook.text : undefined} />
\t\t\t\t</Sequence>
\t\t\t))}
\t\t\t<Sequence from={CLOSING_FROM} durationInFrames={CLOSING_DUR} name="CLOSING">
\t\t\t\t<ClosingCard title="${escTs(title)}"${subtitle ? ` subtitle="${escTs(subtitle)}"` : ''}${handle ? ` handle="${escTs(handle)}"` : ''}${useLogo ? ` logo="${logoArg}"` : ''} sequenceFrames={CLOSING_DUR} />
\t\t\t</Sequence>
\t\t\t<BottomKaraoke lines={lines} size={preset.caption.size} longSize={preset.caption.longSize} bottom={${bottomProp}} variant="${karaokeVariant}" />
\t\t\t<SafeZoneOverlay platform={PLATFORM} show={debugSafeZones} />
\t\t</AbsoluteFill>
\t);
};
`;
writeFileSync(path.join(home, 'src', 'Video.tsx'), videoTsx);

// --- 6. project.json + STATE + runbook --------------------------------
const pjPath = path.join(home, 'project.json');
const pj = JSON.parse(readFileSync(pjPath, 'utf8'));
pj.durationInFrames = totalFrames;
pj.audioRequired = true;
pj.platform = platform;
pj.voFile = 'audio/vo.wav';
writeFileSync(pjPath, JSON.stringify(pj, null, 2) + '\n');

const statePath = path.join(home, 'STATE.json');
try {
	const state = JSON.parse(readFileSync(statePath, 'utf8'));
	state.nextTask =
		'Seguir RUNBOOK.md: sustituir las tarjetas por assets reales, alinear captions, pre-vuelo y borrador.';
	writeFileSync(statePath, JSON.stringify(state, null, 2) + '\n');
} catch {
	// STATE.json opcional: el esqueleto no depende de él.
}

const runbook = `# RUNBOOK — ${title} (\`${slug}\`)

Esqueleto generado por \`scripts/new-reel.mjs\` el ${new Date().toISOString()}.
Plataforma: **${platform}** · karaoke: **${karaokeVariant}**${captionSafe ? ' (despeje estricto)' : ''} · VO: ${duration.toFixed(2)} s · total: ${totalFrames} f (${fmtTime(totalFrames / FPS)}).

Captions: ${captionsNote}.

## 1. Sustituir las tarjetas por assets reales

Cada escena de \`src/Video.tsx\` es una tarjeta con su línea del guion.
Sustituir por foto (\`KenBurnsStill\`), vídeo o motion graphics, una
escena cada vez. El plan está en \`research/edit-plan.json\`.
${useLogo ? '' : 'Sin marca de agua: copia el logotipo completo a `public/img/logo-white.png` y añade `<BrandFrame logo="img/logo-white.png" />` en `Video.tsx` (la regla del Memorial: logotipo COMPLETO, nunca solo la estrella).\n'}
## 2. Alinear los captions con la voz (obligatorio antes del render)

Los tiempos de Whisper adelantan los bordes tras pausa (hasta 0,56 s):

\`\`\`bash
~/workspace/.stt-env/bin/python scripts/audio/align-captions.py \\
  --voice projects/${slug}/public/audio/vo.wav \\
  --captions projects/${slug}/src/captions.ts \\
  --out projects/${slug}/src/captions.ts --verify
\`\`\`
${estimateTimings ? '> Los captions actuales son ESTIMADOS: antes de alinear, transcribe de verdad con `scripts/audio/transcribe-vo-file.py --vo public/audio/vo.wav --script GUION.md --out src/captions.ts`.\n' : ''}
## 3. Pre-vuelo visual (obligatorio: el render lo exige)

\`\`\`bash
flock /tmp/noche-ecosistemas-heavy.lock -c '~/workspace/remotion-hub/.venv/bin/python scripts/visual-preflight.py --stills --project ${slug} --manifest projects/${slug}/preflight-scenes.json --out projects/${slug}/out/preflight.json'
\`\`\`

Sin bloqueantes, el render se desbloquea. Con bloqueantes: corregir el
layout y repetir el pre-vuelo.

## 4. Borrador 540p (revisión creativa)

\`\`\`bash
flock /tmp/noche-ecosistemas-heavy.lock -c 'source scripts/render-lock.sh && render_lock_acquire && node scripts/render-chunks.mjs ${slug} --draft --resume; render_lock_release'
\`\`\`

## 5. Probar ganchos (opcional)

Añade variantes en \`research/hooks.json\` y renderiza los primeros 3 s
de cada una:

\`\`\`bash
node scripts/hook-test.mjs ${slug} --seconds 3
\`\`\`

## 6. Máster

Mezcla de audio con \`scripts/audio/master.py\` (VO + cama escaneada con
\`scan-bed.py\` y ventana elegida con \`select-bed-window.py\`), render
completo con \`render-chunks.mjs --video-only --resume\` y auditoría con
\`scripts/audio/audit-audio.py\` antes de entregar.
`;
writeFileSync(path.join(home, 'RUNBOOK.md'), runbook);

console.log(`[new-reel] OK projects/${slug}`);
console.log(`  composición: src/Video.tsx (${scenes.length} escenas + CLOSING)`);
console.log(`  captions: src/captions.ts (${segments.length} segmentos)`);
console.log(`  plan: research/edit-plan.json · pre-vuelo: preflight-scenes.json`);
console.log(`  siguiente paso: leer projects/${slug}/RUNBOOK.md`);
