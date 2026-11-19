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

test('imagen: el texto de panel nunca toca el borde (regresión 19-nov-2026)', async () => {
	const dir = tmp();
	const out = path.join(dir, 'drake-overflow.jpg');
	await memePy(['--template', 'drake-hotline-bling',
		'--texts', 'ACORDARSE DEL DÍA DEL HOMBRE|FELICITAR EL 8 DE MARZO',
		'--boxes-dir', 'v', '--text-region', 'right', '--out', out]);
	// La mitad derecha de Drake es fondo blanco: ningún píxel oscuro
	// (trazo del texto) puede aparecer a menos de 12 px del borde derecho.
	// Antes del arreglo, «ACORDARSE» llegaba a 5 px del borde.
	const { stdout } = await execFileAsync('python3', ['-c',
		`from PIL import Image
img = Image.open('${out}').convert('L')
w, h = img.size
px = img.load()
print(sum(1 for x in range(w - 12, w) for y in range(h) if px[x, y] < 100))`]);
	assert.equal(stdout.trim(), '0');
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
	for (const s of ['gen-absurd.py', 'refresh-templates.py',
		'refresh-video-templates.py', 'contact-sheet.py']) {
		const { stdout } = await execFileAsync('python3',
			[path.join(SCRIPTS, s), '--help']);
		assert.ok(stdout.length > 50, `${s}: --help vacío`);
	}
});

// --- Nuevas (auditoría 18-nov-2026) ---

async function makeToneClip(dir) {
	// Clip sintético 6 s: testsrc2 en movimiento + tono 440 Hz estéreo.
	const clip = path.join(dir, 'tono.mp4');
	await execFileAsync('ffmpeg', ['-y', '-v', 'error',
		'-f', 'lavfi', '-i', 'testsrc2=size=640x360:rate=30:duration=6',
		'-f', 'lavfi', '-i', 'sine=frequency=440:duration=6',
		'-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac',
		'-shortest', clip]);
	return clip;
}

async function meanVolume(file, start, dur) {
	const { stderr } = await execFileAsync('ffmpeg', ['-v', 'info',
		'-ss', String(start), '-t', String(dur), '-i', file,
		'-af', 'volumedetect', '-vn', '-sn', '-dn', '-f', 'null', '/dev/null']);
	const m = stderr.match(/mean_volume: (-?[\d.]+|-inf) dB/);
	assert.ok(m, `volumedetect sin mean_volume en ${file}`);
	return m[1] === '-inf' ? -Infinity : parseFloat(m[1]);
}

async function psnrBetween(file, t1, t2, dir) {
	const f1 = path.join(dir, 'psnr-a.png');
	const f2 = path.join(dir, 'psnr-b.png');
	await execFileAsync('ffmpeg', ['-y', '-v', 'error',
		'-ss', String(t1), '-i', file, '-frames:v', '1', f1]);
	await execFileAsync('ffmpeg', ['-y', '-v', 'error',
		'-ss', String(t2), '-i', file, '-frames:v', '1', f2]);
	const { stderr } = await execFileAsync('ffmpeg', ['-v', 'info',
		'-i', f1, '-i', f2, '-filter_complex', 'psnr', '-f', 'null', '-']);
	// PNG (RGB) imprime "PSNR r:.. g:.. b:.. average:.."; YUV, "y/u/v".
	// Fotogramas idénticos: average:inf.
	const m = stderr.match(/average:(inf|[\d.]+)/);
	assert.ok(m, 'psnr sin resultado');
	return m[1] === 'inf' ? Infinity : parseFloat(m[1]);
}

test('música: catálogo válido y archivos presentes', () => {
	const music = JSON.parse(readFileSync(
		path.join(MEMES, 'assets', 'music', 'music.json'), 'utf8'));
	assert.ok(music.tracks.length >= 7, `solo ${music.tracks.length} pistas`);
	for (const t of music.tracks) {
		for (const k of ['name', 'title', 'artist', 'license', 'file']) {
			assert.ok(t[k], `${t.name}: falta ${k}`);
		}
		assert.ok(existsSync(path.join(MEMES, 'assets', 'music', t.file)),
			`${t.name}: falta ${t.file}`);
	}
});

