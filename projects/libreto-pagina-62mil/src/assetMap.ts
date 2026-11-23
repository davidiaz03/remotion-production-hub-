/**
 * Resolución de assets de scenes.json.
 *
 * scenes.json mezcla nombres de archivo («post-messi-cuba-falso.jpg»)
 * con ids de captura F1–F14 (la escena del cold open trae ["F11","F12"]).
 * build-timeline vuelca `assets` tal cual, así que la resolución vive
 * aquí, en el código: el mapa F→archivo sale de asset-manifest.json
 * (lista `pending`, 23-nov-2026). Si el manifiesto cambia un nombre,
 * actualizar este mapa.
 *
 * Las imágenes viven en public/images/ y los videos en public/video/.
 *
 * RECORTES (medidos sobre los JPG reales, 23-nov-2026 — ver
 * public/NOTAS-RECURSOS.md): fracciones de la altura de la imagen.
 * - F9/F10/F11/F12: cabecera de Facebook con la foto de perfil del
 *   usuario (PRIVACIDAD: la marca nunca señala su perfil personal) +
 *   caja «Comentar como David Izquierdo» (F9/F10) / botón de redactar
 *   (F11/F12). Medido: la barra termina en la fila ~210/2200 y la caja
 *   de comentario empieza en ~1935/2200.
 * - F6/F7/F8 (Cuballama): banner «VUELA a CUBA» (filas ~75–190/2200).
 *   El botón de campana de F7 tapa 2 hashtags: NO se recorta (el plan
 *   cita los hashtags; el pre-vuelo lo verifica).
 * - F1-p2: comparación + párrafo de métricas (filas ~44–1254/2200).
 * - F5-p2: zona de la cita del tuit (subtítulo + párrafo + cita,
 *   filas ~1320–2024/2200); la cabecera fija de elTOQUE tapa el
 *   párrafo central y queda fuera del recorte.
 */
import {staticFile} from 'remotion';

const F_MAP: Record<string, string> = {
  F1: 'eltoque-messi-17mar-articulo.jpg',
  F2: 'eltoque-patron-02abr-articulo.jpg',
  F3: 'eltoque-ronaldo-24jun-articulo.jpg',
  F4: 'infoveritas-messi-19mar-articulo.jpg',
  F5: 'musk-tuit-starlink-16mar.jpg',
  F6: 'cuballama-bebeshito-articulo.jpg',
  F7: 'cuballama-cienfuegos-articulo.jpg',
  F8: 'cuballama-juicio-2027-articulo.jpg',
  F9: 'denuncia-11millones-21ene.jpg',
  F10: 'denuncia-carlos-perez-20mar.jpg',
  F11: 'pagina-no-disponible-url.jpg',
  F12: 'busqueda-facebook-sin-resultados.jpg',
  F13: 'padron-reel-10jul.jpg',
  F14: 'cuentas-oficiales-messi-ronaldo.jpg',
};

/** Id F1–F14 o nombre de archivo → nombre de archivo en public/. */
export const resolveAsset = (name: string): string =>
  F_MAP[name] ?? name;

/** URL pública de una imagen (public/images/). */
export const imageSrc = (name: string): string =>
  staticFile(`images/${resolveAsset(name)}`);

/** URL pública de un video (public/video/). */
export const videoSrc = (name: string): string =>
  staticFile(`video/${resolveAsset(name)}`);

/** ¿Es un video? (por extensión). */
export const isVideoAsset = (name: string): boolean =>
  /\.(mp4|webm|mov)$/i.test(resolveAsset(name));

/**
 * Archivos de scenes.json que NO existen en public/ (verificado en
 * disco 23-nov-2026): F13 y F14, ambos con plan B. Si el coordinador
 * los captura después, quitarlos de aquí y el componente los mostrará.
 */
export const MISSING_ASSETS = new Set([
  'padron-reel-10jul.jpg', // F13: plan B = tarjeta + F8
  'cuentas-oficiales-messi-ronaldo.jpg', // F14: plan B = checklist gráfico
]);

export const assetExists = (name: string): boolean =>
  !MISSING_ASSETS.has(resolveAsset(name));

