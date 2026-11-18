/**
 * Pruebas del ecosistema de memes rápidos (memes/).
 *
 * Ejecutar: node --test tests/meme-ecosystem.test.mjs
 * (o npm test, que corre toda la suite del repo)
 *
 * Las pruebas de vídeo usan ffmpeg/ffprobe (~40 s en total).
 * No hay llamadas de red en la suite (Pollinations y refresh solo --help).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import {
	existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MEMES = path.join(ROOT, 'memes');
const SCRIPTS = path.join(MEMES, 'scripts');

const tmp = () => mkdtempSync(path.join(tmpdir(), 'meme-test-'));

function jpegSize(file) {
	const b = readFileSync(file);
	assert.equal(b[0], 0xFF, `${file} no es JPEG`);
	assert.equal(b[1], 0xD8, `${file} no es JPEG`);
	let i = 2;
	while (i < b.length - 9) {
		if (b[i] !== 0xFF) { i += 1; continue; }
		const marker = b[i + 1];
		if (marker === 0xC0 || marker === 0xC2) {
			return { height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7) };
		}
		if (marker === 0xD8 || marker === 0x01 || (marker >= 0xD0 && marker <= 0xD7)) {
			i += 2;
			continue;
		}
		i += 2 + b.readUInt16BE(i + 2);
	}
	throw new Error(`${file}: no se encontró el marcador SOF`);
}

async function probe(file) {
	const { stdout } = await execFileAsync('ffprobe', ['-v', 'error',
		'-show_entries', 'stream=codec_type,width,height',
		'-show_entries', 'format=duration', '-of', 'json', file]);
	const d = JSON.parse(stdout);
	const video = d.streams.find((s) => s.codec_type === 'video');
	return {
		width: video.width,
		height: video.height,
		duration: parseFloat(d.format.duration),
		hasAudio: d.streams.some((s) => s.codec_type === 'audio'),
	};
}

async function memePy(args, cwd) {
	return execFileAsync('python3', [path.join(SCRIPTS, 'meme.py'), ...args], { cwd });
}

async function memeVideoPy(args, cwd) {
	return execFileAsync('python3', [path.join(SCRIPTS, 'meme-video.py'), ...args], { cwd });
}

test('catálogo: válido, completo y con archivos', () => {
	const catalog = JSON.parse(readFileSync(
		path.join(MEMES, 'templates', 'catalog.json'), 'utf8'));
	assert.ok(catalog.count >= 90, `solo ${catalog.count} plantillas`);
	assert.equal(catalog.templates.length, catalog.count);
	for (const t of catalog.templates) {
		for (const k of ['id', 'name', 'slug', 'file', 'url', 'box_count']) {
			assert.ok(t[k] !== undefined, `${t.slug}: falta ${k}`);
		}
		assert.ok(existsSync(path.join(MEMES, 'templates', t.file)),
			`${t.slug}: falta ${t.file}`);
	}
	const slugs = catalog.templates.map((t) => t.slug);
	assert.equal(new Set(slugs).size, slugs.length, 'slugs duplicados');
	assert.ok(slugs.includes('drake-hotline-bling'));
});

test('hoja de contacto: existe y es JPEG válido', () => {
	const sheet = path.join(MEMES, 'templates', 'contact-sheet.jpg');
	assert.ok(existsSync(sheet));
	const { width, height } = jpegSize(sheet);
	assert.ok(width >= 2000 && height >= 1500, `${width}x${height}`);
});

test('meme.py --list funciona', async () => {
	const { stdout } = await memePy(['--list']);
	assert.match(stdout, /drake-hotline-bling/);
});

test('imagen: plantilla con región derecha (Drake)', async () => {
	const dir = tmp();
	const out = path.join(dir, 'drake.jpg');
	await memePy(['--template', 'drake-hotline-bling',
		'--texts', 'DORMIR 8 HORAS|PENSAR EN PECES',
		'--boxes-dir', 'v', '--text-region', 'right', '--out', out]);
	assert.ok(existsSync(out));
	assert.deepEqual(jpegSize(out), { width: 1200, height: 1200 });
	rmSync(dir, { recursive: true, force: true });
});

test('imagen: cajas horizontales (Distracted Boyfriend)', async () => {
	const dir = tmp();
	const out = path.join(dir, 'bf.jpg');
	await memePy(['--template', 'distracted-boyfriend',
		'--texts', 'EL WIFI|YO|MI NOVIA', '--boxes-dir', 'h', '--out', out]);
	assert.ok(existsSync(out));
	assert.deepEqual(jpegSize(out), { width: 1200, height: 800 });
	rmSync(dir, { recursive: true, force: true });
});

test('imagen: foto propia como base', async () => {
	const dir = tmp();
	const photo = path.join(dir, 'foto.png');
	await execFileAsync('python3', ['-c',
		`from PIL import Image; Image.new('RGB', (800, 600), (40, 120, 200)).save('${photo}')`]);
	const out = path.join(dir, 'foto.jpg');
	await memePy(['--image', photo, '--top', 'YO', '--bottom', 'A LAS 3 AM',
		'--out', out]);
	assert.ok(existsSync(out));
	assert.deepEqual(jpegSize(out), { width: 800, height: 600 });
	rmSync(dir, { recursive: true, force: true });
});

test('imagen: solo texto (fondo blanco 1080x1080)', async () => {
	const dir = tmp();
	const out = path.join(dir, 'texto.jpg');
	await memePy(['--text-only', 'chiste absurdo de prueba', '--out', out]);
	assert.ok(existsSync(out));
	assert.deepEqual(jpegSize(out), { width: 1080, height: 1080 });
	rmSync(dir, { recursive: true, force: true });
});

test('imagen: rejilla 2x2', async () => {
	const dir = tmp();
	const imgs = ['drake-hotline-bling.jpg', 'two-buttons.jpg',
		'distracted-boyfriend.jpg', 'waiting-skeleton.jpg']
		.map((f) => path.join(MEMES, 'templates', 'images', f)).join(',');
	const out = path.join(dir, 'grid.jpg');
	await memePy(['--grid', imgs, '--texts', 'LUNES|MARTES|MIÉRCOLES|YO',
		'--out', out]);
	assert.ok(existsSync(out));
	assert.deepEqual(jpegSize(out), { width: 1080, height: 1080 });
	rmSync(dir, { recursive: true, force: true });
});

test('imagen: chat falso', async () => {
	const dir = tmp();
	const out = path.join(dir, 'chat.jpg');
	await memePy(['--fake-chat', 'yo: hola|María: cuál|yo: el del pez',
		'--out', out]);
	assert.ok(existsSync(out));
	const { width } = jpegSize(out);
	assert.equal(width, 1080);
	rmSync(dir, { recursive: true, force: true });
});

test('imagen: deep-fry cambia la imagen', async () => {
	const dir = tmp();
	const plain = path.join(dir, 'plain.jpg');
	const fried = path.join(dir, 'fried.jpg');
	const args = ['--template', 'disaster-girl', '--top', 'YO'];
	await memePy([...args, '--out', plain]);
	await memePy([...args, '--deep-fry', '--out', fried]);
	assert.ok(existsSync(fried));
	assert.notEqual(
		readFileSync(plain).toString('base64'),
		readFileSync(fried).toString('base64'));
	rmSync(dir, { recursive: true, force: true });
});

test('vídeo: combo completo (caption + punch + SFX + freeze)', { timeout: 120000 }, async () => {
	const dir = tmp();
	const out = path.join(dir, 'meme.mp4');
	await memeVideoPy(['--template', 'waiting-skeleton',
		'--top', 'YO ESPERANDO EL WIFI',
		'--duration', '4', '--punch-at', '2', '--sfx', 'boing',
		'--freeze-end', '2', '--out', out]);
	assert.ok(existsSync(out));
	const info = await probe(out);
	assert.deepEqual([info.width, info.height], [1080, 1920]);
	assert.ok(Math.abs(info.duration - 6) < 0.2, `duración ${info.duration}`);
	assert.ok(info.hasAudio, 'falta la pista de audio (SFX)');
	rmSync(dir, { recursive: true, force: true });
});

test('vídeo: POV cuadrado con velocidad', { timeout: 120000 }, async () => {
	const dir = tmp();
	const out = path.join(dir, 'pov.mp4');
	await memeVideoPy(['--template', 'one-does-not-simply',
		'--pov', 'cuando dicen que hay examen sorpresa',
		'--format', 'square', '--duration', '3', '--speed', '1.5',
		'--out', out]);
	assert.ok(existsSync(out));
	const info = await probe(out);
	assert.deepEqual([info.width, info.height], [1080, 1080]);
	assert.ok(Math.abs(info.duration - 2) < 0.2, `duración ${info.duration}`);
	rmSync(dir, { recursive: true, force: true });
});

test('scripts de soporte: --help', async () => {
	for (const s of ['gen-absurd.py', 'refresh-templates.py', 'contact-sheet.py']) {
		const { stdout } = await execFileAsync('python3',
			[path.join(SCRIPTS, s), '--help']);
		assert.ok(stdout.length > 50, `${s}: --help vacío`);
	}
});
