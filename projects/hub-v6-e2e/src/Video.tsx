import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {BottomKaraoke} from '../../../shared/captions/BottomKaraoke';
import {capSegmentsToLines} from '../../../shared/captions/legacy';
import {ClosingCard} from '../../../shared/ClosingCard';
import {SafeZoneOverlay} from '../../../shared/SafeZoneOverlay';
import {getPlatformPreset} from '../../../shared/platforms';
import {CAPTIONS} from './captions';
import hooksData from '../research/hooks.json';

// Esqueleto generado por scripts/new-reel.mjs (hub-v6-e2e).
// Cada escena es una TARJETA con su línea del guion sobre degradado:
// el borrador se lee como un storyboard. TODO por escena: sustituir
// la tarjeta por el asset real (foto, KenBurnsStill, motion graphics)
// y borrar el rótulo. El karaoke, el audio, el cierre y la guía de
// zonas seguras ya van cableados.
const PLATFORM = 'instagram-reels';
const SCENES = [
	{name: 'S1', from: 0, dur: 110, line: 'Por primera vez en treinta años, el Caribe dejó de votar unido.', bg: 'linear-gradient(160deg, #0A1628 0%, #132238 100%)'},
	{name: 'S2', from: 110, dur: 110, line: 'Martí lo vio venir en 1891.', bg: 'linear-gradient(160deg, #1C0A0A 0%, #3A1010 100%)'},
	{name: 'S3', from: 220, dur: 98, line: 'Leer para no olvidar. Pensar para no arrodillarse.', bg: 'linear-gradient(160deg, #0A1F1C 0%, #123B34 100%)'},
];
const CLOSING_FROM = 319;
const CLOSING_DUR = 75;
// Ganchos (research/hooks.json, editable): la variante 0 es la
// primera línea del guion. hook-test.mjs renderiza los primeros 3 s
// por variante pasando --props {"hookVariant": N}.
const HOOKS: {text: string; style?: string}[] =
	(hooksData as {variants?: {text: string; style?: string}[]}).variants?.length
		? (hooksData as {variants: {text: string; style?: string}[]}).variants
		: [{text: 'Por primera vez en treinta años, el Caribe dejó de votar unido.', style: 'title'}];

const SceneCard: React.FC<{scene: (typeof SCENES)[number]; hookText?: string}> = ({scene, hookText}) => {
	const f = useCurrentFrame();
	const fade = interpolate(f, [0, 8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	return (
		<AbsoluteFill style={{background: scene.bg, justifyContent: 'center', alignItems: 'center', opacity: fade}}>
			<div style={{position: 'absolute', top: 64, left: 48, fontFamily: 'monospace', fontSize: 28, color: 'rgba(255,255,255,0.55)'}}>
				{scene.name} · {hookText ? 'GANCHO' : 'ESQUELETO — sustituir por el asset real'}
			</div>
			<div style={{fontFamily: "'Archivo Black', sans-serif", fontSize: 56, lineHeight: 1.2, color: '#FFFFFF', textAlign: 'center', padding: '0 80px', textTransform: 'uppercase'}}>
				{hookText ?? scene.line}
			</div>
		</AbsoluteFill>
	);
};

export const MainReel: React.FC<{hookVariant?: number; debugSafeZones?: boolean}> = ({hookVariant = 0, debugSafeZones = false}) => {
	const preset = getPlatformPreset(PLATFORM);
	const hook = HOOKS[hookVariant] ?? HOOKS[0];
	const lines = React.useMemo(() => capSegmentsToLines(CAPTIONS), []);
	return (
		<AbsoluteFill style={{background: '#0A1628'}}>
			<Audio src={staticFile('audio/vo.wav')} />
			{SCENES.map((s, i) => (
				<Sequence key={s.name} from={s.from} durationInFrames={s.dur} name={s.name}>
					<SceneCard scene={s} hookText={i === 0 ? hook.text : undefined} />
				</Sequence>
			))}
			<Sequence from={CLOSING_FROM} durationInFrames={CLOSING_DUR} name="CLOSING">
				<ClosingCard title="Prueba hub-v6" handle="@memorialdenuncia" sequenceFrames={CLOSING_DUR} />
			</Sequence>
			{/* Karaoke solo durante la VO: BottomKaraoke es pegajoso y sin
			esta Sequence el último chunk queda visible sobre el cierre. */}
			<Sequence from={0} durationInFrames={CLOSING_FROM} name="KARAOKE">
				<BottomKaraoke lines={lines} size={preset.caption.size} longSize={preset.caption.longSize} bottom={preset.caption.bottom} variant="pill" />
			</Sequence>
			<SafeZoneOverlay platform={PLATFORM} show={debugSafeZones} />
		</AbsoluteFill>
	);
};
