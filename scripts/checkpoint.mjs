/**
 * Checkpoint automático de un proyecto (guardado en Git).
 *
 * Tras cada fase del pipeline, guarda el trabajo del proyecto en un
 * commit WIP con mensaje claro y, si la rama tiene upstream, lo
 * empuja. El commit local es lo que importa: si no hay upstream o el
 * push falla (red, remoto caído), lo dice y sigue con código 0.
 *
 * Uso:
 *   node scripts/checkpoint.mjs <proyecto> --phase <fase> [--note "..."]
 *     [--include <ruta>] [--no-push]
 *
 * - Solo en ramas work/* (nunca main). Solo añade archivos del
 *   proyecto (projects/<id>/, donde vive STATE.json); --include añade
 *   rutas extra (p. ej. un módulo compartido tocado en la fase).
 * - Sin cambios que guardar, informa y sale con 0.
 * - Reintenta ante index.lock (otros agentes pueden estar haciendo
 *   commit en paralelo en la misma rama).
 * - Registra el checkpoint como hito en STATE.json antes de hacer
 *   commit, para que el commit incluya ese registro.
 *
 * Cuándo se dispara: tras cada fase (assets, VO, captions, mezcla,
 * render, QA, entrega) y siempre antes de dejar un proyecto a medias.
 */
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {ROOT, parseArgs, projectPath} from './lib.mjs';
import {recordMilestone} from './state.mjs';

function git(root, args, {allowFail = false} = {}) {
	for (let attempt = 1; attempt <= 5; attempt++) {
		const r = spawnSync('git', args, {cwd: root, encoding: 'utf8'});
		if (r.error) throw r.error;
		if (r.status === 0) return r.stdout.trim();
		const locked = (r.stderr || '').includes('index.lock');
		if (locked && attempt < 5) {
			// Otro proceso de git en curso: esperar y reintentar.
			Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 2000);
			continue;
		}
		if (allowFail) return null;
		throw Error(`git ${args.join(' ')} falló: ${(r.stderr || r.stdout || '').trim()}`);
	}
	throw Error('git bloqueado por index.lock tras 5 intentos');
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
	const {pos, opts} = parseArgs(process.argv.slice(2));
	const projectId = pos[0];
	const phase = opts.phase ? String(opts.phase) : '';
	const root = opts.root ? path.resolve(String(opts.root)) : process.env.REMOTION_HUB_ROOT || ROOT;
	if (!projectId || !phase) {
		throw Error('Use: node scripts/checkpoint.mjs <proyecto> --phase <fase> [--note "..."]');
	}
	// Solo ramas de trabajo: un checkpoint nunca va a main.
	const branch = git(root, ['branch', '--show-current']);
	if (!branch.startsWith('work/')) {
		throw Error(`checkpoint solo en ramas work/* (rama actual: ${branch || '(detached)'})`);
	}
	projectPath(projectId); // valida el id (solo construye la ruta)
	const extra = opts.include ? String(opts.include).split(',').map((s) => s.trim()).filter(Boolean) : [];
	for (const inc of extra) {
		if (inc.startsWith('/') || inc.includes('..')) throw Error(`Ruta --include no segura: ${inc}`);
	}
	// Sin cambios no hay nada que guardar: se comprueba ANTES de
	// registrar el hito, porque el hito mismo modifica STATE.json y
	// un checkpoint sin cambios sería un commit vacío con ruido.
	const dirty = git(root, ['status', '--porcelain', '--', `projects/${projectId}`, ...extra]);
	if (!dirty) {
		console.log(`CHECKPOINT_OK ${projectId} sin cambios que guardar (fase ${phase})`);
		process.exit(0);
	}
	const stamp = new Date().toISOString();
	try {
		recordMilestone(root, projectId, phase, `checkpoint ${phase} ${stamp}`, {
			note: opts.note ? String(opts.note) : undefined,
		});
	} catch (e) {
		console.warn(`[checkpoint] STATE.json no actualizado (${e.message}); sigo con el commit`);
	}
	git(root, ['add', '--', `projects/${projectId}`, ...extra]);
	const message = `checkpoint: ${phase} ${stamp}`;
	const commitArgs = ['commit', '-m', message, '-m', `Proyecto: ${projectId}`];
	if (opts.note) commitArgs.push('-m', String(opts.note));
	git(root, commitArgs);
	const sha = git(root, ['rev-parse', '--short', 'HEAD']);
	console.log(`CHECKPOINT_OK ${projectId} ${sha} "${message}"`);
	if (opts['no-push'] === true || opts['no-push'] === 'true') {
		console.log('[checkpoint] push omitido (--no-push)');
		process.exit(0);
	}
	const upstream = git(root, ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}'], {
		allowFail: true,
	});
	if (!upstream) {
		console.log('[checkpoint] sin upstream configurado — commit local guardado, sin push');
		process.exit(0);
	}
	const pushed = git(root, ['push'], {allowFail: true});
	if (pushed === null) {
		console.warn(
			'[checkpoint] el push falló (red o remoto); el commit local está guardado — reintenta con `git push` cuando haya conexión',
		);
	} else {
		console.log(`[checkpoint] push OK → ${upstream}`);
	}
}
