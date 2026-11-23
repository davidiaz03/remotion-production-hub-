// Karaoke estilo El Libreto (NO reutilizar BottomKaraoke del Memorial:
// ese es estilo Memorial — Archivo Black, texto blanco, keyword roja).
// El Libreto: Noto Sans Bold, texto Papel #F5F1E8 sobre banda Tinta
// semitransparente, palabra clave con FONDO Resaltador #FFD60A, y la
// palabra del veredicto («FALSO.») con fondo Lápiz rojo #C0392B.
// Banda en y 1100-1240 (encima de la zona de UI inferior de Facebook,
// que empieza en y=1248). Las palabras aparecen una a una en su `s`
// con pop de 0,1 s; el chunk se oculta 0,4 s después de su última
// palabra (igual que asume la auditoría de audio).
import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {CAPTIONS, CapChunk} from './captions';

const PAPEL = '#F5F1E8';
const TINTA = '#1A1A2E';
const ROJO = '#C0392B';
const RESALTADOR = '#FFD60A';

const ALL_CHUNKS: CapChunk[] = CAPTIONS.flatMap((s) => s.chunks);

export const LibretoKaraoke: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;

	// Durante el beat de la negación (18,54-19,5 s) el texto grande
	// «PERO NO HABLÓ DE CUBA» ES el caption: el karaoke se oculta
	// para no duplicarlo ni cubrir las caras de fondo de la foto.
	if (t >= 18.54 && t < 19.5) return null;
	// Chunk activo: el último que ya empezó.
	let active: CapChunk | null = null;
	for (const c of ALL_CHUNKS) {
		if (t >= c.start) active = c;
		else break;
	}
	if (!active) return null;
	// Se oculta 0,4 s después de la última palabra del chunk.
	if (t > active.end + 0.4) return null;

	return (
		<div
			style={{
				position: 'absolute',
				left: 65,
				right: 65,
				top: 1100,
				height: 140,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				backgroundColor: 'rgba(26, 26, 46, 0.82)',
				borderRadius: 18,
				padding: '0 28px',
			}}
		>
			<div
				style={{
					display: 'flex',
					flexWrap: 'wrap',
					justifyContent: 'center',
					alignItems: 'center',
					fontFamily: "'Noto Sans', sans-serif",
					fontWeight: 700,
					fontSize: 56,
					lineHeight: 1.25,
					color: PAPEL,
					textAlign: 'center',
				}}
			>
				{active.words.map((w, i) => {
					const shown = t >= w.s;
					const pop = shown
						? interpolate(t - w.s, [0, 0.1], [1.3, 1], {
								extrapolateLeft: 'clamp',
								extrapolateRight: 'clamp',
						  })
						: 1;
					const isVerdict = w.t === 'FALSO.';
					return (
						<span
							key={i}
							style={{
								opacity: shown ? 1 : 0,
								transform: `scale(${pop})`,
								margin: '0 7px',
								padding: w.kw ? '2px 12px' : '2px 0',
								borderRadius: 8,
								backgroundColor: isVerdict
									? ROJO
									: w.kw
										? RESALTADOR
										: 'transparent',
								color: isVerdict ? PAPEL : w.kw ? TINTA : PAPEL,
							}}
						>
							{w.t}
						</span>
					);
				})}
			</div>
		</div>
	);
};
