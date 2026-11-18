import React from 'react';
import {
	AbsoluteFill,
	Audio,
	Easing,
	Img,
	OffthreadVideo,
	Sequence,
	interpolate,
	staticFile,
	useCurrentFrame,
} from 'remotion';
import {
	BottomKaraoke,
	MEMORIAL_RED,
	capSegmentsToLines,
	textOutline,
	type KaraokeLine,
} from '../../../shared/captions';
import {CAPTIONS} from './captions';
import {MAP_DOTS, MAP_DOT_OFFSETS} from './mapDots';

// ================================================================
// «Martí-Fidel: leer, pensar» — reel vertical 1080×1920, 30 fps.
// 1507 fotogramas = 50,23 s. Tiempos anclados a la VO real (Kokoro
// em_alex, 45,69 s): ver public/audio/vo-lines.json y CREATIVE_BRIEF.md.
// Estructura: cifra → caída → cita («Ya estaba escrito en 1891»).
// ================================================================

const FPS = 30;
const ARCHIVO = "'Archivo Black', sans-serif";
const COND = "'Roboto Condensed', sans-serif";
const AMBER = '#F5B301';
const GRAY = '#9AA3AD';
const NAVY = '#0A1420';
const NAVY2 = '#0E1E33';
const SEPIA_BG = '#171208';
const SEPIA_GOLD = '#C9A86A';

// ---------- karaoke (BottomKaraoke, patrón Pilar V30 / Marabana V1.3) ----------
// Ventana A: fragmentos 1–7 (0–29,87 s). Ventana B: fragmento 10
// (40,69–45,69 s), con tiempos desplazados a su Sequence. Las dos citas
// (fragmentos 8–9) van como texto estático, sin karaoke.
//
// V1.2 (auditoría densa): BottomKaraoke es «pegajoso» — la última línea
// cuyo inicio pasó queda visible hasta que empieza la siguiente, sin
// corte por fin de línea. Por eso, suprimir un chunk NO basta: hay que
// insertar una línea VACÍA (palabra '') en su lugar para que el karaoke
// se apague mientras el texto estático lleva esas palabras. Sin la
// línea vacía, el chunk anterior quedaría visible y rancio.
//   - Seg 6: se suprimen «WASHINGTON LO LLAMÓ PARA» y «QUE CAMBIARA SU
//     VOTO.» (la tarjeta de Browne muestra la cita completa desde f113);
//     línea vacía en 23,03 s (V1.3: inicio de «WASHINGTON» en la VO
//     editada; V1.2 era 22,98 s).
//   - Seg 7: se suprime «1891, MARTÍ DIJO…» (el «1891» gigante + el
//     título estático «MARTÍ DIJO…» ya lo dicen); línea vacía en 27,36 s
//     (V1.3; V1.2 era 27,44 s).
//   - Seg 10: se suprime «EXIGEN EL FIN DEL» (el título «PAÍSES EXIGEN
//     EL FIN DEL BLOQUEO» lo muestra); línea vacía en 41,84 s (V1.3;
//     V1.2 era 41,66 s).
//   - Seg 10: se suprime también «LEER. PENSAR.» (las palabras del
//     título aparecen con los golpes de voz en 44,87/45,20 s; el karaoke
//     las duplicaba apiladas 34 px más abajo — mismo defecto que el de
//     «EXIGEN», detectado en la verificación visual de V1.3); línea
//     vacía en 44,82 s hasta el fin de karaoke-B (45,70 s).
const CAPTIONS_A = CAPTIONS.slice(0, 7).map((seg) => {
	if (seg.id === 6) return {...seg, chunks: seg.chunks.slice(0, 3)};
	if (seg.id === 7) return {...seg, chunks: seg.chunks.slice(0, 2)};
	return seg;
});
const CLEAR_BROWNE: KaraokeLine = {words: [{t: '', s: 23.032, e: 25.54}]};
const CLEAR_1891: KaraokeLine = {words: [{t: '', s: 27.36, e: 29.87}]};
const LINES_A: KaraokeLine[] = (() => {
	const lines = capSegmentsToLines(CAPTIONS_A);
	// Insertar en orden temporal (BottomKaraoke asume líneas ordenadas).
	const out: KaraokeLine[] = [];
	for (const line of lines) {
		const s = line.words[0]?.s ?? 0;
		if (s >= CLEAR_BROWNE.words[0].s && !out.includes(CLEAR_BROWNE))
			out.push(CLEAR_BROWNE);
		if (s >= CLEAR_1891.words[0].s && !out.includes(CLEAR_1891))
			out.push(CLEAR_1891);
		out.push(line);
	}
	if (!out.includes(CLEAR_1891)) out.push(CLEAR_1891);
	return out;
})();
const L9_START = 40.686;
const CAPTIONS_B = CAPTIONS.slice(9, 10).map((seg) => ({
	...seg,
	// i=1 «EXIGEN EL FIN DEL» (duplica el título); i=4 «LEER. PENSAR.»
	// (duplica las palabras del título en 44,87/45,20 s; V1.3).
	chunks: seg.chunks.filter((_, i) => i !== 1 && i !== 4),
}));
const LINES_B: KaraokeLine[] = (() => {
	const lines = capSegmentsToLines(CAPTIONS_B).map((line) => ({
		words: line.words.map((w) => ({
			...w,
			s: w.s - L9_START,
			e: w.e - L9_START,
		})),
	}));
	// Línea vacía en 41,84 s (local 1,154 s): apaga el karaoke mientras
	// el título muestra «PAÍSES EXIGEN EL FIN DEL BLOQUEO».
	// (V1.3: inicio de «EXIGEN» en la VO editada; V1.2 era 41,66 s.)
	const clear: KaraokeLine = {
		words: [{t: '', s: 41.84 - L9_START, e: 42.78 - L9_START}],
	};
	// Línea vacía en 44,82 s (local 4,134 s): apaga el karaoke mientras
	// el título muestra «LEER. PENSAR.» con los golpes de voz (V1.3).
	const clearLeer: KaraokeLine = {
		words: [{t: '', s: 44.82 - L9_START, e: 45.7 - L9_START}],
	};
	const out: KaraokeLine[] = [];
	for (const line of lines) {
		const s = line.words[0]?.s ?? 0;
		if (s >= clear.words[0].s && !out.includes(clear)) out.push(clear);
		if (s >= clearLeer.words[0].s && !out.includes(clearLeer))
			out.push(clearLeer);
		out.push(line);
	}
	// Ninguna línea sigue a «LEER.» (era el último chunk): el clear
	// debe añadirse al final, o «ES ESTA:» quedaría fijo hasta 45,70 s.
	if (!out.includes(clearLeer)) out.push(clearLeer);
	return out;
})();

