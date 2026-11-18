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
const TEMPLATES = ['post', 'story', 'carousel', 'infographic', 'thumbnail', 'quote'];

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
