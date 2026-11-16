/**
 * LottieSticker — micro-animación vectorial de icono (Fase B, R7).
 *
 * Reproduce un icono del registro curado `lottie/` (useAnimations, MIT)
 * en un rango de fotogramas, con el reloj de la composición (determinista:
 * @remotion/lottie busca por fotograma, sin relojes de pared).
 *
 * Uso:
 *   <LottieSticker id="checkmark" size={120} atFrame={30} top={600} left={480} />
 *   <LottieSticker id="notification-v4" size={96} atFrame={0} loop durationInFrames={90} />
 *   <LottieSticker id="lock" size={120} atFrame={45} direction="backward" /> // termina cerrado
 *
 * - `atFrame`: fotograma en que empieza la animación (defecto 0).
 * - Sin `loop`: la animación corre una pasada y se queda en su último
 *   fotograma hasta el final de la escena (la Sequence no tiene duración
 *   y @remotion/lottie fija el último fotograma al terminar).
 * - Con `loop`: repite durante `durationInFrames` (defecto: una pasada)
 *   y desaparece al terminar la ventana.
 * - `playbackRate`: velocidad (1 = normal; 2 = doble de rápido).
 * - `direction`: 'forward' (defecto) o 'backward'. Los iconos toggle
 *   (lock, heart, star, shield-off) terminan en su estado alternativo;
 *   para el estado inicial, reprodúcelos hacia atrás.
 * - `color`: color del trazo (defecto '#FFFFFF'). Los JSON originales
 *   son negros (#000, invisibles sobre GlowStage); el componente clona
 *   los datos y sustituye el negro por este color. Solo el negro puro
 *   se recolorea; otros colores del icono (si los hay) se respetan.
 * - Posición: `top`/`left` absolutos, o `style` libre. El contenedor es
 *   un cuadrado de `size` px; el icono escala sin perder nitidez (SVG).
 *
 * Costo de render: despreciable (SVG, 1–3 capas). No usar en bucle
 * infinito dentro de una escena larga sin motivo: un icono animado
 * compite con el karaoke; una pasada por evento basta.
 */
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Lottie, type LottieAnimationData} from '@remotion/lottie';
import {LOTTIE_ICONS, type LottieIconId} from './lottie';

export type LottieStickerProps = {
	readonly id: LottieIconId;
	/** Lado del cuadrado en px (defecto 96). */
	readonly size?: number;
	/** Fotograma en que empieza la animación (defecto 0). */
	readonly atFrame?: number;
	/** Si repite en bucle durante durationInFrames (defecto false). */
	readonly loop?: boolean;
	/** Duración del bucle en fotogramas (defecto: una pasada). */
	readonly durationInFrames?: number;
	/** Velocidad de reproducción (defecto 1). */
	readonly playbackRate?: number;
	/** Dirección de reproducción (defecto 'forward'). */
	readonly direction?: 'forward' | 'backward';
	/** Color del trazo, hex CSS (defecto '#FFFFFF'). */
	readonly color?: string;
	/** Posición absoluta (px). */
	readonly top?: number;
	readonly left?: number;
	readonly style?: React.CSSProperties;
};

const hexToRgba = (hex: string): [number, number, number, number] => {
	const h = hex.replace('#', '');
	const full =
		h.length === 3
			? h
					.split('')
					.map((c) => c + c)
					.join('')
			: h;
	const n = parseInt(full, 16);
	return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, 1];
};

const isBlack = (k: unknown): boolean =>
	Array.isArray(k) &&
	k.length === 4 &&
	k[0] === 0 &&
	k[1] === 0 &&
	k[2] === 0 &&
	k[3] === 1;

/** Clona los datos y sustituye el negro puro por `color` (recursivo). */
const recolor = (
	data: LottieAnimationData,
	color: string,
): LottieAnimationData => {
	const target = hexToRgba(color);
	const walk = (node: unknown): unknown => {
		if (Array.isArray(node)) {
			return node.map(walk);
		}
		if (node !== null && typeof node === 'object') {
			const obj = node as Record<string, unknown>;
			if ('k' in obj && isBlack(obj.k)) {
				return {...obj, k: [...target]};
			}
			const out: Record<string, unknown> = {};
			for (const [key, value] of Object.entries(obj)) {
				out[key] = walk(value);
			}
			return out;
		}
		return node;
	};
	return walk(data) as LottieAnimationData;
};

export const LottieSticker: React.FC<LottieStickerProps> = ({
	id,
	size = 96,
	atFrame = 0,
	loop = false,
	durationInFrames,
	playbackRate = 1,
	direction = 'forward',
	color = '#FFFFFF',
	top,
	left,
	style,
}) => {
	const meta = LOTTIE_ICONS[id];
	const data = React.useMemo(
		() => recolor(meta.data, color),
		[meta.data, color],
	);
	return (
		<AbsoluteFill
			style={{
				top,
				left,
				width: size,
				height: size,
				...style,
			}}
		>
			<Lottie
				animationData={data}
				from={atFrame}
				durationInFrames={
					loop
						? durationInFrames ??
						  Math.ceil(meta.frames / playbackRate)
						: durationInFrames
				}
				loop={loop}
				playbackRate={playbackRate}
				direction={direction}
				style={{width: size, height: size}}
			/>
		</AbsoluteFill>
	);
};
