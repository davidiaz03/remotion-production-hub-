#!/usr/bin/env node
/**
 * Constructor de carrusel desde texto (v2).
 *
 * Convierte un titular + viñetas (o un texto Markdown sencillo) en una
 * pieza de carrusel completa (brief.md + data.json + STATE.json), con
 * reparto automático de láminas y validación de densidad ANTES de
 * renderizar: si una lámina viola los techos (titular ≤15, cuerpo ≤30,
 * total ≤50 palabras), el constructor se niega y dice exactamente qué
 * acortar — no produce un carrusel malo en silencio.
 *
 * Modo viñetas (una idea por lámina, lo más rápido):
 *   node content/scripts/build-carousel.mjs <slug> --title "..." \
 *     --subtitle "..." --cta "..." --bullets bullets.txt [--kicker "El dato"]
 *   bullets.txt: una viñeta por línea; `Kicker | Texto` para kicker propio.
 *   Cada línea es una lámina (titular = la viñeta, sin cuerpo).
 *
 * Modo Markdown (láminas ricas: titular + cuerpo + ítems + foto):
 *   node content/scripts/build-carousel.mjs <slug> --input slides.md
 *   # Título de portada (8-15 palabras)
 *   Subtítulo de portada (primera línea tras el título).
 *
 *   ## Kicker de la lámina
 *   Titular de la lámina (*palabra* resalta en rojo)
 *   Cuerpo en una o dos frases.
 *   - @icono Dato con viñeta (el @icono es opcional; por defecto 'check')
 *   - Otro dato
 *   imagen: img/foto.jpg       (opcional; layout background por defecto)
 *   layout: band               (opcional: background|band|side)
 *   posicion: 50% 25%          (opcional; calcular con face-frame.py)
 *   credito: Foto: Autor (CC)  (opcional; va en el pie, no en la lámina)
 *
 *   ---
 *   CTA de cierre
 *
 * Opciones comunes: --format 4:5|square (por defecto 4:5, estándar IG),
 * --force (escribir aunque haya avisos de densidad), --render (renderizar
 * al terminar), --check-faces (verificar con face-frame.py que ningún
 * titular cae sobre una cara; solo si hay fotos; requiere el venv del hub).
 *
 * Reglas: 3-8 láminas de contenido (5-10 páginas con portada y cierre);
 * el constructor NO verifica los hechos: el brief que genera recuerda
 * verificar cada dato con su fuente antes de publicar.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { execFile } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { checkCarousel, countWords, LIMITS } from './density.mjs';
import { initPiece } from './state.mjs';

const execFileAsync = promisify(execFile);
const CONTENT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;
const DEFAULT_CTA = 'Memorial de la Denuncia';
const DEFAULT_KICKER = 'El dato';
const MIN_SLIDES = 3;
const MAX_SLIDES = 8;

function parseArgs(argv) {
	const out = { _: [] };
	for (let i = 0; i < argv.length; i++) {
		if (argv[i].startsWith('--')) {
			const key = argv[i].slice(2);
			const next = argv[i + 1];
			if (next && !next.startsWith('--')) { out[key] = next; i++; }
			else out[key] = true;
		} else out._.push(argv[i]);
	}
	return out;
}

function usage() {
	console.error('Uso: build-carousel.mjs <slug> --input slides.md [--format 4:5] [--render] [--check-faces]');
	console.error('     build-carousel.mjs <slug> --title "..." --bullets bullets.txt [--subtitle "..."] [--cta "..."] [--kicker "..."]');
	process.exit(1);
}

/** Claves de foto por lámina en modo Markdown (español + alias en inglés). */
const PHOTO_KEYS = {
	imagen: 'image', image: 'image',
	layout: 'image_layout',
	posicion: 'image_position', position: 'image_position',
	credito: 'image_credit', credit: 'image_credit',
};

/**
 * Parsea el formato Markdown del constructor.
 * Devuelve { title, subtitle, slides: [{kicker, headline, body, items, ...}], cta }.
 */
