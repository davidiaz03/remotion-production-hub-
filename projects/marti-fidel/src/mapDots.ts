// Centroides del mapa (canvas 1400x1400) para marcadores animados.
// Generado por research/map-build.py (Natural Earth 50m).
export const MAP_CANVAS = 1400;
export const MAP_DOTS: Record<string, {x: number; y: number}> = {
  "Venezuela": {x: 852.0, y: 400.0},
  "Trinidad and Tobago": {x: 928.3, y: 334.8},
  "Saint Lucia": {x: 924.2, y: 293.7},
  "Jamaica": {x: 688.7, y: 229.0},
  "Haiti": {x: 754.5, y: 218.4},
  "Dominican Rep.": {x: 786.5, y: 218.1},
  "Dominica": {x: 918.5, y: 270.2},
  "Antigua and Barb.": {x: 912.7, y: 245.0},
};

// V3 (19-nov-2026; viewport ampliado 20-nov-2026): centroide de
// Trinidad y Tobago en el canvas del mapa del Caribe (1400×1400,
// research/map-build-caribbean.py, Natural Earth 50m, bbox lon
// −92..−56 / lat 0..30 — lat 0, no 6, para incluir a Guyana entera).
// Centroide del anillo mayor (isla de Trinidad, no Tobago). Usado
// por VideoV3.tsx (HookMapScene).
export const CARIBBEAN_TT = {x: 1192.9, y: 912.0};

// V3 cascada (19-nov-2026 noche, investigación visual #1;
// CORREGIDA 20-nov-2026): los 7 miembros del CARICOM que rompieron
// la unanimidad del bloque (33 años; acta A/81/PV.28; STRATEGY.md
// §7.1). Centroide del anillo mayor en el canvas Caribe 1400. Los
// puntos luminosos solo marcan las tres islas pequeñas (Antigua,
// Dominica, Santa Lucía); Jamaica, Haití y Guyana se leen por el
// relleno rojo. CORRECCIÓN 20-nov: la primera versión incluía a
// Rep. Dominicana (NO es CARICOM — es CARIFORUM) y omitía a Guyana
// (SÍ es CARICOM, abstención). Los 7 correctos: T&T (en contra),
// Jamaica, Haití, Guyana (abstenciones), Antigua, Dominica,
// Santa Lucía (ausentes). 7+7=14 (los otros 7 CARICOM votaron a favor).
export const CARIBBEAN_BREAK = {
	'Jamaica': {x: 572.5, y: 554.6},
	'Haiti': {x: 749.6, y: 522.4},
	'Guyana': {x: 1290.4, y: 1195.9},
	'Antigua and Barb.': {x: 1175.9, y: 603.3},
	'Dominica': {x: 1191.5, y: 679.6},
	'Saint Lucia': {x: 1206.8, y: 750.8},
};

// V1.2 (auditoría densa, fix 3): desplazamientos de VISUALIZACIÓN de los
// puntos del Caribe, en px de pantalla (1080×1920). Los centroides reales
// están a 16–22 px entre sí y los puntos (24 px + anillo pulsante) se
// fundían en manchas («OO») y el racimo gris tapaba el punto rojo de
// Trinidad. Con estos desplazamientos todos los centros quedan a ≥39 px
// y cada punto lleva una línea guía fina hasta su centroide real.
//   Jamaica (532,357) · Haití (585,335) · Rep. Dom. (615,360)
//   Antigua (670,345) · Dominica (705,380) · Santa Lucía (672,415)
//   Trinidad y Tobago (705,445)
export const MAP_DOT_OFFSETS: Record<string, {dx: number; dy: number}> = {
  "Trinidad and Tobago": {dx: 9, dy: 15},
  "Saint Lucia": {dx: -22, dy: 14},
  "Jamaica": {dx: 0, dy: 0},
  "Haiti": {dx: 8, dy: -15},
  "Dominican Rep.": {dx: 16, dy: 10},
  "Dominica": {dx: 15, dy: -5},
  "Antigua and Barb.": {dx: -16, dy: -23},
};