// ---------- helpers ----------
const clamp01 = (f: number, a: number, b: number) =>
	interpolate(f, [a, b], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

/** Entrada con pop (escala 1,35 → 1 con overshoot suave). */
const popIn = (f: number, at: number, dur = 12) =>
	interpolate(f, [at, at + dur], [1.35, 1], {
		easing: Easing.out(Easing.back(1.4)),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

/** Count-up entero 0 → target entre los fotogramas a y b. */
const countUp = (f: number, a: number, b: number, target: number) =>
	Math.round(
		interpolate(f, [a, b], [0, target], {
			easing: Easing.out(Easing.cubic),
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
		}),
	);

// ---------- marca de agua (logotipo COMPLETO, blanco/transparente) ----------
// Patrón Marabana V1.3: 115 px, arriba derecha, desde el fotograma 0,
// solo fade de salida antes del sting. Nunca solo la estrella.
// V1.1: scrim radial oscuro SUAVE detrás del logo solo en las escenas
// sepia (S6/S7, f768–1018): el blanco se lava sobre el sepia claro de
// Martí (auditoría V1, f_31s/f_33s). NO es una placa: degradado radial
// sin bordes, a transparente antes del centro del fotograma.
// V1.2: mismo scrim en S1 (f0–97) y S9 (f1221–1416): los fotogramas
// reales de la ONU son CLAROS (pared dorada) y el logo blanco se lava
// en la esquina superior derecha. S3 no lo necesita (mármol verde
// oscuro detrás del logo).
/** Ventana de opacidad 0→1→0 con fades de 8 f en los bordes. */
const winOp = (f: number, a: number, b: number) =>
	clamp01(f, a, a + 8) * (1 - clamp01(f, b - 8, b));
const LogoInner: React.FC = () => {
	const frame = useCurrentFrame();
	const fadeOut = interpolate(frame, [1406, 1416], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const scrimOp = Math.max(
		winOp(frame, 0, 97),
		winOp(frame, 768, 1018),
		winOp(frame, 1221, 1416),
	);
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<div
				style={{
					position: 'absolute',
					top: 0,
					right: 0,
					width: 260,
					height: 340,
					background:
						'radial-gradient(ellipse 50% 50% at 50% 44%, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0) 85%)',
					opacity: scrimOp,
				}}
			/>
			<Img
				src={staticFile('img/logo-white.png')}
				style={{
					position: 'absolute',
					top: 54,
					right: 40,
					width: 115,
					opacity: fadeOut,
					filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.6))',
				}}
			/>
		</AbsoluteFill>
	);
};

// ================================================================
// S1 — GANCHO (0–97 f · 0,00–3,23 s)
// V1.2: fotograma REAL de UN Web TV (28ª plenaria, 28-oct-2026):
// plano general con el tablero del escrutinio EN CURSO (Item 37 ·
// A/81/L.5). El «130» va BAJO el tablero (top:950) para no taparlo;
// el tablero ocupa y≈100–800 y debe quedar visible y legible.
// V1.2, fix 8: sin «35 VOTOS MENOS QUE EN 2025» aquí — la voz no lo
// dice hasta S2 (4,56 s); el mensaje lo dan las barras + el badge
// «−35» en su golpe de voz. Crédito ONU obligatorio por licencia.
// ================================================================
const HookScene: React.FC = () => {
	const f = useCurrentFrame();
	const n = countUp(f, 2, 38, 130);
	const push = interpolate(f, [0, 97], [1, 1.05], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const creditIn = clamp01(f, 10, 18);
	return (
		<AbsoluteFill style={{background: NAVY}}>
			<Img
				src={staticFile('img/real-un/un-hall-wide-vert.jpg')}
				style={{
					width: '100%',
					height: '100%',
					objectFit: 'cover',
					transform: `scale(${push})`,
				}}
			/>
			{/* Scrim: ligero arriba (el tablero debe verse), fuerte
			    abajo (el 130 va sobre los delegados). */}
			<div
				style={{
					position: 'absolute',
					inset: 0,
					background:
						'linear-gradient(180deg, rgba(10,20,32,0.30) 0%, rgba(10,20,32,0.10) 35%, rgba(10,20,32,0.55) 55%, rgba(10,20,32,0.88) 100%)',
				}}
			/>
			{/* Fecha + foro (sobre el borde superior, encima del tablero) */}
			<div
				style={{
					position: 'absolute',
					top: 56,
					left: 0,
					right: 0,
					textAlign: 'center',
					fontFamily: COND,
					fontSize: 34,
					fontWeight: 700,
					letterSpacing: 6,
					color: '#BFD4E6',
					textShadow: textOutline(2),
				}}
			>
				28 OCT 2026 · ONU
			</div>
			{/* 130 gigante (bajo el tablero, que termina en y≈800) */}
			<div
				style={{
					position: 'absolute',
					top: 950,
					left: 0,
					right: 0,
					textAlign: 'center',
					fontFamily: ARCHIVO,
					fontSize: 380,
					lineHeight: 1,
					color: '#FFFFFF',
					textShadow: textOutline(4),
				}}
			>
				{n}
			</div>
			<div
				style={{
					position: 'absolute',
					top: 1360,
					left: 0,
					right: 0,
					textAlign: 'center',
					fontFamily: ARCHIVO,
					fontSize: 64,
					letterSpacing: 4,
					color: '#FFFFFF',
					textShadow: textOutline(3),
				}}
			>
				PAÍSES A FAVOR
			</div>
			{/* Crédito obligatorio (licencia UN Web TV) */}
			<div
				style={{
					position: 'absolute',
					top: 1855,
					right: 24,
					fontFamily: COND,
					fontSize: 20,
					fontWeight: 600,
					letterSpacing: 1,
					color: 'rgba(255,255,255,0.75)',
					textShadow: '0 1px 4px rgba(0,0,0,0.8)',
					opacity: creditIn,
				}}
			>
				Imágenes: UN Web TV / Naciones Unidas
			</div>
		</AbsoluteFill>
	);
};

// ================================================================
// S2 — GANAMOS + BARRAS (97–237 f · 3,23–7,89 s, local 0–140)
// Sello «GANAMOS.» + barras 191 → 187 → 165 → 130 + badge «−35»
// ================================================================
const BARS = [
	{year: '2015 / 17', value: 191, at: 41, color: '#5A738C'},
	{year: '2024', value: 187, at: 52, color: '#5A738C'},
	{year: '2025', value: 165, at: 62, color: '#5A738C'},
	{year: '2026', value: 130, at: 72, color: MEMORIAL_RED},
];

const BarsScene: React.FC = () => {
	const f = useCurrentFrame();
	// Sello GANAMOS: entra en f106 global (local 9), sale antes de F2.
	const stampIn = f >= 9 && f < 38;
	const stampScale = popIn(f, 9, 10);
	const stampOp = interpolate(f, [34, 41], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const titleIn = clamp01(f, 41, 49);
	const badgeIn = clamp01(f, 88, 96);
	const badgeScale = popIn(f, 88, 10);
	return (
		<AbsoluteFill style={{background: NAVY2}}>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					background:
						'radial-gradient(ellipse at 50% 30%, rgba(46,90,122,0.35) 0%, rgba(10,20,32,0) 70%)',
				}}
			/>
			{stampIn && (
				<div
					style={{
						position: 'absolute',
						top: 480,
						left: 0,
						right: 0,
						textAlign: 'center',
						opacity: stampOp,
						transform: `scale(${stampScale}) rotate(-4deg)`,
					}}
				>
					<span
						style={{
							fontFamily: ARCHIVO,
							fontSize: 150,
							color: '#FFFFFF',
							textShadow: textOutline(4),
						}}
					>
						GANAMOS
						<span style={{color: MEMORIAL_RED}}>.</span>
					</span>
				</div>
			)}
			{/* Título de las barras */}
			<div
				style={{
					position: 'absolute',
					top: 300,
					left: 0,
					right: 0,
					textAlign: 'center',
					opacity: titleIn,
				}}
			>
				<div
					style={{
						fontFamily: ARCHIVO,
						fontSize: 46,
						letterSpacing: 3,
						color: '#FFFFFF',
					}}
				>
					VOTOS A FAVOR EN LA ONU
				</div>
				<div
					style={{
						fontFamily: COND,
						fontSize: 30,
						letterSpacing: 4,
						color: '#BFD4E6',
						marginTop: 12,
					}}
				>
					RESOLUCIÓN CONTRA EL BLOQUEO
				</div>
			</div>
			{/* Barras horizontales.
			    V1.2, fix 6: la fila NO existe antes de su `at` (antes
			    mostraba «0»); el número aparece con su valor FINAL
			    desde el primer fotograma (sin count-up: a medio contar
			    se leían datos falsos, p. ej. «2026: 127»). Solo la
			    barra crece. */}
			{BARS.map((b, i) => {
				const grow = interpolate(f, [b.at, b.at + 14], [0, 1], {
					easing: Easing.out(Easing.cubic),
					extrapolateLeft: 'clamp',
					extrapolateRight: 'clamp',
				});
				const rowOp = clamp01(f, b.at, b.at + 6);
				const numScale = popIn(f, b.at, 10);
				const top = 520 + i * 150;
				return (
					<div
						key={b.year}
						style={{
							position: 'absolute',
							top,
							left: 90,
							right: 90,
							opacity: rowOp,
						}}
					>
						<div
							style={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'baseline',
								marginBottom: 10,
							}}
						>
							<span
								style={{
									fontFamily: COND,
									fontSize: 36,
									fontWeight: 700,
									color: '#DCE9F2',
								}}
							>
								{b.year}
							</span>
							<span
								style={{
									fontFamily: ARCHIVO,
									fontSize: 56,
									color: b.color === MEMORIAL_RED ? MEMORIAL_RED : '#FFFFFF',
									display: 'inline-block',
									transform: `scale(${numScale})`,
								}}
							>
								{b.value}
							</span>
						</div>
						<div
							style={{
								height: 34,
								background: 'rgba(255,255,255,0.10)',
								borderRadius: 6,
								overflow: 'hidden',
							}}
						>
							<div
								style={{
									height: '100%',
									width: `${(b.value / 191) * 100 * grow}%`,
									background: b.color,
									borderRadius: 6,
								}}
							/>
						</div>
					</div>
				);
			})}
			{/* Badge −35 */}
			<div
				style={{
					position: 'absolute',
					top: 1180,
					left: 0,
					right: 0,
					textAlign: 'center',
					opacity: badgeIn,
					transform: `scale(${badgeScale})`,
				}}
			>
				<span
					style={{
						fontFamily: ARCHIVO,
						fontSize: 88,
						color: MEMORIAL_RED,
						textShadow: textOutline(3),
					}}
				>
					−35
				</span>
				<span
					style={{
						fontFamily: COND,
						fontSize: 34,
						fontWeight: 700,
						color: '#FFFFFF',
						marginLeft: 18,
					}}
				>
					EN UN AÑO
				</span>
			</div>
		</AbsoluteFill>
	);
};

