import React from 'react';
import {AbsoluteFill} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {
	GlowCrossfade,
	GlowStage,
	KineticHeadline,
	StepCard,
} from '../../../shared/motion';
import {fade, slide} from '../../../shared/motion/transitions';

// PLANTILLA motion-reel (Fase B, R12) — esqueleto de explainer animado:
// 3 escenas en <TransitionSeries>, 90 fotogramas (3 s), 1080×1920.
// Total = Σ secuencias (36+36+42=114) − Σ transiciones (2×12) = 90.
// Para crecer: añade escenas (duración en project.json = Σ seq − Σ trans),
// pon el karaoke con <TopKaraoke lines={...} /> (ver shared/captions/),
// los SFX con <Sfx id="..." atFrame={...} /> (previa copia con
// shared/motion/sfx/add-sfx.mjs) y la música con scripts/audio/mix.py.
//
// REGLA TransitionSeries (verificada en motion-demo): el reloj local de la
// escena entrante empieza AL INICIO de la transición; por eso el contenido
// de cada escena entrante lleva delay = duración de la transición (12 f)
// para aterrizar en el corte nominal sincronizado con la VO.

const T12 = linearTiming({durationInFrames: 12});

export const MainReel: React.FC = () => {
	return (
		<AbsoluteFill style={{background: '#0A0A0A'}}>
			<GlowStage glow="danger" />
			<GlowCrossfade to="safe" atFrame={60} durationInFrames={30} />
			<TransitionSeries>
				<TransitionSeries.Sequence durationInFrames={36} name="hook">
					<KineticHeadline
						lines={[
							[{t: 'Martí-Fidel: leer, pensar'}],
							[{t: 'El gancho', accent: true}, {t: 'va aquí.'}],
						]}
						top={700}
					/>
				</TransitionSeries.Sequence>
				<TransitionSeries.Transition
					presentation={slide({direction: 'from-right'})}
					timing={T12}
				/>
				<TransitionSeries.Sequence durationInFrames={36} name="steps">
					<StepCard
						n={1}
						title="Primer paso"
						subtitle="Sustituye por el contenido real del guion."
						delay={12}
						top={600}
					/>
					<StepCard
						n={2}
						title="Segundo paso"
						subtitle="Un paso por tarjeta; una idea por frase."
						delay={14}
						top={950}
					/>
				</TransitionSeries.Sequence>
				<TransitionSeries.Transition
					presentation={fade()}
					timing={T12}
				/>
				<TransitionSeries.Sequence durationInFrames={42} name="cta">
					<KineticHeadline
						lines={[
							[{t: 'Cierre y'}, {t: 'llamada', accent: true}],
							[{t: 'a la acción.'}],
						]}
						delay={12}
						top={700}
					/>
				</TransitionSeries.Sequence>
			</TransitionSeries>
		</AbsoluteFill>
	);
};
