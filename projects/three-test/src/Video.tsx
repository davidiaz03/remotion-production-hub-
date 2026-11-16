import {Float} from '@react-three/drei';
import {ThreeCanvas} from '@remotion/three';
import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';

/**
 * Prueba de verificación de @remotion/three: un cubo rojo y un anillo
 * dorado girando (rotación determinista desde useCurrentFrame, nunca
 * useFrame: Remotion renderiza fotograma a fotograma).
 *
 * Float es de @react-three/drei y demuestra que drei también funciona.
 * Sin texturas ni modelos externos: todo geometría procedural, para que
 * la prueba no dependa de red ni de assets.
 */
const Scene: React.FC = () => {
	const frame = useCurrentFrame();
	const {durationInFrames} = useVideoConfig();
	const progress = frame / durationInFrames;
	// Una vuelta y media en 3 s.
	const angle = progress * Math.PI * 3;
	const tilt = interpolate(frame, [0, durationInFrames], [0.35, -0.35]);

	return (
		<>
			<ambientLight intensity={0.7} />
			<directionalLight position={[4, 6, 5]} intensity={1.6} />
			<pointLight position={[-5, -3, 4]} intensity={12} color="#fbbf24" />
			<Float speed={1.4} rotationIntensity={0.15} floatIntensity={0.6}>
				<mesh rotation={[tilt, angle, 0]}>
					<boxGeometry args={[2.1, 2.1, 2.1]} />
					<meshStandardMaterial color="#e11d48" roughness={0.25} metalness={0.35} />
				</mesh>
			</Float>
			<mesh rotation={[Math.PI / 2.4, 0, angle * 0.6]} position={[0, 0, -0.4]}>
				<torusGeometry args={[2.9, 0.09, 16, 90]} />
				<meshStandardMaterial color="#fbbf24" roughness={0.2} metalness={0.8} />
			</mesh>
		</>
	);
};

export const MainReel: React.FC = () => {
	const {width, height} = useVideoConfig();
	const frame = useCurrentFrame();
	const fade = interpolate(frame, [0, 12, 78, 89], [0, 1, 1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	return (
		<AbsoluteFill style={{background: '#0b1220'}}>
			<ThreeCanvas width={width} height={height}>
				<Scene />
			</ThreeCanvas>
			<AbsoluteFill
				style={{
					justifyContent: 'flex-end',
					alignItems: 'center',
					paddingBottom: 90,
					opacity: fade,
				}}
			>
				<div
					style={{
						color: '#fff',
						fontFamily: 'sans-serif',
						fontSize: 34,
						fontWeight: 800,
						letterSpacing: 2,
						textAlign: 'center',
					}}
				>
					3D EN REMOTION · CUBO + ANILLO
				</div>
				<div
					style={{
						color: '#94a3b8',
						fontFamily: 'sans-serif',
						fontSize: 22,
						marginTop: 10,
					}}
				>
					@remotion/three · fiber 8 · drei 9
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
