import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {GlowStage, LottieSticker} from '../../../shared/motion';

// PRUEBA de los extras de la Fase B — 90 fotogramas (3 s), 540×960.
// Escena 1 (f0–89): iconos Lottie curados sobre GlowStage tinta:
//   - checkmark (f0, una pasada, 45 f): check que se dibuja, blanco.
//   - notification-v4 (f30, bucle 60 f): campana que suena, blanca.
//   - lock (f45, una pasada, 10 f, hacia atrás): candado que se CIERRA.
// Stills de QA: f20 (check a medias), f50 (check completo + campana),
// f80 (candado cerrado). Verificado 15-nov-2026 (Fase B, R7).

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
		</AbsoluteFill>
	);
};
