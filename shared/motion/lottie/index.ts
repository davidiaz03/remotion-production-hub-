/**
 * Iconos Lottie curados (Fase B, R7) — 17 animaciones vectoriales de
 * useAnimations (https://useanimations.com), licencia MIT, atribución
 * opcional, sin cuenta. Descargados por URL directa el 15-nov-2026 desde
 * https://useanimations.com/icons/<id>.json (catálogo: /icons.json).
 *
 * NOTA: la auditoría pedía curar de LottieFiles, pero sus JSONs devuelven
 * 403 por curl (solo accesibles con sesión/navegador) y su licencia
 * (Lottie Simple License) es menos limpia que la MIT de useAnimations.
 * Los iconos de useAnimations son el mismo uso previsto (micro-animaciones
 * de iconos con estados) con licencia permisiva verificada en el catálogo.
 *
 * Todos son shape layers puros (sin imágenes ni fuentes externas), 32×32,
 * 30 fps, y ninguno necesita el reproductor completo (requiresFullPlayer
 * = false en el catálogo). Se importan como datos: @remotion/lottie los
 * reproduce buscando por fotograma (determinista, sin relojes).
 */
import type {LottieAnimationData} from '@remotion/lottie';
import activity from './activity.json';
import alertTriangle from './alert-triangle.json';
import arrowRight from './arrow-right.json';
import award from './award.json';
import checkCircle from './check-circle.json';
import checkmark from './checkmark.json';
import clock from './clock.json';
import flag from './flag.json';
import heart from './heart.json';
import lock from './lock.json';
import mapPin from './map-pin.json';
import notificationV4 from './notification-v4.json';
import share from './share.json';
import shieldOff from './shield-off.json';
import shield from './shield.json';
import star from './star.json';
import trendingUp from './trending-up.json';

export type LottieIconId =
	| 'activity'
	| 'alert-triangle'
	| 'arrow-right'
	| 'award'
	| 'check-circle'
	| 'checkmark'
	| 'clock'
	| 'flag'
	| 'heart'
	| 'lock'
	| 'map-pin'
	| 'notification-v4'
	| 'share'
	| 'shield'
	| 'shield-off'
	| 'star'
	| 'trending-up';

export type LottieIconMeta = {
	/** Datos de la animación (JSON de useAnimations). */
	data: LottieAnimationData;
	/** Fotogramas de una pasada completa a 30 fps (op - ip del JSON). */
	frames: number;
	/** Uso previsto en reels del Memorial. */
	use: string;
};

const asData = (j: unknown): LottieAnimationData =>
	j as LottieAnimationData;

export const LOTTIE_ICONS: Record<LottieIconId, LottieIconMeta> = {
	activity: {
		data: asData(activity),
		frames: 40,
		use: 'Pulso/actividad — ritmo de carrera, esfuerzo.',
	},
	'alert-triangle': {
		data: asData(alertTriangle),
		frames: 30,
		use: 'Alerta — peligro, advertencia (pareja de AlertBanner).',
	},
	'arrow-right': {
		data: asData(arrowRight),
		frames: 36,
		use: 'Flecha — dirección, siguiente paso, CTA.',
	},
	award: {
		data: asData(award),
		frames: 40,
		use: 'Medalla — ganadores, podio, reconocimiento.',
	},
	'check-circle': {
		data: asData(checkCircle),
		frames: 40,
		use: 'Check en círculo — confirmación, dato verificado.',
	},
	checkmark: {
		data: asData(checkmark),
		frames: 45,
		use: 'Check que se dibuja — confirmación, logro.',
	},
	clock: {
		data: asData(clock),
		frames: 40,
		use: 'Reloj — tiempo, marca, cuenta atrás.',
	},
	flag: {
		data: asData(flag),
		frames: 40,
		use: 'Bandera — meta, llegada, punto de control.',
	},
	heart: {
		data: asData(heart),
		frames: 10,
		use: 'Corazón — apoyo, emoción, comunidad.',
	},
	lock: {
		data: asData(lock),
		frames: 10,
		use: 'Candado — el bloqueo. Es un toggle: hacia adelante termina ABIERTO; para cerrarlo usa direction="backward" en LottieSticker.',
	},
	'map-pin': {
		data: asData(mapPin),
		frames: 40,
		use: 'Pin de mapa — La Habana, ruta, lugar.',
	},
	'notification-v4': {
		data: asData(notificationV4),
		frames: 60,
		use: 'Campana que suena en bucle — aviso, llamada de atención. (La v1 es un toggle campana/campana-tachada; la v4 es el timbre limpio.)',
	},
	share: {
		data: asData(share),
		frames: 75,
		use: 'Compartir — CTA de difusión.',
	},
	shield: {
		data: asData(shield),
		frames: 34,
		use: 'Escudo — protección, defensa, denuncia.',
	},
	'shield-off': {
		data: asData(shieldOff),
		frames: 25,
		use: 'Escudo roto — vulnerabilidad, agresión.',
	},
	star: {
		data: asData(star),
		frames: 10,
		use: 'Estrella — destacado, favorito.',
	},
	'trending-up': {
		data: asData(trendingUp),
		frames: 40,
		use: 'Tendencia al alza — crecimiento, récord.',
	},
};

export const LOTTIE_ICON_IDS = Object.keys(
	LOTTIE_ICONS,
) as LottieIconId[];