test('SFX nuevos: airhorn y scratch existen y suenan', { timeout: 120000 }, async () => {
	for (const f of ['airhorn.wav', 'record-scratch.wav']) {
		const p = path.join(MEMES, 'assets', 'sfx', f);
		assert.ok(existsSync(p), `falta ${f}`);
		const { stdout } = await execFileAsync('ffprobe', ['-v', 'error',
			'-show_entries', 'format=duration', '-of', 'csv=p=0', p]);
		assert.ok(parseFloat(stdout) > 0.3, `${f}: duración ${stdout}`);
	}
	const dir = tmp();
	const out = path.join(dir, 'airhorn.mp4');
	await memeVideoPy(['--template', 'waiting-skeleton', '--top', 'PRUEBA',
		'--duration', '3', '--sfx', 'airhorn', '--sfx-at', '1', '--out', out]);
	const info = await probe(out);
	assert.ok(info.hasAudio, 'falta audio con airhorn');
	const out2 = path.join(dir, 'scratch.mp4');
	await memeVideoPy(['--template', 'waiting-skeleton', '--top', 'PRUEBA',
		'--duration', '3', '--sfx', 'scratch', '--sfx-at', '1', '--out', out2]);
	assert.ok((await probe(out2)).hasAudio, 'falta audio con scratch');
	rmSync(dir, { recursive: true, force: true });
});

test('vídeo: freeze a mitad alarga la duración', { timeout: 120000 }, async () => {
	const dir = tmp();
	const clip = await makeToneClip(dir);
	const out = path.join(dir, 'freeze.mp4');
	await memeVideoPy(['--input', clip, '--top', 'CUANDO TE DAS CUENTA',
		'--freeze-at', '2.5', '--freeze-dur', '2', '--out', out]);
	const info = await probe(out);
	assert.ok(Math.abs(info.duration - 8) < 0.2, `duración ${info.duration}`);
	rmSync(dir, { recursive: true, force: true });
});

test('vídeo: freeze a mitad congela la imagen (PSNR)', { timeout: 120000 }, async () => {
	const dir = tmp();
	const clip = await makeToneClip(dir);
	const out = path.join(dir, 'freeze.mp4');
	await memeVideoPy(['--input', clip, '--top', 'CUANDO TE DAS CUENTA',
		'--freeze-at', '2.5', '--freeze-dur', '2', '--out', out]);
	// Dos fotogramas dentro de la ventana de freeze (2.5-4.5): casi idénticos.
	const psnr = await psnrBetween(out, 2.7, 4.0, dir);
	assert.ok(psnr > 45, `PSNR en la ventana de freeze: ${psnr} dB`);
	// Control: dos fotogramas en movimiento (antes del freeze) difieren mucho.
	const moving = await psnrBetween(out, 0.5, 1.0, dir);
	assert.ok(moving < 30, `PSNR en movimiento: ${moving} dB (esperaba < 30)`);
	rmSync(dir, { recursive: true, force: true });
});

test('vídeo: freeze a mitad pausa el audio', { timeout: 120000 }, async () => {
	const dir = tmp();
	const clip = await makeToneClip(dir);
	const out = path.join(dir, 'freeze.mp4');
	await memeVideoPy(['--input', clip, '--top', 'CUANDO TE DAS CUENTA',
		'--freeze-at', '2.5', '--freeze-dur', '2', '--out', out]);
	const inside = await meanVolume(out, 3.2, 1.2);
	assert.ok(inside < -60, `volumen dentro del freeze: ${inside} dB`);
	const outside = await meanVolume(out, 0.5, 1.5);
	assert.ok(outside > -40, `volumen fuera del freeze: ${outside} dB`);
	rmSync(dir, { recursive: true, force: true });
});

