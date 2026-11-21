import {test} from 'node:test';
import assert from 'node:assert/strict';
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {projectPath} from '../scripts/lib.mjs';
import {validateProject} from '../scripts/validate.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const INDEX = path.join(ROOT, 'PROJECTS.json');

const GUION = `# Guion de prueba
Por primera vez en treinta años.

El Caribe dejó de votar unido.

Y la historia se puso en fila.
`;

// WAV válido de silencio (16 kHz, mono, 16 bit): ffprobe debe leer
// su duración. Generado en el test, sin ffmpeg ni audio real.
function writeSilentWav(file, seconds, sampleRate = 16000) {
	const samples = Math.floor(seconds * sampleRate);
	const data = Buffer.alloc(44 + samples * 2);
	data.write('RIFF', 0);
	data.writeUInt32LE(36 + samples * 2, 4);
	data.write('WAVE', 8);
	data.write('fmt ', 12);
	data.writeUInt32LE(16, 16);
	data.writeUInt16LE(1, 20); // PCM
	data.writeUInt16LE(1, 22); // mono
	data.writeUInt32LE(sampleRate, 24);
	data.writeUInt32LE(sampleRate * 2, 28);
	data.writeUInt16LE(2, 32);
	data.writeUInt16LE(16, 34);
	data.write('data', 36);
	data.writeUInt32LE(samples * 2, 40);
	writeFileSync(file, data);
}

function runNewReel(...args) {
	return spawnSync(
		process.execPath,
		[path.join(ROOT, 'scripts', 'new-reel.mjs'), ...args],
		{cwd: ROOT, encoding: 'utf8', timeout: 60000},
	);
}

function withFixtures(fn) {
	const dir = mkdtempSync(path.join(tmpdir(), 'hub-new-reel-'));
	const script = path.join(dir, 'guion.md');
	const vo = path.join(dir, 'vo.wav');
	writeFileSync(script, GUION);
	writeSilentWav(vo, 6);
	try {
		return fn({dir, script, vo});
	} finally {
		rmSync(dir, {recursive: true, force: true});
	}
}

function withProject(id, fn) {
	const home = projectPath(id);
	const originalIndex = readFileSync(INDEX, 'utf8');
	rmSync(home, {recursive: true, force: true});
	try {
		return fn(home);
	} finally {
		rmSync(home, {recursive: true, force: true});
		writeFileSync(INDEX, originalIndex);
	}
}

test('new-reel: esqueleto completo con tiempos estimados', () => {
	withFixtures(({script, vo}) => {
		withProject('new-reel-test-est', (home) => {
			const r = runNewReel(
				'new-reel-test-est',
				'--title',
				'Reel de prueba',
				'--script',
				script,
				'--vo',
				vo,
				'--platform',
				'tiktok',
				'--karaoke',
				'pill',
				'--handle',
				'@prueba',
				'--timings',
				'estimate',
			);
			assert.equal(r.status, 0, r.stderr);
			// Proyecto válido según el validador del hub.
			const v = validateProject('new-reel-test-est');
			// 6 s de VO (180 f) + 75 f de cierre = 255 f.
			assert.equal(v.frames, 255);
			assert.equal(v.fps, 30);
			const pj = JSON.parse(
				readFileSync(path.join(home, 'project.json'), 'utf8'),
			);
			assert.equal(pj.platform, 'tiktok');
			assert.equal(pj.audioRequired, true);
			assert.equal(pj.voFile, 'audio/vo.wav');
			// VO copiada y guion guardado.
			assert.ok(existsSync(path.join(home, 'public', 'audio', 'vo.wav')));
			assert.ok(existsSync(path.join(home, 'GUION.md')));
			// Captions estimados y marcados.
			const caps = readFileSync(
				path.join(home, 'src', 'captions.ts'),
				'utf8',
			);
			assert.match(caps, /ESTIMADO/);
			assert.match(caps, /export const CAPTIONS: CapSegment\[\]/);
			assert.match(caps, /"t":"POR"/);
			// 3 escenas + CLOSING en el manifiesto de pre-vuelo.
			const manifest = JSON.parse(
				readFileSync(path.join(home, 'preflight-scenes.json'), 'utf8'),
			);
			assert.equal(manifest.project, 'new-reel-test-est');
			assert.deepEqual(
				manifest.scenes.map((s) => s.name),
				['S1', 'S2', 'S3', 'CLOSING'],
			);
			assert.deepEqual(manifest.logo_skip_scenes, ['CLOSING']);
			assert.equal(manifest.scenes[3].start, 180);
			assert.equal(manifest.scenes[3].end, 254);
			// Plan de edición: 3 escenas con sus líneas.
			const plan = JSON.parse(
				readFileSync(path.join(home, 'research', 'edit-plan.json'), 'utf8'),
			);
			assert.equal(plan.scenes.length, 3);
			assert.equal(
				plan.scenes[0].line,
				'Por primera vez en treinta años.',
			);
			assert.equal(plan.durationInFrames, 255);
			// Composición: karaoke pill, cierre, guía de zonas, gancho.
			const video = readFileSync(
				path.join(home, 'src', 'Video.tsx'),
				'utf8',
			);
			assert.match(video, /BottomKaraoke/);
			assert.match(video, /variant="pill"/);
			assert.match(video, /ClosingCard/);
			assert.match(video, /SafeZoneOverlay/);
			assert.match(video, /hookVariant/);
			assert.match(video, /getPlatformPreset\(PLATFORM\)/);
			assert.match(video, /audio\/vo\.wav/);
			// Runbook con los pasos exactos del proyecto.
			const runbook = readFileSync(
				path.join(home, 'RUNBOOK.md'),
				'utf8',
			);
			assert.match(runbook, /new-reel-test-est/);
			assert.match(runbook, /visual-preflight\.py --stills/);
			assert.match(runbook, /render-chunks\.mjs .*--draft/);
			assert.match(runbook, /ESTIMADOS/);
		});
	});
});

