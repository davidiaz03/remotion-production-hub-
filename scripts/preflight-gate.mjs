/**
 * Puerta del pre-vuelo visual (hub-v6).
 *
 * La regla de AGENTS.md («ningún reel se renderiza entero sin pasar el
 * pre-vuelo») era solo texto: nada impedía renderizar sin haberlo
 * pasado. Este módulo la cablea en `render-chunks.mjs`: el render
 * exige un informe de pre-vuelo (`out/preflight.json`, escrito por
 * `scripts/visual-preflight.py --out`) que sea:
 *
 * - del MISMO proyecto (y composición, si el informe la declara),
 * - SIN bloqueantes (`blocking_frames === 0` y ningún flag BLOCK),
 * - FRESCO: generado DESPUÉS del último cambio de layout.
 *
 * Frescura por mtime (no por hash): el informe trae `generatedAt`
 * (ISO, UTC) y se compara con la mtime más reciente de las entradas
 * que cambian el LAYOUT:
 *   - src/ (excepto archivos de captions: un cambio de tiempo de
 *     caption no mueve ningún elemento visual; los tramos
 *     incrementales ya re-renderizan lo afectado),
 *   - shared/ (componentes del hub),
 *   - project.json y preflight-scenes.json,
 *   - public/ excepto audios (un audio no cambia ningún píxel).
 * out/ queda fuera (el informe vive ahí; sería circular).
 *
 * Consecuencia honesta: un `git checkout` toca las mtimes de todo y
 * deja el informe caducado (dirección segura: re-correr el pre-vuelo,
 * ~3-4 min, nunca un render a ciegas). Añadir un asset de imagen a
 * public/ también caduca la puerta aunque no esté referenciado: el
 * pre-vuelo es barato y la dirección segura manda.
 *
 * Escape: `--skip-preflight` en render-chunks (queda registrado en el
 * resumeCommand de STATE.json). Usarlo solo para iteración rápida
 * consciente; nunca para un máster.
 */
import {existsSync, readdirSync, readFileSync, statSync} from 'node:fs';
import path from 'node:path';
import {ROOT} from './lib.mjs';

/** Archivos de captions: sus cambios NO caducan el pre-vuelo. */
export const CAPTIONS_FILE_RE = /^captions.*\.tsx?$/i;

/** Extensiones de audio: no afectan a ningún píxel. */
export const AUDIO_EXTS = new Set([
	'.wav',
	'.mp3',
	'.aac',
	'.ogg',
	'.flac',
	'.m4a',
	'.opus',
]);

/** Informe por defecto (relativo al proyecto). */
export const DEFAULT_REPORT = 'out/preflight.json';

export function defaultReportPath(home) {
	return path.join(home, DEFAULT_REPORT);
}

function walkNewest(dir, {skipFile = null} = {}) {
	let newest = null;
	const walk = (d) => {
		let entries;
		try {
			entries = readdirSync(d).sort();
		} catch {
			return;
		}
		for (const name of entries) {
			const p = path.join(d, name);
			let st;
			try {
				st = statSync(p);
			} catch {
				continue;
			}
			if (st.isDirectory()) walk(p);
			else if (st.isFile()) {
				if (skipFile && skipFile(p, name)) continue;
				if (!newest || st.mtimeMs > newest.mtimeMs) {
					newest = {file: p, mtimeMs: st.mtimeMs};
				}
			}
		}
	};
	walk(dir);
	return newest;
}

/**
 * La entrada de layout más reciente del proyecto (o null si no hay
 * ninguna legible). Devuelve {file, mtimeMs}.
 */
export function newestLayoutInput(
	home,
	{sharedDir = path.join(ROOT, 'shared')} = {},
) {
	const candidates = [];
	const src = walkNewest(path.join(home, 'src'), {
		skipFile: (_p, name) => CAPTIONS_FILE_RE.test(name),
	});
	if (src) candidates.push(src);
	const shared = walkNewest(sharedDir);
	if (shared) candidates.push(shared);
	for (const f of ['project.json', 'preflight-scenes.json']) {
		const p = path.join(home, f);
		if (existsSync(p)) {
			candidates.push({file: p, mtimeMs: statSync(p).mtimeMs});
		}
	}
	const pub = walkNewest(path.join(home, 'public'), {
		skipFile: (_p, name) =>
			AUDIO_EXTS.has(path.extname(name).toLowerCase()),
	});
	if (pub) candidates.push(pub);
	if (candidates.length === 0) return null;
	return candidates.reduce((a, b) => (b.mtimeMs > a.mtimeMs ? b : a));
}

function hasBlockingFlag(report) {
	if (typeof report.blocking_frames === 'number') {
		return report.blocking_frames > 0;
	}
	// Informes antiguos sin blocking_frames: buscar flags BLOCK.
	for (const r of report.results || []) {
		for (const f of r.flags || []) {
			if (f.severity === 'BLOCK') return true;
		}
	}
	return false;
}

