/**
 * Reanudación de un proyecto en frío.
 *
 * Lee SOLO projects/<id>/STATE.json (y project.json para la duración)
 * y muestra el estado exacto — qué está hecho, qué falta, en qué
 * tramo va el render — y el SIGUIENTE COMANDO CONCRETO para seguir.
 * No necesita más contexto: es lo que ejecuta el agente que retoma
 * un proyecto interrumpido.
 *
 * Uso:
 *   node scripts/resume.mjs <proyecto> [--json]
 *
 * --root <dir> (o REMOTION_HUB_ROOT) sustituye la raíz del repo; solo
 * para pruebas. Solo lectura: nunca modifica STATE.json ni el repo.
 *
 * STATE.json sin pipeline (proyectos viejos, esquema v1 puro): cae
 * al modo legado y muestra fase editorial, pendientes y nextTask.
 * En proyectos CON pipeline, los campos de nivel superior
 * `phase`/`nextTask` son legado editorial (ver state.mjs) y NO se
 * muestran: la fase actual se deriva del pipeline.
 */
import {existsSync, readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {ROOT, parseArgs} from './lib.mjs';
import {PHASES, PHASE_LABELS, currentPhase, hasPipeline, loadState, projectHome} from './state.mjs';

const VENV_PY = '~/workspace/remotion-hub/.venv/bin/python';
const STT_PY = '~/workspace/.stt-env/bin/python';

const STATUS_ICON = {pending: '○', in_progress: '▶', done: '✓', failed: '✗'};

function readProjectMeta(root, slug) {
	try {
		const data = JSON.parse(
			readFileSync(path.join(projectHome(root, slug), 'project.json'), 'utf8'),
		);
		const seconds =
			data.durationInFrames && data.fps
				? Math.round((100 * data.durationInFrames) / data.fps) / 100
				: null;
		return {data, seconds};
	} catch {
		return {data: null, seconds: null};
	}
}

function masterExists(root, slug, qaArtifacts) {
	if (qaArtifacts.some((a) => /-master\.mp4$/.test(a))) return true;
	return existsSync(path.join(projectHome(root, slug), 'out', `${slug}-master.mp4`));
}

/** Decide el siguiente paso a partir del pipeline. Devuelve {phase, description, command}. */
export function nextStep(root, slug, state) {
	const {data: meta, seconds} = readProjectMeta(root, slug);
	const p = state.pipeline.phases;
	const firstOpen = PHASES.find((ph) => p[ph].status !== 'done');
	if (!firstOpen) {
		return {
			phase: null,
			description: 'Proyecto completo: todas las fases en done.',
			command: '',
		};
	}
	const dir = `projects/${slug}`;
	switch (firstOpen) {
		case 'assets':
			return {
				phase: 'assets',
				description:
					'Recopila fotos/video en projects/' + slug + '/public/ (o la carpeta de Drive del encargo) y registra el hito.',
				command: `node scripts/state.mjs ${slug} milestone assets "Assets recopilados" --status done`,
			};
		case 'vo':
			return {
				phase: 'vo',
				description:
					'Genera la VO de previsualización con Kokoro desde el guion (vo.json). La voz definitiva la graba el usuario después.',
				command: `${VENV_PY} scripts/audio/gen-vo-kokoro.py --script ${dir}/vo.json --out ${dir}/public/vo.wav --lines-json ${dir}/vo-lines.json`,
			};
		case 'captions':
			return {
				phase: 'captions',
				description:
					'Alinea faster-whisper con el guion para generar el karaoke (captions.ts + captions.json).',
				command: `${STT_PY} scripts/audio/transcribe-vo.py --vo ${dir}/public/vo.wav --lines-json ${dir}/vo-lines.json --script ${dir}/vo.json --out ${dir}/src/captions.ts --out-json ${dir}/captions.json`,
			};
		case 'mix':
			return {
				phase: 'mix',
				description:
					'Mezcla VO + música (+ SFX) con ducking sidechain a −14,5 LUFS.',
				command: `${VENV_PY} scripts/audio/mix.py --voice ${dir}/public/vo.wav --music ${dir}/public/music.wav --seconds ${seconds ?? '<duración en segundos>'} --out ${dir}/public/mix.wav`,
			};
		case 'render': {
			const c = p.render.chunks;
			if (c.resumeCommand) {
				return {
					phase: 'render',
					description:
						`Render interrumpido en ${c.done}/${c.total} tramos (${c.percent}%). Los tramos verificados se saltan; solo se renderiza lo que falta.`,
					command: c.resumeCommand,
				};
			}
			return {
				phase: 'render',
				description:
					c.done > 0
						? `Render con ${c.done} tramo(s) ya verificados; --resume los salta.`
						: 'Render por tramos (vía por defecto para reels largos).',
				command: `node scripts/render-chunks.mjs ${slug} --chunk ${c.chunkSize || 150}${c.done > 0 ? ' --resume' : ''}`,
			};
		}
		case 'qa': {
			if (!masterExists(root, slug, p.qa.artifacts)) {
				// Concat PCM (.mkv, por defecto desde V4.1) o AAC
				// antiguo (.mp4): el audio PCM no necesita trim,
				// atempo ni boost (--clean-audio).
				const chunksMkv = path.join(
					projectHome(root, slug),
					'out',
					`${slug}-chunks.mkv`,
				);
				const pcm = existsSync(chunksMkv);
				const chunksFile = pcm
					? `${slug}-chunks.mkv`
					: `${slug}-chunks.mp4`;
				return {
					phase: 'qa',
					description:
						'Render terminado pero sin máster: compone máster + ligera desde el concatenado (receta V1.3) y luego pasa el gate de QA.',
					command: `${VENV_PY} scripts/audio/master.py --input ${dir}/out/${chunksFile} --out-master ${dir}/out/${slug}-master.mp4 --out-light ${dir}/out/${slug}-light.mp4${pcm ? ' --clean-audio' : ''}`,
				};
			}
			return {
				phase: 'qa',
				description:
					meta?.audioRequired === false
						? 'Proyecto mudo (audioRequired=false): el gate de QA comprueba video y descarta la sonoridad.'
						: 'Gate de sonoridad + video sobre el máster (falla fuera de [−16,5, −12,0] LUFS, TP > −1 dBTP o silencios fuera de rango).',
				command: `node scripts/qa-media.mjs --project ${slug} --file ${dir}/out/${slug}-master.mp4 --mode full`,
			};
		}
		case 'delivery':
			return {
				phase: 'delivery',
				description:
					'Sube el máster a la carpeta de Drive del proyecto (verifica checksum remoto).',
				command: `node scripts/drive-upload.mjs ${slug} --file ${dir}/out/${slug}-master.mp4`,
			};
		default:
			return {phase: firstOpen, description: '', command: ''};
	}
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
	const {pos, opts} = parseArgs(process.argv.slice(2));
	const slug = pos[0];
	const root = opts.root ? path.resolve(String(opts.root)) : process.env.REMOTION_HUB_ROOT || ROOT;
	if (!slug) throw Error('Use: node scripts/resume.mjs <proyecto> [--json]');
	const state = loadState(root, slug);
	const legacy = !hasPipeline(root, slug);
	const step = legacy
		? {
				phase: state.phase || null,
				description:
					'Proyecto sin pipeline registrado (STATE.json v1 puro): sigue la fase editorial y nextTask.',
				command: '',
			}
		: nextStep(root, slug, state);

	if (opts.json === true || opts.json === 'true') {
		console.log(
			JSON.stringify(
				{
					project: slug,
					title: state.title,
					// En modo pipeline, `phase` es la fase actual del
					// pipeline (no el campo editorial legado, obsoleto).
					phase: legacy ? state.phase : step.phase,
					updatedAt: state.updatedAt,
					legacy,
					phases: legacy ? null : state.pipeline.phases,
					lastMilestones: legacy ? [] : state.pipeline.milestones.slice(-10),
					nextStep: step,
					...(legacy
						? {nextTask: state.nextTask, pending: state.pending, completed: state.completed}
						: {}),
				},
				null,
				2,
			),
		);
		process.exit(0);
	}

	console.log(`RESUME ${slug} — ${state.title}`);
	if (legacy) {
		console.log(`fase editorial: ${state.phase} · actualizado: ${state.updatedAt}`);
	} else {
		const cur = currentPhase(state);
		console.log(
			`fase actual (pipeline): ${cur ? PHASE_LABELS[cur] : 'completo'} · actualizado: ${state.updatedAt}`,
		);
	}
	if (legacy) {
		console.log('⚠ STATE.json sin pipeline (v1 puro). Estado editorial:');
		console.log(`  próxima tarea: ${state.nextTask || '(sin registrar)'}`);
		for (const item of state.pending || []) console.log(`  pendiente: ${item}`);
		for (const item of (state.completed || []).slice(-3)) console.log(`  hecho: ${item}`);
		console.log(
			'Para el guardado por fases, registra el primer hito con: ' +
				`node scripts/state.mjs ${slug} milestone <fase> "<evento>"`,
		);
		process.exit(0);
	}
	console.log('Fases:');
	for (const ph of PHASES) {
		const s = state.pipeline.phases[ph];
		let line = `  ${STATUS_ICON[s.status] || '?'} ${PHASE_LABELS[ph]}: ${s.status}`;
		if (ph === 'render' && s.chunks.total) {
			line += ` — ${s.chunks.done}/${s.chunks.total} tramos, ${s.chunks.framesDone}/${s.chunks.framesTotal} f (${s.chunks.percent}%)`;
			if (s.chunks.completed.length) {
				line += ` · último: ${s.chunks.completed[s.chunks.completed.length - 1]}`;
			}
		}
		if (s.updatedAt) line += ` · ${s.updatedAt}`;
		if (s.note) line += ` · ${s.note}`;
		console.log(line);
		if (s.artifacts.length) console.log(`      artefactos: ${s.artifacts.join(', ')}`);
	}
	const last = state.pipeline.milestones.slice(-5);
	if (last.length) {
		console.log('Últimos hitos:');
		for (const m of last) console.log(`  · ${m.at} [${m.phase}] ${m.event}`);
	}
	console.log('');
	console.log(`SIGUIENTE PASO (${step.phase ?? 'fin'}): ${step.description}`);
	if (step.command) console.log(`COMANDO: ${step.command}`);
	else console.log('Sin comando pendiente.');
}