test('vídeo: música mezclada audible', { timeout: 120000 }, async () => {
	const dir = tmp();
	const out = path.join(dir, 'music.mp4');
	await memeVideoPy(['--template', 'waiting-skeleton', '--top', 'YO',
		'--duration', '4', '--music', 'sneaky-snitch', '--out', out]);
	const info = await probe(out);
	assert.ok(info.hasAudio, 'falta la pista de música');
	const vol = await meanVolume(out, 0.5, 2);
	assert.ok(vol > -60, `música demasiado baja: ${vol} dB`);
	rmSync(dir, { recursive: true, force: true });
});

test('imagen: texto que taparía una cara se desplaza', async () => {
	const dir = tmp();
	const out = path.join(dir, 'cara.jpg');
	const { stderr } = await memePy(['--template', 'disaster-girl',
		'--bottom', 'LA CASA SE QUEMA', '--out', out]);
	assert.ok(existsSync(out));
	assert.match(stderr, /tapaba una cara; movido arriba/);
	rmSync(dir, { recursive: true, force: true });
});

test('vídeo: aviso de cara con --face-box', { timeout: 120000 }, async () => {
	const dir = tmp();
	const out = path.join(dir, 'cara.mp4');
	const { stderr } = await memeVideoPy(['--template', 'two-buttons',
		'--top', 'OPCIÓN A', '--duration', '3',
		'--face-box', '200,50,200,200', '--out', out]);
	assert.ok(existsSync(out));
	assert.match(stderr, /tapaba una cara; movido abajo/);
	rmSync(dir, { recursive: true, force: true });
});

// --- Nuevas (banco de plantillas de vídeo, 19-nov-2026) ---

test('vídeo: --list-video-templates funciona', async () => {
	const { stdout } = await memeVideoPy(['--list-video-templates']);
	assert.match(stdout, /dicaprio-pointing/);
	assert.match(stdout, /coffin-dance/);
	assert.match(stdout, /tung-tung-tung-sahur/);
});

test('vídeo: catálogo válido, con archivos y ffprobe', async () => {
	const catalog = JSON.parse(readFileSync(
		path.join(MEMES, 'video-templates', 'catalog.json'), 'utf8'));
	assert.ok(catalog.count >= 20, `solo ${catalog.count} plantillas`);
	assert.equal(catalog.templates.length, catalog.count);
	const slugs = [];
	for (const t of catalog.templates) {
		for (const k of ['slug', 'name', 'file', 'url', 'source', 'origin',
			'use', 'caption_tip', 'duration', 'width', 'height',
			'green_screen', 'trend', 'added']) {
			assert.ok(t[k] !== undefined, `${t.slug}: falta ${k}`);
		}
		slugs.push(t.slug);
		const p = path.join(MEMES, 'video-templates', t.file);
		assert.ok(existsSync(p), `${t.slug}: falta ${t.file}`);
		const { stdout } = await execFileAsync('ffprobe', ['-v', 'error',
			'-select_streams', 'v:0',
			'-show_entries', 'stream=width,height',
			'-show_entries', 'format=duration', '-of', 'json', p]);
		const d = JSON.parse(stdout);
		assert.ok(d.streams.length === 1, `${t.slug}: sin pista de vídeo`);
		assert.equal(d.streams[0].width, t.width, `${t.slug}: ancho`);
		assert.equal(d.streams[0].height, t.height, `${t.slug}: alto`);
		assert.ok(Math.abs(parseFloat(d.format.duration) - t.duration) < 0.1,
			`${t.slug}: duración ${d.format.duration} vs ${t.duration}`);
	}
	assert.equal(new Set(slugs).size, slugs.length, 'slugs duplicados');
	assert.ok(slugs.includes('el-risitas'));
	assert.ok(slugs.includes('messi-que-miras-bobo'));
});

test('vídeo: render con --video-template', { timeout: 120000 }, async () => {
	const dir = tmp();
	const out = path.join(dir, 'plantilla.mp4');
	await memeVideoPy(['--video-template', 'dicaprio-pointing',
		'--top', 'CUANDO VES EL MEME ANTES', '--punch-at', '0.7',
		'--sfx', 'vine-boom', '--freeze-end', '1', '--out', out]);
	assert.ok(existsSync(out));
	const info = await probe(out);
	assert.deepEqual([info.width, info.height], [1080, 1920]);
	// Clip 1,43 s + freeze 1 s.
	assert.ok(Math.abs(info.duration - 2.43) < 0.2,
		`duración ${info.duration}`);
	assert.ok(info.hasAudio, 'falta la pista de audio (SFX)');
	rmSync(dir, { recursive: true, force: true });
});

