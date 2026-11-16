#!/usr/bin/env node
/**
 * Exporta los subtítulos de un proyecto a .srt.
 *
 * Uso:
 *   node scripts/export-srt.mjs marabana-v1 [--out ruta.srt]
 *   node scripts/export-srt.mjs pilar-v30
 *
 * Lee el `captions.ts` del proyecto (formato CapSegment), lo adapta con
 * `capSegmentsToLines` y serializa con `linesToSrt` (shared/captions).
 * Por defecto escribe en `projects/<id>/out/<id>.srt`.
 *
 * La compilación TS se hace con esbuild (ya es dependencia de Remotion):
 * se genera un entry temporal que importa el captions.ts del proyecto y
 * el módulo compartido, se empaqueta y se ejecuta.
 */
import {execFileSync, spawnSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const esbuild = path.join(root, 'node_modules', '.bin', 'esbuild');

const [projectId, ...rest] = process.argv.slice(2);
if (!projectId) {
  console.error('Uso: node scripts/export-srt.mjs <proyecto> [--out ruta.srt]');
  process.exit(1);
}
let out = null;
for (let i = 0; i < rest.length; i++) {
  if (rest[i] === '--out' && rest[i + 1]) out = rest[++i];
}

const captionsPath = path.join(root, 'projects', projectId, 'src', 'captions.ts');
if (!fs.existsSync(captionsPath)) {
  console.error(`No existe ${captionsPath}`);
  process.exit(1);
}
out ??= path.join(root, 'projects', projectId, 'out', `${projectId}.srt`);

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'export-srt-'));
try {
  const entry = path.join(dir, 'entry.ts');
  const bundle = path.join(dir, 'bundle.mjs');
  fs.writeFileSync(
    entry,
    `import {CAPTIONS} from ${JSON.stringify(captionsPath)};\n` +
      `import {capSegmentsToLines} from ${JSON.stringify(
        path.join(root, 'shared', 'captions', 'legacy.ts'),
      )};\n` +
      `import {linesToSrt} from ${JSON.stringify(
        path.join(root, 'shared', 'captions', 'srt.ts'),
      )};\n` +
      `console.log(linesToSrt(capSegmentsToLines(CAPTIONS)));\n`,
  );
  const built = spawnSync(
    esbuild,
    [entry, '--bundle', '--platform=node', '--format=esm', `--outfile=${bundle}`, '--log-level=error'],
    {encoding: 'utf8'},
  );
  if (built.status !== 0) {
    console.error(built.stderr);
    process.exit(1);
  }
  const srt = execFileSync(process.execPath, [bundle], {encoding: 'utf8'});
  fs.mkdirSync(path.dirname(out), {recursive: true});
  fs.writeFileSync(out, srt);
  const entries = (srt.match(/^\d+$/gm) || []).length;
  console.log(`${projectId}: ${entries} entradas SRT -> ${out}`);
} finally {
  fs.rmSync(dir, {recursive: true, force: true});
}
