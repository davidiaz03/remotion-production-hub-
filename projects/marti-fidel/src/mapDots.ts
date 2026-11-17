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