test('vídeo: --chroma-key quita el fondo verde', { timeout: 120000 }, async () => {
	const dir = tmp();
	const out = path.join(dir, 'chroma.mp4');
	await memeVideoPy(['--video-template', 'michael-rosen-nice',
		'--chroma-key', '--top', 'PRUEBA', '--out', out]);
	assert.ok(existsSync(out));
	// La esquina superior izquierda era verde puro; con el key sobre
	// fondo negro debe quedar oscura (sin dominante verde).
	const frame = path.join(dir, 'frame.png');
	await execFileAsync('ffmpeg', ['-y', '-v', 'error',
		'-ss', '1', '-i', out, '-frames:v', '1', frame]);
	const { stdout } = await execFileAsync('python3', ['-c',
		`from PIL import Image
im = Image.open('${frame}').convert('RGB')
px = [im.getpixel((x, y)) for x in range(0, 200, 20) for y in range(200, 400, 20)]
g = sum(p[1] for p in px) / len(px)
r = sum(p[0] for p in px) / len(px)
print(f'{r:.0f},{g:.0f}')`]);
	const [r, g] = stdout.trim().split(',').map(Number);
	assert.ok(g < 60, `esquina sigue verde: R=${r} G=${g}`);
	rmSync(dir, { recursive: true, force: true });
});

test('SFX de memes: los 18 nuevos existen y suenan', async () => {
	const sfx = ['vine-boom.wav', 'metal-pipe.wav', 'dramatic-sting.wav',
		'fail-womp.wav', 'error-chime.wav', 'ping.wav', 'applause.wav',
		'riser.wav', 'bonk.wav', 'bass-drop.wav', 'glitch.wav',
		'deflate.wav', 'coin.wav', 'thunder.wav', 'alarm.wav',
		'sad-trombone.wav', 'censor-beep.wav', 'wrong-buzzer.wav'];
	for (const f of sfx) {
		const p = path.join(MEMES, 'assets', 'sfx', f);
		assert.ok(existsSync(p), `falta ${f}`);
		const { stdout } = await execFileAsync('ffprobe', ['-v', 'error',
			'-show_entries', 'format=duration', '-of', 'csv=p=0', p]);
		assert.ok(parseFloat(stdout) > 0.1, `${f}: duración ${stdout}`);
	}
});

// --- Nuevas (mejora de calidad del pipeline, 19-nov-2026) ---

test('cajas: Two Buttons pone cada texto en su botón y respeta la cara', async () => {
	const dir = tmp();
	const out = path.join(dir, 'two-buttons.jpg');
	await memePy(['--template', 'two-buttons',
		'--texts', 'FELICITAR EL DÍA DEL HOMBRE|FINGIR QUE NO EXISTE|LA SOCIEDAD EL 19 DE NOVIEMBRE',
		'--out', out]);
	assert.ok(existsSync(out));
	// La cara del tipo (panel inferior, centro) debe quedar idéntica a
	// la plantilla (solo ruido de recompresión JPEG); el botón izquierdo
	// debe cambiar mucho (texto negro encima). Antes de las cajas, los
	// textos apilados tapaban toda la imagen y la cara.
	const tpl = path.join(MEMES, 'templates', 'images', 'two-buttons.jpg');
	const { stdout } = await execFileAsync('python3', ['-c',
		`from PIL import Image
t = Image.open('${tpl}').convert('RGB')
o = Image.open('${out}').convert('RGB')
w, h = t.size
def meandiff(box):
    a = t.crop(box); b = o.crop(box)
    pa, pb = list(a.getdata()), list(b.getdata())
    return sum(abs(x[0]-y[0])+abs(x[1]-y[1])+abs(x[2]-y[2]) for x, y in zip(pa, pb)) / (len(pa)*3)
print(f"{meandiff((int(w*0.35), int(h*0.55), int(w*0.65), int(h*0.80))):.2f}")
print(f"{meandiff((int(w*0.06), int(h*0.05), int(w*0.47), int(h*0.35))):.2f}")`]);
	const [cara, boton] = stdout.trim().split('\n').map(Number);
	assert.ok(cara < 5, `la cara cambió ${cara} (texto encima)`);
	assert.ok(boton > 15, `el botón no cambió ${boton} (texto ausente)`);
	rmSync(dir, { recursive: true, force: true });
});