/** Recorte vertical por archivo: fracciones {top, bottom} de la altura. */
export type Crop = {top: number; bottom: number};
const CROPS: Record<string, Crop> = {
  // Privacidad: cabecera de Facebook con foto de perfil + caja de comentario.
  'pagina-no-disponible-url.jpg': {top: 0.1, bottom: 0.11},
  'busqueda-facebook-sin-resultados.jpg': {top: 0.1, bottom: 0.11},
  // -páginas (cold open, escena 1): top 0.06 deja visible el título
  // «Resultados de la búsqueda para» y sigue tapando el avatar de la
  // cabecera (y 40–110 de 2200; el corte cae en y≈132).
  'busqueda-facebook-sin-resultados-paginas.jpg': {top: 0.06, bottom: 0.11},
  'denuncia-11millones-21ene.jpg': {top: 0.1, bottom: 0.12},
  'denuncia-carlos-perez-20mar.jpg': {top: 0.1, bottom: 0.12},
  // Banner publicitario «VUELA a CUBA» (el logo de Cuballama se conserva).
  'cuballama-bebeshito-articulo.jpg': {top: 0.1, bottom: 0},
  'cuballama-cienfuegos-articulo.jpg': {top: 0.1, bottom: 0},
  'cuballama-juicio-2027-articulo.jpg': {top: 0.1, bottom: 0},
  // F1-p2: solo comparación + párrafo de métricas.
  'eltoque-messi-17mar-articulo-p2.jpg': {top: 0.02, bottom: 0.43},
  // F5-p2: solo la zona de la cita del tuit real.
  'musk-tuit-starlink-16mar-p2.jpg': {top: 0.6, bottom: 0.08},
};

export const cropForAsset = (name: string): Crop =>
  CROPS[resolveAsset(name)] ?? {top: 0, bottom: 0};

/**
 * Páginas de cada captura, en orden de aparición (NOTAS-RECURSOS.md).
 * - F1/F2/F3/F5: la -p2 lleva el contenido que el plan pide (métricas,
 *   fórmula, veredicto, cita del tuit) y se muestra tras la p1.
 * - F12: tras la búsqueda general, el filtro «Páginas» («No encontramos
 *   resultados») es la prueba más limpia de la desaparición.
 * - F4-p2: respaldo del beat de la lupa (3.6), NO se muestra por defecto.
 * - F6-p2: NO se muestra como imagen (página 95% en blanco + campana
 *   sobre el inicio de la cita); la cita va como tarjeta de texto
 *   (CARDS, plan 2.2).
 */
const PAGES: Record<string, string[]> = {
  'eltoque-messi-17mar-articulo.jpg': [
    'eltoque-messi-17mar-articulo.jpg',
    'eltoque-messi-17mar-articulo-p2.jpg',
  ],
  'eltoque-patron-02abr-articulo.jpg': [
    'eltoque-patron-02abr-articulo.jpg',
    'eltoque-patron-02abr-articulo-p2.jpg',
  ],
  'eltoque-ronaldo-24jun-articulo.jpg': [
    'eltoque-ronaldo-24jun-articulo.jpg',
    'eltoque-ronaldo-24jun-articulo-p2.jpg',
  ],
  'musk-tuit-starlink-16mar.jpg': [
    'musk-tuit-starlink-16mar.jpg',
    'musk-tuit-starlink-16mar-p2.jpg',
  ],
  'busqueda-facebook-sin-resultados.jpg': [
    'busqueda-facebook-sin-resultados.jpg',
    'busqueda-facebook-sin-resultados-paginas.jpg',
  ],
};

/** Expande los assets de una escena a sus páginas (F11/F12 → archivos). */
export const expandAssets = (assets: string[]): string[] =>
  assets.flatMap((a) => {
    const file = resolveAsset(a);
    return PAGES[file] ?? [file];
  });

/**
 * Tarjetas de texto asociadas a un asset (plan B o beats del plan):
 * - F6: la cita de Bebeshito (F6-p2, verificada en NOTAS-RECURSOS.md);
 *   la página NO se muestra como imagen (95% en blanco).
 * - F13: plan B sin captura (NOTAS-RECURSOS.md).
 */
export type AssetCard = {
  text: string;
  attribution: string;
  kind: 'quote' | 'note';
};
const CARDS: Record<string, AssetCard> = {
  'cuballama-bebeshito-articulo.jpg': {
    text: 'Es totalmente falso. No he salido de Estados Unidos.',
    attribution: 'ONIEL BEBESHITO · ABRIL 2026',
    kind: 'quote',
  },
  'padron-reel-10jul.jpg': {
    text: 'Teresa Maria Padron lo denunció en un reel del 10 de julio.',
    attribution: 'FACEBOOK · 10-JUL-2026',
    kind: 'note',
  },
};

export const cardForAsset = (name: string): AssetCard | null =>
  CARDS[resolveAsset(name)] ?? null;