test('new-reel: --captions usa los tiempos dados (sin Whisper)', () => {
	withFixtures(({dir, script, vo}) => {
		const capsJson = path.join(dir, 'caps.json');
		const segments = [
			{
				id: 1,
				start: 0.5,
				frames: 90,
				chunks: [
					{
						start: 0.5,
						end: 2.0,
						words: [
							{t: 'POR', s: 0.5, e: 1.0, kw: false},
							{t: 'PRIMERA', s: 1.0, e: 2.0, kw: true},
						],
					},
				],
			},
			{
				id: 2,
				start: 3.5,
				frames: 75,
				chunks: [
					{
						start: 3.5,
						end: 5.0,
						words: [{t: 'CARIBE', s: 3.5, e: 5.0, kw: true}],
					},
				],
			},
		];
		writeFileSync(capsJson, JSON.stringify(segments));
		withProject('new-reel-test-caps', (home) => {
			const r = runNewReel(
				'new-reel-test-caps',
				'--title',
				'Reel con captions',
				'--script',
				script,
				'--vo',
				vo,
				'--captions',
				capsJson,
			);
			assert.equal(r.status, 0, r.stderr);
			const caps = readFileSync(
				path.join(home, 'src', 'captions.ts'),
				'utf8',
			);
			assert.doesNotMatch(caps, /ESTIMADO/);
			assert.match(caps, /"t":"PRIMERA"/);
			assert.match(caps, /"s":1/);
			// Las escenas usan los inicios de los segmentos dados.
			const manifest = JSON.parse(
				readFileSync(path.join(home, 'preflight-scenes.json'), 'utf8'),
			);
			assert.equal(manifest.scenes[0].start, 15); // 0,5 s * 30
			assert.equal(manifest.scenes[1].start, 105); // 3,5 s * 30
		});
	});
});

test('new-reel: nunca sobrescribe, exige slug válido y archivos reales', () => {
	withFixtures(({script, vo}) => {
		withProject('new-reel-test-dup', () => {
			const ok = runNewReel(
				'new-reel-test-dup',
				'--title',
				'Uno',
				'--script',
				script,
				'--vo',
				vo,
				'--timings',
				'estimate',
			);
			assert.equal(ok.status, 0, ok.stderr);
			const dup = runNewReel(
				'new-reel-test-dup',
				'--title',
				'Dos',
				'--script',
				script,
				'--vo',
				vo,
				'--timings',
				'estimate',
			);
			assert.notEqual(dup.status, 0);
			assert.match(dup.stderr, /ya existe/);
		});
		const badSlug = runNewReel(
			'Slug_Malo',
			'--title',
			'x',
			'--script',
			script,
			'--vo',
			vo,
		);
		assert.notEqual(badSlug.status, 0);
		const noVo = runNewReel(
			'new-reel-test-novo',
			'--title',
			'x',
			'--script',
			script,
			'--vo',
			'/tmp/no-existe-vo.wav',
		);
		assert.notEqual(noVo.status, 0);
		assert.match(noVo.stderr, /--vo obligatorio/);
		const badPlatform = runNewReel(
			'new-reel-test-plat',
			'--title',
			'x',
			'--script',
			script,
			'--vo',
			vo,
			'--platform',
			'myspace',
		);
		assert.notEqual(badPlatform.status, 0);
		assert.match(badPlatform.stderr, /--platform debe ser/);
	});
});