test('cajas: Woman Yelling no solapa los dos textos', async () => {
	const dir = tmp();
	const out = path.join(dir, 'yelling.jpg');
	await memePy(['--template', 'woman-yelling-at-cat',
		'--texts', '¡FELIZ DÍA DE LA MUJER! ¡FLORES! ¡REGALOS! ¡CADENAS DE WHATSAPP!|feliz día del hombre supongo',
		'--out', out]);
	assert.ok(existsSync(out));
	// Texto negro en cada mitad de la banda blanca y nada en la columna
	// central que las separa (antes se superponían en el centro).
	const { stdout } = await execFileAsync('python3', ['-c',
		`from PIL import Image
im = Image.open('${out}').convert('L')
w, h = im.size
def dark(box):
    return sum(1 for v in im.crop(box).getdata() if v < 100)
print(dark((int(w*0.02), int(h*0.02), int(w*0.48), int(h*0.19))))
print(dark((int(w*0.52), int(h*0.02), int(w*0.98), int(h*0.19))))
print(dark((int(w*0.48), int(h*0.02), int(w*0.52), int(h*0.19))))`]);
	const [izq, der, gap] = stdout.trim().split('\n').map(Number);
	assert.ok(izq > 100, `sin texto en la mitad izquierda (${izq} px oscuros)`);
	assert.ok(der > 100, `sin texto en la mitad derecha (${der} px oscuros)`);
	assert.equal(gap, 0, `los textos invaden la separación (${gap} px oscuros)`);
	rmSync(dir, { recursive: true, force: true });
});

test('vídeo: el texto se achica cuando las caras bloquean ambos lados', { timeout: 120000 }, async () => {
	const dir = tmp();
	const out = path.join(dir, 'achicado.mp4');
	// Cara sintética gigante que tapa arriba y abajo a tamaño completo:
	// solo cabe el texto al 50% arriba.
	const { stderr } = await memeVideoPy(['--template', 'two-buttons',
		'--top', 'OPCIÓN A', '--duration', '3',
		'--face-box', '100,50,400,830', '--out', out]);
	assert.ok(existsSync(out));
	assert.match(stderr, /achicado al 50%/);
	rmSync(dir, { recursive: true, force: true });
});

test('vídeo: fondo difuminado en cuadrado (sin bandas negras)', { timeout: 180000 }, async () => {
	const dir = tmp();
	// Mecanismo: clip sintético colorido -> las esquinas no son negras.
	const clip = await makeToneClip(dir);
	const out = path.join(dir, 'blur.mp4');
	await memeVideoPy(['--input', clip, '--format', 'square', '--out', out]);
	assert.ok(existsSync(out));
	const frame = path.join(dir, 'blur.png');
	await execFileAsync('ffmpeg', ['-y', '-v', 'error',
		'-ss', '3', '-i', out, '-frames:v', '1', frame]);
	const { stdout } = await execFileAsync('python3', ['-c',
		`from PIL import Image
im = Image.open('${frame}').convert('L')
px = list(im.crop((0, 0, 100, 100)).getdata())
print(f"{sum(px)/len(px):.1f}")`]);
	const corner = parseFloat(stdout.trim());
	assert.ok(corner > 20, `esquina superior negra (${corner})`);
	// Caso real: el Wasted cuadrado tiene resplandor difuminado abajo
	// (antes: bandas negras muertas arriba y abajo).
	const out2 = path.join(dir, 'wasted.mp4');
	await memeVideoPy(['--video-template', 'gta-wasted',
		'--format', 'square', '--out', out2]);
	const frame2 = path.join(dir, 'wasted.png');
	await execFileAsync('ffmpeg', ['-y', '-v', 'error',
		'-ss', '3.5', '-i', out2, '-frames:v', '1', frame2]);
	const { stdout: s2 } = await execFileAsync('python3', ['-c',
		`from PIL import Image
im = Image.open('${frame2}').convert('L')
w, h = im.size
px = list(im.crop((0, 715, w, h)).getdata())
print(f"{100*sum(1 for v in px if v > 15)/len(px):.1f}")`]);
	const glow = parseFloat(s2.trim());
	assert.ok(glow > 10, `banda inferior sin resplandor (${glow}%)`);
	rmSync(dir, { recursive: true, force: true });
});