/**
 * Overlays gráficos (dato del dossier, NO legible en la imagen):
 * - F8: «2027» NO aparece en la captura («próximo 1 de marzo», artículo
 *   del 19-nov-2026). La fecha va como píldora DEBAJO de la imagen,
 *   nunca como resaltado sobre ella.
 */
const OVERLAYS: Record<string, string> = {
  'cuballama-juicio-2027-articulo.jpg':
    'EL JUICIO EMPIEZA EL 1 DE MARZO DE 2027',
};

export const overlayForAsset = (name: string): string | null =>
  OVERLAYS[resolveAsset(name)] ?? null;

/**
 * Relación de aspecto (ancho/alto) medida en disco — la necesita
 * DocumentImage para el recorte con contain. Si falta una entrada,
 * el componente cae a <Img> con contain sin recorte.
 */
const ASPECTS: Record<string, number> = {
  // Páginas carta 1700×2200 (F1–F12, -p2, -paginas).
  'eltoque-messi-17mar-articulo.jpg': 1700 / 2200,
  'eltoque-messi-17mar-articulo-p2.jpg': 1700 / 2200,
  'eltoque-patron-02abr-articulo.jpg': 1700 / 2200,
  'eltoque-patron-02abr-articulo-p2.jpg': 1700 / 2200,
  'eltoque-ronaldo-24jun-articulo.jpg': 1700 / 2200,
  'eltoque-ronaldo-24jun-articulo-p2.jpg': 1700 / 2200,
  'infoveritas-messi-19mar-articulo.jpg': 1700 / 2200,
  'infoveritas-messi-19mar-articulo-p2.jpg': 1700 / 2200,
  'musk-tuit-starlink-16mar.jpg': 1700 / 2200,
  'musk-tuit-starlink-16mar-p2.jpg': 1700 / 2200,
  'cuballama-bebeshito-articulo.jpg': 1700 / 2200,
  'cuballama-bebeshito-articulo-p2.jpg': 1700 / 2200,
  'cuballama-cienfuegos-articulo.jpg': 1700 / 2200,
  'cuballama-juicio-2027-articulo.jpg': 1700 / 2200,
  'denuncia-11millones-21ene.jpg': 1700 / 2200,
  'denuncia-carlos-perez-20mar.jpg': 1700 / 2200,
  'pagina-no-disponible-url.jpg': 1700 / 2200,
  'busqueda-facebook-sin-resultados.jpg': 1700 / 2200,
  'busqueda-facebook-sin-resultados-paginas.jpg': 1700 / 2200,
  // Recursos P1 (medidos).
  'post-messi-cuba-falso.jpg': 670 / 621,
  'messi-foto-98c58e7b73.jpg': 1113 / 713,
  'busqueda-inversa-foto-messi.jpg': 875 / 1027,
  'post-bukele-1.jpg': 530 / 697,
  'post-bukele-2.jpg': 559 / 710,
  'post-bad-bunny.jpg': 491 / 651,
  'post-musk.jpg': 450 / 380,
  'eltoque-collage-5-casos.jpg': 1218 / 714,
  'casa-blanca-dt1261-messi-camiseta-47.jpg': 1920 / 1280,
  'casa-blanca-dt0969-trump-podio.jpg': 1920 / 1280,
  'casa-blanca-messi-sonrie-trump.jpg': 480 / 360,
  'casa-blanca-messi-trump-podio.jpg': 480 / 360,
  'casa-blanca-despacho-oval.jpg': 480 / 360,
};

export const aspectForAsset = (name: string): number | null =>
  ASPECTS[resolveAsset(name)] ?? null;

/** Capturas en modo oscuro de Facebook: la píldora va en Papel. */
const DARK_ASSETS = new Set([
  'pagina-no-disponible-url.jpg',
  'busqueda-facebook-sin-resultados.jpg',
  'busqueda-facebook-sin-resultados-paginas.jpg',
  'denuncia-11millones-21ene.jpg',
  'denuncia-carlos-perez-20mar.jpg',
]);

export const isDarkAsset = (name: string): boolean =>
  DARK_ASSETS.has(resolveAsset(name));

/**
 * Texto de la píldora de fuente por archivo (CREATIVE_BRIEF §4: píldora
 * en cada documento, mín. 24 px a 1080p). Si falta una entrada, se
 * deriva del nombre del archivo en mayúsculas.
 */
