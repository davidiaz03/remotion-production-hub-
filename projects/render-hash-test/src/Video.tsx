import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {CAPTIONS} from './captions';

// Fixture mínimo para tests/render-chunks-hash.test.mjs (P0-3): 30 f,
// palabra actual del caption + un asset referenciado (img/dot.png, que
// el test genera en la copia de trabajo: los PNG no se commitean).
// El fondo '#0A0A0A' lo toca el test para probar la invalidación por
// cambio de código: no cambiar el literal sin tocar el test.
export const MainReel: React.FC = () => {
	const frame = useCurrentFrame();
	const t = frame / 30;
	let word = '';
	for (const seg of CAPTIONS) {
		for (const ch of seg.chunks) {
			for (const w of ch.words) {
				if (t >= w.s && t < w.e) word = w.t;
			}
		}
	}
	return (
		<AbsoluteFill
			style={{
				background: '#0A0A0A',
				justifyContent: 'center',
				alignItems: 'center',
			}}
		>
			<div style={{color: 'white', fontSize: 120, fontFamily: 'sans-serif'}}>
				{word}
			</div>
			<Img src={staticFile('img/dot.png')} style={{width: 10, height: 10}} />
		</AbsoluteFill>
	);
};
