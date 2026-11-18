/**
 * Guardarraíles de densidad para carruseles.
 *
 * Reglas de la investigación en Instagram (17-nov-2026, ver
 * content/RESEARCH.md): una idea por lámina, cuerpo de desarrollo de
 * ~18–30 palabras, techo de 30–50 palabras por lámina, titular de
 * 8–15 palabras en portada (techo 15 en cualquier titular).
 *
 * Uso como módulo: checkCarousel(data) devuelve una lista de avisos
 * (cadenas vacía = limpio). render.mjs lo llama en cada render de
 * carrusel y muestra los avisos sin bloquear.
 *
 * Uso como CLI: node scripts/density.mjs <data.json> [--quiet]
 * Sale con código 1 si hay avisos (útil en QA).
 */
import { readFileSync } from 'node:fs';

export const LIMITS = { pageWords: 50, headlineWords: 15, bodyWords: 30 };

/** Cuenta palabras; ignora los marcadores *...* de resaltado. */
export function countWords(text) {
	if (!text) return 0;
	return String(text).replaceAll('*', '').split(/\s+/).filter(Boolean).length;
}

/** Avisos de densidad de una página de contenido (index = nº de lámina, 1-based). */
export function checkPage(page, index) {
	const warnings = [];
	const hl = countWords(page.headline);
	if (hl > LIMITS.headlineWords) {
		warnings.push(`lámina ${index}: titular con ${hl} palabras (techo ${LIMITS.headlineWords})`);
	}
	const body = countWords(page.body);
	if (body > LIMITS.bodyWords) {
		warnings.push(`lámina ${index}: cuerpo con ${body} palabras (techo recomendado ${LIMITS.bodyWords})`);
	}
	let total = hl + body;
	if (Array.isArray(page.items)) {
		for (const it of page.items) total += countWords(it.text);
	}
	if (total > LIMITS.pageWords) {
		warnings.push(`lámina ${index}: ${total} palabras en total (techo ${LIMITS.pageWords}; una idea por lámina)`);
	}
	return warnings;
}

/** Avisos de un carrusel completo (data.json con pages[]). Portada y cierre no cuentan. */
export function checkCarousel(data) {
	const warnings = [];
	const titleWords = countWords(data.title);
	if (titleWords > LIMITS.headlineWords) {
		warnings.push(`portada: titular con ${titleWords} palabras (techo ${LIMITS.headlineWords})`);
	}
	if (!Array.isArray(data.pages)) return warnings;
	data.pages.forEach((page, i) => {
		if (i === 0 || i === data.pages.length - 1) return;
		warnings.push(...checkPage(page, i + 1));
	});
	return warnings;
}

if (import.meta.url === `file://${process.argv[1]}`) {
	const [file, ...rest] = process.argv.slice(2);
	if (!file) {
		console.error('Uso: node scripts/density.mjs <data.json>');
		process.exit(2);
	}
	const data = JSON.parse(readFileSync(file, 'utf8'));
	const warnings = checkCarousel(data);
	if (!rest.includes('--quiet')) {
		for (const w of warnings) console.log(`  ! densidad: ${w}`);
		if (warnings.length === 0) console.log('Densidad: limpia (todas las láminas dentro de los techos).');
	}
	process.exit(warnings.length ? 1 : 0);
}
