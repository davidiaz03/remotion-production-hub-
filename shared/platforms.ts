/**
 * Presets por plataforma para reels verticales (hub-v6).
 *
 * Cada plataforma tapa una parte distinta del fotograma con su propia
 * interfaz (barra superior, rail de acciones a la derecha, caption y
 * botones abajo). Dos zonas por plataforma, en píxeles sobre 1080×1920:
 *
 * - `safeZone`: la zona segura PUBLICADA por la plataforma (guías de
 *   anuncios: Meta Ads Guide, TikTok In-Feed template, Google Ads
 *   Help). Es estricta (incluye botones de CTA que los posts
 *   orgánicos no tienen): texto crítico, logos y CTAs van dentro.
 * - `organicZone`: márgenes prácticos medidos sobre la interfaz
 *   orgánica (sin botones de anuncio). Los subtítulos karaoke viven
 *   aquí: más abajo que la zona segura de anuncios, pero por encima
 *   de la UI real de la app.
 *
 * `caption.bottom` es el valor de la casa (235, probado en los reels
 * publicados del Memorial: Pilar, Marabana, Martí-Fidel); `bottomStrict`
 * es el margen que dejaría el karaoke POR ENCIMA de la UI orgánica
 * (para proyectos que quieran despeje total). Ninguna plataforma
 * publica zona segura para posts orgánicos: los márgenes orgánicos
 * son mediciones de terceros, no spec oficial.
 *
 * Duraciones verificadas nov-2026 (Sprout Social, guía actualizada
 * 2-nov-2026; Hootsuite): IG Reels hasta 20 min en la app pero más
 * de 3 min no se recomienda a no seguidores; TikTok hasta 60 min
 * subido (10 min grabado en la app); Shorts hasta 3 min; Facebook
 * Reels sin límite en la app (API 3–90 s).
 *
 * Fuentes:
 * - https://sproutsocial.com/insights/social-media-video-specs-guide/
 * - https://shotstack.io/learn/vertical-video-safe-zones/
 * - https://blog.hootsuite.com/social-media-video-length/
 * - https://www.markstudios.com/tools/safe-zone-checker
 */

export type PlatformId =
	| 'instagram-reels'
	| 'tiktok'
	| 'youtube-shorts'
	| 'facebook-reels';

/** Márgenes a mantener libres, en píxeles sobre 1080×1920. */
export type SafeMargins = {
	top: number;
	bottom: number;
	left: number;
	right: number;
};

export type PlatformPreset = {
	id: PlatformId;
	label: string;
	width: number;
	height: number;
	/** Zona segura publicada (anuncios): para texto crítico y logos. */
	safeZone: SafeMargins;
	/** Márgenes prácticos de la UI orgánica: para subtítulos. */
	organicZone: SafeMargins;
	caption: {
		/** Tamaño de fuente del karaoke (valor de la casa). */
		size: number;
		longSize: number;
		/** Margen inferior del karaoke (valor de la casa). */
		bottom: number;
		/** Margen inferior que despeja la UI orgánica por completo. */
		bottomStrict: number;
	};
	/** Duración máxima en la app (segundos); null = sin límite publicado. */
	maxDurationSec: number | null;
	/** Umbral de alcance: por encima, la plataforma lo recomienda menos. */
	reachCutoffSec: number | null;
	/** Duración recomendada [min, max] en segundos. */
	recommendedSec: [number, number];
	notes: string;
};

const CAPTION_HOUSE = {size: 60, longSize: 52, bottom: 235};