const SOURCE_LABELS: Record<string, string> = {
  'post-messi-cuba-falso.jpg': 'FACEBOOK · MARZO 2026',
  'messi-foto-98c58e7b73.jpg': 'ELTOQUE / INFOVERITAS · COMPARACIÓN',
  'eltoque-messi-17mar-articulo.jpg': 'ELTOQUE · 17-MAR-2026',
  'eltoque-messi-17mar-articulo-p2.jpg': 'ELTOQUE · 17-MAR-2026',
  'infoveritas-messi-19mar-articulo.jpg': 'INFOVERITAS · 19-MAR-2026',
  'infoveritas-messi-19mar-articulo-p2.jpg': 'INFOVERITAS · 19-MAR-2026',
  'eltoque-patron-02abr-articulo.jpg': 'ELTOQUE · 2-ABR-2026',
  'eltoque-patron-02abr-articulo-p2.jpg': 'ELTOQUE · 2-ABR-2026',
  'eltoque-ronaldo-24jun-articulo.jpg': 'ELTOQUE · 24-JUN-2026',
  'eltoque-ronaldo-24jun-articulo-p2.jpg': 'ELTOQUE · 24-JUN-2026',
  'eltoque-collage-5-casos.jpg': 'ELTOQUE · 2-ABR-2026',
  'casa-blanca-dt1261-messi-camiseta-47.jpg':
    'CASA BLANCA · 5-MAR-2026 · FOTO OFICIAL',
  'casa-blanca-postcard-38s.mp4': 'CASA BLANCA · VIDEO OFICIAL',
  'casa-blanca-bienvenida-messi-15s.mp4': 'CASA BLANCA · VIDEO OFICIAL',
  'post-bukele-1.jpg': 'FACEBOOK · 23-MAR-2026',
  'post-bukele-2.jpg': 'FACEBOOK · MARZO 2026',
  'post-musk.jpg': 'FACEBOOK · MARZO 2026',
  'post-bad-bunny.jpg': 'FACEBOOK · MARZO 2026',
  'musk-tuit-starlink-16mar.jpg': 'ELTOQUE · 18-MAR-2026',
  'musk-tuit-starlink-16mar-p2.jpg': 'X · 16-MAR-2026',
  'denuncia-11millones-21ene.jpg': 'FACEBOOK · 21-ENE-2026',
  'denuncia-carlos-perez-20mar.jpg': 'FACEBOOK · 20-MAR-2026',
  'cuballama-bebeshito-articulo.jpg': 'CUBALLAMA · 15-ABR-2026',
  'cuballama-cienfuegos-articulo.jpg': 'CUBALLAMA · 23-JUN-2026',
  'cuballama-juicio-2027-articulo.jpg': 'CUBALLAMA · 19-NOV-2026',
  'padron-reel-10jul.jpg': 'FACEBOOK · 10-JUL-2026',
  'busqueda-inversa-foto-messi.jpg': 'BÚSQUEDA INVERSA · GOOGLE',
  'cuentas-oficiales-messi-ronaldo.jpg': 'PERFILES OFICIALES · X / INSTAGRAM',
  'pagina-no-disponible-url.jpg': 'FACEBOOK · 23-NOV-2026',
  'busqueda-facebook-sin-resultados.jpg': 'FACEBOOK · 23-NOV-2026',
  'busqueda-facebook-sin-resultados-paginas.jpg': 'FACEBOOK · 23-NOV-2026',
};

export const sourceLabel = (name: string): string => {
  const file = resolveAsset(name);
  if (SOURCE_LABELS[file]) return SOURCE_LABELS[file];
  return file
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[-_]+/g, ' ')
    .toUpperCase();
};

/**
 * Posición de la marca de agua de Gemini en messi-foto-98c58e7b73.jpg:
 * el destello ✦ está en la esquina inferior derecha del panel falso
 * (izquierdo), medido en el JPG a plena resolución (~x 497/1113,
 * ~y 685/713). La lupa de la comprobación 3 (escena 3.6) apunta ahí.
 * El pre-vuelo (P3) debe verificar que se lee; respaldo: F4-p2.
 */
export const GEMINI_MARK = {x: 0.447, y: 0.961} as const;

/**
 * Círculo de lápiz rojo de la comparación (escena 0.3): rodea la
 * estrella izquierda de la bandera cubana en el panel falso (medido:
 * centro ~x 128/1113, ~y 292/713; radio ~95 px de ancho). Queda por
 * debajo de las caras (terminan ~y 0,25; el círculo empieza ~y 0,28).
 */
export const FLAG_CIRCLE = {x: 0.115, y: 0.41, r: 0.085} as const;