/**
 * Comprueba la puerta del pre-vuelo.
 *
 * @param {object} args
 * @param {string} args.home - Carpeta del proyecto.
 * @param {string} args.projectId - Id del proyecto.
 * @param {string} [args.compositionId] - Composición a renderizar.
 * @param {string} [args.reportPath] - Informe (defecto: out/preflight.json).
 * @returns {{ok: boolean, reason: string, detail: string, report: object|null,
 *   reportTimeMs: number|null, newestInput: {file: string, mtimeMs: number}|null}}
 *   reason: 'ok' | 'missing' | 'invalid' | 'wrong-project' |
 *   'wrong-composition' | 'blocking' | 'stale'.
 */
export function checkPreflightGate({
	home,
	projectId,
	compositionId,
	reportPath,
	sharedDir,
}) {
	// sharedDir inyectable para tests: sin él, la frescura dependería
	// de las mtimes reales de shared/ y los tests dejarían de ser
	// herméticos (fallaban al editar shared/ después de T_LAYOUT).
	const sharedOpts = sharedDir ? {sharedDir} : {};
	const report = reportPath ?? defaultReportPath(home);
	if (!existsSync(report)) {
		return {
			ok: false,
			reason: 'missing',
			detail: `sin informe de pre-vuelo en ${path.relative(process.cwd(), report) || report} (corre visual-preflight.py --stills --out ${DEFAULT_REPORT})`,
			report: null,
			reportTimeMs: null,
			newestInput: newestLayoutInput(home, sharedOpts),
		};
	}
	let parsed;
	try {
		parsed = JSON.parse(readFileSync(report, 'utf8'));
	} catch (e) {
		return {
			ok: false,
			reason: 'invalid',
			detail: `informe de pre-vuelo ilegible (${report}): ${e.message}`,
			report: null,
			reportTimeMs: null,
			newestInput: newestLayoutInput(home, sharedOpts),
		};
	}
	if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.results)) {
		return {
			ok: false,
			reason: 'invalid',
			detail: `informe de pre-vuelo sin la forma esperada (${report}): falta results[]`,
			report: parsed,
			reportTimeMs: null,
			newestInput: newestLayoutInput(home, sharedOpts),
		};
	}
	if (parsed.project && parsed.project !== projectId) {
		return {
			ok: false,
			reason: 'wrong-project',
			detail: `el informe es del proyecto '${parsed.project}', no de '${projectId}'`,
			report: parsed,
			reportTimeMs: null,
			newestInput: newestLayoutInput(home, sharedOpts),
		};
	}
	if (
		compositionId &&
		parsed.composition &&
		parsed.composition !== compositionId
	) {
		return {
			ok: false,
			reason: 'wrong-composition',
			detail: `el informe es de la composición '${parsed.composition}', no de '${compositionId}'`,
			report: parsed,
			reportTimeMs: null,
			newestInput: newestLayoutInput(home, sharedOpts),
		};
	}
	if (hasBlockingFlag(parsed)) {
		const n = parsed.blocking_frames ?? '?';
		return {
			ok: false,
			reason: 'blocking',
			detail: `el pre-vuelo tiene ${n} fotograma(s) BLOQUEANTE(S): corrige el layout y repite el pre-vuelo`,
			report: parsed,
			reportTimeMs: null,
			newestInput: newestLayoutInput(home, sharedOpts),
		};
	}
	// Frescura: generatedAt (si es válido) manda sobre la mtime del
	// archivo (una copia del informe tendría mtime nueva y mentiría).
	let reportTimeMs = statSync(report).mtimeMs;
	if (typeof parsed.generatedAt === 'string') {
		const t = Date.parse(parsed.generatedAt);
		if (!Number.isNaN(t)) reportTimeMs = t;
	}
	const newest = newestLayoutInput(home, sharedOpts);
	if (newest && reportTimeMs <= newest.mtimeMs) {
		return {
			ok: false,
			reason: 'stale',
			detail:
				`informe caducado: ${path.relative(home, newest.file)} cambió después del pre-vuelo ` +
				`(${new Date(newest.mtimeMs).toISOString()} > ${new Date(reportTimeMs).toISOString()})`,
			report: parsed,
			reportTimeMs,
			newestInput: newest,
		};
	}
	const warnings = (parsed.flagged_frames ?? 0) - (parsed.blocking_frames ?? 0);
	return {
		ok: true,
		reason: 'ok',
		detail:
			`pre-vuelo PASS (${parsed.frames ?? '?'} fotogramas, ` +
			`${parsed.scenes ?? '?'} escenas` +
			(warnings > 0 ? `, ${warnings} aviso(s) no bloqueante(s)` : '') +
			`, generado ${new Date(reportTimeMs).toISOString()})`,
		report: parsed,
		reportTimeMs,
		newestInput: newest,
	};
}
