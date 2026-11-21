/**
 * Clasificación de los avisos de face-frame.py (v2).
 *
 * face-frame.py mete en `warnings` cosas de distinta gravedad; qa.mjs y
 * build-carousel.mjs comparten este criterio para no marcar como fallo
 * lo que es solo información:
 *
 *   FALLO (la regla «titular nunca sobre la cara» se viola):
 *   - "[actual ...] cara en la zona de texto / ojos bajo la banda /
 *     cara cortada / cara pequeña" (con la image_position ACTUAL).
 *   - "la cara NO cabe entera en la zona libre..." (ni con el mejor
 *     encuadre: retrato demasiado ajustado).
 *
 *   AVISO (se muestra, no bloquea):
 *   - "N caras en el encuadre; se encuadra por la mayor" (informativo:
 *     las demás caras son fondo; la v1 lo acepta, p. ej. trump-cuba).
 *   - "sin cara detectada: encuadre manual..." (no se pudo verificar;
 *     la foto puede no tener caras — verificar a ojo en el QA visual).
 *
 *   SE IGNORA:
 *   - "[sugerida ...] ..." (la posición sugerida solo importa si se
 *     aplica con --apply; si la actual está limpia, no hay problema).
 */
export function classifyFaceWarnings(warnings) {
	const failures = [];
	const infos = [];
	for (const w of warnings ?? []) {
		if (w.startsWith('[sugerida')) continue;
		if (w.startsWith('[actual') || w.includes('NO cabe entera')) {
			failures.push(w);
		} else {
			infos.push(w);
		}
	}
	return { failures, infos };
}