// ================================================================
// S3 — CONTADORES (237–365 f · 7,89–12,16 s, local 0–128)
// V1.2: fotograma REAL de UN Web TV — Bruno Rodríguez Parrilla en el
// podio presentando la resolución (00:40:10 del VOD). Layout partido:
// la foto ocupa el tercio superior (la cara queda íntegra, sin
// tarjetas encima) y las tres tarjetas van abajo sobre fondo NAVY.
// V1.2, fix 7: números ESTÁTICOS con pop, sincronizados con el golpe
// de voz (at: 0/30/70 = «ciento treinta» / «diecisiete» /
// «veinticinco»); el count-up marcaba 55 y 7 mientras la voz ya decía
// el número final.
// V1.5: los cortes acústicos de L4 (la caída de «favor,» se conserva
// entera en vez de truncarse) retrasan «diecisiete» y «veinticinco»
// 0,09/0,11 s (9,05→9,14 y 10,32→10,42). Los pops se mueven igual
// (at: 33/73) para mantener la misma antelación (0,15/0,09 s antes del
// golpe de voz).
// ================================================================
const COUNTERS = [
	{value: 130, label: 'A FAVOR', at: 0, color: '#FFFFFF', sub: 'PAÍSES'},
	{value: 17, label: 'EN CONTRA', at: 33, color: MEMORIAL_RED, sub: 'PAÍSES'},
	{value: 25, label: 'ABSTENCIONES', at: 73, color: AMBER, sub: ''},
];

