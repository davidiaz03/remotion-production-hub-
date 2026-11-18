#!/usr/bin/env node
/**
 * Renderiza plantillas de contenido estático a PNG (+ JPG ligero).
 *
 *   node content/scripts/render.mjs --template post --data data.json --out out/
 *   node content/scripts/render.mjs --piece <slug>            # usa pieces/<slug>/
 *   node content/scripts/render.mjs --example <plantilla>     # ejemplo de la plantilla
 *   node content/scripts/render.mjs --all-examples            # los 6 ejemplos
 *
 * Cada render produce en --out: <nombre>.png (máster), <nombre>-light.jpg
 * (ligero para el móvil) y <nombre>.html (intermedio, para depurar).
 * Las plantillas multi-página (carousel) producen un PNG por página.
 *
 * El render usa Chromium headless por CDP (ver scripts/cdp.mjs): el modo
 * CLI --screenshot se cuelga en esta VM. Requiere node_modules del hub
 * (checkout principal) o $CHROME_HEADLESS_SHELL.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, readdirSync, statSync } from 'node:fs';
import { execFile } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { screenshot } from './cdp.mjs';
import { renderTemplate } from './template.mjs';
import { readState, setPhase, recordMilestone } from './state.mjs';

const execFileAsync = promisify(execFile);
const CONTENT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const IMAGE_KEYS = new Set(['image', 'background', 'photo', 'cover', 'portrait', 'cutout']);
const TEMPLATES = ['post', 'story', 'carousel', 'infographic', 'thumbnail', 'quote'];

function parseArgs(argv) {
	const out = {};
	for (let i = 0; i < argv.length; i++) {
		if (argv[i].startsWith('--')) {
			const key = argv[i].slice(2);
			const next = argv[i + 1];
			if (next && !next.startsWith('--')) { out[key] = next; i++; }
			else out[key] = true;
		}
	}
	return out;
}

function usage() {
	console.error('Uso: render.mjs --template <t> --data <json> --out <dir> [--name <base>]');
	console.error('     render.mjs --piece <slug> [--name <base>]');
	console.error('     render.mjs --example <plantilla> | --all-examples');
	process.exit(1);
}

/** Dimensiones reales de un PNG (cabecera IHDR, sin dependencias). */
export function pngSize(file) {
	const b = readFileSync(file);
	if (b.length < 24 || b.toString('ascii', 1, 4) !== 'PNG') throw new Error(`No es PNG: ${file}`);
	return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}

function loadTemplate(name) {
	const dir = path.join(CONTENT, 'templates', name);
	const metaPath = path.join(dir, 'template.json');
	if (!existsSync(metaPath)) throw new Error(`Plantilla desconocida: ${name}`);
	const meta = JSON.parse(readFileSync(metaPath, 'utf8'));
	return { dir, meta, html: readFileSync(path.join(dir, 'template.html'), 'utf8') };
}

/** Copia un archivo a assets/ con nombre único; devuelve la ruta relativa. */
function stageFile(src, assetsDir, used) {
	const base = path.basename(src).replace(/[^A-Za-z0-9._-]/g, '_');
	let name = base;
	let n = 1;
	while (used.has(name)) { name = `${n++}-${base}`; }
	used.add(name);
	copyFileSync(src, path.join(assetsDir, name));
	return `assets/${name}`;
}

/** Recorre data y sustituye rutas de imagen existentes por su copia staged. */
function stageImages(data, dataDir, assetsDir, used) {
	if (Array.isArray(data)) {
		data.forEach((v) => stageImages(v, dataDir, assetsDir, used));
		return;
	}
	if (!data || typeof data !== 'object') return;
	for (const [key, val] of Object.entries(data)) {
		if (IMAGE_KEYS.has(key) && typeof val === 'string' && val && !val.startsWith('assets/')) {
			const candidates = [path.resolve(dataDir, val), path.resolve(process.cwd(), val), path.resolve(CONTENT, val)];
			const found = candidates.find((c) => existsSync(c));
			if (found) data[key] = stageFile(found, assetsDir, used);
			else console.warn(`  ! imagen no encontrada (${key}): ${val}`);
		} else {
			stageImages(val, dataDir, assetsDir, used);
		}
	}
}

