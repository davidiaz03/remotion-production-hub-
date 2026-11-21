import React from 'react';
import {AbsoluteFill} from 'remotion';
import {
	getPlatformPreset,
	organicZoneRect,
	safeZoneRect,
	type PlatformId,
} from './platforms';

export type SafeZoneOverlayProps = {
	/** Plataforma cuyas zonas se dibujan. */
	platform?: PlatformId | string;
	/** Solo se dibuja si es true: es una guía de estudio, nunca va en el máster. */
	show?: boolean;
	/** Qué zonas dibujar: 'ads' (estricta), 'organic' (UI real) o ambas. */
	mode?: 'ads' | 'organic' | 'both';
};

/**
 * Guía visual de zonas seguras (hub-v6, solo estudio/preview).
 *
 * Dibuja la zona segura de anuncios (rojo discontinuo: texto crítico y
 * logos dentro) y la zona orgánica (ámbar discontinuo: subtítulos
 * dentro) de la plataforma. Se activa con `show` (p. ej. desde una
 * prop de debug de la composición) y NUNCA debe quedar encendida en
 * un render de entrega.
 */
export const SafeZoneOverlay: React.FC<SafeZoneOverlayProps> = ({
	platform,
	show = false,
	mode = 'both',
}) => {
	if (!show) return null;
	const preset = getPlatformPreset(platform);
	const ads = safeZoneRect(preset);
	const org = organicZoneRect(preset);
	const label = (
		text: string,
		color: string,
		top: number,
		left: number,
	) => (
		<div
			style={{
				position: 'absolute',
				top,
				left,
				backgroundColor: color,
				color: '#fff',
				fontSize: 26,
				fontFamily: 'monospace',
				padding: '4px 12px',
				borderRadius: 6,
			}}
		>
			{text}
		</div>
	);
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			{(mode === 'both' || mode === 'organic') && (
				<>
					<div
						style={{
							position: 'absolute',
							left: org.x,
							top: org.y,
							width: org.w,
							height: org.h,
							border: '3px dashed rgba(255,176,0,0.9)',
							boxSizing: 'border-box',
						}}
					/>
					{label(
						`ORGÁNICA ${preset.label}`,
						'rgba(255,176,0,0.9)',
						org.y + 8,
						org.x + 8,
					)}
				</>
			)}
			{(mode === 'both' || mode === 'ads') && (
				<>
					<div
						style={{
							position: 'absolute',
							left: ads.x,
							top: ads.y,
							width: ads.w,
							height: ads.h,
							border: '3px dashed rgba(237,28,36,0.95)',
							boxSizing: 'border-box',
						}}
					/>
					{label(
						`SEGURA ${preset.label}`,
						'rgba(237,28,36,0.95)',
						ads.y + 8,
						ads.x + 8,
					)}
				</>
			)}
		</AbsoluteFill>
	);
};
