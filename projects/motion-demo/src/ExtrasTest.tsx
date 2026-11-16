import React from 'react';
import {AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {Flag, Heart, MapPin, Shield, Trophy} from 'lucide-react';
import {GlowStage, LottieSticker, MOTION_COLORS} from '../../../shared/motion';

// PRUEBA de los extras de la Fase B — 150 fotogramas (5 s), 540×960.
// Escena 1 (f0–89): iconos Lottie curados sobre GlowStage tinta:
//   - checkmark (f0, una pasada, 45 f): check que se dibuja, blanco.
//   - notification-v4 (f30, bucle 60 f): campana que suena, blanca.
//   - lock (f45, una pasada, 10 f, hacia atrás): candado que se CIERRA.
// Escena 2 (f90–119): motion blur A/B — dos barras rojas cruzan la
//   pantalla en 30 f a la misma velocidad: la superior con
//   <CameraMotionBlur samples={4}>, la inferior sin blur. En el still
//   de f105 la superior debe verse como estela y la inferior nítida.
// Escena 3 (f120–149): iconos Lucide (Trophy, MapPin, Shield, Flag,
//   Heart) con pop en cascada por spring. Still de QA: f140.
// Stills de QA: f20, f50, f80 (lottie), f105 (blur A/B), f140 (lucide).
// Verificado 15-nov-2026 (Fase B, R7 + R9 + R10).

const WhipBar: React.FC<{color: string; top: number}> = ({color, top}) => {
	const frame = useCurrentFrame();
	const x = interpolate(frame, [0, 29], [-160, 540], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	return (
		<div
			style={{
				position: 'absolute',
				top,
				left: x,
				width: 160,
				height: 60,
				background: color,
				borderRadius: 12,
			}}
		/>
	);
};

const LUCIDE_ICONS = [
	{Icon: Trophy, label: 'Trophy'},
	{Icon: MapPin, label: 'MapPin'},
	{Icon: Shield, label: 'Shield'},
	{Icon: Flag, label: 'Flag'},
	{Icon: Heart, label: 'Heart'},
];

const LucideRow: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	return (
		<div
			style={{
				position: 'absolute',
				top: 400,
				left: 0,
				right: 0,
				display: 'flex',
				justifyContent: 'center',
				gap: 28,
			}}
		>
			{LUCIDE_ICONS.map(({Icon, label}, i) => {
				const scale = spring({
					frame: frame - i * 3,
					fps,
					config: {damping: 12, stiffness: 200},
				});
				return (
					<div
						key={label}
						style={{
							transform: `scale(${scale})`,
							color: i === 2 ? MOTION_COLORS.green : '#FFFFFF',
						}}
					>
						<Icon size={72} strokeWidth={2} />
					</div>
				);
			})}
		</div>
	);
};

export const ExtrasTest: React.FC = () => {
	return (
		<AbsoluteFill style={{background: '#0A0A0A'}}>
			<GlowStage glow="ink" />
			<Sequence from={0} durationInFrames={90} name="lottie">
				<LottieSticker id="checkmark" size={140} atFrame={0} top={180} left={200} />
				<LottieSticker
					id="notification-v4"
					size={120}
					atFrame={30}
					loop
					durationInFrames={60}
					top={400}
					left={210}
				/>
				<LottieSticker
					id="lock"
					size={120}
					atFrame={45}
					direction="backward"
					top={600}
					left={210}
				/>
			</Sequence>
			<Sequence from={90} durationInFrames={30} name="motion-blur">
				<CameraMotionBlur samples={4} shutterAngle={180}>
					<WhipBar color={MOTION_COLORS.red} top={380} />
				</CameraMotionBlur>
				<WhipBar color="#FFFFFF" top={520} />
			</Sequence>
			<Sequence from={120} durationInFrames={30} name="lucide">
				<LucideRow />
			</Sequence>
		</AbsoluteFill>
	);
};
