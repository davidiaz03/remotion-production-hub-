/**
 * Probador de ganchos (hub-v6).
 *
 * Los primeros 3 segundos deciden si el reel se ve o se pasa de
 * largo. Este script renderiza esos primeros segundos UNA VEZ POR
 * VARIANTE de gancho, para compararlas antes de renderizar el reel
 * entero. Las variantes viven en `research/hooks.json` (new-reel lo
 * crea con la variante 0 = primera línea del guion); la composición
 * las recibe por la prop `hookVariant` (ver el esqueleto de new-reel).
 *
 * Uso:
 *   node scripts/hook-test.mjs <proyecto> [--seconds 3] [--variants 0,1]
 *     [--out out/hooks] [--scale 0.5] [--dry-run] [--force]
 *
 * - Cada variante sale a `out/hooks/variant-NN.mp4` (540p por
 *   defecto: es revisión, no entrega) + `out/hooks/index.json` con
 *   el texto de cada variante y su archivo.
 * - Si la composición no menciona `hookVariant`, se niega (todas las
 *   variantes saldrían idénticas): --force lo ignora.
 * - Renders: envolver con el candado de render (scripts/render-lock.sh)
 *   y con flock si otros trabajadores renderizan (ver docs/HUB-V6.md).
 *   --dry-run imprime el plan sin renderizar nada.
 */
import {
	existsSync,
	mkdirSync,
	readFileSync,
	readdirSync,
	statSync,
	writeFileSync,
} from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {ROOT, loadProject, parseArgs, requireFile} from './lib.mjs';

const {pos, opts} = parseArgs(process.argv.slice(2));
const projectId = pos[0];
if (!projectId) {
	throw Error(
		'Use: node scripts/hook-test.mjs <proyecto> [--seconds 3] [--variants 0,1] [--dry-run]',
	);
}
const {home, data} = loadProject(projectId);
const fps = Number(data.fps ?? 30);
const seconds = Number(opts.seconds ?? 3);
if (!Number.isFinite(seconds) || seconds <= 0 || seconds > 30) {
	throw Error(`--seconds debe estar entre 0 y 30 (recibido: ${opts.seconds})`);
}
const frames = Math.min(
	Math.round(seconds * fps),
	data.durationInFrames,
);
const scale = String(opts.scale ?? '0.5');
const dryRun = opts['dry-run'] === true || opts['dry-run'] === 'true';
const force = opts.force === true || opts.force === 'true';
const outDir = path.resolve(home, String(opts.out ?? 'out/hooks'));

// Variantes de research/hooks.json.
const hooksPath = path.join(home, 'research', 'hooks.json');
if (!existsSync(hooksPath)) {
	throw Error(
		`Sin variantes de gancho: falta ${path.relative(ROOT, hooksPath)} ` +
			`(new-reel lo crea; en proyectos viejos, créalo a mano: {"variants": [{"text": "...", "style": "title"}]})`,
	);
}
let hooks;
try {
	hooks = JSON.parse(readFileSync(hooksPath, 'utf8'));
} catch (e) {
	throw Error(`hooks.json ilegible: ${e.message}`);
}
const variants = hooks.variants;
if (!Array.isArray(variants) || variants.length === 0) {
	throw Error('hooks.json sin variants[] no vacío');
}
let selected = variants.map((_, i) => i);
if (opts.variants !== undefined) {
	selected = String(opts.variants)
		.split(',')
		.map((s) => Number(s.trim()))
		.filter((n) => Number.isInteger(n));
	if (selected.length === 0) {
		throw Error(`--variants inválido: ${opts.variants}`);
	}
	for (const i of selected) {
		if (i < 0 || i >= variants.length) {
			throw Error(
				`Variante ${i} fuera de rango (hay ${variants.length}: 0-${variants.length - 1})`,
			);
		}
	}
}

// La composición debe leer la prop hookVariant; si no, todas las
// variantes salen idénticas y el render es trabajo tirado.
function codeMentionsHookVariant(dir) {
	const walk = (d) => {
		let entries;
		try {
			entries = readdirSync(d).sort();
		} catch {
			return false;
		}
		for (const name of entries) {
			const p = path.join(d, name);
			const st = statSync(p, {throwIfNoEntry: false});
			if (!st) continue;
			if (st.isDirectory()) {
				if (walk(p)) return true;
			} else if (
				st.isFile() &&
				/\.(tsx?|jsx?|mjs)$/.test(name) &&
				readFileSync(p, 'utf8').includes('hookVariant')
			) {
				return true;
			}
		}
		return false;
	};
	return walk(dir);
}
if (!force && !codeMentionsHookVariant(path.join(home, 'src'))) {
	throw Error(
		`La composición de ${projectId} no lee la prop hookVariant: todas las variantes saldrían idénticas. ` +
			`Añade el soporte (ver el esqueleto de new-reel: MainReel recibe {hookVariant} y elige el texto de research/hooks.json) o usa --force.`,
	);
}

const entry = requireFile(path.join(home, 'src/index.ts'));
const publicDir = path.join(home, 'public');
const cli = requireFile(
	path.join(ROOT, 'node_modules/@remotion/cli/remotion-cli.js'),
);
const compositionId = opts.composition || data.compositionId;

const plan = selected.map((i) => ({
	index: i,
	text: variants[i].text ?? '',
	style: variants[i].style ?? 'title',
	file: `variant-${String(i).padStart(2, '0')}.mp4`,
}));
console.log(
	`[hook-test] ${projectId}: ${plan.length} variante(s), primeros ${frames} fotogramas (${(frames / fps).toFixed(1)} s) a escala ${scale}`,
);
for (const v of plan) {
	console.log(`  variante ${v.index} [${v.style}]: ${v.file} — «${v.text}»`);
}
if (dryRun) {
	console.log('[hook-test] --dry-run: sin renderizar');
	process.exit(0);
}

mkdirSync(outDir, {recursive: true});
function runCmd(cmd, args, label) {
	const r = spawnSync(cmd, args, {cwd: ROOT, stdio: 'inherit'});
	if (r.error) throw r.error;
	if (r.status !== 0) {
		throw Error(`${label} falló (código ${r.status ?? 'señal'})`);
	}
}

const results = [];
for (const v of plan) {
	const out = path.join(outDir, v.file);
	console.log(`[hook-test] variante ${v.index} → ${v.file}`);
	runCmd(
		process.execPath,
		[
			cli,
			'render',
			entry,
			compositionId,
			out,
			'--public-dir',
			publicDir,
			'--codec',
			'h264',
			'--pixel-format',
			'yuv420p',
			'--crf',
			'23',
			'--frames',
			`0-${frames - 1}`,
			'--scale',
			scale,
			'--x264-preset',
			'veryfast',
			'--props',
			JSON.stringify({hookVariant: v.index}),
			'--concurrency',
			String(opts.concurrency ?? '2'),
			'--timeout',
			String(opts.timeout ?? '120000'),
			'--log',
			'warn',
		],
		`render variante ${v.index}`,
	);
	results.push({...v, path: path.relative(home, out)});
}
writeFileSync(
	path.join(outDir, 'index.json'),
	JSON.stringify(
		{
			project: projectId,
			composition: compositionId,
			seconds: frames / fps,
			frames,
			scale: Number(scale),
			variants: results,
			createdAt: new Date().toISOString(),
		},
		null,
		2,
	) + '\n',
);
console.log(
	`HOOK_TEST_OK project=${projectId} variants=${results.length} out=${path.relative(home, outDir)}`,
);
