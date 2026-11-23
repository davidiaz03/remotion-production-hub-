/**
 * Formato numérico es-ES con agrupación MANUAL de miles.
 *
 * `toLocaleString('es-ES')` en el Chrome headless del render NO agrupa
 * miles (verificado en el smoke: «~1.177» salía como «~1177»), así que
 * los contadores animados formatean a mano: 62000 → «62.000».
 */

/** 62000 → «62.000»; respeta prefijo/sufijo fuera del número. */
export const formatGrouped = (n: number): string => {
  const rounded = Math.round(n);
  return String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

/**
 * «748.000+» → 748000; «~5.400» → 5400; «600.000» → 600000.
 * Devuelve null si no hay dígitos.
 */
export const parseGrowthNumber = (value: string): number | null => {
  const digits = value.replace(/[^0-9]/g, '');
  if (!digits) return null;
  const n = Number(digits);
  return Number.isFinite(n) ? n : null;
};
