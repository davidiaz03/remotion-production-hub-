import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync, mkdirSync, rmSync, writeFileSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {acquireRenderLock} from '../scripts/render-lock.mjs';

// Los tests usan rutas temporales, NUNCA el candado real de render.
const lockPath = (tag) => path.join(os.tmpdir(), `render-lock-test-${process.pid}-${tag}`);

test('render-lock: adquirir y liberar borra el candado', async () => {
	const p = lockPath('basic');
	const lock = await acquireRenderLock(p, 1000);
	assert.equal(existsSync(p), true);
	assert.equal(lock.held(), true);
	assert.equal(lock.release(), true);
	assert.equal(lock.held(), false);
	assert.equal(existsSync(p), false);
	assert.equal(lock.release(), false); // doble liberación: no-op
});

test('render-lock: un segundo adquiriente espera y entra al liberarse', async () => {
	const p = lockPath('wait');
	const first = await acquireRenderLock(p, 1000);
	// Segundo adquiriente en el MISMO proceso: ve el PID vivo (el
	// propio) y espera hasta el timeout.
	await assert.rejects(acquireRenderLock(p, 100), /timeout/);
	first.release();
	const second = await acquireRenderLock(p, 1000);
	assert.equal(second.held(), true);
	second.release();
});

test('render-lock: candado rancio (PID muerto) se rompe', async () => {
	const p = lockPath('stale');
	mkdirSync(p, {recursive: true});
	// PID que no existe: el candado es rancio y se rompe.
	writeFileSync(path.join(p, 'pid'), '999999999');
	const lock = await acquireRenderLock(p, 1000);
	assert.equal(lock.held(), true);
	lock.release();
	assert.equal(existsSync(p), false);
});

test('render-lock: no se rompe el candado de un proceso vivo', async () => {
	const p = lockPath('alive');
	mkdirSync(p, {recursive: true});
	// PID vivo: el proceso padre del test.
	writeFileSync(path.join(p, 'pid'), String(process.ppid));
	await assert.rejects(acquireRenderLock(p, 100), /timeout/);
	// El candado sigue intacto (no lo rompimos).
	assert.equal(existsSync(p), true);
	rmSync(p, {recursive: true, force: true});
});
