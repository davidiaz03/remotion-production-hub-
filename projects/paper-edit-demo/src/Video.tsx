import React from 'react';
import {
	AbsoluteFill,
	Img,
	OffthreadVideo,
	Sequence,
	interpolate,
	staticFile,
	useCurrentFrame,
} from 'remotion';
import {BottomKaraoke} from '../../../shared/captions/BottomKaraoke';
import {LowerThird} from '../../../shared/LowerThird';
import {CUT, type CutLowerThird} from './cut';

// QuietReel — plantilla tranquila para reels de material grabado.
// Proyecto paper-edit-demo — «Prueba edición en papel».
//
// El montaje (cortes + transiciones) lo hace assemble-cut.py con ffmpeg
// y llega aquí como UN solo video (public/video/rough-cut.mp4). Esta
// composición solo añade la capa de acabado: marca de agua, karaoke
// opcional, lower-thirds y cierre con logo animado. Las transiciones
// NO se hacen en Remotion: Remotion no funde audio entre clips
// solapados y el resultado suena turbio (lección 17-nov-2026).

// ---------- marca de agua (logotipo COMPLETO, blanco/transparente) ----------
// Patrón Marabana V1.3 / Martí-Fidel: 115 px, arriba derecha, desde el
// fotograma 0, fade de salida antes del sting. Nunca solo la estrella,
// nunca placa de fondo (el scrim radial suave solo si el fondo es claro).
const Watermark: React.FC<{fadeOutFrom: number}> = ({fadeOutFrom}) => {
	const frame = useCurrentFrame();
	const opacity = interpolate(frame, [fadeOutFrom, fadeOutFrom + 10], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	return (
		<Img
			src={staticFile('img/logo-white.png')}
			style={{
				position: 'absolute',
				top: 54,
				right: 40,
				width: 115,
				opacity,
				filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.6))',
				pointerEvents: 'none',
			}}
		/>
	);
};

// ---------- lower-third con fundido de entrada y salida ----------
// Cuando el karaoke está activo, el lower-third sube por encima de la
// zona de subtítulos (bottom 480 en vez de 190): a 190 se solapa con
// el karaoke (verificado en la prueba paper-edit-demo, f_45).
const FadingLowerThird: React.FC<{lt: CutLowerThird; karaokeOn: boolean}> = ({
	lt,
	karaokeOn,
}) => {
	const f = useCurrentFrame();
	const opacity =
		interpolate(f, [0, 12], [0, 1], {
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
		}) *
		interpolate(f, [lt.frames - 10, lt.frames], [1, 0], {
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
		});
	return (
		<div style={{opacity}}>
			<LowerThird
				title={lt.title}
				subtitle={lt.subtitle}
				bottom={karaokeOn ? 480 : 190}
			/>
		</div>
	);
};

// ---------- cierre animado oficial (fondo negro propio) ----------
const ClosingSting: React.FC = () => {
	const f = useCurrentFrame();
	const fadeIn = interpolate(f, [0, 4], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	return (
		<AbsoluteFill style={{background: '#000', opacity: fadeIn}}>
			<OffthreadVideo
				src={staticFile('video/sting-black-2x.mp4')}
				style={{width: '100%', height: '100%', objectFit: 'cover'}}
			/>
		</AbsoluteFill>
	);
};

// ================================================================
// COMPOSICIÓN PRINCIPAL — rough cut + cierre
// Duración total = CUT.totalFrames (roughCutFrames + stingFrames).
// ================================================================
export const QuietReel: React.FC = () => {
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<Sequence
				from={0}
				durationInFrames={CUT.roughCutFrames}
				name="rough-cut"
			>
				<OffthreadVideo
					src={staticFile(CUT.roughCutFile)}
					style={{width: '100%', height: '100%', objectFit: 'cover'}}
				/>
			</Sequence>
			{CUT.lowerThirds.map((lt, i) => (
				<Sequence
					key={i}
					from={lt.atFrame}
					durationInFrames={lt.frames}
					name={`lower-third-${i + 1}`}
				>
					<FadingLowerThird lt={lt} karaokeOn={CUT.karaoke} />
				</Sequence>
			))}
			{CUT.karaoke ? <BottomKaraoke captions={CUT.captions} /> : null}
			<Watermark fadeOutFrom={CUT.roughCutFrames - 10} />
			<Sequence
				from={CUT.roughCutFrames}
				durationInFrames={CUT.stingFrames}
				name="sting"
			>
				<ClosingSting />
			</Sequence>
		</AbsoluteFill>
	);
};
