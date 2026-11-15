#!/usr/bin/env node
/**
 * Copia SFX del kit del hub al public/ de un proyecto.
 *
 * Uso:
 *   node shared/motion/sfx/add-sfx.mjs <proyecto> <id...> [<id...>]
 *
 * Ejemplo:
 *   node shared/motion/sfx/add-sfx.mjs motion-demo whoosh-fast-hard pop-soft logo-sting-warm
 *
 * Copia cada WAV desde ~/workspace/remotion-hub/assets/sfx/sounds/ a
 * projects/<proyecto>/public/audio/sfx/<categoría>/, conservando la
 * estructura de carpetas (el componente <Sfx> resuelve ahí). Los WAV
 * no entran en el índice del repo: solo los proyectos que los usan
 * los llevan en su public/ (y public/ está ignorado por git, como los
 * demás audios generados).
 */
import {copyFileSync, existsSync, mkdirSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {readFileSync} from 'node:fs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..', '..', '..');
const HUB = resolve(REPO, '..');
const KIT = join(HUB, 'assets', 'sfx');

const [project, ...ids] = process.argv.slice(2);
if (!project || ids.length === 0) {
  console.error('Uso: node shared/motion/sfx/add-sfx.mjs <proyecto> <id...> [<id...>]');
  process.exit(1);
}
const projectDir = join(REPO, 'projects', project);
if (!existsSync(projectDir)) {
  console.error(`Proyecto no encontrado: ${projectDir}`);
  process.exit(1);
}
const catalog = JSON.parse(readFileSync(join(KIT, 'sounds.json'), 'utf8'));
const byId = new Map(catalog.sounds.map((s) => [s.id, s]));

let copied = 0;
for (const id of ids) {
  const meta = byId.get(id);
  if (!meta) {
    console.error(`SFX desconocido: ${id}`);
    process.exitCode = 1;
    continue;
  }
  const src = join(KIT, meta.file);
  const dest = join(projectDir, 'public', 'audio', 'sfx', meta.file.replace(/^sounds\//, ''));
  mkdirSync(dirname(dest), {recursive: true});
  copyFileSync(src, dest);
  console.log(`${id} -> public/audio/sfx/${meta.file.replace(/^sounds\//, '')} (sync ${meta.sync.at}s, ${meta.duration}s)`);
  copied++;
}
console.log(`${copied}/${ids.length} sonidos copiados a projects/${project}/public/audio/sfx/`);
