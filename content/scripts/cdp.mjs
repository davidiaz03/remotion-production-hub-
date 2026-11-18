/**
 * Cliente CDP mínimo para chrome-headless-shell (sin dependencias).
 *
 * Por qué CDP y no `--screenshot`: en esta VM el modo CLI
 * (`--screenshot` / `--dump-dom`) se CUELGA incluso con file:// URLs
 * (verificado 17-nov-2026, tres intentos con timeouts de 30-90 s). En
 * cambio, lanzar con `--remote-debugging-port` y pilotar por CDP funciona
 * siempre: es el mismo camino que usa Remotion (@remotion/renderer).
 *
 * Usa fetch + WebSocket globales de Node 22. Localiza el binario de
 * Chromium en este orden:
 *   1. $CHROME_HEADLESS_SHELL
 *   2. <repo>/node_modules/.remotion/chrome-headless-shell/... (checkout con
 *      node_modules instalado, p. ej. $HUB_REPO o el checkout principal)
 *   3. ~/workspace/remotion-hub/repo/node_modules/.remotion/...
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { writeFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SHELL_REL = 'node_modules/.remotion/chrome-headless-shell/linux64/chrome-headless-shell-linux64/chrome-headless-shell';

export function findChrome() {
	if (process.env.CHROME_HEADLESS_SHELL && existsSync(process.env.CHROME_HEADLESS_SHELL)) {
		return process.env.CHROME_HEADLESS_SHELL;
	}
	const roots = [
		process.env.HUB_REPO,
		path.resolve(HERE, '..', '..'), // raíz del repo que contiene content/
		path.join(process.env.HOME ?? '', 'workspace', 'remotion-hub', 'repo'),
	];
	for (const root of roots) {
		if (!root) continue;
		const p = path.join(root, SHELL_REL);
		if (existsSync(p)) return p;
	}
	throw new Error(
		'No se encontró chrome-headless-shell. Instala node_modules en el repo ' +
		'(checkout principal) o define $CHROME_HEADLESS_SHELL.',
	);
}

// Subconjunto de los flags que usa @remotion/renderer/open-browser.js.
// Imprescindibles aquí: --no-proxy-server + --proxy-bypass-list=* (el proxy
// del entorno cuelga la resolución) y --disable-dev-shm-usage.
const FLAGS = [
	'--headless', '--no-sandbox', '--no-zygote', '--single-process',
	'--no-proxy-server', '--proxy-bypass-list=*',
	'--disable-gpu', '--disable-dev-shm-usage', '--disable-software-rasterizer',
	'--disable-background-networking', '--disable-sync', '--disable-extensions',
	'--disable-default-apps', '--no-first-run', '--no-default-browser-check',
	'--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader',
	'--force-color-profile=srgb', '--font-render-hinting=none',
	'--hide-scrollbars', '--mute-audio', '--disable-breakpad',
];

export async function launchChrome({ port, userDataDir }) {
	const chrome = spawn(findChrome(), [...FLAGS, `--remote-debugging-port=${port}`, `--user-data-dir=${userDataDir}`], {
		stdio: ['ignore', 'pipe', 'pipe'],
		env: { ...process.env },
	});
	let log = '';
	const onData = (d) => { log += d.toString(); if (log.length > 4000) log = log.slice(-4000); };
	chrome.stdout.on('data', onData);
	chrome.stderr.on('data', onData);
	const deadline = Date.now() + 30000;
	while (Date.now() < deadline) {
		try {
			const r = await fetch(`http://127.0.0.1:${port}/json/version`);
			if (r.ok) return { chrome, log: () => log };
		} catch { /* aún no levantó */ }
		if (chrome.exitCode !== null) break;
		await sleep(400);
	}
	chrome.kill('SIGKILL');
	throw new Error(`Chrome no levantó DevTools en 30 s (puerto ${port}). Log:\n${log.slice(-2000)}`);
}

export class CdpPage {
	constructor(ws) {
		this.ws = ws;
		this.id = 0;
		this.pending = new Map();
		this.loadWaiters = [];
		ws.onmessage = (ev) => {
			const msg = JSON.parse(ev.data);
			if (msg.id && this.pending.has(msg.id)) {
				const { resolve, reject } = this.pending.get(msg.id);
				this.pending.delete(msg.id);
				if (msg.error) reject(new Error(`CDP ${msg.error.message} (código ${msg.error.code})`));
				else resolve(msg.result);
			} else if (msg.method === 'Page.loadEventFired') {
				this.loadWaiters.splice(0).forEach((w) => w());
			}
		};
	}

	send(method, params = {}) {
		return new Promise((resolve, reject) => {
			const mid = ++this.id;
			this.pending.set(mid, { resolve, reject });
			this.ws.send(JSON.stringify({ id: mid, method, params }));
		});
	}

	waitLoad(timeoutMs = 20000) {
		return Promise.race([
			new Promise((res) => this.loadWaiters.push(res)),
			sleep(timeoutMs),
		]);
	}

	async close() {
		this.ws.close();
	}
}

export async function newPage(port, url) {
	const res = await fetch(`http://127.0.0.1:${port}/json/new?${new URLSearchParams({ url })}`, { method: 'PUT' });
	if (!res.ok) throw new Error(`No se pudo crear la pestaña CDP: ${res.status}`);
	const target = await res.json();
	const ws = new WebSocket(target.webSocketDebuggerUrl);
	await new Promise((resolve, reject) => {
		ws.onopen = resolve;
		ws.onerror = () => reject(new Error('No se pudo conectar el WebSocket CDP'));
	});
	return new CdpPage(ws);
}

/**
 * Captura una URL local (file://) a PNG con el tamaño exacto dado.
 * Devuelve la ruta del PNG escrito.
 */
export async function screenshot({ url, width, height, out, waitMs = 600, port = 0 }) {
	const usePort = port || (9200 + Math.floor(Math.random() * 200));
	const userDataDir = `/tmp/content-hub-chrome-${usePort}`;
	const { chrome, log } = await launchChrome({ port: usePort, userDataDir });
	try {
		const page = await newPage(usePort, url);
		try {
			await page.send('Page.enable');
			await page.send('Emulation.setDeviceMetricsOverride', {
				width, height, deviceScaleFactor: 1, mobile: false,
			});
			await page.send('Page.navigate', { url });
			await page.waitLoad();
			await sleep(waitMs); // deja asentar fuentes e imágenes locales
			const shot = await page.send('Page.captureScreenshot', { format: 'png' });
			writeFileSync(out, Buffer.from(shot.data, 'base64'));
			return out;
		} finally {
			await page.close();
		}
	} catch (err) {
		err.message += `\nLog de Chrome:\n${log().slice(-1500)}`;
		throw err;
	} finally {
		chrome.kill('SIGKILL');
	}
}
