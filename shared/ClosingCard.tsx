import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {MEMORIAL_RED} from './captions/BottomKaraoke';

export type ClosingCardProps = {
	/** Titular de cierre (1-2 líneas). */
	title: string;
	/** Subtítulo o frase de cierre. */
	subtitle?: string;
	/** Handle o CTA (p. ej. '@memorialdenuncia'). */
	handle?: string;
	/** Logo en public/ (ruta relativa, p. ej. 'img/logo-white.png'). */
	logo?: string;
	/** Fondo CSS (por defecto, azul noche de la casa). */
	background?: string;
	/** Color de acento (por defecto, rojo corporativo). */
	accent?: string;
	/** Fotogramas de entrada (fade + escala). */
	enterFrames?: number;
	/**
	 * Duración de la Sequence que contiene la tarjeta: la salida hace
	 * fade en los últimos `exitFrames` de esa Sequence. Sin este dato
	 * no hay fade de salida (useVideoConfig da la duración de la
	 * composición, no de la Sequence).
	 */
	sequenceFrames?: number;
	/** Fotogramas de salida (fade al final de la Sequence). */
	exitFrames?: number;
};

/**
 * Tarjeta de cierre reutilizable (hub-v6).
 *
 * El sting final que cada reel construía a mano: logotipo completo
 * centrado, titular, regla roja, subtítulo y handle en píldora, sobre
 * el azul noche de la casa. Se usa dentro de una `Sequence` al final
 * de la composición (pasar su duración en `sequenceFrames` para el
 * fade de salida).
 *
 * Regla del Memorial: el logotipo es SIEMPRE el completo, nunca solo
 * la estrella; aquí va en blanco sobre fondo oscuro.
 */
export const ClosingCard: React.FC<ClosingCardProps> = ({
	title,
	subtitle,
	handle,
	logo,
	background = 'linear-gradient(170deg, #0A1628 0%, #132238 55%, #0A1628 100%)',
	accent = MEMORIAL_RED,
	enterFrames = 12,
	sequenceFrames,
	exitFrames = 10,
}) => {
	const frame = useCurrentFrame();
	const enter = interpolate(frame, [0, enterFrames], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const scale = interpolate(frame, [0, enterFrames], [0.94, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const exit =
		sequenceFrames === undefined
			? 1
			: interpolate(
					frame,
					[sequenceFrames - exitFrames, sequenceFrames],
					[1, 0],
					{extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
				);
	const opacity = enter * exit;
	return (
		<AbsoluteFill
			style={{
				background,
				justifyContent: 'center',
				alignItems: 'center',
				opacity,
				transform: `scale(${scale})`,
			}}
		>
			<div
				style={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					padding: '0 90px',
					textAlign: 'center',
				}}
			>
				{logo ? (
					<Img
						src={staticFile(logo)}
						style={{width: 300, height: 'auto', marginBottom: 64}}
					/>
				) : null}
				<div
					style={{
						fontFamily: "'Archivo Black', sans-serif",
						fontSize: 66,
						lineHeight: 1.15,
						color: '#FFFFFF',
						textTransform: 'uppercase',
					}}
				>
					{title}
				</div>
				<div
					style={{
						width: 120,
						height: 8,
						backgroundColor: accent,
						margin: '44px 0',
						borderRadius: 4,
					}}
				/>
				{subtitle ? (
					<div
						style={{
							fontFamily: 'sans-serif',
							fontSize: 36,
							lineHeight: 1.35,
							color: 'rgba(255,255,255,0.85)',
						}}
					>
						{subtitle}
					</div>
				) : null}
				{handle ? (
					<div
						style={{
							marginTop: 72,
							fontFamily: 'monospace',
							fontSize: 32,
							color: '#FFFFFF',
							border: `2px solid ${accent}`,
							borderRadius: 999,
							padding: '16px 36px',
						}}
					>
						{handle}
					</div>
				) : null}
			</div>
		</AbsoluteFill>
	);
};