export const PLATFORM_PRESETS: Record<PlatformId, PlatformPreset> = {
	'instagram-reels': {
		id: 'instagram-reels',
		label: 'Instagram Reels',
		width: 1080,
		height: 1920,
		// Meta Ads Guide: 14% arriba, 35% abajo, 6% a cada lado.
		safeZone: {top: 269, bottom: 672, left: 65, right: 65},
		// UI orgánica medida: caption + audio + teaser abajo.
		organicZone: {top: 220, bottom: 420, left: 60, right: 180},
		caption: {...CAPTION_HOUSE, bottomStrict: 440},
		maxDurationSec: 1200,
		reachCutoffSec: 180,
		recommendedSec: [15, 45],
		notes:
			'Hasta 20 min en la app, pero más de 3 min no se recomienda a no seguidores (desde ene-2025).',
	},
	'facebook-reels': {
		id: 'facebook-reels',
		label: 'Facebook Reels',
		width: 1080,
		height: 1920,
		// Meta publica la misma zona segura que para Instagram Reels.
		safeZone: {top: 269, bottom: 672, left: 65, right: 65},
		organicZone: {top: 220, bottom: 420, left: 60, right: 180},
		caption: {...CAPTION_HOUSE, bottomStrict: 440},
		maxDurationSec: null,
		reachCutoffSec: null,
		recommendedSec: [15, 30],
		notes:
			'Sin límite de duración en la app; la API de publicación (3–90 s) solo afecta a herramientas de programación.',
	},
	tiktok: {
		id: 'tiktok',
		label: 'TikTok',
		width: 1080,
		height: 1920,
		// Plantilla In-Feed de TikTok (medida sobre el archivo oficial).
		// El rail derecho llega a 300 px desde y=840 hacia abajo.
		safeZone: {top: 240, bottom: 660, left: 120, right: 120},
		organicZone: {top: 140, bottom: 400, left: 60, right: 180},
		caption: {...CAPTION_HOUSE, bottomStrict: 420},
		maxDurationSec: 3600,
		reachCutoffSec: null,
		recommendedSec: [20, 35],
		notes:
			'Hasta 60 min subido; 10 min grabado en la app. Solo vídeos de ≥1 min cobran Creator Rewards.',
	},
	'youtube-shorts': {
		id: 'youtube-shorts',
		label: 'YouTube Shorts',
		width: 1080,
		height: 1920,
		// Google Ads Help: zona segura de vídeo vertical en YouTube.
		safeZone: {top: 288, bottom: 672, left: 48, right: 192},
		organicZone: {top: 180, bottom: 350, left: 60, right: 180},
		caption: {...CAPTION_HOUSE, bottomStrict: 370},
		maxDurationSec: 180,
		reachCutoffSec: null,
		recommendedSec: [15, 45],
		notes:
			'Un Short de más de 1 min con reclamación de Content ID se bloquea en todo el mundo.',
	},
};

export const DEFAULT_PLATFORM: PlatformId = 'instagram-reels';

export function platformIds(): PlatformId[] {
	return Object.keys(PLATFORM_PRESETS) as PlatformId[];
}

/** Preset por id; un id desconocido o ausente devuelve el de la casa. */
export function getPlatformPreset(id?: string | null): PlatformPreset {
	if (id && id in PLATFORM_PRESETS) {
		return PLATFORM_PRESETS[id as PlatformId];
	}
	return PLATFORM_PRESETS[DEFAULT_PLATFORM];
}

/**
 * ¿Cabe el texto crítico en la zona segura? Comprueba que un rectángulo
 * (x, y, ancho, alto en píxeles) queda entero dentro de la zona segura
 * de anuncios de la plataforma. Puro y testeable; el chequeo visual en
 * el fotograma lo hace el pre-vuelo, esto es geometría declarada.
 */
export function rectInSafeZone(
	preset: PlatformPreset,
	rect: {x: number; y: number; w: number; h: number},
): boolean {
	const z = preset.safeZone;
	return (
		rect.x >= z.left &&
		rect.y >= z.top &&
		rect.x + rect.w <= preset.width - z.right &&
		rect.y + rect.h <= preset.height - z.bottom
	);
}

/** Rectángulo de la zona segura (para dibujar guías). */
export function safeZoneRect(preset: PlatformPreset): {
	x: number;
	y: number;
	w: number;
	h: number;
} {
	const z = preset.safeZone;
	return {
		x: z.left,
		y: z.top,
		w: preset.width - z.left - z.right,
		h: preset.height - z.top - z.bottom,
	};
}

/** Rectángulo de la zona orgánica (para dibujar guías). */
export function organicZoneRect(preset: PlatformPreset): {
	x: number;
	y: number;
	w: number;
	h: number;
} {
	const z = preset.organicZone;
	return {
		x: z.left,
		y: z.top,
		w: preset.width - z.left - z.right,
		h: preset.height - z.top - z.bottom,
	};
}