test('vídeo: guarda green-screen activa el chroma y no deja verde', { timeout: 180000 }, async () => {
	const dir = tmp();
	const out = path.join(dir, 'messi.mp4');
	const { stderr } = await memeVideoPy(['--video-template', 'messi-que-miras-bobo',
		'--format', 'vertical', '--top', 'PRUEBA', '--out', out]);
	assert.ok(existsSync(out));
	assert.match(stderr, /activando --chroma-key automáticamente/);
	const frame = path.join(dir, 'messi.png');
	await execFileAsync('ffmpeg', ['-y', '-v', 'error',
		'-ss', '4.5', '-i', out, '-frames:v', '1', frame]);
	const { stdout } = await execFileAsync('python3', ['-c',
		`from PIL import Image
im = Image.open('${frame}').convert('RGB')
px = list(im.getdata())
g = sum(1 for r, gg, b in px if gg > 100 and gg > r*1.4 and gg > b*1.4)
print(f"{100*g/len(px):.3f}")`]);
	const green = parseFloat(stdout.trim());
	assert.ok(green < 0.5, `residuo verde: ${green}%`);
	rmSync(dir, { recursive: true, force: true });
});

test('vídeo: la guarda no dispara con un clip que no es green screen', { timeout: 120000 }, async () => {
	const dir = tmp();
	const out = path.join(dir, 'homer.mp4');
	const { stderr } = await memeVideoPy(['--video-template', 'homer-disappears-bushes',
		'--format', 'vertical', '--top', 'PRUEBA', '--out', out]);
	assert.ok(existsSync(out));
	assert.doesNotMatch(stderr, /activando --chroma-key automáticamente/);
	rmSync(dir, { recursive: true, force: true });
});

test('vídeo: píldora de legibilidad en fondo claro (auto)', { timeout: 120000 }, async () => {
	const dir = tmp();
	const photo = path.join(dir, 'claro.png');
	await execFileAsync('python3', ['-c',
		`from PIL import Image; Image.new('RGB', (1080, 1080), (240, 240, 235)).save('${photo}')`]);
	async function bandMean(out) {
		const frame = `${out}.png`;
		await execFileAsync('ffmpeg', ['-y', '-v', 'error',
			'-ss', '1', '-i', out, '-frames:v', '1', frame]);
		const { stdout } = await execFileAsync('python3', ['-c',
			`from PIL import Image
im = Image.open('${frame}').convert('L')
px = list(im.crop((150, 40, 930, 260)).getdata())
print(f"{sum(px)/len(px):.1f}")`]);
		return parseFloat(stdout.trim());
	}
	const auto = path.join(dir, 'auto.mp4');
	await memeVideoPy(['--input', photo, '--format', 'square',
		'--duration', '2', '--top', 'TEXTO SOBRE FONDO CLARO', '--out', auto]);
	const off = path.join(dir, 'off.mp4');
	await memeVideoPy(['--input', photo, '--format', 'square',
		'--duration', '2', '--top', 'TEXTO SOBRE FONDO CLARO',
		'--text-bg', 'off', '--out', off]);
	const mAuto = await bandMean(auto);
	const mOff = await bandMean(off);
	assert.ok(mAuto < mOff - 20,
		`la píldora no oscureció el fondo (auto ${mAuto} vs off ${mOff})`);
	rmSync(dir, { recursive: true, force: true });
});