export function parseMarkdown(text) {
	const lines = text.split(/\r?\n/);
	let title = null;
	let subtitle = null;
	let cta = null;
	const slides = [];
	let slide = null;
	let inCta = false;
	const flush = () => {
		if (slide) {
			slide.body = slide._body.join(' ').trim();
			delete slide._body;
			if (slide.items.length === 0) delete slide.items;
			if (!slide.body) delete slide.body;
			slides.push(slide);
			slide = null;
		}
	};
	for (const raw of lines) {
		const line = raw.trim();
		if (!line || line.startsWith('<!--')) continue;
		if (line === '---') { flush(); inCta = true; continue; }
		if (inCta) { if (!cta) cta = line; continue; }
		const h1 = line.match(/^#\s+(.+)$/);
		if (h1 && !title) { title = h1[1].trim(); continue; }
		const h2 = line.match(/^##\s+(.+)$/);
		if (h2) { flush(); slide = { kicker: h2[1].trim(), _body: [], items: [] }; continue; }
		if (!slide) {
			// Antes de la primera lámina: la primera línea tras el título es el subtítulo.
			if (title && !subtitle) { subtitle = line; continue; }
			throw new Error(`línea fuera de lugar (falta '# Título' o '## Kicker'): ${line}`);
		}
		const item = line.match(/^-\s+(?:@([\w-]+)\s+)?(.+)$/);
		if (item) { slide.items.push({ icon: item[1] || 'check', text: item[2].trim() }); continue; }
		const kv = line.match(/^([\wáéíóú]+):\s+(.+)$/i);
		if (kv && PHOTO_KEYS[kv[1].toLowerCase()]) {
			slide[PHOTO_KEYS[kv[1].toLowerCase()]] = kv[2].trim();
			continue;
		}
		if (!slide.headline) { slide.headline = line; continue; }
		slide._body.push(line);
	}
	flush();
	if (!title) throw new Error('falta el título de portada (# Título)');
	if (slides.length === 0) throw new Error('no hay láminas (falta al menos un ## Kicker)');
	for (const s of slides) {
		if (!s.headline) throw new Error(`lámina '${s.kicker}' sin titular`);
	}
	return { title, subtitle: subtitle ?? '', slides, cta: cta ?? '' };
}

/**
 * Parsea el archivo de viñetas: una por línea; `Kicker | Texto` o `Texto`.
 * Las líneas vacías y las que empiezan por # se ignoran.
 */
export function parseBullets(text, defaultKicker = DEFAULT_KICKER) {
	const slides = [];
	for (const raw of text.split(/\r?\n/)) {
		const line = raw.trim();
		if (!line || line.startsWith('#')) continue;
		const [left, ...rest] = line.split('|').map((s) => s.trim());
		if (rest.length > 0) {
			slides.push({ kicker: left, headline: rest.join('|').trim() });
		} else {
			slides.push({ kicker: defaultKicker, headline: left });
		}
	}
	if (slides.length === 0) throw new Error('el archivo de viñetas no tiene líneas');
	return slides;
}

/** Valida la estructura (nº de láminas, titulares, densidad). Devuelve avisos. */
export function validateCarousel(data) {
	const errors = [];
	const warnings = [];
	const slides = (data.pages ?? []).slice(1, -1);
	if (slides.length < MIN_SLIDES) {
		errors.push(`solo ${slides.length} lámina(s) de contenido (mínimo ${MIN_SLIDES}; con menos, mejor un post o una tarjeta)`);
	}
	if (slides.length > MAX_SLIDES) {
		errors.push(`${slides.length} láminas de contenido (máximo ${MAX_SLIDES}; divide el tema en dos carruseles)`);
	}
	const titleWords = countWords(data.title);
	if (titleWords < 8) warnings.push(`portada: titular con ${titleWords} palabras (recomendado 8-15)`);
	for (const w of checkCarousel(data)) errors.push(w);
	return { errors, warnings };
}

/** Construye el data.json del carrusel a partir de título, subtítulo, láminas y CTA. */
export function buildCarouselData({ title, subtitle, slides, cta, format }) {
	const data = {
		title,
		subtitle: subtitle ?? '',
		cta: cta || DEFAULT_CTA,
		format: format ?? '4:5',
		pages: [{}, ...slides, {}],
	};
	return data;
}

function writeBrief(pieceDir, slug, { title, slides, sourceFile }) {
	const facts = slides.map((s) => `- **${s.kicker} — ${s.headline.replaceAll('*', '')}**: (fuente por verificar)`).join('\n');
	writeFileSync(path.join(pieceDir, 'brief.md'), `# Brief — ${title}

- **Pieza:** \`${slug}\` · plantilla \`carousel\` (construida con \`build-carousel.mjs\` desde \`${sourceFile}\`)
- **Objetivo:** carrusel informativo (${slides.length} láminas de contenido + portada + cierre).
- **Hechos verificados:** CADA dato de abajo necesita su fuente antes de publicar. El constructor no verifica hechos: verifica tú cada línea y anota la fuente.
${facts}
- **Copy:** titular de portada «${title.replaceAll('*', '')}» (${countWords(title)} palabras).
- **Imagen:** ${slides.some((s) => s.image) ? 'fotos por lámina (ver data.json; procedencia y licencia en ASSETS.md)' : 'sin fotos (diseño puro)'}
- **Revisión:** (¿quién aprueba? ¿qué cambiaron en cada vuelta?)

## Registro de revisiones

| Fecha | Versión | Cambio | Aprobado por |
|---|---|---|---|
| | v1 | Borrador inicial (constructor) | |
`);
}

async function checkFaces(slug, format) {
	const venvPython = path.join(process.env.HOME ?? '', 'workspace', 'remotion-hub', '.venv', 'bin', 'python');
	if (!existsSync(venvPython)) {
		console.log('  ! chequeo de caras: sin venv del hub (cv2) — PENDIENTE manual con face-frame.py');
		return true;
	}
	try {
		const { stdout } = await execFileAsync(venvPython, [
			path.join(CONTENT, 'scripts', 'face-frame.py'), '--piece', slug,
			'--format', format, '--json',
		], { cwd: path.resolve(CONTENT, '..') });
		const report = JSON.parse(stdout);
		const problems = (report.pages ?? []).flatMap((p) => (p.warnings ?? []).map((w) => `lámina ${p.page}: ${w}`));
		if (problems.length > 0) {
			console.log('  ✗ caras: el titular puede caer sobre una cara:');
			for (const p of problems) console.log(`    - ${p}`);
			console.log('    Ajusta image_position con face-frame.py --apply, cambia de foto o de layout.');
			return false;
		}
		console.log('  ✓ caras: ningún titular cae sobre una cara');
		return true;
	} catch (err) {
		console.log(`  ! chequeo de caras no concluyente: ${err.message.split('\n')[0]}`);
		return true;
	}
}

async function main() {
	const args = parseArgs(process.argv.slice(2));
	const slug = args._[0];
	if (!slug || !SLUG_RE.test(slug)) usage();
	const format = args.format ?? '4:5';
	if (format !== '4:5' && format !== 'square') {
		console.error(`Formato desconocido: ${format} (usa 4:5 o square)`);
		process.exit(1);
	}
	let parsed;
	let sourceFile;
	if (args.input) {
		const inputPath = path.resolve(args.input);
		if (!existsSync(inputPath)) { console.error(`Archivo no encontrado: ${args.input}`); process.exit(1); }
		try {
			parsed = parseMarkdown(readFileSync(inputPath, 'utf8'));
		} catch (err) {
			console.error(`ERROR en ${args.input}: ${err.message}`);
			process.exit(1);
		}
		sourceFile = args.input;
		if (args.title) parsed.title = args.title;
		if (args.subtitle) parsed.subtitle = args.subtitle;
		if (args.cta) parsed.cta = args.cta;
	} else if (args.bullets && args.title) {
		const bulletsPath = path.resolve(args.bullets);
		if (!existsSync(bulletsPath)) { console.error(`Archivo no encontrado: ${args.bullets}`); process.exit(1); }
		let slides;
		try {
			slides = parseBullets(readFileSync(bulletsPath, 'utf8'), args.kicker ?? DEFAULT_KICKER);
		} catch (err) {
			console.error(`ERROR en ${args.bullets}: ${err.message}`);
			process.exit(1);
		}
		parsed = { title: args.title, subtitle: args.subtitle ?? '', slides, cta: args.cta ?? '' };
		sourceFile = args.bullets;
	} else {
		usage();
	}
	const data = buildCarouselData({ ...parsed, format });
	const { errors, warnings } = validateCarousel(data);
	for (const w of warnings) console.warn(`  ! ${w}`);
	if (errors.length > 0) {
		console.error('El carrusel NO se construye: viola las reglas de densidad:');
		for (const e of errors) console.error(`  ✗ ${e}`);
		if (!args.force) {
			console.error('Acorta lo indicado y vuelve a intentarlo (o usa --force para escribirlo igual).');
			process.exit(1);
		}
		console.warn('  ! --force: se escribe con los avisos arriba; el QA visual decide.');
	}
	const pieceDir = path.join(CONTENT, 'pieces', slug);
	if (existsSync(pieceDir)) {
		console.error(`Ya existe la pieza: ${slug}`);
		process.exit(1);
	}
	mkdirSync(path.join(pieceDir, 'out'), { recursive: true });
	// Fotos: avisar si alguna ruta no existe (el render la ignoraría en silencio).
	for (const s of parsed.slides) {
		if (s.image && !existsSync(path.resolve(s.image)) && !existsSync(path.join(path.dirname(path.resolve(sourceFile)), s.image))) {
			console.warn(`  ! foto no encontrada (${s.kicker}): ${s.image} — ponla en pieces/${slug}/img/ y ajusta data.json`);
		}
	}
	writeFileSync(path.join(pieceDir, 'data.json'), `${JSON.stringify(data, null, '\t')}\n`);
	writeBrief(pieceDir, slug, { title: parsed.title, slides: parsed.slides, sourceFile });
	initPiece(pieceDir, { slug, template: 'carousel', title: parsed.title });
	console.log(`Carrusel construido: pieces/${slug}/ (${parsed.slides.length} láminas + portada + cierre, ${format})`);
	if (args['check-faces']) {
		if (!parsed.slides.some((s) => s.image)) {
			console.log('  · chequeo de caras: sin fotos, no aplica');
		} else if (!(await checkFaces(slug, format))) {
			process.exit(1);
		}
	}
	if (args.render) {
		console.log('Renderizando…');
		const { spawn } = await import('node:child_process');
		await new Promise((resolve, reject) => {
			const p = spawn(process.execPath, [path.join(CONTENT, 'scripts', 'render.mjs'), '--piece', slug],
				{ cwd: path.resolve(CONTENT, '..'), stdio: 'inherit' });
			p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`render salió con código ${code}`))));
		});
	} else {
		console.log('Siguiente paso: verifica los hechos en brief.md y renderiza:');
		console.log(`  node content/scripts/render.mjs --piece ${slug}`);
	}
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main().catch((err) => { console.error(`ERROR: ${err.message}`); process.exit(1); });
}
