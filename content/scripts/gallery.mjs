#!/usr/bin/env node
/**
 * Galería/índice de plantillas con vista previa (v2).
 *
 * Genera un HTML estático con una tarjeta por plantilla: nombre, tamaño,
 * descripción, campos y la vista previa renderizada (de examples/out/).
 * Para elegir plantilla sin abrir diez PNG a mano.
 *
 *   node content/scripts/render.mjs --all-examples   # primero, los renders
 *   node content/scripts/gallery.mjs                 # luego, la galería
 *   # abrir content/examples/out/gallery.html en el navegador
 *
 * La galería vive en examples/out/ (ignorado por git): solo tiene sentido
 * junto a los renders. Las plantillas sin render aparecen marcadas como
 * «sin render» en vez de romperse.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CONTENT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RED = '#ED1C24';

function escapeHtml(s) {
	return String(s)
		.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

export function listTemplates() {
	return readdirSync(path.join(CONTENT, 'templates'))
		.filter((t) => existsSync(path.join(CONTENT, 'templates', t, 'template.json')))
		.sort();
}

export function buildGallery({ examplesDir = path.join(CONTENT, 'examples', 'out') } = {}) {
	const cards = [];
	for (const t of listTemplates()) {
		const meta = JSON.parse(readFileSync(path.join(CONTENT, 'templates', t, 'template.json'), 'utf8'));
		const outDir = path.join(examplesDir, t);
		const previews = existsSync(outDir)
			? readdirSync(outDir).filter((f) => f.endsWith('.png')).sort()
			: [];
		const size = meta.variants?.['4:5']
			? `${meta.width}×${meta.height} (+ 4:5: ${meta.variants['4:5'].width}×${meta.variants['4:5'].height})`
			: `${meta.width}×${meta.height}`;
		const fields = Object.entries(meta.fields ?? {})
			.map(([k, v]) => `<li><code>${escapeHtml(k)}</code> — ${escapeHtml(v)}</li>`).join('\n');
		const imgs = previews.length > 0
			? previews.map((f) => `<a href="${t}/${f}"><img src="${t}/${f}" alt="${t} ${f}" loading="lazy"></a>`).join('\n')
			: `<p class="missing">Sin render — <code>node content/scripts/render.mjs --example ${t}</code></p>`;
		cards.push(`<section class="card" id="${t}">
<h2>${escapeHtml(t)} <span class="size">${size}</span>${meta.multi ? ' <span class="tag">multi-página</span>' : ''}</h2>
<p class="desc">${escapeHtml(meta.description)}</p>
<div class="previews">${imgs}</div>
<details><summary>Campos (${Object.keys(meta.fields ?? {}).length})</summary><ul>${fields}</ul></details>
</section>`);
	}
	return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Galería de plantillas — Memorial de la Denuncia</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #000; color: #fff; font-family: sans-serif; padding: 32px; }
h1 { font-size: 28px; text-transform: uppercase; letter-spacing: 0.04em; }
h1 b { color: ${RED}; }
.sub { color: #999; margin: 8px 0 28px; }
nav { margin-bottom: 28px; display: flex; flex-wrap: wrap; gap: 8px; }
nav a { color: #fff; background: #1a1a1a; border: 1px solid #333; padding: 6px 12px;
  border-radius: 20px; text-decoration: none; font-size: 14px; }
nav a:hover { border-color: ${RED}; }
.card { border: 1px solid #2a2a2a; border-radius: 12px; padding: 24px; margin-bottom: 24px; }
.card h2 { font-size: 22px; }
.card .size { color: #999; font-weight: 400; font-size: 16px; }
.card .tag { background: ${RED}; font-size: 12px; padding: 3px 8px; border-radius: 10px;
  vertical-align: middle; text-transform: uppercase; letter-spacing: 0.08em; }
.card .desc { color: #c9c9c9; margin: 10px 0 16px; line-height: 1.5; max-width: 900px; }
.previews { display: flex; flex-wrap: wrap; gap: 12px; }
.previews img { height: 300px; width: auto; border: 1px solid #333; border-radius: 6px; }
.missing { color: #f58466; }
details { margin-top: 16px; color: #c9c9c9; }
details summary { cursor: pointer; color: #fff; }
details ul { margin: 10px 0 0 20px; line-height: 1.6; font-size: 14px; }
code { background: #1a1a1a; padding: 1px 6px; border-radius: 4px; }
</style>
</head>
<body>
<h1>Galería de plantillas — <b>Memorial de la Denuncia</b></h1>
<p class="sub">${cards.length} plantillas · renders de ejemplo en <code>content/examples/out/</code> · regenerar con <code>node content/scripts/gallery.mjs</code></p>
<nav>${listTemplates().map((t) => `<a href="#${t}">${t}</a>`).join('')}</nav>
${cards.join('\n')}
</body>
</html>
`;
}

function main() {
	const outDir = path.join(CONTENT, 'examples', 'out');
	mkdirSync(outDir, { recursive: true });
	const html = buildGallery({ examplesDir: outDir });
	const outPath = path.join(outDir, 'gallery.html');
	writeFileSync(outPath, html);
	console.log(`Galería: ${outPath} (${listTemplates().length} plantillas)`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main();
}
