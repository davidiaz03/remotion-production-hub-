#!/usr/bin/env node
/**
 * QA de una pieza en un solo comando (v2): densidad + marca + caras.
 *
 *   node content/scripts/qa.mjs --piece <slug>
 *   node content/scripts/qa.mjs --example <plantilla>
 *
 * Junta lo que antes eran tres comandos separados:
 *   1. density.mjs (solo carruseles): techos de palabras por lámina.
 *   2. brand-check.mjs: dimensiones, logo completo, rojo de marca, JPG ligero.
 *   3. face-frame.py (solo carruseles con foto en layout background):
 *      ningún titular cae sobre una cara. Requiere el venv del hub; si no
 *      está, avisa y queda PENDIENTE (no bloquea).
 *
 * Sale con código 1 si algo falla. El QA visual del PNG sigue siendo
 * obligatorio: esto caza lo mecánico, no el gusto.
 */
import { existsSync, readFileSync } from 'node:fs';
import { execFile } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { checkCarousel } from './density.mjs';
import { checkRendered } from './brand-check.mjs';
import { classifyFaceWarnings } from './face-warnings.mjs';

const execFileAsync = promisify(execFile);
const CONTENT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

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
	console.error('Uso: qa.mjs --piece <slug> | --example <plantilla>');
	process.exit(1);
}

async function checkFaces(slug, format) {
	const venvPython = path.join(process.env.HOME ?? '', 'workspace', 'remotion-hub', '.venv', 'bin', 'python');
	if (!existsSync(venvPython)) {
		return { skipped: 'sin venv del hub (cv2) — PENDIENTE manual con face-frame.py' };
	}
	const { stdout } = await execFileAsync(venvPython, [
		path.join(CONTENT, 'scripts', 'face-frame.py'), '--piece', slug,
		'--format', format, '--json',
	], { cwd: path.resolve(CONTENT, '..') });
	const report = JSON.parse(stdout);
	const warnings = (report.pages ?? []).flatMap((p) => (p.warnings ?? []).map((w) => `lámina ${p.page}: ${w}`));
	const skipped = (report.pages ?? []).filter((p) => p.skipped)
		.map((p) => `lámina ${p.page}: chequeo de caras omitido (${p.skipped})`);
	return { ...classifyFaceWarnings(warnings), skipped };
}

async function main() {
	const args = parseArgs(process.argv.slice(2));
	let outDir;
	let name;
	let template;
	let data;
	let slug = null;
	if (args.piece) {
		slug = args.piece;
		const pieceDir = path.join(CONTENT, 'pieces', slug);
		if (!existsSync(path.join(pieceDir, 'STATE.json'))) { console.error(`Pieza sin STATE.json: ${slug}`); process.exit(1); }
		template = JSON.parse(readFileSync(path.join(pieceDir, 'STATE.json'), 'utf8')).template;
		outDir = path.join(pieceDir, 'out');
		name = slug;
		data = JSON.parse(readFileSync(path.join(pieceDir, 'data.json'), 'utf8'));
	} else if (args.example) {
		template = args.example;
		outDir = path.join(CONTENT, 'examples', 'out', template);
		name = template;
		data = JSON.parse(readFileSync(path.join(CONTENT, 'templates', template, 'data.example.json'), 'utf8'));
	} else {
		usage();
	}
	let failed = false;
	console.log(`QA: ${name} (${template})`);
	// 1. Densidad (carruseles).
	if (template === 'carousel') {
		const dw = checkCarousel(data);
		if (dw.length > 0) {
			failed = true;
			for (const w of dw) console.log(`  ✗ densidad: ${w}`);
		} else console.log('  ✓ densidad: todas las láminas dentro de los techos');
	}
	// 2. Marca (sobre el render).
	if (!existsSync(outDir)) {
		console.log('  ✗ marca: sin renders (renderiza primero)');
		failed = true;
	} else {
		const { failures, passes } = await checkRendered({ outDir, name, template, data });
		for (const p of passes) console.log(`  ✓ ${p}`);
		for (const f of failures) { console.log(`  ✗ marca: ${f}`); failed = true; }
	}
	// 3. Caras (carruseles con foto en background).
	if (slug && template === 'carousel') {
		const hasPhoto = (data.pages ?? []).some((p) => p.image && (!p.image_layout || p.image_layout === 'background'));
		if (!hasPhoto) {
			console.log('  · caras: sin fotos en layout background, no aplica');
		} else {
			try {
				const res = await checkFaces(slug, data.format ?? 'square');
				if (res.skipped && typeof res.skipped === 'string') console.log(`  ! caras: ${res.skipped}`);
				else {
					for (const s of (res.skipped ?? [])) console.log(`  ! caras: ${s}`);
					for (const w of res.infos) console.log(`  ! caras: ${w}`);
					if (res.failures.length > 0) {
						failed = true;
						for (const w of res.failures) console.log(`  ✗ caras: ${w}`);
					} else console.log('  ✓ caras: ningún titular cae sobre una cara');
				}
			} catch (err) {
				console.log(`  ! caras: chequeo no concluyente (${err.message.split('\n')[0]})`);
			}
		}
	}
	if (failed) {
		console.log('QA: FALLOS — corrige antes de entregar.');
		process.exit(1);
	}
	console.log('QA: OK (falta el QA visual del PNG, obligatorio).');
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main().catch((err) => { console.error(`ERROR: ${err.message}`); process.exit(1); });
}
