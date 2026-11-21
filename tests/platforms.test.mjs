import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const esbuild = path.join(root, 'node_modules', '.bin', 'esbuild');

// Igual que tests/captions.test.mjs: compila el módulo puro con
// esbuild y devuelve sus exports. El bundle se borra al final.
function loadPlatforms() {
	const dir = mkdtempSync(path.join(tmpdir(), 'platforms-test-'));
	const entry = path.join(dir, 'entry.ts');
	const out = path.join(dir, 'bundle.mjs');
	writeFileSync(
		entry,
		`export * from ${JSON.stringify(path.join(root, 'shared/platforms.ts'))};\n`,
	);
	const r = spawnSync(
		esbuild,
		[entry, '--bundle', '--platform=node', '--format=esm', `--outfile=${out}`, '--log-level=error'],
		{encoding: 'utf8'},
	);
	assert.equal(r.status, 0, r.stderr);
	return import(out).finally(() => rmSync(dir, {recursive: true, force: true}));
}

test('presets: 4 plataformas, todas 1080x1920 9:16', async () => {
	const p = await loadPlatforms();
	assert.deepEqual(p.platformIds().sort(), [
		'facebook-reels',
		'instagram-reels',
		'tiktok',
		'youtube-shorts',
	]);
	for (const id of p.platformIds()) {
		const preset = p.PLATFORM_PRESETS[id];
		assert.equal(preset.width, 1080);
		assert.equal(preset.height, 1920);
		assert.ok(preset.label.length > 0);
		assert.ok(preset.notes.length > 0);
	}
});

test('presets: zonas seguras dentro del fotograma y con área positiva', async () => {
	const p = await loadPlatforms();
	for (const id of p.platformIds()) {
		const preset = p.PLATFORM_PRESETS[id];
		for (const rect of [
			p.safeZoneRect(preset),
			p.organicZoneRect(preset),
		]) {
			assert.ok(rect.x >= 0 && rect.y >= 0);
			assert.ok(rect.w > 0 && rect.h > 0);
			assert.ok(rect.x + rect.w <= 1080);
			assert.ok(rect.y + rect.h <= 1920);
		}
		// La zona orgánica es más permisiva que la de anuncios: la
		// contiene (o casi: el rail derecho orgánico es más ancho).
		const ads = p.safeZoneRect(preset);
		const org = p.organicZoneRect(preset);
		assert.ok(org.y <= ads.y, `${id}: orgánica empieza más arriba`);
		assert.ok(
			org.y + org.h >= ads.y + ads.h,
			`${id}: orgánica termina más abajo`,
		);
	}
});

test('presets: valores publicados verificables (nov-2026)', async () => {
	const p = await loadPlatforms();
	// Meta Ads Guide: 14% arriba, 35% abajo, 6% lados (1080x1920).
	const ig = p.PLATFORM_PRESETS['instagram-reels'];
	assert.deepEqual(ig.safeZone, {top: 269, bottom: 672, left: 65, right: 65});
	assert.deepEqual(
		p.PLATFORM_PRESETS['facebook-reels'].safeZone,
		ig.safeZone,
	);
	// TikTok In-Feed template: 240/660/120/120.
	assert.deepEqual(p.PLATFORM_PRESETS.tiktok.safeZone, {
		top: 240,
		bottom: 660,
		left: 120,
		right: 120,
	});
	// Google Ads Help (vertical YouTube): 288/672/48/192.
	assert.deepEqual(p.PLATFORM_PRESETS['youtube-shorts'].safeZone, {
		top: 288,
		bottom: 672,
		left: 48,
		right: 192,
	});
	// Duraciones máximas en la app.
	assert.equal(ig.maxDurationSec, 1200);
	assert.equal(ig.reachCutoffSec, 180);
	assert.equal(p.PLATFORM_PRESETS.tiktok.maxDurationSec, 3600);
	assert.equal(p.PLATFORM_PRESETS['youtube-shorts'].maxDurationSec, 180);
	assert.equal(p.PLATFORM_PRESETS['facebook-reels'].maxDurationSec, null);
});

test('presets: karaoke de la casa + despeje estricto por plataforma', async () => {
	const p = await loadPlatforms();
	for (const id of p.platformIds()) {
		const c = p.PLATFORM_PRESETS[id].caption;
		assert.equal(c.size, 60);
		assert.equal(c.longSize, 52);
		assert.equal(c.bottom, 235);
		// El despeje estricto supera la UI orgánica inferior.
		assert.ok(
			c.bottomStrict > p.PLATFORM_PRESETS[id].organicZone.bottom,
			`${id}: bottomStrict despeja la UI orgánica`,
		);
	}
});

test('getPlatformPreset: id desconocido o ausente devuelve el de la casa', async () => {
	const p = await loadPlatforms();
	assert.equal(p.getPlatformPreset('tiktok').id, 'tiktok');
	assert.equal(p.getPlatformPreset('no-existe').id, 'instagram-reels');
	assert.equal(p.getPlatformPreset().id, 'instagram-reels');
	assert.equal(p.getPlatformPreset(null).id, 'instagram-reels');
});

test('rectInSafeZone: geometría declarada de texto crítico', async () => {
	const p = await loadPlatforms();
	const ig = p.PLATFORM_PRESETS['instagram-reels'];
	// Rectángulo centrado, dentro de la zona segura.
	assert.equal(
		p.rectInSafeZone(ig, {x: 100, y: 300, w: 400, h: 200}),
		true,
	);
	// Pegado al borde superior (bajo la barra de la app): fuera.
	assert.equal(
		p.rectInSafeZone(ig, {x: 100, y: 100, w: 400, h: 200}),
		false,
	);
	// En la franja inferior de la UI: fuera.
	assert.equal(
		p.rectInSafeZone(ig, {x: 100, y: 1300, w: 400, h: 200}),
		false,
	);
});
