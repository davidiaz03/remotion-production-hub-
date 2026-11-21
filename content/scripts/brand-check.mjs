#!/usr/bin/env node
/**
 * Chequeos automáticos de marca sobre piezas renderizadas (v2).
 *
 * El QA visual sigue siendo obligatorio (WORKFLOW.md), pero estas
 * comprobaciones mecánicas cazan los fallos tontos antes de mirar:
 *
 *   1. Dimensiones: cada PNG mide lo que dice template.json (con variante).
 *   2. Logo: el HTML compuesto de cada página contiene EXACTAMENTE UNA
 *      aparición del logotipo completo (`<img class="brand-logo">`).
 *      Cero = logo ausente; más de uno = logo duplicado.
 *   3. Rojo de marca: el PNG contiene píxeles #ED1C24 (tolerancia ±12 por
 *      canal) en al menos el 0,05% de la muestra (ver brand-pixels.py).
 *      El rojo debe aparecer en toda pieza (logo, barra, cifra o banda).
 *   4. Titulares: título/titular ≤15 palabras (regla IG); en carruseles,
 *      la densidad completa de density.mjs.
 *   5. JPG ligero presente por cada PNG máster.
 *
 * Uso:
 *   node content/scripts/brand-check.mjs --piece <slug>
 *   node content/scripts/brand-check.mjs --example <plantilla>
 *   node content/scripts/brand-check.mjs --dir <out/> --template <t> [--data <json>]
 *
 * Sale con código 1 si algún chequeo falla. Lo que NO comprueba (queda
 * para el QA visual): altura del logo en píxeles, colores fuera de
 * paleta, texto desbordado, titular sobre una cara (eso es face-frame.py).
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { execFile } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { checkCarousel, countWords } from './density.mjs';

const execFileAsync = promisify(execFile);
const CONTENT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const MIN_RED_FRACTION = 0.0005;

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
	console.error('Uso: brand-check.mjs --piece <slug> | --example <plantilla> | --dir <out/> --template <t> [--data <json>]');
	process.exit(1);
}

export function pngSize(file) {
	const b = readFileSync(file);
	if (b.length < 24 || b.toString('ascii', 1, 4) !== 'PNG') throw new Error(`No es PNG: ${file}`);
	return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}

/** Nº de apariciones del logotipo completo en el HTML compuesto. */
export function countLogos(html) {
	return (html.match(/<img class="brand-logo"/g) ?? []).length;
}

async function redFraction(pngPath) {
	const { stdout } = await execFileAsync('python3', [
		path.join(CONTENT, 'scripts', 'brand-pixels.py'), pngPath, '--json',
	]);
	return JSON.parse(stdout).red_fraction;
}

/** Chequeos de texto (titulares/densidad) sobre el data.json. Devuelve fallos. */
export function checkCopy(data, template) {
	const failures = [];
	if (template === 'carousel') {
		for (const w of checkCarousel(data)) failures.push(`densidad: ${w}`);
		return failures;
	}
	for (const key of ['title', 'headline']) {
		if (typeof data[key] === 'string') {
			const n = countWords(data[key]);
			if (n > 15) failures.push(`${key}: ${n} palabras (techo 15)`);
		}
	}
	if (template === 'timeline' && Array.isArray(data.events)) {
		data.events.forEach((e, i) => {
			const n = countWords(e.text);
			if (n > 25) failures.push(`hecho ${i + 1} (${e.year}): ${n} palabras (techo 25)`);
		});
	}
	return failures;
}

