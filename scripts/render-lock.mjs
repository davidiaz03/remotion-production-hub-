/**
 * Candado de render compartido con propiedad por PID (versión Node de
 * scripts/render-lock.sh; misma semántica, mismo archivo por defecto).
 *
 * REGLA (21-nov-2026, incidente V6): solo el proceso que creó el
 * candado puede borrarlo. Al adquirir se escribe el PID en
 * $LOCK/pid; al liberar solo se borra si el PID coincide con el
 * propio. Un candado cuyo PID ya no existe (el poseedor murió sin
 * liberar) se considera rancio y el siguiente adquiriente lo rompe.
 * Sin archivo PID (candados viejos), rancio por edad (>7200 s).
 * Nunca se rompe el candado de un proceso vivo.
 *
 * Uso:
 *   import {acquireRenderLock} from './render-lock.mjs';
 *   const lock = await acquireRenderLock(); // espera siempre (timeout 0)
 *   try { ...trabajo pesado... } finally { lock.release(); }
 */
import {existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync} from 'node:fs';
import path from 'node:path';

export const DEFAULT_LOCK_PATH = '/tmp/hub-speed-v5-render.lock';
export const STALE_S = 7200;
const POLL_MS = 5000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function pidAlive(pid) {
	try {
		process.kill(pid, 0);
		return true;
	} catch {
		return false;
	}
}

function lockAgeS(lockPath) {
	try {
		return (Date.now() - statSync(lockPath).mtimeMs) / 1000;
	} catch {
		return Infinity;
	}
}

/**
 * Intenta romper un candado rancio. Devuelve true si lo rompió (o ya
 * no existía) y el llamante debe reintentar adquirir.
 */
function breakIfStale(lockPath) {
	const pidFile = path.join(lockPath, 'pid');
	let owner = null;
	try {
		owner = Number.parseInt(readFileSync(pidFile, 'utf8').trim(), 10);
	} catch {
		owner = null;
	}
	if (owner !== null && !Number.isNaN(owner)) {
		if (pidAlive(owner)) return false; // dueño vivo: no tocar
	} else if (lockAgeS(lockPath) <= STALE_S) {
		return false; // sin PID y reciente: no tocar
	}
	try {
		rmSync(lockPath, {recursive: true, force: true});
		return true;
	} catch {
		return false;
	}
}

export async function acquireRenderLock(lockPath = DEFAULT_LOCK_PATH, timeoutMs = 0) {
	const started = Date.now();
	for (;;) {
		try {
			mkdirSync(lockPath);
			writeFileSync(path.join(lockPath, 'pid'), String(process.pid));
			let held = true;
			return {
				path: lockPath,
				held: () => held,
				release() {
					if (!held) return false;
					held = false;
					// Solo borrar si el PID sigue siendo el nuestro.
					try {
						const owner = Number.parseInt(
							readFileSync(path.join(lockPath, 'pid'), 'utf8').trim(),
							10,
						);
						if (owner !== process.pid) return false;
					} catch {
						return false;
					}
					try {
						rmSync(lockPath, {recursive: true, force: true});
						return true;
					} catch {
						return false;
					}
				},
			};
		} catch (e) {
			if (e.code !== 'EEXIST') throw e;
		}
		if (!existsSync(lockPath)) continue; // alguien lo soltó entre medias
		if (breakIfStale(lockPath)) continue; // rancio: reintentar ya
		if (timeoutMs > 0) {
			const remaining = timeoutMs - (Date.now() - started);
			if (remaining <= 0) {
				throw Error(`timeout esperando el candado de render ${lockPath}`);
			}
			await sleep(Math.min(POLL_MS, remaining));
		} else {
			await sleep(POLL_MS);
		}
	}
}
