// P0-3: tramos incrementales por hash (hub-speed-v5, pieza 2).
// Render real de un proyecto fixture mínimo (30 f, 2 tramos de 15 f) y
// verificación de que --resume salta SOLO los tramos sin cambios:
//   1. Corrida en frío: renderiza los 2 tramos, manifiesto con inputHash v2.
//   2. --resume sin cambios: ambos tramos saltados.
//   3. Archivo NO referenciado en public/: no invalida nada.
//   4. Asset REFERENCIADO modificado: re-render de ambos tramos.
//   5. Caption tocado solo en el 2º tramo: solo ese se re-renderiza.
//   6. Código modificado: re-render de ambos tramos.
// La fixture commiteada (projects/render-hash-test) NUNCA se muta: el
// test trabaja sobre una copia temporal con sufijo PID que borra al final.
import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {
	cpSync,
	existsSync,
	mkdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FIXTURE = 'render-hash-test';
const TMP_ID = `${FIXTURE}-tmp-${process.pid}`;
const TMP_HOME = path.join(ROOT, 'projects', TMP_ID);

// PNG 1x1 negro y rojo (base64): el asset referenciado por la fixture.
// Los PNG no se commitean (.gitignore), así que el test los genera.
const DOT_BLACK =
	'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const DOT_RED =
	'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

function render(args) {
	const r = spawnSync(
		process.execPath,
		[
			'scripts/render-chunks.mjs',
			TMP_ID,
			'--frames',
			'0-29',
			'--chunk',
			'15',
			'--concurrency',
			'1',
			'--scale',
			'0.5',
			'--x264-preset',
			'veryfast',
			'--crf',
			'23',
			...args,
		],
		{cwd: ROOT, encoding: 'utf8', timeout: 600000},
	);
	const out = `${r.stdout ?? ''}\n${r.stderr ?? ''}`;
	assert.equal(
		r.status,
		0,
		`render falló (código ${r.status}):\n${out.slice(-3000)}`,
	);
	return out;
}

function count(out, re) {
	return (out.match(re) || []).length;
}

function manifest() {
	return JSON.parse(
		readFileSync(path.join(TMP_HOME, 'out/chunks/manifest.json'), 'utf8'),
	);
}

test(
	'P0-3: --resume salta solo los tramos sin cambios (hash por tramo)',
	{timeout: 900000},
	async (t) => {
		if (
			!existsSync(
				path.join(ROOT, 'node_modules/@remotion/cli/remotion-cli.js'),
			)
		) {
			t.skip('falta node_modules/@remotion/cli en el entorno');
			return;
		}
		for (const bin of ['ffmpeg', 'ffprobe']) {
			const r = spawnSync('which', [bin]);
			if (r.status !== 0) {
				t.skip(`falta ${bin} en el entorno`);
				return;
			}
		}
		try {
			// Puppeteer (Remotion) hace mkdtemp bajo TMPDIR: si el
			// directorio no existe, el render muere con ENOENT.
			mkdirSync(process.env.TMPDIR || os.tmpdir(), {recursive: true});
			cpSync(path.join(ROOT, 'projects', FIXTURE), TMP_HOME, {
				recursive: true,
			});
			const pjPath = path.join(TMP_HOME, 'project.json');
			const pj = JSON.parse(readFileSync(pjPath, 'utf8'));
			pj.id = TMP_ID;
			writeFileSync(pjPath, `${JSON.stringify(pj, null, 2)}\n`);
			const stPath = path.join(TMP_HOME, 'STATE.json');
			const st = JSON.parse(readFileSync(stPath, 'utf8'));
			st.id = TMP_ID;
			writeFileSync(stPath, `${JSON.stringify(st, null, 2)}\n`);
			mkdirSync(path.join(TMP_HOME, 'public/img'), {recursive: true});
			writeFileSync(
				path.join(TMP_HOME, 'public/img/dot.png'),
				Buffer.from(DOT_BLACK, 'base64'),
			);

			// 1) Corrida en frío: los 2 tramos se renderizan y el
			// manifiesto guarda un inputHash por tramo (esquema v2).
			const out1 = render([]);
			assert.equal(
				count(out1, /fotogramas \d+-\d+ → chunk/g),
				2,
				'corrida en frío renderiza 2 tramos',
			);
			const m1 = manifest();
			assert.equal(m1.inputHashVersion, 2);
			assert.equal(m1.chunks.length, 2);
			assert.ok(
				m1.chunks.every((c) => /^[a-f0-9]{64}$/.test(c.inputHash)),
				'cada tramo guarda su inputHash',
			);

			// 2) --resume sin cambios: ambos saltados, ningún re-render.
			const out2 = render(['--resume']);
			assert.equal(
				count(out2, /sin cambios \(15 f, hash [0-9a-f]+\) — salto/g),
				2,
				'sin cambios: 2 tramos saltados',
			);
			assert.equal(count(out2, /re-render/g), 0);

			// 3) Archivo NO referenciado en public/: no invalida nada.
			writeFileSync(
				path.join(TMP_HOME, 'public/img/unused.png'),
				Buffer.from(DOT_RED, 'base64'),
			);
			const out3 = render(['--resume']);
			assert.equal(
				count(out3, /— salto/g),
				2,
				'asset no referenciado no invalida tramos',
			);

			// 4) Asset REFERENCIADO modificado: ambos tramos se re-renderizan.
			writeFileSync(
				path.join(TMP_HOME, 'public/img/dot.png'),
				Buffer.from(DOT_RED, 'base64'),
			);
			const out4 = render(['--resume']);
			assert.equal(
				count(
					out4,
					/entradas cambiadas \(hash [0-9a-f]+ → [0-9a-f]+\) — re-render/g,
				),
				2,
				'asset referenciado invalida ambos tramos',
			);
			const m4 = manifest();
			assert.notEqual(
				m4.chunks[0].inputHash,
				m1.chunks[0].inputHash,
				'el hash del tramo 1 cambió tras tocar el asset',
			);

			// 5) Caption tocado solo en el 2º tramo: solo ese se re-renderiza.
			const capsPath = path.join(TMP_HOME, 'src/captions.ts');
			const caps = readFileSync(capsPath, 'utf8');
			assert.ok(caps.includes('"DOS"'), 'la fixture trae la palabra DOS');
			writeFileSync(capsPath, caps.replace('"DOS"', '"TRES"'));
			const out5 = render(['--resume']);
			assert.match(
				out5,
				/\[tramo 1\] chunk_01\.\w+ sin cambios/,
				'tramo 1 intacto tras tocar caption del tramo 2',
			);
			assert.match(
				out5,
				/\[tramo 2\] chunk_02\.\w+ entradas cambiadas/,
				'tramo 2 re-renderizado',
			);
			const m5 = manifest();
			assert.equal(
				m5.chunks[0].inputHash,
				m4.chunks[0].inputHash,
				'hash del tramo 1 sin cambios',
			);
			assert.notEqual(
				m5.chunks[1].inputHash,
				m4.chunks[1].inputHash,
				'hash del tramo 2 cambió',
			);

			// 6) Código modificado: ambos tramos se re-renderizan.
			const videoPath = path.join(TMP_HOME, 'src/Video.tsx');
			const video = readFileSync(videoPath, 'utf8');
			assert.ok(video.includes('#0A0A0A'), 'la fixture trae el fondo #0A0A0A');
			writeFileSync(videoPath, video.replace('#0A0A0A', '#101010'));
			const out6 = render(['--resume']);
			assert.equal(
				count(out6, /entradas cambiadas/g),
				2,
				'cambio de código invalida ambos tramos',
			);
		} finally {
			rmSync(TMP_HOME, {recursive: true, force: true});
		}
	},
);