export async function checkRendered({ outDir, name, template, data }) {
	const failures = [];
	const passes = [];
	const meta = JSON.parse(readFileSync(path.join(CONTENT, 'templates', template, 'template.json'), 'utf8'));
	const formatKey = data?.format ?? 'square';
	const dims = (meta.variants && meta.variants[formatKey]) || { width: meta.width, height: meta.height };
	// Páginas: <name>.png o <name>-pNN.png (multi).
	const files = readdirSync(outDir).filter((f) => f.endsWith('.png') && (f === `${name}.png` || f.startsWith(`${name}-p`)));
	if (files.length === 0) {
		return { failures: [`sin PNG renderizados en ${outDir} (¿renderizado? ${name}.png)`], passes };
	}
	for (const file of files.sort()) {
		const label = file.replace('.png', '');
		const pngPath = path.join(outDir, file);
		const size = pngSize(pngPath);
		if (size.width !== dims.width || size.height !== dims.height) {
			failures.push(`${label}: dimensiones ${size.width}x${size.height}, esperado ${dims.width}x${dims.height}`);
		} else passes.push(`${label}: dimensiones ${dims.width}x${dims.height}`);
		const htmlPath = path.join(outDir, `${label}.html`);
		if (!existsSync(htmlPath)) {
			failures.push(`${label}: falta el HTML intermedio (${label}.html)`);
		} else {
			const logos = countLogos(readFileSync(htmlPath, 'utf8'));
			if (logos === 0) failures.push(`${label}: logo COMPLETO ausente en el HTML`);
			else if (logos > 1) failures.push(`${label}: logo ${logos} veces (debe aparecer una sola vez por página)`);
			else passes.push(`${label}: logo completo presente (1×)`);
		}
		const frac = await redFraction(pngPath);
		if (frac < MIN_RED_FRACTION) {
			failures.push(`${label}: rojo de marca #ED1C24 casi ausente (${(frac * 100).toFixed(3)}% de la muestra; mínimo ${(MIN_RED_FRACTION * 100).toFixed(2)}%)`);
		} else passes.push(`${label}: rojo de marca presente (${(frac * 100).toFixed(2)}%)`);
		if (!existsSync(path.join(outDir, `${label}-light.jpg`))) {
			failures.push(`${label}: falta el JPG ligero (${label}-light.jpg)`);
		} else passes.push(`${label}: JPG ligero presente`);
	}
	if (data) {
		const copyFailures = checkCopy(data, template);
		failures.push(...copyFailures);
		if (copyFailures.length === 0) passes.push('copy: titulares dentro de los techos');
	}
	return { failures, passes };
}

async function main() {
	const args = parseArgs(process.argv.slice(2));
	let outDir;
	let name;
	let template;
	let data = null;
	if (args.piece) {
		const pieceDir = path.join(CONTENT, 'pieces', args.piece);
		const stateFile = path.join(pieceDir, 'STATE.json');
		if (!existsSync(stateFile)) { console.error(`Pieza sin STATE.json: ${args.piece}`); process.exit(1); }
		template = JSON.parse(readFileSync(stateFile, 'utf8')).template;
		outDir = path.join(pieceDir, 'out');
		name = args.piece;
		data = JSON.parse(readFileSync(path.join(pieceDir, 'data.json'), 'utf8'));
	} else if (args.example) {
		template = args.example;
		outDir = path.join(CONTENT, 'examples', 'out', template);
		name = template;
		data = JSON.parse(readFileSync(path.join(CONTENT, 'templates', template, 'data.example.json'), 'utf8'));
	} else if (args.dir && args.template) {
		template = args.template;
		outDir = path.resolve(args.dir);
		name = args.name ?? template;
		if (args.data) data = JSON.parse(readFileSync(path.resolve(args.data), 'utf8'));
	} else {
		usage();
	}
	if (!existsSync(outDir)) {
		console.error(`Directorio sin renders: ${outDir} (renderiza primero)`);
		process.exit(1);
	}
	console.log(`Chequeo de marca: ${name} (${template})`);
	const { failures, passes } = await checkRendered({ outDir, name, template, data });
	for (const p of passes) console.log(`  ✓ ${p}`);
	for (const f of failures) console.log(`  ✗ ${f}`);
	if (failures.length > 0) {
		console.log(`Marca: ${failures.length} FALLO(S) — corrige antes de entregar.`);
		process.exit(1);
	}
	console.log('Marca: OK (recuerda el QA visual: esto no sustituye mirar el PNG).');
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main().catch((err) => { console.error(`ERROR: ${err.message}`); process.exit(1); });
}
