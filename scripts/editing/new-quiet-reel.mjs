#!/usr/bin/env node
/** Crea un proyecto QuietReel (plantilla tranquila) listo para recibir
 *  un corte de assemble-cut.py.
 *
 *  Uso:
 *    node scripts/editing/new-quiet-reel.mjs mi-reel "Mi reel"
 *
 *  Hace:
 *    1. node scripts/project.mjs create --template quiet-reel
 *    2. Copia los activos de marca (shared/brand/) a public/
 *    3. Corrige STATE.json (compositionId QuietReel)
 *    4. Imprime los siguientes pasos
 */
import {copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const [slug, ...titleParts] = process.argv.slice(2);
if (!slug) {
	console.error('Uso: node scripts/editing/new-quiet-reel.mjs <slug> ["Título"]');
	process.exit(1);
}
const title = titleParts.join(' ') || slug.replaceAll('-', ' ').toUpperCase();

const r = spawnSync(
	process.execPath,
	[path.join(ROOT, 'scripts', 'project.mjs'), 'create', slug, title, '--template', 'quiet-reel'],
	{stdio: 'inherit'},
);
if (r.status !== 0) process.exit(r.status ?? 1);

const home = path.join(ROOT, 'projects', slug);
mkdirSync(path.join(home, 'public', 'img'), {recursive: true});
mkdirSync(path.join(home, 'public', 'video'), {recursive: true});
for (const [src, dst] of [
	['logo-white.png', path.join('img', 'logo-white.png')],
	['sting-black-2x.mp4', path.join('video', 'sting-black-2x.mp4')],
]) {
	const from = path.join(ROOT, 'shared', 'brand', src);
	const to = path.join(home, 'public', dst);
	if (!existsSync(from)) throw new Error(`Falta el activo de marca: ${from}`);
	copyFileSync(from, to);
	console.log(`Marca: ${dst}`);
}
const statePath = path.join(home, 'STATE.json');
const state = JSON.parse(readFileSync(statePath, 'utf8'));
state.compositionId = 'QuietReel';
state.nextTask =
	'Transcribir la grabación con paper-edit.py, pedir la selección al usuario, montar con assemble-cut.py --project, renderizar, mezclar con mix.py y auditar con audit-audio.py.';
writeFileSync(statePath, JSON.stringify(state, null, 2) + '\n');
console.log(`\nListo: projects/${slug}/ (QuietReel)`);
console.log('Siguientes pasos (ver scripts/editing/README.md):');
console.log('  1. Transcribir la grabación: paper-edit.py --input <video> --out-dir research/paper');
console.log('  2. Pedir la selección al usuario (números de frase del papel).');
console.log(`  3. Montar: assemble-cut.py --video <video> --paper research/paper/paper.json --select "..." --project projects/${slug}`);
console.log(`  4. Renderizar: npm run preview -- ${slug}  (luego master con --approve EXPORTAR-MASTER)`);
console.log('  5. Mezclar música con mix.py y auditar con audit-audio.py antes de entregar.');
