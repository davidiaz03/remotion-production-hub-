/**
 * Pruebas del hub de contenido estático (content/).
 *
 * Ejecutar: node --test tests/content-hub.test.mjs
 * (o npm test, que corre toda la suite del repo)
 *
 * La prueba de render usa Chromium headless por CDP (~25 s) y requiere
 * node_modules del hub (checkout principal) o $CHROME_HEADLESS_SHELL.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
	existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = path.join(ROOT, 'content');
const TEMPLATES = ['post', 'story', 'carousel', 'infographic', 'thumbnail', 'quote', 'breaking', 'stat', 'cover', 'timeline'];

function pngSize(file) {
	const b = readFileSync(file);
	assert.equal(b.toString('ascii', 1, 4), 'PNG', `${file} no es PNG`);
	return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}

test('tokens de marca: colores, logo y fuentes', () => {
	const tokens = JSON.parse(readFileSync(path.join(CONTENT, 'brand', 'tokens.json'), 'utf8'));
	assert.equal(tokens.colors.red, '#ED1C24');
	assert.equal(tokens.colors.black, '#000000');
	assert.equal(tokens.colors.gray, '#77787B');
	assert.equal(tokens.colors.support.brownDark, '#624D45');
	assert.ok(tokens.colors.redTints.length >= 4);
	// El logo versionado coincide con el SHA registrado.
	const logoPath = path.join(CONTENT, tokens.logo.file);
	assert.ok(existsSync(logoPath), 'falta brand/logo-color.png');
	const sha = createHash('sha256').update(readFileSync(logoPath)).digest('hex');
	assert.equal(sha, tokens.logo.sha256);
	assert.deepEqual(pngSize(logoPath), { width: 573, height: 907 });
	// Fuentes OFL presentes.
	for (const f of tokens.fonts.files) {
		assert.ok(existsSync(path.join(CONTENT, f)), `falta fuente ${f}`);
	}
	assert.ok(existsSync(path.join(CONTENT, 'brand', 'fonts', 'OFL.txt')));
	// Formatos coherentes con las plantillas.
	for (const t of TEMPLATES) {
		assert.ok(tokens.formats[t], `falta formato ${t} en tokens`);
	}
});

test('plantillas: meta, HTML y ejemplo válidos', () => {
	for (const t of TEMPLATES) {
		const dir = path.join(CONTENT, 'templates', t);
		const meta = JSON.parse(readFileSync(path.join(dir, 'template.json'), 'utf8'));
		assert.equal(meta.name, t);
		assert.ok(meta.width > 0 && meta.height > 0, `${t}: tamaño inválido`);
		assert.equal(typeof meta.multi, 'boolean', `${t}: multi debe ser booleano`);
		assert.ok(meta.fields && Object.keys(meta.fields).length > 0, `${t}: sin campos documentados`);
		const html = readFileSync(path.join(dir, 'template.html'), 'utf8');
		assert.ok(html.includes('assets/base.css'), `${t}: no enlaza base.css`);
		// Toda plantilla usa el logo COMPLETO ({{logo:...}}); nunca solo la estrella.
		assert.ok(html.includes('{{logo:color}}') || html.includes('{{logo:white}}'), `${t}: no usa el logo completo`);
		// Sin hex sueltos de marca fuera de base.css: los colores vienen de tokens/base.css.
		assert.ok(!html.includes('#ED1C24'), `${t}: hex de marca suelto en la plantilla (usa var(--red))`);
		const data = JSON.parse(readFileSync(path.join(dir, 'data.example.json'), 'utf8'));
		assert.equal(typeof data, 'object', `${t}: ejemplo inválido`);
		if (meta.multi) {
			assert.ok(Array.isArray(data.pages) && data.pages.length >= 2, `${t}: ejemplo multi sin páginas`);
		}
	}
});

test('motor de plantillas: anidación, negación, escape e iconos', async () => {
	const { renderTemplate } = await import('../content/scripts/template.mjs');
	const iconsDir = path.join(CONTENT, 'lib', 'icons');
	// #if anidados (el bug del carrusel, 17-nov-2026).
	let r = renderTemplate('{{#if a}}A{{#if b}}B{{/if}}C{{/if}}', { a: true, b: true }, { iconsDir });
	assert.equal(r.html, 'ABC');
	assert.deepEqual(r.warnings, []);
	r = renderTemplate('{{#if a}}A{{#if b}}B{{/if}}C{{/if}}', { a: true, b: false }, { iconsDir });
	assert.equal(r.html, 'AC');
	r = renderTemplate('{{#if a}}A{{/if}}', { a: false }, { iconsDir });
	assert.equal(r.html, '');
	// Negación.
	r = renderTemplate('{{#if !a}}SIN{{/if}}', {}, { iconsDir });
	assert.equal(r.html, 'SIN');
	// #each con contexto del elemento + @index + icono por campo.
	r = renderTemplate(
		'{{#each items}}{{@index}}:{{text}}[{{icon:icon}}]{{/each}}',
		{ items: [{ text: 'uno', icon: 'check' }, { text: 'dos', icon: 'star' }] },
		{ iconsDir },
	);
	assert.ok(r.html.startsWith('0:uno['), r.html);
	assert.ok(r.html.includes('<svg'), 'el icono no se incrustó');
	assert.ok(r.html.includes('1:dos['), r.html);
	assert.deepEqual(r.warnings, []);
	// Escape por defecto; |raw sin escapar.
	r = renderTemplate('{{x}}|{{x|raw}}', { x: '<b>&</b>' }, { iconsDir });
	assert.equal(r.html, '&lt;b&gt;&amp;&lt;/b&gt;|<b>&</b>');
	// Resaltado {{hl:}}: *palabra* -> <span class="hl">, el resto escapado.
	r = renderTemplate('{{hl:h}}', { h: '«Quiero dejar resuelto lo de *Cuba* antes de irme»' }, { iconsDir });
	assert.equal(r.html, '«Quiero dejar resuelto lo de <span class="hl">Cuba</span> antes de irme»');
	r = renderTemplate('{{hl:h}}', { h: 'a *b* c *d* e' }, { iconsDir });
	assert.equal(r.html, 'a <span class="hl">b</span> c <span class="hl">d</span> e');
	r = renderTemplate('{{hl:h}}', { h: 'sin marcas <>&' }, { iconsDir });
	assert.equal(r.html, 'sin marcas &lt;&gt;&amp;');
	r = renderTemplate('{{hl:h}}', { h: 'asterisco *suelto' }, { iconsDir });
	assert.equal(r.html, 'asterisco *suelto');
	// Campo ausente: vacío + warning (no excepción).
	r = renderTemplate('a{{falta}}b', {}, { iconsDir });
	assert.equal(r.html, 'ab');
	assert.equal(r.warnings.length, 1);
	// Bloque sin cerrar: warning.
	r = renderTemplate('{{#if a}}x', { a: true }, { iconsDir });
	assert.ok(r.warnings.some((w) => w.includes('sin cerrar')));
});

test('logo blanco derivado: determinista y con estrella blanca', async () => {
	const dir = mkdtempSync(path.join(tmpdir(), 'content-hub-test-'));
	try {
		const src = path.join(CONTENT, 'brand', 'logo-color.png');
		const out1 = path.join(dir, 'w1.png');
		const out2 = path.join(dir, 'w2.png');
		const script = path.join(CONTENT, 'scripts', 'make-logo-white.py');
		await execFileAsync('python3', [script, src, out1]);
		await execFileAsync('python3', [script, src, out2]);
		const h1 = createHash('sha256').update(readFileSync(out1)).digest('hex');
		const h2 = createHash('sha256').update(readFileSync(out2)).digest('hex');
		assert.equal(h1, h2, 'la derivación no es determinista');
		assert.deepEqual(pngSize(out1), { width: 573, height: 907 });
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});

test('duotono: convierte y conserva dimensiones', async () => {
	const dir = mkdtempSync(path.join(tmpdir(), 'content-hub-test-'));
	try {
		// Imagen de prueba: degradado gris 64x64.
		const src = path.join(dir, 'in.png');
		const dst = path.join(dir, 'out.png');
		await execFileAsync('python3', ['-c', `
from PIL import Image
im = Image.new('RGB', (64, 64))
for x in range(64):
    for y in range(64):
        v = (x * 4) % 256
        im.putpixel((x, y), (v, v, v))
im.save('${src}')
`]);
		await execFileAsync('python3', [path.join(CONTENT, 'scripts', 'duotone.py'), src, dst, '--preset', 'red']);
		assert.deepEqual(pngSize(dst), { width: 64, height: 64 });
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});

test('STATE.json de pieza: ciclo brief → draft → review', async () => {
	const { initPiece, setPhase, recordMilestone, readState } = await import('../content/scripts/state.mjs');
	const dir = mkdtempSync(path.join(tmpdir(), 'content-hub-test-'));
	try {
		initPiece(dir, { slug: 't', template: 'post', title: 'T' });
		setPhase(dir, 'brief', 'done');
		recordMilestone(dir, 'draft', 'Borrador', { artifacts: ['out/t.png'], status: 'done' });
		const s = readState(dir);
		assert.equal(s.pipeline.phases.brief.status, 'done');
		assert.equal(s.pipeline.phases.draft.status, 'done');
		assert.deepEqual(s.pipeline.phases.draft.artifacts, ['out/t.png']);
		assert.equal(s.pipeline.milestones.length, 2);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});

test('render de ejemplo (quote): PNG con dimensiones exactas + JPG ligero', async () => {
	const dir = mkdtempSync(path.join(tmpdir(), 'content-hub-test-'));
	try {
		const outDir = path.join(dir, 'out');
		await execFileAsync(process.execPath, [
			path.join(CONTENT, 'scripts', 'render.mjs'),
			'--template', 'quote',
			'--data', path.join(CONTENT, 'templates', 'quote', 'data.example.json'),
			'--out', outDir, '--name', 'quote-test',
		], { cwd: ROOT, timeout: 180000 });
		const png = path.join(outDir, 'quote-test.png');
		const jpg = path.join(outDir, 'quote-test-light.jpg');
		assert.ok(existsSync(png), 'falta el PNG máster');
		assert.ok(existsSync(jpg), 'falta el JPG ligero');
		assert.deepEqual(pngSize(png), { width: 1080, height: 1080 });
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});

test('densidad: conteo y techos (titular 15, cuerpo 30, lámina 50)', async () => {
	const { countWords, checkCarousel, LIMITS } = await import('../content/scripts/density.mjs');
	assert.equal(LIMITS.pageWords, 50);
	assert.equal(LIMITS.headlineWords, 15);
	assert.equal(LIMITS.bodyWords, 30);
	assert.equal(countWords('«Quiero dejar resuelto lo de *Cuba* antes de irme»'), 9);
	assert.equal(countWords('  a  b   c '), 3);
	assert.equal(countWords(''), 0);
	// Carrusel limpio: sin avisos.
	let w = checkCarousel({
		title: 'Título corto de portada',
		pages: [{}, { headline: 'Titular corto', body: 'Cuerpo corto.', items: [{ text: 'Un dato.' }] }, {}],
	});
	assert.deepEqual(w, []);
	// Titular largo + lámina sobrecargada: avisos.
	w = checkCarousel({
		title: 'uno dos tres cuatro cinco seis siete ocho nueve diez once doce trece catorce quince dieciséis',
		pages: [{},
			{ headline: 'uno dos tres cuatro cinco seis siete ocho nueve diez once doce trece catorce quince dieciséis',
			  body: 'uno dos tres cuatro cinco seis siete ocho nueve diez once doce trece catorce quince dieciséis diecisiete dieciocho diecinueve veinte veintiuno veintidós veintitrés veinticuatro veinticinco veintiséis veintisiete veintiocho veintinueve treinta y',
			  items: [{ text: 'uno dos tres cuatro cinco seis siete ocho nueve diez' }] },
			{}],
	});
	assert.ok(w.some((x) => x.startsWith('portada:')), w.join(' | '));
	assert.ok(w.some((x) => x.includes('titular con 16 palabras')), w.join(' | '));
	assert.ok(w.some((x) => x.includes('cuerpo con 31 palabras')), w.join(' | '));
	assert.ok(w.some((x) => x.includes('57 palabras en total')), w.join(' | '));
});

test('carrusel con foto: layouts background/band/side + retrocompatibilidad', async () => {
	const dir = mkdtempSync(path.join(tmpdir(), 'content-hub-test-'));
	try {
		// Foto de prueba: degradado 800x1000 (sin red, sin binarios en el repo).
		await execFileAsync('python3', ['-c', `
from PIL import Image
im = Image.new('RGB', (800, 1000))
for x in range(800):
    for y in range(1000):
        im.putpixel((x, y), ((x * 255) // 800, 40, (y * 255) // 1000))
im.save('${path.join(dir, 'foto.png')}')
`]);
		const data = {
			title: 'Prueba foto', subtitle: 'Tres layouts + portada y cierre sin foto.',
			cta: 'Cierre de prueba',
			pages: [
				{},
				{ kicker: 'Fondo', headline: 'Layout *background*', body: 'Texto.', image: 'foto.png', image_credit: 'Foto de prueba', show_credit: true },
				{ kicker: 'Banda', headline: 'Layout band', body: 'Texto.', image: 'foto.png', image_layout: 'band', image_credit: 'Foto de prueba' },
				{ kicker: 'Columna', headline: 'Layout side', body: 'Texto.', image: 'foto.png', image_layout: 'side', image_credit: 'Foto de prueba' },
				{},
			],
		};
		const dataFile = path.join(dir, 'data.json');
		writeFileSync(dataFile, JSON.stringify(data));
		const outDir = path.join(dir, 'out');
		await execFileAsync(process.execPath, [
			path.join(CONTENT, 'scripts', 'render.mjs'),
			'--template', 'carousel',
			'--data', dataFile,
			'--out', outDir, '--name', 'carrusel-foto',
		], { cwd: ROOT, timeout: 300000 });
		for (let i = 1; i <= 5; i++) {
			const png = path.join(outDir, `carrusel-foto-p0${i}.png`);
			assert.ok(existsSync(png), `falta la lámina ${i}`);
			assert.deepEqual(pngSize(png), { width: 1080, height: 1080 }, `lámina ${i} con tamaño incorrecto`);
		}
		// El HTML compuesto de la lámina con fondo incluye la foto y el crédito.
		const html = readFileSync(path.join(outDir, 'carrusel-foto-p02.html'), 'utf8');
		assert.ok(html.includes('class="photo"'), 'falta el div de foto en background');
		assert.ok(html.includes('Foto de prueba'), 'falta el crédito en el pie (show_credit: true)');
		assert.ok(html.includes('<span class="hl">background</span>'), 'falta el resaltado {{hl:}}');
		const htmlBand = readFileSync(path.join(outDir, 'carrusel-foto-p03.html'), 'utf8');
		assert.ok(htmlBand.includes('layout-band'), 'falta la clase layout-band');
		// Sin show_credit, el crédito NO se imprime en la lámina (va en el pie).
		assert.ok(!htmlBand.includes('Foto de prueba'), 'el crédito se imprimió sin show_credit');
		const htmlSide = readFileSync(path.join(outDir, 'carrusel-foto-p04.html'), 'utf8');
		assert.ok(htmlSide.includes('layout-side'), 'falta la clase layout-side');
		assert.ok(!htmlSide.includes('Foto de prueba'), 'el crédito se imprimió sin show_credit');
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});

test('carrusel 4:5: dimensiones 1080x1350, clase format-45 y aviso de densidad', async () => {
	const dir = mkdtempSync(path.join(tmpdir(), 'content-hub-test-'));
	try {
		await execFileAsync('python3', ['-c', `
from PIL import Image
im = Image.new('RGB', (800, 1000))
for x in range(800):
    for y in range(1000):
        im.putpixel((x, y), ((x * 255) // 800, 40, (y * 255) // 1000))
im.save('${path.join(dir, 'foto.png')}')
`]);
		const data = {
			title: 'Prueba 4:5', subtitle: 'Variante vertical.',
			cta: 'Cierre de prueba', format: '4:5',
			pages: [
				{},
				{ kicker: 'Fondo', headline: 'Titular *resaltado*', body: 'Texto corto.', image: 'foto.png' },
				// Lámina sobrecargada a propósito: el render debe avisar de densidad.
				{ kicker: 'Densa', headline: 'Titular corto',
				  body: 'uno dos tres cuatro cinco seis siete ocho nueve diez once doce trece catorce quince dieciséis diecisiete dieciocho diecinueve veinte veintiuno veintidós veintitrés veinticuatro veinticinco veintiséis veintisiete veintiocho veintinueve treinta treinta y uno treinta y dos' },
				{},
			],
		};
		const dataFile = path.join(dir, 'data.json');
		writeFileSync(dataFile, JSON.stringify(data));
		const outDir = path.join(dir, 'out');
		const { stderr } = await execFileAsync(process.execPath, [
			path.join(CONTENT, 'scripts', 'render.mjs'),
			'--template', 'carousel',
			'--data', dataFile,
			'--out', outDir, '--name', 'carrusel-45',
		], { cwd: ROOT, timeout: 300000 });
		for (let i = 1; i <= 4; i++) {
			const png = path.join(outDir, `carrusel-45-p0${i}.png`);
			assert.ok(existsSync(png), `falta la lámina ${i}`);
			assert.deepEqual(pngSize(png), { width: 1080, height: 1350 }, `lámina ${i} con tamaño incorrecto`);
		}
		const html = readFileSync(path.join(outDir, 'carrusel-45-p02.html'), 'utf8');
		assert.ok(html.includes('format-45'), 'falta la clase format-45 en 4:5');
		assert.ok(html.includes('<span class="hl">resaltado</span>'), 'falta el resaltado {{hl:}}');
		// El aviso de densidad se imprime en stderr (no bloquea el render).
		assert.ok(stderr.includes('densidad'), `el render no avisó de la lámina densa: ${stderr}`);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});

test('face-frame: la cara no invade la zona de texto (geometría con cara sintética)', async (t) => {
	const venvPython = path.join(process.env.HOME ?? '', 'workspace', 'remotion-hub', '.venv', 'bin', 'python');
	if (!existsSync(venvPython)) {
		t.skip('sin venv del hub (cv2)');
		return;
	}
	const dir = mkdtempSync(path.join(tmpdir(), 'content-hub-test-'));
	try {
		// Imagen de prueba 1000x1500 (retrato) con una cara sintética en la
		// mitad inferior (caja 400,550,200,300: centro en y=700, 47% de la
		// altura). Con la posición por defecto (50% 30%) la parte inferior
		// de la cara cae en la zona de texto; la sugerencia la sube.
		await execFileAsync('python3', ['-c', `
from PIL import Image
Image.new('RGB', (1000, 1500), (30, 30, 30)).save('${path.join(dir, 'retrato.png')}')
`]);
		const script = path.join(CONTENT, 'scripts', 'face-frame.py');
		const img = path.join(dir, 'retrato.png');
		// Con la posición por defecto (50% 30%), la cara entra en la zona de texto.
		let out = await execFileAsync(venvPython, [script, img, '--canvas', '1080x1350',
			'--text-top', '780', '--face-box', '400,550,200,300',
			'--position', '50% 30%', '--json']);
		let report = JSON.parse(out.stdout);
		assert.equal(report.faces_found, 1);
		assert.ok(report.warnings.some((w) => w.includes('zona de texto')),
			`debía avisar de cara en zona de texto: ${report.warnings.join(' | ')}`);
		// La sugerencia sube la cara en el lienzo (py mayor = se muestra más
		// abajo de la foto): con la posición sugerida ya no hay aviso.
		const [sx, sy] = report.suggested_position.replaceAll('%', '').split(' ').map(Number);
		assert.equal(report.suggested_position, '50% 90%');
		assert.ok(sy > 30, `la sugerencia debía subir la cara (py=${sy})`);
		assert.equal(sx, 50);
		out = await execFileAsync(venvPython, [script, img, '--canvas', '1080x1350',
			'--text-top', '780', '--face-box', '400,550,200,300',
			'--position', report.suggested_position, '--json']);
		report = JSON.parse(out.stdout);
		assert.ok(!report.warnings.some((w) => w.includes('zona de texto')),
			`la posición sugerida sigue en zona de texto: ${report.warnings.join(' | ')}`);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});

test('letterbox: retrato demasiado ajustado cabe tras acolchar (cara sintética)', async (t) => {
	const venvPython = path.join(process.env.HOME ?? '', 'workspace', 'remotion-hub', '.venv', 'bin', 'python');
	if (!existsSync(venvPython)) {
		t.skip('sin venv del hub (cv2)');
		return;
	}
	const dir = mkdtempSync(path.join(tmpdir(), 'content-hub-test-'));
	try {
		// Imagen de prueba 1000x1500 con una cara sintética muy alta
		// (caja 300,400,400,900): a escala cover la cara ocupa 972 px de
		// lienzo y no cabe en la zona libre (650 px entre kicker y texto).
		// letterbox --auto debe achicarla (modo shrink) y salir con 0.
		await execFileAsync('python3', ['-c', `
from PIL import Image
Image.new('RGB', (1000, 1500), (30, 30, 30)).save('${path.join(dir, 'retrato.png')}')
`]);
		const script = path.join(CONTENT, 'scripts', 'letterbox.py');
		const img = path.join(dir, 'retrato.png');
		const out = path.join(dir, 'retrato-lb.png');
		const lb = await execFileAsync(venvPython, [script, img, '--out', out,
			'--canvas', '1080x1350', '--text-top', '780',
			'--face-box', '300,400,400,900', '--json']);
		const report = JSON.parse(lb.stdout);
		assert.equal(report.mode, 'shrink');
		assert.ok(report.ok, `letterbox debía resolver el encuadre: ${report.warnings.join(' | ')}`);
		assert.ok(report.output_size[0] > 1000 && report.output_size[1] > 1500,
			`la salida debía ser mayor que la entrada: ${report.output_size}`);
		// Comprobación independiente: face-frame con la cara desplazada por
		// el acolchado no avisa de zona de texto.
		const [pl, pt] = report.pad;
		const ff = path.join(CONTENT, 'scripts', 'face-frame.py');
		const shifted = `${300 + pl},${400 + pt},400,900`;
		const res = await execFileAsync(venvPython, [ff, out, '--canvas', '1080x1350',
			'--text-top', '780', '--face-box', shifted, '--json']);
		const check = JSON.parse(res.stdout);
		assert.ok(!check.warnings.some((w) => w.includes('zona de texto')),
			`la cara acolchada sigue en zona de texto: ${check.warnings.join(' | ')}`);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});

test('constructor de carrusel: Markdown → data.json con reparto y validación', async () => {
	const { parseMarkdown, parseBullets, buildCarouselData, validateCarousel } =
		await import('../content/scripts/build-carousel.mjs');
	const md = `# La ONU contra el bloqueo por trigésimo cuarto año
La Asamblea General aprobó la resolución cubana el 28 de octubre de 2026.

## El voto
130 países dijeron no al *bloqueo*
La resolución se aprobó con 130 votos a favor, 17 en contra y 25 abstenciones.
- @globe 172 de 193 Estados miembros votaron
- @scale Es la 34.ª resolución consecutiva desde 1992

## La presión
Washington presionó y no logró *derrotar* la resolución
El secretario de Estado repartió un memorando para que los países dejaran de votar a favor.

## El contexto
El bloqueo cumple más de *60 años*
El embargo unilateral de Estados Unidos rige desde 1960.

---
Memorial de la Denuncia
`;
	const parsed = parseMarkdown(md);
	assert.equal(parsed.title, 'La ONU contra el bloqueo por trigésimo cuarto año');
	assert.equal(parsed.slides.length, 3);
	assert.equal(parsed.slides[0].kicker, 'El voto');
	assert.equal(parsed.slides[0].headline, '130 países dijeron no al *bloqueo*');
	assert.equal(parsed.slides[0].items.length, 2);
	assert.equal(parsed.slides[0].items[0].icon, 'globe');
	assert.equal(parsed.slides[0].items[1].icon, 'scale');
	assert.equal(parsed.cta, 'Memorial de la Denuncia');
	const data = buildCarouselData({ ...parsed, format: '4:5' });
	assert.equal(data.pages.length, 5, 'portada + 3 láminas + cierre');
	assert.equal(data.format, '4:5');
	const { errors, warnings } = validateCarousel(data);
	assert.deepEqual(errors, []);
	assert.deepEqual(warnings, []);
	// Viñetas: una por línea, kicker con |, comentarios ignorados.
	const slides = parseBullets('# comentario\nEl voto | 130 países dijeron no\nWashington presionó sin éxito\n');
	assert.equal(slides.length, 2);
	assert.deepEqual(slides[0], { kicker: 'El voto', headline: '130 países dijeron no' });
	assert.equal(slides[1].kicker, 'El dato');
	// Violaciones: titular de portada >15 palabras y lámina densa.
	const bad = buildCarouselData({
		title: 'uno dos tres cuatro cinco seis siete ocho nueve diez once doce trece catorce quince dieciséis',
		subtitle: '', cta: '', format: '4:5',
		slides: [
			{ kicker: 'A', headline: 'Titular corto', body: 'Cuerpo corto.' },
			{ kicker: 'B', headline: 'Titular corto', body: 'Cuerpo corto.' },
			{ kicker: 'C', headline: 'uno dos tres cuatro cinco seis siete ocho nueve diez once doce trece catorce quince dieciséis',
			  body: 'uno dos tres cuatro cinco seis siete ocho nueve diez once doce trece catorce quince dieciséis diecisiete dieciocho diecinueve veinte veintiuno veintidós veintitrés veinticuatro veinticinco veintiséis veintisiete veintiocho veintinueve treinta treinta y uno' },
		],
	});
	const v = validateCarousel(bad);
	assert.ok(v.errors.some((e) => e.startsWith('portada:')), v.errors.join(' | '));
	assert.ok(v.errors.some((e) => e.includes('titular con 16 palabras')), v.errors.join(' | '));
	// Muy pocas láminas: error (mejor otro formato).
	const few = buildCarouselData({ title: 'Título de portada corto', subtitle: '', cta: '', format: '4:5',
		slides: [{ kicker: 'A', headline: 'Solo una lámina' }] });
	assert.ok(validateCarousel(few).errors.some((e) => e.includes('mínimo 3')), validateCarousel(few).errors.join(' | '));
	// Markdown sin título o sin láminas: error claro.
	assert.throws(() => parseMarkdown('## Solo kicker\nTitular\n'), /título de portada/);
	assert.throws(() => parseMarkdown('# Solo título\n'), /no hay láminas/);
});

test('chequeo de marca: logo en HTML, titulares y rojo en PNG sintético', async () => {
	const { countLogos, checkCopy, MIN_RED_FRACTION } = await import('../content/scripts/brand-check.mjs');
	assert.equal(countLogos('<img class="brand-logo" src="assets/logo-color.png">'), 1);
	assert.equal(countLogos('<div class="x">sin logo</div>'), 0);
	// La clase en el CSS inline NO cuenta como aparición del logo.
	assert.equal(countLogos('<style>.brand-logo { height: 120px; }</style><img class="brand-logo" src="x">'), 1);
	assert.equal(countLogos('<img class="brand-logo" src="a"><img class="brand-logo" src="b">'), 2);
	assert.deepEqual(checkCopy({ title: 'Titular corto de portada' }, 'breaking'), []);
	assert.ok(checkCopy({ headline: 'uno dos tres cuatro cinco seis siete ocho nueve diez once doce trece catorce quince dieciséis' }, 'breaking').length > 0);
	assert.ok(checkCopy({ events: [{ year: '1976', text: 'uno dos tres cuatro cinco seis siete ocho nueve diez once doce trece catorce quince dieciséis diecisiete dieciocho diecinueve veinte veintiuno veintidós veintitrés veinticuatro veinticinco veintiséis' }] }, 'timeline').length > 0);
	// Rojo de marca: PNG negro puro -> 0%; PNG con franja roja -> supera el umbral.
	const dir = mkdtempSync(path.join(tmpdir(), 'content-hub-test-'));
	try {
		const black = path.join(dir, 'black.png');
		const red = path.join(dir, 'red.png');
		await execFileAsync('python3', ['-c', `
from PIL import Image
Image.new('RGB', (200, 200), (0, 0, 0)).save('${black}')
im = Image.new('RGB', (200, 200), (0, 0, 0))
for x in range(200):
    for y in range(20):
        im.putpixel((x, y), (237, 28, 36))
im.save('${red}')
`]);
		const script = path.join(CONTENT, 'scripts', 'brand-pixels.py');
		const outBlack = JSON.parse((await execFileAsync('python3', [script, black, '--json'])).stdout);
		assert.equal(outBlack.red_fraction, 0);
		const outRed = JSON.parse((await execFileAsync('python3', [script, red, '--json'])).stdout);
		assert.ok(outRed.red_fraction > MIN_RED_FRACTION, `franja roja del 10%: ${outRed.red_fraction}`);
		assert.ok(outRed.red_fraction > 0.09 && outRed.red_fraction < 0.11, `fracción esperada ~0.10: ${outRed.red_fraction}`);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});

test('render de ejemplo (breaking): PNG 1080x1080 + JPG ligero + logo en HTML', async () => {
	const dir = mkdtempSync(path.join(tmpdir(), 'content-hub-test-'));
	try {
		const outDir = path.join(dir, 'out');
		await execFileAsync(process.execPath, [
			path.join(CONTENT, 'scripts', 'render.mjs'),
			'--template', 'breaking',
			'--data', path.join(CONTENT, 'templates', 'breaking', 'data.example.json'),
			'--out', outDir, '--name', 'breaking-test',
		], { cwd: ROOT, timeout: 180000 });
		const png = path.join(outDir, 'breaking-test.png');
		const jpg = path.join(outDir, 'breaking-test-light.jpg');
		assert.ok(existsSync(png), 'falta el PNG máster');
		assert.ok(existsSync(jpg), 'falta el JPG ligero');
		assert.deepEqual(pngSize(png), { width: 1080, height: 1080 });
		const html = readFileSync(path.join(outDir, 'breaking-test.html'), 'utf8');
		assert.ok(html.includes('ÚLTIMA HORA'), 'falta el sello ÚLTIMA HORA');
		assert.ok(html.includes('<span class="hl">por 34.º año consecutivo</span>'), 'falta el resaltado {{hl:}}');
		const { countLogos } = await import('../content/scripts/brand-check.mjs');
		assert.equal(countLogos(html), 1, 'el logo completo debe aparecer exactamente una vez');
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});

test('clasificación de avisos de caras: solo la cara en zona de texto es fallo', async () => {
	const { classifyFaceWarnings } = await import('../content/scripts/face-warnings.mjs');
	// Informativos: varias caras y sin cara detectada -> aviso, no fallo.
	let r = classifyFaceWarnings([
		'7 caras en el encuadre; se encuadra por la mayor (las demás son fondo)',
		'sin cara detectada: encuadre manual (verificar a ojo)',
	]);
	assert.deepEqual(r.failures, []);
	assert.equal(r.infos.length, 2);
	// La posición sugerida con problemas no importa si la actual está limpia.
	r = classifyFaceWarnings(['[sugerida 50% 90%] cara en la zona de texto (la barbilla llega a y=800px, texto desde y=780px)']);
	assert.deepEqual(r.failures, []);
	assert.deepEqual(r.infos, []);
	// La posición ACTUAL con la cara en zona de texto sí es fallo.
	r = classifyFaceWarnings(['[actual 50% 30%] cara en la zona de texto (la barbilla llega a y=800px, texto desde y=780px)']);
	assert.equal(r.failures.length, 1);
	// Cara que no cabe ni con el mejor encuadre: fallo.
	r = classifyFaceWarnings(['la cara NO cabe entera en la zona libre ni con el mejor encuadre (retrato demasiado ajustado)']);
	assert.equal(r.failures.length, 1);
});

test('carrusel v3: portada con foto (cover_image) + gráfico de barras', async () => {
	const dir = mkdtempSync(path.join(tmpdir(), 'content-hub-test-'));
	try {
		await execFileAsync('python3', ['-c', `
from PIL import Image
im = Image.new('RGB', (800, 1000))
for x in range(800):
    for y in range(1000):
        im.putpixel((x, y), ((x * 255) // 800, 40, (y * 255) // 1000))
im.save('${path.join(dir, 'foto.png')}')
`]);
		const data = {
			title: 'Prueba v3', subtitle: 'Portada con foto y barras.',
			cta: 'Cierre de prueba', format: '4:5',
			cover_image: 'foto.png', cover_position: '50% 25%',
			pages: [
				{},
				{ kicker: 'El contraste', headline: 'La presión restó *35 apoyos*',
				  bars: [
					{ label: '2025', value: '165', pct: 85 },
					{ label: '2026', value: '130', pct: 67, highlight: true },
				  ],
				  body: 'La presión restó 35 apoyos en un año.' },
				{ kicker: 'Sin foto', headline: 'Lámina de texto', body: 'Texto.' },
				{},
			],
		};
		const dataFile = path.join(dir, 'data.json');
		writeFileSync(dataFile, JSON.stringify(data));
		const outDir = path.join(dir, 'out');
		await execFileAsync(process.execPath, [
			path.join(CONTENT, 'scripts', 'render.mjs'),
			'--template', 'carousel',
			'--data', dataFile,
			'--out', outDir, '--name', 'carrusel-v3',
		], { cwd: ROOT, timeout: 300000 });
		for (let i = 1; i <= 4; i++) {
			const png = path.join(outDir, `carrusel-v3-p0${i}.png`);
			assert.ok(existsSync(png), `falta la lámina ${i}`);
			assert.deepEqual(pngSize(png), { width: 1080, height: 1350 }, `lámina ${i} con tamaño incorrecto`);
		}
		// Portada: foto a sangre completa con la clase y el encuadre.
		const htmlCover = readFileSync(path.join(outDir, 'carrusel-v3-p01.html'), 'utf8');
		assert.ok(htmlCover.includes('with-cover-photo'), 'falta la clase with-cover-photo en la portada');
		assert.ok(htmlCover.includes('class="photo"'), 'falta el div de foto en la portada');
		assert.ok(htmlCover.includes('object-position: 50% 25%'), 'falta el encuadre cover_position');
		// Lámina de barras: dos barras, la destacada en rojo, anchos honestos.
		const htmlBars = readFileSync(path.join(outDir, 'carrusel-v3-p02.html'), 'utf8');
		assert.ok(htmlBars.includes('with-bars'), 'falta la clase with-bars (bloque centrado)');
		assert.ok(htmlBars.includes('bar-fill hot'), 'falta la barra destacada (hot)');
		assert.ok(htmlBars.includes('width: 85%'), 'falta el ancho 85% (2025)');
		assert.ok(htmlBars.includes('width: 67%'), 'falta el ancho 67% (2026)');
		assert.ok(htmlBars.includes('>165<') && htmlBars.includes('>130<'), 'faltan los valores de las barras');
		// La lámina sin bars no tiene gráfico (el campo es por página).
		// (Se comprueba el marcado, no 'bar-fill': la clase existe en el
		// CSS de la plantilla y aparece en el HTML de todas las láminas.)
		const htmlPlain = readFileSync(path.join(outDir, 'carrusel-v3-p03.html'), 'utf8');
		assert.ok(!htmlPlain.includes('class="bars"'), 'la lámina sin bars renderizó un gráfico');
		assert.ok(!htmlPlain.includes('class="bar-row"'), 'la lámina sin bars renderizó filas de barras');
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});

test('plantillas v3: foto de fondo en breaking/stat/cover + miniaturas en timeline', async () => {
	const dir = mkdtempSync(path.join(tmpdir(), 'content-hub-test-'));
	try {
		await execFileAsync('python3', ['-c', `
from PIL import Image
im = Image.new('RGB', (800, 1000))
for x in range(800):
    for y in range(1000):
        im.putpixel((x, y), ((x * 255) // 800, 40, (y * 255) // 1000))
im.save('${path.join(dir, 'foto.png')}')
`]);
		const cases = [
			{ template: 'breaking', name: 'breaking-v3', size: { width: 1080, height: 1080 },
			  data: { kicker: 'LA CONFESIÓN', headline: 'Un primer ministro *lo contó* en la radio',
				body: 'Washington lo llamó para que cambiara su voto.', date: '9 de noviembre de 2026',
				source: 'Radio · Antigua y Barbuda', image: 'foto.png', image_position: '50% 20%' } },
			{ template: 'breaking', name: 'breaking-band', size: { width: 1080, height: 1080 },
			  data: { kicker: 'LA CONFESIÓN', headline: 'Un primer ministro *lo contó* en la radio',
				body: 'Washington lo llamó para que cambiara su voto.', date: '9 de noviembre de 2026',
				source: 'Radio · Antigua y Barbuda', image: 'foto.png', image_layout: 'band' } },
			{ template: 'stat', name: 'stat-v3', size: { width: 1080, height: 1080 },
			  data: { kicker: 'El crimen en una cifra', value: '73', label: 'personas murieron',
				context: 'El 6 de octubre de 1976, el vuelo CU-455 fue destruido en pleno vuelo.',
				source: 'Archivo del Memorial', image: 'foto.png' } },
			{ template: 'cover', name: 'cover-v3', size: { width: 1920, height: 1080 },
			  data: { kicker: 'Museo histórico', title: 'Memorial de la *Denuncia*',
				subtitle: 'La memoria de las víctimas del terrorismo contra Cuba.',
				address: 'Ave 5ta, Miramar, La Habana', image: 'foto.png' } },
			{ template: 'timeline', name: 'timeline-v3', size: { width: 1080, height: 1350 },
			  data: { title: 'Fechas que *no se olvidan*', subtitle: 'Cuatro fechas.',
				source: 'Archivo del Memorial',
				events: [
					{ year: '1974', title: 'Libro bomba en Lima', text: 'El 4 de febrero estalla un libro bomba en la Embajada de Cuba en Lima.' },
					{ year: '1976', title: 'Crimen de Barbados', text: 'El 6 de octubre, el vuelo CU-455 es destruido en pleno vuelo.', image: 'foto.png' },
					{ year: '1980', title: 'Asesinado Félix García', text: 'El 11 de septiembre, el diplomático cubano ante la ONU es asesinado en Queens.' },
					{ year: '2026', title: 'La ONU vota', text: 'El 28 de octubre, 130 países apoyan la resolución cubana.', image: 'foto.png' },
				] } },
		];
		for (const c of cases) {
			const dataFile = path.join(dir, `${c.name}.json`);
			writeFileSync(dataFile, JSON.stringify(c.data));
			const outDir = path.join(dir, c.name);
			await execFileAsync(process.execPath, [
				path.join(CONTENT, 'scripts', 'render.mjs'),
				'--template', c.template,
				'--data', dataFile,
				'--out', outDir, '--name', c.name,
			], { cwd: ROOT, timeout: 180000 });
			const png = path.join(outDir, `${c.name}.png`);
			assert.ok(existsSync(png), `falta el PNG de ${c.template}`);
			assert.deepEqual(pngSize(png), c.size, `${c.template} con tamaño incorrecto`);
			const html = readFileSync(path.join(outDir, `${c.name}.html`), 'utf8');
			if (c.template === 'timeline') {
				// Dos hechos con miniatura, dos sin ella.
				assert.ok(html.includes('has-thumb'), 'falta la clase has-thumb en el hecho con foto');
				assert.equal((html.match(/class="thumb"/g) ?? []).length, 2, 'deben ser exactamente 2 miniaturas');
				assert.equal((html.match(/class="event has-thumb"/g) ?? []).length, 2, 'deben ser exactamente 2 hechos con foto');
			} else {
				assert.ok(html.includes('with-photo'), `falta la clase with-photo en ${c.template}`);
				assert.ok(html.includes('class="photo"'), `falta el div de foto en ${c.template}`);
			}
			if (c.name === 'breaking-band') {
				assert.ok(html.includes('layout-band'), 'falta la clase layout-band en la variante de banda');
			}
			// El logo completo aparece exactamente una vez en cada plantilla.
			const { countLogos } = await import('../content/scripts/brand-check.mjs');
			assert.equal(countLogos(html), 1, `${c.template}: el logo completo debe aparecer exactamente una vez`);
		}
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});

test('carrusel: selectores 4:5 compuestos (bug de la v2: reglas muertas)', () => {
	// format-45, with-photo, layout-band y layout-side van en el MISMO
	// elemento (.page); con combinador descendiente (`.format-45
	// .layout-band …`) la regla no casa nunca y la variante 4:5 hereda
	// los valores cuadrados. Regresión del 21-nov-2026 (v3).
	const html = readFileSync(path.join(CONTENT, 'templates', 'carousel', 'template.html'), 'utf8');
	for (const sel of [
		'.format-45.with-photo .body-wrap',
		'.format-45.layout-band .photo',
		'.format-45.layout-band .body-wrap',
		'.format-45.layout-side .photo',
		'.format-45.layout-side .body-wrap',
	]) {
		assert.ok(html.includes(sel), `falta el selector compuesto ${sel}`);
	}
	for (const dead of [
		'.format-45 .with-photo .body-wrap',
		'.format-45 .layout-band .photo',
		'.format-45 .layout-band .body-wrap',
		'.format-45 .layout-side .photo',
		'.format-45 .layout-side .body-wrap',
	]) {
		assert.ok(!html.includes(dead), `selector muerto (descendiente) presente: ${dead}`);
	}
});

test('face_check: false omite la lámina de plano general (sin falso fallo)', async (t) => {
	const venvPython = path.join(process.env.HOME ?? '', 'workspace', 'remotion-hub', '.venv', 'bin', 'python');
	if (!existsSync(venvPython)) {
		t.skip('sin venv del hub (cv2)');
		return;
	}
	// La lámina 2 del carrusel ONU es un plano general (tablero de
	// votación con público de fondo): el detector cazaba caras diminutas
	// de fondo y el QA fallaba en falso. Con face_check: false, la
	// lámina se omite y la 6 (Fidel, retrato) se sigue analizando.
	const photo = path.join(CONTENT, 'pieces', 'onu-bloqueo-2026', 'img', 'un-voteboard-result-vert.jpg');
	if (!existsSync(photo)) {
		t.skip('sin foto de la pieza onu-bloqueo-2026 (img/ no versionado en este checkout)');
		return;
	}
	const { stdout } = await execFileAsync(venvPython, [
		path.join(CONTENT, 'scripts', 'face-frame.py'),
		'--piece', 'onu-bloqueo-2026', '--format', '4:5', '--json',
	], { cwd: ROOT, timeout: 180000 });
	const report = JSON.parse(stdout);
	const p2 = report.pages.find((p) => p.page === 2);
	assert.ok(p2, 'la lámina 2 debe aparecer en el informe');
	assert.ok(p2.skipped, 'la lámina 2 debe marcarse como omitida (face_check: false)');
	assert.deepEqual(p2.warnings ?? [], [], 'la lámina omitida no debe aportar avisos');
	const p6 = report.pages.find((p) => p.page === 6);
	assert.ok(p6 && !p6.skipped, 'la lámina 6 (Fidel) se debe seguir analizando');
	assert.ok(p6.faces_found >= 1, 'la lámina 6 debe detectar caras');
});

test('galería: índice con las 10 plantillas y aviso si falta el render', async () => {
	const { buildGallery, listTemplates } = await import('../content/scripts/gallery.mjs');
	assert.equal(listTemplates().length, 10);
	const dir = mkdtempSync(path.join(tmpdir(), 'content-hub-test-'));
	try {
		// Sin renders: todas marcadas como «Sin render», sin romperse.
		const html = buildGallery({ examplesDir: dir });
		for (const t of listTemplates()) {
			assert.ok(html.includes(`id="${t}"`), `falta la tarjeta ${t}`);
		}
		assert.ok(html.includes('Sin render'), 'sin renders debe avisar, no romperse');
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});