async function renderOne({ tpl, data, outDir, name, waitMs }) {
	const { dir: tplDir, meta, html } = tpl;
	mkdirSync(outDir, { recursive: true });
	const assetsDir = path.join(outDir, 'assets');
	mkdirSync(path.join(assetsDir, 'fonts'), { recursive: true });
	mkdirSync(path.join(assetsDir, 'textures'), { recursive: true });
	const used = new Set();
	// CSS base + fuentes + texturas + logos.
	copyFileSync(path.join(CONTENT, 'lib', 'base.css'), path.join(assetsDir, 'base.css'));
	for (const f of readdirSync(path.join(CONTENT, 'brand', 'fonts'))) {
		if (f.endsWith('.ttf')) copyFileSync(path.join(CONTENT, 'brand', 'fonts', f), path.join(assetsDir, 'fonts', f));
	}
	for (const f of readdirSync(path.join(CONTENT, 'brand', 'textures'))) {
		copyFileSync(path.join(CONTENT, 'brand', 'textures', f), path.join(assetsDir, 'textures', f));
	}
	copyFileSync(path.join(CONTENT, 'brand', 'logo-color.png'), path.join(assetsDir, 'logo-color.png'));
	await execFileAsync('python3', [
		path.join(CONTENT, 'scripts', 'make-logo-white.py'),
		path.join(CONTENT, 'brand', 'logo-color.png'),
		path.join(assetsDir, 'logo-white.png'),
	]);
	// Imágenes de data.
	const dataDir = data.__dir ?? process.cwd();
	stageImages(data, dataDir, assetsDir, used);
	// Componer HTML.
	const { html: composed, warnings } = renderTemplate(html, data, { iconsDir: path.join(CONTENT, 'lib', 'icons') });
	for (const w of warnings) console.warn(`  ! ${w}`);
	const withSize = composed.replace('</head>',
		`<style>:root{--page-w:${meta.width}px;--page-h:${meta.height}px}</style></head>`);
	const htmlPath = path.join(outDir, `${name}.html`);
	writeFileSync(htmlPath, withSize);
	// Screenshot por CDP.
	const pngPath = path.join(outDir, `${name}.png`);
	await screenshot({ url: `file://${htmlPath}`, width: meta.width, height: meta.height, out: pngPath, waitMs });
	const size = pngSize(pngPath);
	if (size.width !== meta.width || size.height !== meta.height) {
		throw new Error(`Dimensiones incorrectas en ${name}.png: ${size.width}x${size.height}, esperado ${meta.width}x${meta.height}`);
	}
	// JPG ligero.
	const { stdout } = await execFileAsync('python3', [
		path.join(CONTENT, 'scripts', 'postprocess.py'), pngPath,
	], { cwd: CONTENT });
	const lightPath = path.join(outDir, `${name}-light.jpg`);
	const kb = (p) => `${Math.round(statSync(p).size / 1024)} KB`;
	console.log(`  ✓ ${name}.png (${size.width}x${size.height}, ${kb(pngPath)}) + ${name}-light.jpg (${kb(lightPath)})`);
	return { png: pngPath, light: lightPath, html: htmlPath };
}

async function main() {
	const args = parseArgs(process.argv.slice(2));
	const waitMs = Number(args.wait ?? 600);
	const jobs = [];
	if (args['all-examples']) {
		for (const t of TEMPLATES) {
			jobs.push({ template: t, dataFile: path.join(CONTENT, 'templates', t, 'data.example.json'), outDir: path.join(CONTENT, 'examples', 'out', t), name: t });
		}
	} else if (args.example) {
		const t = args.example;
		jobs.push({ template: t, dataFile: path.join(CONTENT, 'templates', t, 'data.example.json'), outDir: path.join(CONTENT, 'examples', 'out', t), name: t });
	} else if (args.piece) {
		const pieceDir = path.join(CONTENT, 'pieces', args.piece);
		const state = readState(pieceDir);
		if (!state) throw new Error(`Pieza sin STATE.json: ${args.piece} (¿creada con new-piece.mjs?)`);
		const template = args.template ?? state.template;
		jobs.push({ template, dataFile: path.join(pieceDir, 'data.json'), outDir: path.join(pieceDir, 'out'), name: args.name ?? args.piece, pieceDir, state });
	} else if (args.template && args.data && args.out) {
		jobs.push({ template: args.template, dataFile: path.resolve(args.data), outDir: path.resolve(args.out), name: args.name ?? args.template });
	} else {
		usage();
	}
	for (const job of jobs) {
		if (!existsSync(job.dataFile)) throw new Error(`Data no encontrada: ${job.dataFile}`);
		console.log(`Render: ${job.template} → ${job.outDir}`);
		const tpl = loadTemplate(job.template);
		const data = JSON.parse(readFileSync(job.dataFile, 'utf8'));
		data.__dir = path.dirname(job.dataFile);
		const artifacts = [];
		if (tpl.meta.multi && Array.isArray(data.pages) && data.pages.length > 0) {
			for (let i = 0; i < data.pages.length; i++) {
				const pageData = { ...data, ...data.pages[i], _index: i + 1, _total: data.pages.length, _first: i === 0, _last: i === data.pages.length - 1, _middle: i > 0 && i < data.pages.length - 1 };
				const pageName = `${job.name}-p${String(i + 1).padStart(2, '0')}`;
				const r = await renderOne({ tpl, data: pageData, outDir: job.outDir, name: pageName, waitMs });
				artifacts.push(path.relative(job.outDir, r.png), path.relative(job.outDir, r.light));
			}
		} else {
			const r = await renderOne({ tpl, data, outDir: job.outDir, name: job.name, waitMs });
			artifacts.push(path.relative(job.outDir, r.png), path.relative(job.outDir, r.light));
		}
		if (job.pieceDir) {
			recordMilestone(job.pieceDir, 'draft', `Borrador renderizado (${artifacts.length / 2} imagen(es))`, { artifacts, status: 'done' });
			setPhase(job.pieceDir, 'review', 'in_progress', { note: 'Borrador listo para revisión visual' });
		}
	}
	console.log('Render completo.');
}

main().catch((err) => { console.error(`ERROR: ${err.message}`); process.exit(1); });