const CountersScene: React.FC = () => {
	const f = useCurrentFrame();
	const titleIn = clamp01(f, 0, 8);
	const photoPush = interpolate(f, [0, 128], [1, 1.04], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	return (
		<AbsoluteFill style={{background: NAVY}}>
			{/* Bruno en el podio, tercio superior (cara íntegra) */}
			{/* V1.3 (fix S3): la foto baja de 860 a 800 px para que título,
			    tarjetas y nota suban 60 px y el karaoke de 2 líneas
			    (borde superior ≈ y1543) no toque ni la 3ª tarjeta ni la
			    nota. El recorte quita solo zona de fundido inferior; la
			    cara de Bruno queda intacta (objectPosition 50% 12%). */}
			<div
				style={{
					position: 'absolute',
					top: 0,
					left: 0,
					right: 0,
					height: 800,
					overflow: 'hidden',
				}}
			>
				<Img
					src={staticFile('img/real-un/un-bruno-podium-vert.jpg')}
					style={{
						width: '100%',
						height: '100%',
						objectFit: 'cover',
						objectPosition: '50% 12%',
						transform: `scale(${photoPush})`,
					}}
				/>
				<div
					style={{
						position: 'absolute',
						left: 0,
						right: 0,
						bottom: 0,
						height: 120,
						background:
							'linear-gradient(180deg, rgba(10,20,32,0) 0%, rgba(10,20,32,1) 100%)',
					}}
				/>
			</div>
			<div
				style={{
					position: 'absolute',
					top: 825,
					left: 0,
					right: 0,
					textAlign: 'center',
					fontFamily: COND,
					fontSize: 34,
					fontWeight: 700,
					letterSpacing: 6,
					color: '#BFD4E6',
					opacity: titleIn,
				}}
			>
				ASAMBLEA GENERAL · 28 OCT 2026
			</div>
			{COUNTERS.map((c, i) => {
				const slide = interpolate(f, [c.at, c.at + 10], [-60, 0], {
					easing: Easing.out(Easing.cubic),
					extrapolateLeft: 'clamp',
					extrapolateRight: 'clamp',
				});
				const op = clamp01(f, c.at, c.at + 8);
				const numScale = popIn(f, c.at, 12);
				// V1.3 (fix S3): tarjetas 890 + i·195, alto 180 (antes
				// 950 + i·205, alto 190). La 3ª termina en y1460: 83 px
				// libres hasta el borde superior del karaoke (≈1543).
				const top = 890 + i * 195;
				return (
					<div
						key={c.label}
						style={{
							position: 'absolute',
							top,
							left: 80,
							right: 80,
							height: 180,
							background: 'rgba(255,255,255,0.06)',
							borderLeft: `10px solid ${c.color}`,
							borderRadius: 12,
							display: 'flex',
							alignItems: 'center',
							paddingLeft: 48,
							opacity: op,
							transform: `translateX(${slide}px)`,
						}}
					>
						<span
							style={{
								fontFamily: ARCHIVO,
								fontSize: 120,
								color: c.color,
								minWidth: 300,
								flexShrink: 0,
								display: 'inline-block',
								transform: `scale(${numScale})`,
							}}
						>
							{c.value}
						</span>
						<span
							style={{
								fontFamily: ARCHIVO,
								fontSize: 52,
								lineHeight: 1.15,
								color: '#FFFFFF',
							}}
						>
							{c.label}
							{c.sub && (
								<>
									<br />
									<span
										style={{
											fontFamily: COND,
											fontSize: 30,
											letterSpacing: 5,
											color: '#BFD4E6',
										}}
									>
										{c.sub}
									</span>
								</>
							)}
						</span>
					</div>
				);
			})}
			{/* V1.3 (fix S3): la nota sube a top 1480 (termina ≈1511), 20 px
			    bajo la 3ª tarjeta y 32 px libres hasta el karaoke. Antes
			    estaba en 1575, DENTRO de la zona del karaoke, y el chunk
			    «VEINTICINCO / ABSTENCIONES.» (10,28–11,46 s) la tapaba. */}
			<div
				style={{
					position: 'absolute',
					top: 1480,
					left: 0,
					right: 0,
					textAlign: 'center',
					fontFamily: COND,
					fontSize: 26,
					letterSpacing: 3,
					color: '#8FA9BE',
					opacity: clamp01(f, 100, 110),
				}}
			>
				193 ESTADOS MIEMBROS · 21 NO VOTARON
			</div>
		</AbsoluteFill>
	);
};

// ================================================================
// S4 — MAPA (365–576 f · 12,16–19,18 s, local 0–211)
// Base Natural Earth + overlays por grupo + puntos + lista + art. 19
// ================================================================
const MAP_LEFT = 60;
const MAP_TOP = 200;
const MAP_SIZE = 960;
const MAP_SCALE = MAP_SIZE / 1400;

const MAP_GROUPS = [
	{
		key: 'red',
		title: 'EN CONTRA · 6',
		color: MEMORIAL_RED,
		at: 56,
		names: ['Argentina', 'Colombia', 'Costa Rica', 'Ecuador', 'Paraguay', 'Trinidad y Tobago'],
		dots: ['Trinidad and Tobago'],
	},
	{
		key: 'yellow',
		title: 'SE ABSTUVIERON · 7',
		color: AMBER,
		at: 102,
		names: ['Chile', 'Rep. Dominicana', 'Guyana', 'Haití', 'Honduras', 'Jamaica', 'Perú'],
		dots: ['Jamaica', 'Haiti', 'Dominican Rep.'],
	},
	{
		key: 'gray',
		title: 'AUSENTES · 6',
		color: GRAY,
		at: 144,
		names: ['Antigua y Barbuda', 'Bolivia', 'Dominica', 'El Salvador', 'Guatemala', 'Santa Lucía'],
		dots: ['Antigua and Barb.', 'Dominica', 'Saint Lucia'],
	},
] as const;

/** Punto luminoso con anillo pulsante (ciclo determinista de 45 f).
    V1.2: si el punto lleva desplazamiento (dx, dy), se dibuja en la
    posición desplazada con una línea guía fina hasta su centroide real
    y un ancla pequeña en el centroide. Anillo reducido (2,0× en vez
    de 2,8×) para que los anillos vecinos no se solapen. */
const MapDot: React.FC<{
	x: number;
	y: number;
	color: string;
	appearAt: number;
	frame: number;
	dx?: number;
	dy?: number;
}> = ({x, y, color, appearAt, frame, dx = 0, dy = 0}) => {
	if (frame < appearAt) return null;
	const age = frame - appearAt;
	const cycle = age % 45;
	const ringScale = interpolate(cycle, [0, 45], [1, 2.0]);
	const ringOp = interpolate(cycle, [0, 45], [0.9, 0]);
	const inScale = popIn(frame, appearAt, 8);
	const px = x + dx;
	const py = y + dy;
	const hasLeader = dx !== 0 || dy !== 0;
	const leaderLen = Math.sqrt(dx * dx + dy * dy);
	const leaderAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
	return (
		<>
			{hasLeader && (
				<>
					<div
						style={{
							position: 'absolute',
							left: x,
							top: y,
							width: leaderLen,
							height: 2,
							background: color,
							opacity: 0.55,
							transform: `rotate(${leaderAngle}deg)`,
							transformOrigin: '0 50%',
						}}
					/>
					<div
						style={{
							position: 'absolute',
							left: x - 4,
							top: y - 4,
							width: 8,
							height: 8,
							borderRadius: '50%',
							background: color,
							border: '1px solid #FFFFFF',
						}}
					/>
				</>
			)}
			<div
				style={{
					position: 'absolute',
					left: px - 11,
					top: py - 11,
					width: 22,
					height: 22,
					borderRadius: '50%',
					border: `3px solid ${color}`,
					transform: `scale(${ringScale})`,
					opacity: ringOp,
				}}
			/>
			<div
				style={{
					position: 'absolute',
					left: px - 9,
					top: py - 9,
					width: 18,
					height: 18,
					borderRadius: '50%',
					background: color,
					border: '3px solid #FFFFFF',
					transform: `scale(${inScale})`,
					boxShadow: '0 0 14px rgba(255,255,255,0.7)',
				}}
			/>
		</>
	);
};

const MapScene: React.FC = () => {
	const f = useCurrentFrame();
	const baseIn = clamp01(f, 0, 12);
	const titleIn = clamp01(f, 0, 8);
	// V1.1: «EL MAPA CAMBIÓ» entra en f60, tras el chunk de karaoke
	// idéntico «EL MAPA CAMBIÓ:» (local f33–56; auditoría V1, f_14s).
	const subTitleIn = clamp01(f, 60, 68);
	const venIn = clamp01(f, 155, 165);
	const footIn = clamp01(f, 155, 165);
	const ven = MAP_DOTS.Venezuela;
	const venX = MAP_LEFT + (ven.x / 1400) * MAP_SIZE;
	const venY = MAP_TOP + (ven.y / 1400) * MAP_SIZE;
	return (
		<AbsoluteFill style={{background: NAVY}}>
			{/* Título */}
			<div
				style={{
					position: 'absolute',
					top: 80,
					left: 0,
					right: 0,
					textAlign: 'center',
					opacity: titleIn,
				}}
			>
				<div
					style={{
						fontFamily: ARCHIVO,
						fontSize: 52,
						letterSpacing: 3,
						color: '#FFFFFF',
					}}
				>
					NUESTRA AMÉRICA
				</div>
				<div
					style={{
						fontFamily: ARCHIVO,
						fontSize: 40,
						letterSpacing: 3,
						color: MEMORIAL_RED,
						marginTop: 8,
						opacity: subTitleIn,
					}}
				>
					EL MAPA CAMBIÓ
				</div>
			</div>
			{/* Mapa */}
			<div
				style={{
					position: 'absolute',
					left: MAP_LEFT,
					top: MAP_TOP,
					width: MAP_SIZE,
					height: MAP_SIZE,
					opacity: baseIn,
				}}
			>
				<Img
					src={staticFile('img/map-base.png')}
					style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}
				/>
				{MAP_GROUPS.map((g) => (
					<Img
						key={g.key}
						src={staticFile(`img/map-${g.key}.png`)}
						style={{
							position: 'absolute',
							inset: 0,
							width: '100%',
							height: '100%',
							opacity: clamp01(f, g.at, g.at + 10),
						}}
					/>
				))}
			</div>
			{/* Puntos luminosos en las islas (V1.2: dispersos con guías) */}
			{MAP_GROUPS.map((g) =>
				g.dots.map((name) => {
					const d = MAP_DOTS[name as keyof typeof MAP_DOTS];
					const off = MAP_DOT_OFFSETS[name] ?? {dx: 0, dy: 0};
					return (
						<MapDot
							key={name}
							x={MAP_LEFT + (d.x / 1400) * MAP_SIZE}
							y={MAP_TOP + (d.y / 1400) * MAP_SIZE}
							color={g.color}
							appearAt={g.at}
							frame={f}
							dx={off.dx}
							dy={off.dy}
						/>
					);
				}),
			)}
			{/* Anillo de Venezuela (art. 19) */}
			{f >= 155 && (
				<div
					style={{
						position: 'absolute',
						left: venX - 26,
						top: venY - 26,
						width: 52,
						height: 52,
						borderRadius: '50%',
						border: '4px dashed #FFFFFF',
						opacity: venIn,
					}}
				/>
			)}
			{/* V1.2, fix 3: la etiqueta «ART. 19» sale del mapa — va sobre
			    el Pacífico vacío (oeste de Colombia), con una línea guía
			    hasta el anillo. Antes tapaba el rojo de Colombia y la
			    zona de Venezuela. */}
			{f >= 155 && (
				<>
					<div
						style={{
							position: 'absolute',
							left: 320,
							top: venY - 20,
							fontFamily: ARCHIVO,
							fontSize: 26,
							color: '#FFFFFF',
							background: 'rgba(10,20,32,0.85)',
							padding: '6px 12px',
							borderRadius: 6,
							opacity: venIn,
						}}
					>
						ART. 19
					</div>
					<div
						style={{
							position: 'absolute',
							left: 438,
							top: venY + 1,
							width: venX - 26 - 438,
							height: 2,
							background: 'rgba(255,255,255,0.6)',
							opacity: venIn,
						}}
					/>
				</>
			)}
			{/* Lista en 3 columnas */}
			{MAP_GROUPS.map((g, gi) => {
				const colOp = clamp01(f, g.at, g.at + 10);
				const left = 60 + gi * 340;
				return (
					<div
						key={g.key}
						style={{
							position: 'absolute',
							top: 1190,
							left,
							width: 320,
							opacity: colOp,
						}}
					>
						<div
							style={{
								fontFamily: ARCHIVO,
								fontSize: 27,
								color: g.color,
								marginBottom: 10,
								whiteSpace: 'nowrap',
							}}
						>
							{g.title}
						</div>
						{g.names.map((n) => (
							<div
								key={n}
								style={{
									fontFamily: COND,
									fontSize: 27,
									fontWeight: 600,
									lineHeight: 1.32,
									color: '#E8F0F6',
									whiteSpace: 'nowrap',
								}}
							>
								{n}
							</div>
						))}
					</div>
				);
			})}
			{/* Nota al pie: Venezuela */}
			<div
				style={{
					position: 'absolute',
					top: 1500,
					left: 60,
					right: 60,
					textAlign: 'center',
					fontFamily: COND,
					fontSize: 24,
					lineHeight: 1.3,
					color: '#BFD4E6',
					opacity: footIn,
				}}
			>
				VENEZUELA NO PUDO VOTAR: DERECHO SUSPENDIDO POR MORA
				<br />
				(ART. 19 DE LA CARTA DE LA ONU)
			</div>
		</AbsoluteFill>
	);
};

