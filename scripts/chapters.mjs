#!/usr/bin/env node
/**
 * Genera los capítulos para YouTube de un video largo.
 *
 * Fuentes (en orden): src/timeline.json (inicios reales por capítulo,
 * construidos por build-timeline.mjs a partir de la VO) o, si no hay
 * timeline, vo-chapters/vo-full-lines.json (primera línea de cada
 * capítulo). Los títulos salen de chapters.json.
 *
 * Salidas:
 *   out/<id>-chapters.txt   formato YouTube, para pegar en la descripción
 *   out/<id>-chapters.json  mismo contenido estructurado (+ descartados)
 *
 * Reglas de YouTube que se imponen aquí (si no se cumplen, YouTube
 * ignora los capítulos en silencio):
 *   - el primer capítulo empieza en 0:00;
 *   - al menos 10 s entre capítulos (se fusionan los que violan la
 *     regla, conservando el título del capítulo anterior);
 *   - al menos 3 capítulos tras fusionar (si no, error claro).
 *
 * Uso:
 *   node scripts/chapters.mjs <proyecto>
 *   node scripts/chapters.mjs modern-wisdom-aprende --min-gap 10
 */
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadProject, parseArgs} from './lib.mjs';

export function formatStamp(totalSeconds) {
	const s = Math.max(0, Math.floor(totalSeconds));
	const h = Math.floor(s / 3600);
	const m = Math.floor((s % 3600) / 60);
	const sec = s % 60;
	const mmss = `${m}:${String(sec).padStart(2, '0')}`;
	return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : mmss;
}

/**
 * Fusiona capítulos que violan la separación mínima. Devuelve
 * {kept, dropped}: kept son los capítulos finales (start_s, title),
 * dropped los fusionados con el motivo.
 */
export function enforceMinGap(chapters, minGapS) {
	const kept = [];
	const dropped = [];
	for (const c of chapters) {
		const prev = kept[kept.length - 1];
		if (prev && c.start_s - prev.start_s < minGapS) {
			dropped.push({
				...c,
				reason: `a ${Math.round(c.start_s - prev.start_s)} s del capítulo anterior (mínimo ${minGapS} s)`,
			});
			continue;
		}
		kept.push(c);
	}
	return {kept, dropped};
}

export function buildChapters({titles, starts, minGapS = 10}) {
	if (titles.length !== starts.length) {
		throw Error(
			`capítulos: ${titles.length} títulos ≠ ${starts.length} inicios`,
		);
	}
	const raw = titles.map((title, i) => ({number: i, start_s: starts[i], title}));
	// El primero siempre en 0:00 (regla de YouTube); si el primer inicio
	// real no es 0 (p. ej. la VO arranca con una pausa), se ancla a 0.
	if (raw.length && raw[0].start_s !== 0) raw[0] = {...raw[0], start_s: 0};
	const {kept, dropped} = enforceMinGap(raw, minGapS);
	if (kept.length < 3) {
		throw Error(
			`YouTube exige al menos 3 capítulos; quedaron ${kept.length} tras fusionar (original: ${raw.length})`,
		);
	}
	return {
		chapters: kept.map((c) => ({
			number: c.number,
			start_s: Math.round(c.start_s * 100) / 100,
			start: formatStamp(c.start_s),
			title: c.title,
		})),
		dropped: dropped.map((c) => ({
			number: c.number,
			start_s: Math.round(c.start_s * 100) / 100,
			title: c.title,
			reason: c.reason,
		})),
	};
}

function chapterStartsFromTimeline(home, fps) {
	const tlPath = path.join(home, 'src', 'timeline.json');
	if (!existsSync(tlPath)) return null;
	const tl = JSON.parse(readFileSync(tlPath, 'utf8'));
	if (!Array.isArray(tl.chapters) || !tl.chapters.length) return null;
	return tl.chapters
		.slice()
		.sort((a, b) => a.startFrame - b.startFrame)
		.map((c) => c.startFrame / fps);
}

function chapterStartsFromVoLines(home) {
	const linesPath = path.join(home, 'vo-chapters', 'vo-full-lines.json');
	if (!existsSync(linesPath)) return null;
	const data = JSON.parse(readFileSync(linesPath, 'utf8'));
	const lines = Array.isArray(data) ? data : data.lines;
	if (!Array.isArray(lines) || !lines.length) return null;
	const starts = [];
	for (const line of lines) {
		const n = line.chapter;
		if (typeof n !== 'number') continue;
		if (starts[n] === undefined || line.start < starts[n]) starts[n] = line.start;
	}
	// Capítulos densos 0..N sin huecos; si hay huecos, no es fiable.
	for (let i = 0; i < starts.length; i++) {
		if (starts[i] === undefined) return null;
	}
	return starts;
}

export function main(argv = process.argv.slice(2)) {
	const {pos, opts} = parseArgs(argv);
	const projectId = pos[0];
	if (!projectId) {
		throw Error('Uso: node scripts/chapters.mjs <proyecto> [--min-gap 10]');
	}
	const {home, data} = loadProject(projectId);
	const minGapS = Number(opts['min-gap'] ?? 10);
	const metaPath = path.join(home, 'chapters.json');
	if (!existsSync(metaPath)) {
		throw Error(`Falta ${path.relative(process.cwd(), metaPath)} (títulos de capítulo)`);
	}
	const meta = JSON.parse(readFileSync(metaPath, 'utf8'));
	const chaptersMeta = Array.isArray(meta) ? meta : meta.chapters;
	if (!Array.isArray(chaptersMeta) || !chaptersMeta.length) {
		throw Error('chapters.json no trae capítulos');
	}
	const titles = chaptersMeta
		.slice()
		.sort((a, b) => (a.number ?? 0) - (b.number ?? 0))
		.map((c) => c.title ?? c.short_title ?? `Capítulo ${c.number ?? ''}`);
	const fps = Number(data.fps ?? 30);
	let starts = chapterStartsFromTimeline(home, fps);
	let source = 'src/timeline.json';
	if (!starts) {
		starts = chapterStartsFromVoLines(home);
		source = 'vo-chapters/vo-full-lines.json';
	}
	if (!starts) {
		throw Error(
			'sin tiempos de capítulo: falta src/timeline.json (paso timeline) y vo-chapters/vo-full-lines.json (paso merge)',
		);
	}
	const result = buildChapters({titles, starts, minGapS});
	const outDir = path.join(home, 'out');
	mkdirSync(outDir, {recursive: true});
	const txtPath = path.join(home, opts['out-txt'] ?? `out/${projectId}-chapters.txt`);
	const jsonPath = path.join(home, opts['out-json'] ?? `out/${projectId}-chapters.json`);
	const txt = result.chapters.map((c) => `${c.start} ${c.title}`).join('\n') + '\n';
	writeFileSync(txtPath, txt);
	writeFileSync(
		jsonPath,
		JSON.stringify(
			{project: projectId, source, min_gap_s: minGapS, ...result},
			null,
			2,
		) + '\n',
	);
	console.log(
		`${projectId}: ${result.chapters.length} capítulos desde ${source} -> ${path.relative(process.cwd(), txtPath)}`,
	);
	for (const d of result.dropped) {
		console.log(`  fusionado «${d.title}» (${d.start_s}s): ${d.reason}`);
	}
	return result;
}

const invoked =
	process.argv[1] &&
	path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invoked) {
	try {
		main();
	} catch (e) {
		console.error(`chapters: ${e.message}`);
		process.exit(1);
	}
}
