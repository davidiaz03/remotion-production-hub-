// Karaoke estilo El Libreto (NO reutilizar BottomKaraoke del Memorial:
// ese es estilo Memorial — Archivo Black, texto blanco, keyword roja).
// El Libreto: Noto Sans Bold, texto Papel #F5F1E8 sobre banda Tinta
// semitransparente, palabra clave con FONDO Resaltador #FFD60A, y la
// palabra del veredicto («FALSO.») con fondo Lápiz rojo #C0392B.
// Banda en y 1100-1240 (encima de la zona de UI inferior de Facebook,
// que empieza en y=1248). Las palabras aparecen una a una en su `s`
// con pop de 0,1 s; el chunk se oculta 0,4 s después de su última
// palabra (igual que asume la auditoría de audio).
// H8 (auditoría FB v1): el pop es 1,15 (no 1,3: a 1,3 la palabra que
// hace pop invadía a la vecina y se leía «MESSIESTUVO») y las
// micropalabras se fusionan en grupos de visualización: las palabras
// consecutivas dentro de un mismo grupo aparecen juntas en el `s` de
// la primera, con un ancho máximo de grupo de 0,18 s (ninguna palabra
// aparece más de 0,18 s antes de su onset). Así ningún pop se corta
// antes de terminar ni colisiona con el vecino.
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

	// Beats en los que la pantalla lleva su propio texto grande y el
	// karaoke se oculta para no duplicarlo (H3, auditoría FB v1):
	// - 0-2,7 s: el título del gancho «MESSI NUNCA LO DIJO» ES el
	//   caption de L1.
	// - 3,52-5,24 s: el contador «62.000 REACCIONES».
	// - 6,54-8,2 s: la píldora «750.000 SEGUIDORES» (todo el chunk,
	//   para no cortar «CON» a mitad de palabra).
	// - 10,1-13,0 s: la tarjeta «Usa el nombre de El Taiger. Nada
	//   que ver con él.» es L3 entera.
	// - 15,0-15,87 s: la placa de la foto original (movida a la
	//   banda del karaoke, H5: en su posición anterior tapaba la
	//   etiqueta «Original» de la imagen).
	// - 17,78-24,0 s: lupa Gemini + checklist de ausencia + tarjeta de
	//   pregunta (cada beat ES el caption de su frase).
	// - 28,43-29,9 s: la negación «PERO NO HABLÓ DE CUBA» (igual que FB).
	// - 32,6-43 s: el veredicto (FALSO + dos líneas) y la pregunta de
	//   marca del cierre son texto grande en pantalla.
	if (t < 2.7) return null;
	if (t >= 3.52 && t < 5.24) return null;
	if (t >= 6.54 && t < 8.2) return null;
	if (t >= 10.1 && t < 13.0) return null;
	if (t >= 15.0 && t < 15.87) return null;
	if (t >= 17.78 && t < 24.0) return null;
	if (t >= 28.43 && t < 29.9) return null;
	if (t >= 32.6) return null;
	// Chunk activo: el último que ya empezó.
	let active: CapChunk | null = null;
	for (const c of ALL_CHUNKS) {
		if (t >= c.start) active = c;
		else break;
	}
	if (!active) return null;
	// Se oculta 0,4 s después de la última palabra del chunk.
	if (t > active.end + 0.4) return null;

	// Grupos de visualización (H8): una palabra se fusiona con el grupo
	// anterior si cae a menos de 0,18 s del inicio del grupo; el grupo
	// entero hace pop junto en el `s` de su primera palabra.
	type Group = {s: number; words: typeof active.words};
	const groups: Group[] = [];
	for (const w of active.words) {
		const last = groups[groups.length - 1];
		if (last && w.s - last.s < 0.18) {
			last.words.push(w);
		} else {
			groups.push({s: w.s, words: [w]});
		}
	}

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
				{groups.map((g, gi) => {
					const shown = t >= g.s;
					const pop = shown
						? interpolate(t - g.s, [0, 0.1], [1.15, 1], {
								extrapolateLeft: 'clamp',
								extrapolateRight: 'clamp',
							})
						: 1;
					return (
						<span
							key={gi}
							style={{
								display: 'inline-flex',
								opacity: shown ? 1 : 0,
								transform: `scale(${pop})`,
								margin: '0 10px',
							}}
						>
							{g.words.map((w, i) => {
								const isVerdict = w.t === 'FALSO.';
								return (
									<span
										key={i}
										style={{
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
						</span>
					);
				})}
			</div>
		</div>
	);
};
