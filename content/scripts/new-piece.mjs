#!/usr/bin/env node
/**
 * Crea una pieza nueva de contenido estático.
 *
 *   node content/scripts/new-piece.mjs <slug> --template <post|story|carousel|infographic|thumbnail|quote> [--title "..."]
 *
 * Crea pieces/<slug>/ con:
 *   brief.md    — encargo: objetivo, hechos verificados, copy, revisión
 *   data.json   — datos de la plantilla (copia del ejemplo; editar antes de renderizar)
 *   STATE.json  — pipeline brief → draft → review → export → delivery
 *   out/        — renders (ignorado por git)
 *
 * Flujo después: editar brief.md y data.json, luego
 *   node content/scripts/render.mjs --piece <slug>
 */
import { existsSync, mkdirSync, writeFileSync, readFileSync, copyFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initPiece } from './state.mjs';

const CONTENT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;

function usage() {
	console.error('Uso: new-piece.mjs <slug> --template <nombre> [--title "..."]');
	console.error('Plantillas: post, story, carousel, infographic, thumbnail, quote');
	process.exit(1);
}

const args = process.argv.slice(2);
const slug = args[0];
const tIdx = args.indexOf('--template');
const template = tIdx >= 0 ? args[tIdx + 1] : null;
const titleIdx = args.indexOf('--title');
const title = titleIdx >= 0 ? args[titleIdx + 1] : slug;
if (!slug || !SLUG_RE.test(slug) || !template) usage();

const tplDir = path.join(CONTENT, 'templates', template);
if (!existsSync(path.join(tplDir, 'template.json'))) {
	console.error(`Plantilla desconocida: ${template}`);
	process.exit(1);
}
const pieceDir = path.join(CONTENT, 'pieces', slug);
if (existsSync(pieceDir)) {
	console.error(`Ya existe la pieza: ${slug}`);
	process.exit(1);
}
mkdirSync(path.join(pieceDir, 'out'), { recursive: true });
copyFileSync(path.join(tplDir, 'data.example.json'), path.join(pieceDir, 'data.json'));
writeFileSync(path.join(pieceDir, 'brief.md'), `# Brief — ${title}

- **Pieza:** \`${slug}\` · plantilla \`${template}\`
- **Objetivo:** (¿qué debe lograr esta pieza? ¿para qué canal?)
- **Hechos verificados:** (cada dato con su fuente; sin fuente no va al diseño)
- **Copy:** (titular, cuerpo, CTA — editar también en \`data.json\`)
- **Imagen:** (foto real / ilustración generada / ninguna — procedencia y licencia)
- **Revisión:** (¿quién aprueba? ¿qué cambiaron en cada vuelta?)

## Registro de revisiones

| Fecha | Versión | Cambio | Aprobado por |
|---|---|---|---|
| | v1 | Borrador inicial | |
`);
initPiece(pieceDir, { slug, template, title });
console.log(`Pieza creada: pieces/${slug}/`);
console.log('Siguiente paso: edita brief.md y data.json, luego:');
console.log(`  node content/scripts/render.mjs --piece ${slug}`);
