/**
 * Motor de plantillas mínimo para el hub de contenido (sin dependencias).
 *
 * Sintaxis (en template.html):
 *   {{key}}            valor escapado (rutas con punto: {{stat.value}})
 *   {{key|raw}}        valor sin escapar (HTML ya construido)
 *   {{hl:key}}         valor escapado con resaltado: lo que vaya entre
 *                      asteriscos (*palabra*) sale como
 *                      <span class="hl">palabra</span> (rojo de marca, ver
 *                      base.css). Para palabras clave en titulares.
 *   {{#if key}}…{{/if}}  bloque si key es veraz (listas: no vacías).
 *                      Acepta negación: {{#if !key}}. Anidable.
 *   {{#each items}}…{{/each}}  repite por cada elemento; dentro, {{field}}
 *                      resuelve primero contra el elemento y luego contra
 *                      el contexto global. {{@index}} = índice (0-based),
 *                      {{@first}} / {{@last}} booleanos. Anidable.
 *   {{icon:nombre}}    SVG inline de lib/icons/<nombre>.svg (width/height
 *                      al 100%; el tamaño lo controla el CSS del padre).
 *                      Si `nombre` no es un archivo, se interpreta como
 *                      clave de datos (p. ej. {{icon:icon}} dentro de un
 *                      #each con campo `icon`).
 *   {{logo:color}} / {{logo:white}}  <img> del logo (ya staged en assets/).
 *   {{asset:ruta}}     ruta tal cual (para fondos/imágenes staged).
 *
 * Los valores que no existen se sustituyen por cadena vacía y se registran
 * en `warnings` (render.mjs los muestra; un campo obligatorio ausente debe
 * detectarse ahí, no aquí). Las etiquetas de bloque sin cerrar se reportan
 * como warnings y se tratan como texto.
 *
 * Implementación: tokenizer + árbol con pila (los bloques anidados NO se
 * pueden resolver con regex — el intento con regex dejaba {{#if}} literales
 * en el carrusel, 17-nov-2026).
 */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

export function escapeHtml(s) {
	return String(s)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}

function lookup(ctx, key) {
	if (key === '@index' || key === '@first' || key === '@last') return ctx[key];
	const parts = key.split('.');
	let cur = ctx;
	for (const p of parts) {
		if (cur == null || typeof cur !== 'object' || !(p in cur)) return undefined;
		cur = cur[p];
	}
	return cur;
}

function truthy(v) {
	if (Array.isArray(v)) return v.length > 0;
	return Boolean(v);
}

// Tokeniza: texto plano y etiquetas {{...}}.
const TAG_RE = /\{\{([^{}]+)\}\}/g;

function parse(tpl, warnings) {
	const root = { type: 'root', children: [] };
	const stack = [root];
	let last = 0;
	let m;
	const pushText = (text) => {
		if (text) stack[stack.length - 1].children.push({ type: 'text', text });
	};
	while ((m = TAG_RE.exec(tpl)) !== null) {
		pushText(tpl.slice(last, m.index));
		last = m.index + m[0].length;
		const tag = m[1].trim();
		const eachOpen = tag.match(/^#each\s+([\w.]+)$/);
		const ifOpen = tag.match(/^#if\s+(!?[\w.]+)$/);
		if (eachOpen) {
			const node = { type: 'each', key: eachOpen[1], children: [] };
			stack[stack.length - 1].children.push(node);
			stack.push(node);
		} else if (ifOpen) {
			const node = { type: 'if', key: ifOpen[1], children: [] };
			stack[stack.length - 1].children.push(node);
			stack.push(node);
		} else if (tag === '/each' || tag === '/if') {
			const want = tag.slice(1);
			if (stack.length > 1 && stack[stack.length - 1].type === want) {
				stack.pop();
			} else {
				warnings.push(`etiqueta de cierre sin apertura: {{${tag}}}`);
				pushText(m[0]);
			}
		} else {
			stack[stack.length - 1].children.push({ type: 'tag', tag });
		}
	}
	pushText(tpl.slice(last));
	while (stack.length > 1) {
		const node = stack.pop();
		warnings.push(`bloque sin cerrar: {{#${node.type} ${node.key}}}`);
	}
	return root;
}

function resolveIcon(name, ctx, iconsDir, warnings) {
	let file = name;
	if (iconsDir && !existsSync(path.join(iconsDir, `${name}.svg`))) {
		const fromData = lookup(ctx, name);
		if (typeof fromData === 'string' && fromData) file = fromData;
	}
	if (!iconsDir) return '';
	const p = path.join(iconsDir, `${file}.svg`);
	if (!existsSync(p)) {
		warnings.push(`icono no encontrado: ${file}`);
		return '';
	}
	return readFileSync(p, 'utf8')
		.replace('width="24"', 'width="100%"')
		.replace('height="24"', 'height="100%"');
}

function renderTag(tag, ctx, opts, warnings) {
	const iconM = tag.match(/^icon:([\w.-]+)$/);
	if (iconM) return resolveIcon(iconM[1], ctx, opts.iconsDir, warnings);
	const logoM = tag.match(/^logo:(color|white)$/);
	if (logoM) return `<img class="brand-logo" src="assets/logo-${logoM[1]}.png" alt="Memorial de la Denuncia">`;
	const assetM = tag.match(/^asset:(.+)$/);
	if (assetM) return assetM[1];
	const hlM = tag.match(/^hl:([\w.@]+)$/);
	if (hlM) {
		const val = lookup(ctx, hlM[1]);
		if (val === undefined || val === null) {
			warnings.push(`campo ausente en data: ${hlM[1]}`);
			return '';
		}
		// Escapa todo y convierte *palabra* en <span class="hl">palabra</span>.
		return escapeHtml(val).replace(/\*([^*]+)\*/g, '<span class="hl">$1</span>');
	}
	const varM = tag.match(/^([\w.@]+)(\|raw)?$/);
	if (varM) {
		const val = lookup(ctx, varM[1]);
		if (val === undefined || val === null) {
			warnings.push(`campo ausente en data: ${varM[1]}`);
			return '';
		}
		return varM[2] ? String(val) : escapeHtml(val);
	}
	warnings.push(`etiqueta desconocida: {{${tag}}}`);
	return '';
}

function renderNode(node, ctx, opts, warnings) {
	switch (node.type) {
		case 'root':
			return node.children.map((c) => renderNode(c, ctx, opts, warnings)).join('');
		case 'text':
			return node.text;
		case 'tag':
			return renderTag(node.tag, ctx, opts, warnings);
		case 'if': {
			const neg = node.key.startsWith('!');
			const val = lookup(ctx, neg ? node.key.slice(1) : node.key);
			const show = neg ? !truthy(val) : truthy(val);
			if (!show) return '';
			return node.children.map((c) => renderNode(c, ctx, opts, warnings)).join('');
		}
		case 'each': {
			const list = lookup(ctx, node.key);
			if (!Array.isArray(list)) {
				if (list !== undefined) warnings.push(`#each sobre un valor no lista: ${node.key}`);
				return '';
			}
			return list.map((item, i) => {
				const child = Object.assign(Object.create(null), ctx, item, {
					'@index': i, '@first': i === 0, '@last': i === list.length - 1,
				});
				return node.children.map((c) => renderNode(c, child, opts, warnings)).join('');
			}).join('');
		}
		default:
			return '';
	}
}

export function renderTemplate(tpl, data, opts = {}) {
	const warnings = [];
	const tree = parse(tpl, warnings);
	const html = renderNode(tree, data, opts, warnings);
	return { html, warnings };
}