// ================================================================
// S5 — EVIDENCIA (576–768 f · 19,18–25,60 s, local 0–192)
// «19 GOBIERNOS» + micrófono + tarjeta de la confesión de Browne
// ================================================================
const EvidenceScene: React.FC = () => {
	const f = useCurrentFrame();
	const n = countUp(f, 0, 24, 19);
	const push = interpolate(f, [0, 192], [1, 1.06], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const cardSlide = interpolate(f, [113, 125], [60, 0], {
		easing: Easing.out(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const cardOp = clamp01(f, 113, 121);
	return (
		<AbsoluteFill style={{background: NAVY}}>
			<Img
				src={staticFile('img/bg-radio-mic.png')}
				style={{
					width: '100%',
					height: '100%',
					objectFit: 'cover',
					transform: `scale(${push})`,
					opacity: 0.6,
				}}
			/>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					background:
						'linear-gradient(180deg, rgba(10,20,32,0.72) 0%, rgba(10,20,32,0.25) 45%, rgba(10,20,32,0.92) 100%)',
				}}
			/>
			{/* 19 GOBIERNOS */}
			<div
				style={{
					position: 'absolute',
					top: 240,
					left: 0,
					right: 0,
					textAlign: 'center',
				}}
			>
				<div
					style={{
						fontFamily: ARCHIVO,
						fontSize: 240,
						lineHeight: 1,
						color: '#FFFFFF',
						textShadow: textOutline(4),
					}}
				>
					{n}
				</div>
				<div
					style={{
						fontFamily: ARCHIVO,
						fontSize: 56,
						letterSpacing: 6,
						color: MEMORIAL_RED,
						textShadow: textOutline(3),
					}}
				>
					GOBIERNOS
				</div>
			</div>
			{/* Tarjeta de evidencia.
			    V1.2, fix 4: achicada (cita 44→38 px, paddings y
			    atribución reducidos) y bajada (top 1010→1240): la
			    cabeza del micrófono (y≈700–1050) queda íntegra y
			    visible; la tarjeta solo cubre el pie del micrófono.
			    El karaoke que duplicaba la cita se apaga con la línea
			    vacía CLEAR_BROWNE (22,98 s) mientras la tarjeta está
			    en pantalla. */}
			<div
				style={{
					position: 'absolute',
					top: 1240,
					left: 70,
					right: 70,
					background: 'rgba(8,15,24,0.88)',
					borderLeft: `10px solid ${MEMORIAL_RED}`,
					borderRadius: 12,
					padding: '26px 32px',
					opacity: cardOp,
					transform: `translateY(${cardSlide}px)`,
				}}
			>
				<div
					style={{
						fontFamily: ARCHIVO,
						fontSize: 24,
						letterSpacing: 4,
						color: MEMORIAL_RED,
						marginBottom: 14,
					}}
				>
					LO CONTÓ EN LA RADIO
				</div>
				<div
					style={{
						fontFamily: ARCHIVO,
						fontSize: 38,
						lineHeight: 1.3,
						color: '#FFFFFF',
					}}
				>
					«Washington lo llamó para que cambiara su voto»
				</div>
				<div
					style={{
						fontFamily: COND,
						fontSize: 25,
						lineHeight: 1.35,
						color: '#BFD4E6',
						marginTop: 14,
					}}
				>
					GASTON BROWNE · PRIMER MINISTRO DE ANTIGUA Y BARBUDA
					<br />
					RADIO · 9 NOV 2026 · CMC
				</div>
			</div>
		</AbsoluteFill>
	);
};

// ================================================================
// S6 — INTERRUPT 1891 (768–910 f · 25,60–30,32 s, local 0–142)
// Corte duro a sepia + línea de tiempo + «1891» + retrato cuerpo entero
// ================================================================
const InterruptScene: React.FC = () => {
	const f = useCurrentFrame();
	const push = interpolate(f, [0, 142], [1, 1.07], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const photoIn = clamp01(f, 10, 40);
	const lineW = interpolate(f, [0, 60], [0, 840], {
		easing: Easing.out(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const node1891 = clamp01(f, 55, 61);
	const node2026 = clamp01(f, 100, 106);
	const yearScale = popIn(f, 55, 12);
	const subIn = clamp01(f, 70, 78);
	const dijoIn = clamp01(f, 103, 111);
	return (
		<AbsoluteFill style={{background: SEPIA_BG}}>
			<Img
				src={staticFile('img/marti-temple-hall-1892.jpg')}
				style={{
					width: '100%',
					height: '100%',
					objectFit: 'cover',
					transform: `scale(${push})`,
					opacity: 0.5 * photoIn,
				}}
			/>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					background:
						'linear-gradient(180deg, rgba(23,18,8,0.62) 0%, rgba(23,18,8,0.35) 45%, rgba(23,18,8,0.88) 100%)',
				}}
			/>
			{/* V1.1: título BAJO la línea de tiempo (antes cruzaba la cara de
			    Martí en top:200, auditoría V1 f_27s). Por encima de la
			    cabeza no cabe: la cabeza roza el borde superior del
			    fotograma. Entra en f60 (tras el chunk de karaoke
			    «ESTABA ESCRITO.», local f16–55) y coincide con el fin
			    del trazado de la línea de tiempo. */}
			<div
				style={{
					position: 'absolute',
					top: 1530,
					left: 0,
					right: 0,
					textAlign: 'center',
					fontFamily: COND,
					fontSize: 36,
					fontWeight: 700,
					letterSpacing: 8,
					color: SEPIA_GOLD,
					opacity: clamp01(f, 60, 68),
				}}
			>
				PERO ESTO YA ESTABA ESCRITO
			</div>
			{/* 1891 gigante */}
			<div
				style={{
					position: 'absolute',
					top: 300,
					left: 0,
					right: 0,
					textAlign: 'center',
					fontFamily: ARCHIVO,
					fontSize: 280,
					lineHeight: 1,
					color: '#FFFFFF',
					textShadow: textOutline(4),
					opacity: node1891,
					transform: `scale(${yearScale})`,
				}}
			>
				1891
			</div>
			<div
				style={{
					position: 'absolute',
					top: 610,
					left: 0,
					right: 0,
					textAlign: 'center',
					fontFamily: ARCHIVO,
					fontSize: 58,
					letterSpacing: 4,
					color: SEPIA_GOLD,
					textShadow: textOutline(3),
					opacity: subIn,
				}}
			>
				NUESTRA AMÉRICA
			</div>
			{/* Línea de tiempo */}
			<div
				style={{
					position: 'absolute',
					top: 1440,
					left: 120,
					width: 840,
					height: 6,
					background: 'rgba(201,168,106,0.30)',
					borderRadius: 3,
				}}
			/>
			<div
				style={{
					position: 'absolute',
					top: 1440,
					left: 120,
					width: lineW,
					height: 6,
					background: SEPIA_GOLD,
					borderRadius: 3,
				}}
			/>
			<div
				style={{
					position: 'absolute',
					top: 1426,
					left: 106,
					width: 34,
					height: 34,
					borderRadius: '50%',
					background: node1891 > 0 ? MEMORIAL_RED : 'transparent',
					border: `4px solid ${SEPIA_GOLD}`,
					opacity: node1891,
				}}
			/>
			<div
				style={{
					position: 'absolute',
					top: 1480,
					left: 60,
					width: 130,
					textAlign: 'center',
					fontFamily: ARCHIVO,
					fontSize: 32,
					color: '#FFFFFF',
					opacity: node1891,
				}}
			>
				1891
			</div>
			<div
				style={{
					position: 'absolute',
					top: 1426,
					left: 940,
					width: 34,
					height: 34,
					borderRadius: '50%',
					background: node2026 > 0 ? '#FFFFFF' : 'transparent',
					border: `4px solid ${SEPIA_GOLD}`,
					opacity: node2026,
				}}
			/>
			<div
				style={{
					position: 'absolute',
					top: 1480,
					left: 894,
					width: 130,
					textAlign: 'center',
					fontFamily: ARCHIVO,
					fontSize: 32,
					color: '#FFFFFF',
					opacity: node2026,
				}}
			>
				2026
			</div>
			<div
				style={{
					position: 'absolute',
					top: 1620,
					left: 0,
					right: 0,
					textAlign: 'center',
					fontFamily: ARCHIVO,
					fontSize: 48,
					letterSpacing: 3,
					color: '#FFFFFF',
					textShadow: textOutline(3),
					opacity: dijoIn,
				}}
			>
				MARTÍ DIJO…
			</div>
		</AbsoluteFill>
	);
};

// ================================================================
// S7 — CITA MARTÍ (902–1018 f · 30,32–33,93 s, local 0–116)
// Retrato busto + cita estática (sin karaoke)
// ================================================================
const MartiQuoteScene: React.FC = () => {
	const f = useCurrentFrame();
	const fadeIn = clamp01(f, 0, 8);
	const push = interpolate(f, [0, 116], [1, 1.05], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const l1 = clamp01(f, 8, 16);
	const l2 = clamp01(f, 20, 28);
	const l3 = clamp01(f, 32, 40);
	const attr = clamp01(f, 45, 53);
	// V1.2, fix 2: el TEXTO de la cita sale (fade-out local f95–108)
	// ANTES de que empiece el fundido de la foto S7→S8 (S8 entra en
	// global f1010 = local f108). En V1.1 la cita de Martí se leía
	// semitransparente sobre la cara de Fidel (~34 s). La foto sí
	// puede fundirse con la siguiente; el texto, nunca.
	const textOut = 1 - clamp01(f, 95, 108);
	return (
		<AbsoluteFill style={{background: SEPIA_BG, opacity: fadeIn}}>
			<Img
				src={staticFile('img/marti-jamaica-1892.jpg')}
				style={{
					width: '100%',
					height: '100%',
					objectFit: 'cover',
					objectPosition: '50% 18%',
					transform: `scale(${push})`,
				}}
			/>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					background:
						'linear-gradient(180deg, rgba(23,18,8,0.15) 0%, rgba(23,18,8,0.10) 45%, rgba(23,18,8,0.92) 78%, rgba(23,18,8,0.97) 100%)',
				}}
			/>
			<div
				style={{
					position: 'absolute',
					top: 1150,
					left: 70,
					right: 70,
					textAlign: 'center',
					fontFamily: ARCHIVO,
					fontSize: 56,
					lineHeight: 1.28,
					color: '#FFFFFF',
					textShadow: textOutline(3),
					opacity: textOut,
				}}
			>
				<div style={{opacity: l1}}>
					«TRINCHERAS DE <span style={{color: MEMORIAL_RED}}>IDEAS</span>
				</div>
				<div style={{opacity: l2}}>VALEN MÁS QUE</div>
				<div style={{opacity: l3}}>TRINCHERAS DE PIEDRA»
				</div>
			</div>
			<div
				style={{
					position: 'absolute',
					top: 1460,
					left: 0,
					right: 0,
					textAlign: 'center',
					fontFamily: COND,
					fontSize: 30,
					fontWeight: 700,
					letterSpacing: 3,
					color: SEPIA_GOLD,
					opacity: attr * textOut,
				}}
			>
				— JOSÉ MARTÍ · NUESTRA AMÉRICA, 1891
			</div>
		</AbsoluteFill>
	);
};

// ================================================================
// S8 — CITA FIDEL (1010–1221 f · 33,93–40,69 s, local 0–211)
// Retrato MATS 1959 + «2005» + cita estática (sin karaoke)
// ================================================================
const FidelQuoteScene: React.FC = () => {
	const f = useCurrentFrame();
	const fadeIn = clamp01(f, 0, 8);
	const push = interpolate(f, [0, 211], [1, 1.05], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const chipIn = clamp01(f, 12, 20);
	const advIn = clamp01(f, 44, 52);
	const l1 = clamp01(f, 82, 90);
	const l2 = clamp01(f, 92, 100);
	const l3 = clamp01(f, 102, 110);
	const l4 = clamp01(f, 112, 120);
	const attr = clamp01(f, 140, 148);
	return (
		<AbsoluteFill style={{background: '#0B0B0B', opacity: fadeIn}}>
			<Img
				src={staticFile('img/fidel-mats-1959-cropped.jpg')}
				style={{
					width: '100%',
					height: '100%',
					objectFit: 'cover',
					objectPosition: '50% 12%',
					transform: `scale(${push})`,
				}}
			/>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					background:
						'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.10) 40%, rgba(0,0,0,0.88) 72%, rgba(0,0,0,0.96) 100%)',
				}}
			/>
			{/* V1.2, fix 1: «2005» + «FIDEL ADVIRTIÓ:» en UNA línea
			    centrada sobre la cita (top:1035, sobre la chaqueta
			    oscura), fuera de la cara. En V1.1 caían sobre la
			    frente y el pelo de Fidel (auditoría densa s_36/s_38).
			    Tiempos originales: chip con «2005» (f12), rótulo con
			    «ADVIRTIÓ:» (f44). */}
			<div
				style={{
					position: 'absolute',
					top: 1035,
					left: 0,
					right: 0,
					textAlign: 'center',
				}}
			>
				<span
					style={{
						fontFamily: ARCHIVO,
						fontSize: 34,
						color: '#FFFFFF',
						background: 'rgba(0,0,0,0.55)',
						border: `3px solid ${MEMORIAL_RED}`,
						padding: '8px 20px',
						borderRadius: 10,
						opacity: chipIn,
						marginRight: 18,
					}}
				>
					2005
				</span>
				<span
					style={{
						fontFamily: ARCHIVO,
						fontSize: 36,
						letterSpacing: 3,
						color: '#FFFFFF',
						textShadow: textOutline(3),
						opacity: advIn,
					}}
				>
					FIDEL ADVIRTIÓ:
				</span>
			</div>
			<div
				style={{
					position: 'absolute',
					top: 1120,
					left: 70,
					right: 70,
					textAlign: 'center',
					fontFamily: ARCHIVO,
					fontSize: 50,
					lineHeight: 1.3,
					color: '#FFFFFF',
					textShadow: textOutline(3),
				}}
			>
				<div style={{opacity: l1}}>«NO ES LO MISMO</div>
				<div style={{opacity: l2}}>ESTAR DESINFORMADO</div>
				<div style={{opacity: l3}}>QUE HABER PERDIDO</div>
				<div style={{opacity: l4}}>
					LA CAPACIDAD DE <span style={{color: MEMORIAL_RED}}>PENSAR»</span>
				</div>
			</div>
			<div
				style={{
					position: 'absolute',
					top: 1470,
					left: 0,
					right: 0,
					textAlign: 'center',
					fontFamily: COND,
					fontSize: 30,
					fontWeight: 700,
					letterSpacing: 3,
					color: '#D8D8D8',
					opacity: attr,
				}}
			>
				— FIDEL CASTRO · 2005
			</div>
		</AbsoluteFill>
	);
};

// ================================================================
// S9 — CALLBACK + CTA (1221–1416 f · 40,69–47,20 s, local 0–195)
// V1.2: fotograma REAL de UN Web TV con el RESULTADO FINAL en el
// tablero (IN FAVOUR 130 / AGAINST 17 / ABSTENTION 25). El «130»
// gigante va BAJO el tablero (top:850; el tablero ocupa y≈110–800 y
// debe quedar visible y legible). En local f150 (45,69 s, al entrar
// el CTA) el fondo funde a los delegados tras la aprobación
// (variedad en el cierre). El karaoke «EXIGEN EL FIN DEL» se apaga
// con línea vacía (fix 9): el título ya muestra esas palabras.
// ================================================================
const CallbackScene: React.FC = () => {
	const f = useCurrentFrame();
	// V1.1: 130 ESTÁTICO con pop desde el fotograma 0. La voz dice
	// «ciento» en f0 (L10, 40,686 s); el count-up marcaba 91 en ese
	// momento y contradecía a la voz (auditoría V1, f_41s).
	const numScale = popIn(f, 0, 12);
	const subIn = clamp01(f, 18, 26);
	const divIn = clamp01(f, 60, 68);
	const titleIn = clamp01(f, 93, 101);
	const leerIn = clamp01(f, 125, 131);
	const pensarScale = popIn(f, 135, 10);
	const pensarIn = clamp01(f, 135, 141);
	const ctaIn = clamp01(f, 150, 158);
	const ctaScale = popIn(f, 150, 12);
	// V1.2: fundido tablero → delegados al entrar el CTA (f150–165).
	const delIn = clamp01(f, 150, 165);
	return (
		<AbsoluteFill style={{background: NAVY}}>
			<Img
				src={staticFile('img/real-un/un-voteboard-result-vert.jpg')}
				style={{
					width: '100%',
					height: '100%',
					objectFit: 'cover',
					opacity: 1 - delIn,
				}}
			/>
			<Img
				src={staticFile('img/real-un/un-delegates-after-vert.jpg')}
				style={{
					position: 'absolute',
					inset: 0,
					width: '100%',
					height: '100%',
					objectFit: 'cover',
					opacity: delIn,
				}}
			/>
			{/* Scrim: ligero arriba (el tablero debe verse), fuerte
			    abajo (el texto va sobre los delegados). */}
			<div
				style={{
					position: 'absolute',
					inset: 0,
					background:
						'linear-gradient(180deg, rgba(10,20,32,0.15) 0%, rgba(10,20,32,0.10) 35%, rgba(10,20,32,0.60) 50%, rgba(10,20,32,0.88) 100%)',
				}}
			/>
			<div
				style={{
					position: 'absolute',
					top: 850,
					left: 0,
					right: 0,
					textAlign: 'center',
					fontFamily: ARCHIVO,
					fontSize: 300,
					lineHeight: 1,
					color: '#FFFFFF',
					textShadow: textOutline(4),
					transform: `scale(${numScale})`,
				}}
			>
				130
			</div>
			<div
				style={{
					position: 'absolute',
					top: 1170,
					left: 0,
					right: 0,
					textAlign: 'center',
					fontFamily: ARCHIVO,
					fontSize: 52,
					lineHeight: 1.25,
					color: '#FFFFFF',
					textShadow: textOutline(3),
					opacity: subIn,
				}}
			>
				PAÍSES EXIGEN
				<br />
				EL FIN DEL BLOQUEO
			</div>
			<div
				style={{
					position: 'absolute',
					top: 1340,
					left: 390,
					width: 300,
					height: 6,
					background: MEMORIAL_RED,
					opacity: divIn,
				}}
			/>
			<div
				style={{
					position: 'absolute',
					top: 1400,
					left: 0,
					right: 0,
					textAlign: 'center',
					fontFamily: ARCHIVO,
					fontSize: 62,
					letterSpacing: 2,
					color: '#FFFFFF',
					textShadow: textOutline(3),
					opacity: titleIn,
				}}
			>
				MARTÍ-FIDEL:
			</div>
			<div
				style={{
					position: 'absolute',
					top: 1490,
					left: 0,
					right: 0,
					textAlign: 'center',
					fontFamily: ARCHIVO,
					fontSize: 76,
					letterSpacing: 2,
					textShadow: textOutline(3),
				}}
			>
				<span style={{color: '#FFFFFF', opacity: leerIn}}>LEER. </span>
				<span
					style={{
						color: MEMORIAL_RED,
						opacity: pensarIn,
						display: 'inline-block',
						transform: `scale(${pensarScale})`,
					}}
				>
					PENSAR.
				</span>
			</div>
			<div
				style={{
					position: 'absolute',
					top: 1640,
					left: 0,
					right: 0,
					textAlign: 'center',
					opacity: ctaIn,
					transform: `scale(${ctaScale})`,
				}}
			>
				<span
					style={{
						fontFamily: ARCHIVO,
						fontSize: 40,
						letterSpacing: 2,
						color: '#FFFFFF',
						background: MEMORIAL_RED,
						padding: '22px 44px',
						borderRadius: 60,
						boxShadow: '0 8px 30px rgba(237,28,36,0.45)',
					}}
				>
					GUARDA ESTE DATO
				</span>
			</div>
		</AbsoluteFill>
	);
};

// ================================================================
// S10 — STING (1416–1507 f · 47,20–50,23 s)
// Cierre animado oficial, versión negra a 2x (fondo negro propio)
// ================================================================
const StingScene: React.FC = () => {
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
// COMPOSICIÓN PRINCIPAL — 1507 f (50,23 s)
// ================================================================
export const MainReel: React.FC = () => {
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<Sequence from={0} durationInFrames={97} name="hook">
				<HookScene />
			</Sequence>
			<Sequence from={97} durationInFrames={140} name="bars">
				<BarsScene />
			</Sequence>
			<Sequence from={237} durationInFrames={128} name="counters">
				<CountersScene />
			</Sequence>
			<Sequence from={365} durationInFrames={211} name="map">
				<MapScene />
			</Sequence>
			<Sequence from={576} durationInFrames={192} name="evidence">
				<EvidenceScene />
			</Sequence>
			<Sequence from={768} durationInFrames={142} name="interrupt">
				<InterruptScene />
			</Sequence>
			<Sequence from={902} durationInFrames={116} name="marti">
				<MartiQuoteScene />
			</Sequence>
			<Sequence from={1010} durationInFrames={211} name="fidel">
				<FidelQuoteScene />
			</Sequence>
			<Sequence from={1221} durationInFrames={195} name="callback">
				<CallbackScene />
			</Sequence>
			<Sequence from={1416} durationInFrames={91} name="sting">
				<StingScene />
			</Sequence>

			{/* Marca de agua: logotipo completo desde el fotograma 0 */}
			<LogoInner />

			{/* Karaoke: 0–29,87 s y 40,69–45,69 s (citas sin karaoke) */}
			<Sequence from={0} durationInFrames={896} name="karaoke-a">
				<BottomKaraoke lines={LINES_A} />
			</Sequence>
			<Sequence from={1221} durationInFrames={150} name="karaoke-b">
				<BottomKaraoke lines={LINES_B} />
			</Sequence>

			{/* Mezcla única: VO + música Flow + SFX + sting */}
			<Audio src={staticFile('audio/mix.wav')} />
		</AbsoluteFill>
	);
};
