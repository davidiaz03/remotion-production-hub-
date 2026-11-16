// Reel escaparate — Marabana 40 · «Los que se fueron, los que vinieron»
// 1080×1920, 30 fps, 1677 fotogramas (55,9 s) = 1587 contenido + 90 sting.
// Estructura: 10 escenas en TransitionSeries (transiciones DOM de 12 f) +
// sting oficial. Audio: mezcla mix.wav (VO Kokoro + Flow) + SFX por sync
// point + audio del sting adelantado 9 f (compensa la deriva +0,3 s del
// render por tramos, lección V1.3). Los SFX posteriores al f1000 van
// adelantados 7 f por la misma deriva.
import React from 'react';
import {
	AbsoluteFill,
	Audio,
	Img,
	Sequence,
	interpolate,
	staticFile,
	useCurrentFrame,
} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {Sfx} from '../../../shared/motion';
import {
	fade,
	irisWipe,
	slide,
	waveWipe,
	whipPan,
} from '../../../shared/motion/transitions';
import {BottomKaraoke, capSegmentsToLines} from '../../../shared/captions';
import {CAPTIONS} from './captions';
import {CUTS, SEQ} from './timeline';
import {
	CameScene,
	CloseScene,
	DawnScene,
	DenunciaScene,
	HookScene,
	LoopScene,
	SardinasScene,
	ShoeScene,
	SiegeScene,
	StingScene,
	WinnersScene,
} from './scenes';

const T12 = linearTiming({durationInFrames: 12});
const LINES = capSegmentsToLines(CAPTIONS);

/** Marca de agua: logotipo COMPLETO blanco transparente desde el fotograma 0. */
const Watermark: React.FC = () => {
	const frame = useCurrentFrame();
	const opacity =
		frame < CUTS.sting - 18
			? 1
			: interpolate(frame, [CUTS.sting - 18, CUTS.sting - 9], [1, 0], {
					extrapolateLeft: 'clamp',
					extrapolateRight: 'clamp',
			  });
	return (
		<Img
			src={staticFile('img/logo-white.png')}
			style={{
				position: 'absolute',
				top: 30,
				right: 30,
				width: 115,
				opacity,
				filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.55))',
			}}
		/>
	);
};

export const MainReel: React.FC = () => {
	return (
		<AbsoluteFill style={{background: '#050507'}}>
			{/* Mezcla: VO + música Flow (55,9 s). */}
			<Audio src={staticFile('audio/mix.wav')} />

			<TransitionSeries>
				<TransitionSeries.Sequence durationInFrames={SEQ.hook} name="hook">
					<HookScene />
				</TransitionSeries.Sequence>
				<TransitionSeries.Transition presentation={slide({direction: 'from-right'})} timing={T12} />
				<TransitionSeries.Sequence durationInFrames={SEQ.siege} name="siege">
					<SiegeScene />
				</TransitionSeries.Sequence>
				<TransitionSeries.Transition presentation={waveWipe()} timing={T12} />
				<TransitionSeries.Sequence durationInFrames={SEQ.came} name="came">
					<CameScene />
				</TransitionSeries.Sequence>
				<TransitionSeries.Transition presentation={fade()} timing={T12} />
				<TransitionSeries.Sequence durationInFrames={SEQ.dawn} name="dawn">
					<DawnScene />
				</TransitionSeries.Sequence>
				<TransitionSeries.Transition presentation={fade()} timing={T12} />
				<TransitionSeries.Sequence durationInFrames={SEQ.loop} name="loop">
					<LoopScene />
				</TransitionSeries.Sequence>
				<TransitionSeries.Transition presentation={slide({direction: 'from-left'})} timing={T12} />
				<TransitionSeries.Sequence durationInFrames={SEQ.denuncia} name="denuncia">
					<DenunciaScene />
				</TransitionSeries.Sequence>
				<TransitionSeries.Transition presentation={whipPan()} timing={T12} />
				<TransitionSeries.Sequence durationInFrames={SEQ.winners} name="winners">
					<WinnersScene />
				</TransitionSeries.Sequence>
				<TransitionSeries.Transition presentation={fade()} timing={T12} />
				<TransitionSeries.Sequence durationInFrames={SEQ.shoe} name="shoe">
					<ShoeScene />
				</TransitionSeries.Sequence>
				<TransitionSeries.Transition presentation={irisWipe()} timing={T12} />
				<TransitionSeries.Sequence durationInFrames={SEQ.sardinas} name="sardinas">
					<SardinasScene />
				</TransitionSeries.Sequence>
				<TransitionSeries.Transition presentation={fade()} timing={T12} />
				<TransitionSeries.Sequence durationInFrames={SEQ.close} name="close">
					<CloseScene />
				</TransitionSeries.Sequence>
				<TransitionSeries.Transition presentation={fade()} timing={T12} />
				<TransitionSeries.Sequence durationInFrames={SEQ.sting} name="sting">
					{/* El video arranca en el corte nominal (local 12); el audio 9 f
						antes para compensar la deriva del render por tramos. */}
					<Sequence from={12} durationInFrames={90}>
						<StingScene />
					</Sequence>
					<Sequence from={3} durationInFrames={90}>
						<Audio src={staticFile('audio/sting-2x.wav')} />
					</Sequence>
				</TransitionSeries.Sequence>
			</TransitionSeries>

			{/* Karaoke inferior (patrón V1.3): solo durante el contenido. */}
			<Sequence from={0} durationInFrames={CUTS.sting}>
				<BottomKaraoke lines={LINES} />
			</Sequence>

			{/* Marca de agua: todo el contenido, fade antes del sting. */}
			<Sequence from={0} durationInFrames={CUTS.sting - 9}>
				<Watermark />
			</Sequence>

			{/* SFX por sync point (kit CC0; underVO bajo la narración). */}
			<Sfx id="pop-medium-in" atFrame={6} underVO />
			<Sfx id="boom-hit-medium" atFrame={169} underVO />
			<Sfx id="pop-medium-in" atFrame={169} underVO />
			<Sfx id="whoosh-medium-medium" atFrame={185} underVO />
			<Sfx id="pop-medium-in" atFrame={316} underVO />
			<Sfx id="whoosh-medium-medium" atFrame={430} underVO />
			<Sfx id="pop-medium-in" atFrame={442} underVO />
			<Sfx id="whoosh-fast-soft" atFrame={570} underVO />
			<Sfx id="pop-medium-in" atFrame={574} underVO />
			<Sfx id="whoosh-medium-medium" atFrame={717} underVO />
			<Sfx id="whoosh-medium-medium" atFrame={812} underVO />
			<Sfx id="pop-medium-in" atFrame={918} underVO />
			<Sfx id="pop-medium-in" atFrame={1017} underVO />
			<Sfx id="whoosh-medium-medium" atFrame={1066} underVO />
			<Sfx id="pop-medium-in" atFrame={1153} underVO />
			<Sfx id="pop-medium-in" atFrame={1240} underVO />
			<Sfx id="pop-medium-in" atFrame={1308} underVO />
			<Sfx id="riser-2s-strong" atFrame={1320} underVO />
			<Sfx id="pop-medium-in" atFrame={1358} underVO />
			<Sfx id="pop-medium-in" atFrame={1373} underVO />
			<Sfx id="sting-warm-short" atFrame={1439} underVO />
			<Sfx id="pop-medium-in" atFrame={1549} underVO />
		</AbsoluteFill>
	);
};
