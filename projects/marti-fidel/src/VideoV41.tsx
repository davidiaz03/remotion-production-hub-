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
import {CAPTIONS} from './captions-v4';
import {CARIBBEAN_TT, CARIBBEAN_BREAK} from './mapDots';

// ================================================================
// «Martí-Fidel: leer, pensar» — V4.1 (20-nov-2026, rama work/marti-fidel-v3)
// Reel vertical 1080×1920, 30 fps. 2077 fotogramas = 69,23 s.
// Guion V4.3 (11 líneas), VO real de Adriana (verificada de oído
// por el usuario, 11/11 líneas aprobadas; tiempos reales de
// captions-v4.ts). Concepto «El archivo cobra vida»
// (research/ESTRATEGIA-VISUAL-V4.md): tres mundos — PRESENTE
// (L1–L4, azul noche, mapa vivo), ARCHIVO (L5–L7, papel y tinta),
// ESPEJO (L8–L11, pantallas → negro → árboles) — unidos por
// TRANSICIONES CONTINUAS (morfos, no cortes): el mapa SE CONVIERTE
// en papel (S1→S2), el papel se oscurece y SE CONVIERTE en
// pantallas (S7→S8, morfo DURO de 8 f, violento), las pantallas se
// apagan y el negro resultante ES el fondo de la tesis (S8→S9).
// EL HILO ROJO: un único rojo #ED1C24 con el mismo lenguaje de
// pulso/halo (ciclo de 45 f) que viaja de T&T (S1) a la tinta de
// las citas (S3/S5/S7, regla de margen que «se enciende») y a la
// llamarada del cierre (S11).
// Sistema tipográfico de tres voces: DATO (JetBrains Mono),
// VOZ (karaoke Archivo Black, kw en rojo), CITA (Playfair Display
// solemne) + tesis manuscrita (Caveat). Fuentes instaladas en
// ~/.fonts/ por la misma vía que Archivo Black (V3).
// Karaoke en L1, L2, L4, L6, L8, L10, L11; las citas (L3, L5, L7)
// van en tarjeta SIN karaoke (nunca texto doble); L9 es la tesis
// manuscrita. El «19» y «diecinueve» están PROHIBIDOS en voz,
// pantalla y mapa (los años 1891/2005 sí se muestran).
// Recursos V4 (caza completada 20-nov, 20/25): Martí retrato
// clásico (S2/S3), Browne Cumbre 2015 con letrero y micrófono
// (S4), Fidel La Habana 2003 recortado al Comandante (S7; la
// Mercosur 2006 es de grupo y queda como respaldo), tablero ONU
// como overlay (S1, NUNCA apertura), radio Pexels (S4), papel
// Pexels (S2/S3/S5), 7 banderas CARICOM en SVG (cascada S1).
// Recursos IA: bosque lejano con niebla (S11, fondo atmosférico
// tras la fila; Pollinations Flux, seed 7,
// public/img/v4/ai/forest-silhouette-mist.jpg) + tres sets de
// palmas reales pictóricas recortadas con rembg, UNO POR ESCENA
// (S5: palma-s5-{a,b,c}.png; S11: palma-s11-{a,b,c}.png; el set
// V4 palma-real-{a,b,c}.png queda sin uso). Nada de IA en
// personas ni en archivo: Martí, Fidel y Browne son solo reales.
// V3 queda intacta en src/VideoV3.tsx (composición MainReelV3).
// V4.1 (revisión del máster V4 por veredicto del usuario): música
// nueva generada con MusicGen (la cama de biblioteca V4 era lo más
// débil); cada escena de palmas usa SU PROPIO set de cutouts (el
// motivo se repite, la imagen nunca): S5 set nuevo, S11 set nuevo
// dramático; S10 SIN palmas (visual propio); mezcla con ducking
// suavizado (sin bombeo) y corrección de los microcortes de
// audio (ver reports/adjudicacion-auditoria-v41.md). NIVEL PARA
// TRIUNFAR (estudio EditorOP, research/social-trends-v3): S1 con
// T&T ya en rojo en el fotograma 0 (la miniatura muestra la
// ruptura); S11 con puñetazo de la llamarada en «¡FILA!» (f98).
// S8 ya era la interrupción más fuerte (flash de estática +
// temblor + glitch + apagado CRT) y se mantiene. V4 queda
// intacta en src/VideoV4.tsx (composición MainReelV4).
// ================================================================

const FPS = 30;
const ARCHIVO = "'Archivo Black', sans-serif";
const COND = "'Roboto Condensed', sans-serif";
const SERIF = "'Playfair Display', serif";
const MONO = "'JetBrains Mono', monospace";
const HAND = "'Caveat', cursive";
const AMBER = '#F5B301';
const NAVY = '#0A1420';
const NAVY2 = '#0E1E33';
const SEPIA_BG = '#171208';
const INK = '#211A12';
const FOLIO = '#6E5320';

// Fronteras de escena (fotogramas absolutos, 30 fps).
const S2_START = 167;
const S3_START = 269;
const S4_START = 382;
const S5_START = 562;
const S6_START = 768;
const S7_START = 1063;
const S8_START = 1345;
const S9_START = 1590;
const S10_START = 1724;
const S11_START = 1916;
const STING_START = 2026;

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

/** Deriva cinematográfica (Ken Burns con translate). */
const drift = (f: number, dur: number, dx: number, dy: number) => ({
	x: interpolate(f, [0, dur], [0, dx], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	}),
	y: interpolate(f, [0, dur], [0, dy], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	}),
});

/** Ventana de opacidad 0→1→0 con fades de 8 f en los bordes. */
const winOp = (f: number, a: number, b: number) =>
	clamp01(f, a, a + 8) * (1 - clamp01(f, b - 8, b));

/** Pseudo-aleatorio determinista (glitch, temblor): mismo valor cada render. */
const rnd = (n: number) => {
	const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
	return x - Math.floor(x);
};

// ---------- EL HILO ROJO ----------
// Un único rojo (#ED1C24 = MEMORIAL_RED) con el mismo lenguaje de
// pulso/halo en los tres mundos: ciclo de 45 f compartido por el
// pulso de T&T, los anillos de la cascada, la regla de margen de
// las tarjetas de cita y la llamarada del cierre. El espectador
// siente que es EL MISMO rojo porque late igual en todas partes.
const RED_PULSE_PERIOD = 45;
const redPulse = (f: number) => {
	const cycle = (f % RED_PULSE_PERIOD) / RED_PULSE_PERIOD;
	return {
		ringScale: interpolate(cycle, [0, 1], [1, 2.0]),
		ringOp: interpolate(cycle, [0, 1], [0.9, 0]),
		glow: interpolate(cycle, [0, 0.5, 1], [0.95, 0.45, 0.95]),
	};
};
const RED_HALO = (glow: number) =>
	`0 0 24px rgba(237,28,36,${0.75 * glow}), 0 0 60px rgba(237,28,36,${0.35 * glow})`;

// ---------- VOZ DATO: chip mono (fechas, fuentes, etiquetas) ----------
const DataChip: React.FC<{
	top: number;
	left?: number;
	right?: number;
	opacity: number;
	children: React.ReactNode;
}> = ({top, left, right, opacity, children}) => (
	<div
		style={{
			position: 'absolute',
			top,
			left,
			right,
			background: 'rgba(6,12,20,0.62)',
			border: '1px solid rgba(255,255,255,0.28)',
			borderRadius: 6,
			padding: '10px 18px',
			fontFamily: MONO,
			fontSize: 24,
			fontWeight: 700,
			letterSpacing: 3,
			color: '#FFFFFF',
			opacity,
			whiteSpace: 'nowrap',
		}}
	>
		{children}
	</div>
);

// ---------- tarjeta de papel del manuscrito (V2.1, V3) ----------
// `redPulse`: la regla de margen roja «se enciende» con el pulso
// del hilo rojo (mismo ciclo de 45 f que T&T): el eco del pulso
// del mapa reaparece en las citas.
const PaperCard: React.FC<{
	top: number;
	folio: string;
	opacity: number;
	rise?: number;
	redPulse?: boolean;
	children: React.ReactNode;
}> = ({top, folio, opacity, rise = 0, redPulse: rp = false, children}) => {
	const f = useCurrentFrame();
	const pulse = redPulse(f);
	return (
		<div
			style={{
				position: 'absolute',
				top,
				left: 56,
				right: 56,
				borderRadius: 8,
				overflow: 'hidden',
				boxShadow: '0 18px 50px rgba(0,0,0,0.55)',
				opacity,
				transform: `translateY(${rise}px)`,
			}}
		>
			<Img
				src={staticFile('img/paper-manuscript.png')}
				style={{
					position: 'absolute',
					inset: 0,
					width: '100%',
					height: '100%',
					objectFit: 'cover',
				}}
			/>
			{/* Regla de margen roja (el motivo que recorre todo el reel) */}
			<div
				style={{
					position: 'absolute',
					left: 22,
					top: 0,
					bottom: 0,
					width: 8,
					background: MEMORIAL_RED,
					opacity: 0.9,
					boxShadow: rp ? RED_HALO(pulse.glow) : 'none',
				}}
			/>
			{rp && (
				<>
					<div
						style={{
							position: 'absolute',
							left: 26,
							top: 26,
							width: 14,
							height: 14,
							borderRadius: '50%',
							border: `3px solid ${MEMORIAL_RED}`,
							transform: `scale(${pulse.ringScale})`,
							opacity: pulse.ringOp,
						}}
					/>
					<div
						style={{
							position: 'absolute',
							left: 28,
							top: 28,
							width: 10,
							height: 10,
							borderRadius: '50%',
							background: MEMORIAL_RED,
							boxShadow: RED_HALO(pulse.glow),
						}}
					/>
				</>
			)}
			<div style={{position: 'relative', padding: '30px 44px 34px 58px'}}>
				<div
					style={{
						fontFamily: MONO,
						fontSize: 24,
						fontWeight: 700,
						letterSpacing: 4,
						color: FOLIO,
						marginBottom: 18,
					}}
				>
					{folio}
				</div>
				{children}
			</div>
		</div>
	);
};

// ---------- grano de película + viñeta globales ----------
const GrainVignette: React.FC = () => {
	const f = useCurrentFrame();
	const tile = Math.floor((f * 12) / FPS) % 8;
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<Img
				src={staticFile(`img/grain/grain-${tile}.png`)}
				style={{
					width: '100%',
					height: '100%',
					objectFit: 'cover',
					opacity: 0.05,
					mixBlendMode: 'overlay',
				}}
			/>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					background:
						'radial-gradient(ellipse 90% 75% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.30) 100%)',
				}}
			/>
		</AbsoluteFill>
	);
};

// ---------- marca de agua (logotipo COMPLETO, blanco/transparente) ----------
// 115 px, arriba derecha, desde el fotograma 0, fade de salida
// antes del sting (2022–2032). Nunca solo la estrella. Velo
// radial MUY ligero (apenas legibilidad, nunca manchón ni placa)
// solo en las escenas claras de papel (S2/S3, S5) y en S7
// (pulido final 20-nov: 0,65/0,45 → 0,38/0,20, radio reducido).
const LogoInner: React.FC = () => {
	const frame = useCurrentFrame();
	const fadeOut = interpolate(frame, [2016, 2026], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const scrimOp = Math.max(
		winOp(frame, 167, 394),
		winOp(frame, 562, 780),
		winOp(frame, 1063, 1353),
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
						'radial-gradient(ellipse 42% 42% at 50% 44%, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0.20) 55%, rgba(0,0,0,0) 80%)',
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

// ---------- punto luminoso con anillo pulsante (hilo rojo, 45 f) ----------
const MapDot: React.FC<{
	x: number;
	y: number;
	color: string;
	appearAt: number;
	frame: number;
}> = ({x, y, color, appearAt, frame}) => {
	if (frame < appearAt) return null;
	const pulse = redPulse(frame - appearAt);
	const inScale = popIn(frame, appearAt, 8);
	return (
		<>
			<div
				style={{
					position: 'absolute',
					left: x - 11,
					top: y - 11,
					width: 22,
					height: 22,
					borderRadius: '50%',
					border: `3px solid ${color}`,
					transform: `scale(${pulse.ringScale})`,
					opacity: pulse.ringOp,
				}}
			/>
			<div
				style={{
					position: 'absolute',
					left: x - 9,
					top: y - 9,
					width: 18,
					height: 18,
					borderRadius: '50%',
					background: color,
					border: '3px solid #FFFFFF',
					transform: `scale(${inScale})`,
					boxShadow:
						color === MEMORIAL_RED
							? RED_HALO(pulse.glow)
							: '0 0 14px rgba(255,255,255,0.7)',
				}}
			/>
		</>
	);
};

// ---------- karaoke ----------
// Ventanas (tiempos absolutos → locales de cada Sequence):
// A: L1–L2 (f0–269) · B: L4 truncada (f382–562; la tarjeta muestra
// la cita completa desde «WASHINGTON», 15,71 s: el karaoke se
// apaga ahí con una línea vacía, patrón V3) · C: L6 (f768–1063) ·
// D: L8 (f1345–1590) · E1: L10 grande y centrada (f1724–1916, las
// dos afirmaciones a pantalla completa) · E2: L11 (f1916–2032).
// L3, L5, L7 van en tarjeta (sin karaoke); L9 es la tesis manuscrita.
const LINES_A: KaraokeLine[] = capSegmentsToLines(CAPTIONS.slice(0, 2));
const shiftLines = (lines: KaraokeLine[], sec: number): KaraokeLine[] =>
	lines.map((line) => ({
		words: line.words.map((w) => ({...w, s: w.s - sec, e: w.e - sec})),
	}));
const B_START = S4_START / FPS;
const CAPTIONS_B = [
	{
		...CAPTIONS[3],
		chunks: [
			...CAPTIONS[3].chunks.slice(0, 2),
			// Solo «RADIO:» del chunk 3: «WASHINGTON LO LLAMÓ…» lo
			// muestra la tarjeta, no el karaoke (nunca texto doble).
			{
				start: CAPTIONS[3].chunks[2].words[0].s,
				end: CAPTIONS[3].chunks[2].words[0].e,
				words: CAPTIONS[3].chunks[2].words.slice(0, 1),
			},
		],
	},
];
const LINES_B: KaraokeLine[] = [
	...shiftLines(capSegmentsToLines(CAPTIONS_B), B_START),
	// Línea vacía en 15,71 s («WASHINGTON»): apaga el karaoke
	// mientras la tarjeta muestra la cita completa.
	{words: [{t: '', s: 15.71 - B_START, e: 18.29 - B_START}]},
];
const LINES_C: KaraokeLine[] = shiftLines(
	capSegmentsToLines(CAPTIONS.slice(5, 6)),
	S6_START / FPS,
);
const LINES_D_RAW: KaraokeLine[] = shiftLines(
	capSegmentsToLines(CAPTIONS.slice(7, 8)),
	S8_START / FPS,
);
const LINES_D: KaraokeLine[] = [
	...LINES_D_RAW.slice(0, 2),
	// Línea vacía mientras el título glitch «REFLEJOS CONDICIONADOS»
	// está en pantalla (local f80–131): el título HACE de texto para
	// esas palabras (nunca texto doble; patrón V3 de LINES_B).
	// «REFLEJOS» se dice a los 47,52 s (local f80); «MUCHOS» a los
	// 49,22 s (local f131), cuando el karaoke vuelve. La ventana cubre
	// hasta f131 (no solo hasta f116, fin de «CONDICIONADOS:») porque
	// BottomKaraoke mantiene la línea activa hasta que empieza la
	// siguiente: sin la línea vacía, el chunk 2 seguiría visible en
	// la pausa f116–131 bajo el título. El fundido del título
	// (f140–148) coincide solo con el chunk 3 («MUCHOS…»), palabras
	// distintas: no hay duplicado.
	{words: [{t: '', s: 47.52 - S8_START / FPS, e: 49.22 - S8_START / FPS}]},
	...LINES_D_RAW.slice(2),
];
const LINES_E1: KaraokeLine[] = shiftLines(
	capSegmentsToLines(CAPTIONS.slice(9, 10)),
	S10_START / FPS,
);
const LINES_E2: KaraokeLine[] = shiftLines(
	capSegmentsToLines(CAPTIONS.slice(10, 11)),
	S11_START / FPS,
);

// ---------- onda sonora de radio (V3) ----------
const WAVE_BARS = 28;
const Soundwave: React.FC<{frame: number; top: number}> = ({frame, top}) => {
	const t = frame / FPS;
	const amp = interpolate(frame, [15, 25], [0.55, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const bars = [];
	for (let i = 0; i < WAVE_BARS; i++) {
		const h =
			(30 +
				110 *
					(0.5 + 0.5 * Math.sin(t * 3.1 + i * 0.9)) *
					(0.6 + 0.4 * Math.sin(t * 1.7 + i * 0.3))) *
			amp;
		bars.push(
			<div
				key={i}
				style={{
					width: 10,
					height: h,
					borderRadius: 5,
					background: i % 4 === 0 ? AMBER : '#FFFFFF',
					opacity: 0.8,
				}}
			/>,
		);
	}
	return (
		<div
			style={{
				position: 'absolute',
				top,
				left: 0,
				right: 0,
				height: 160,
				display: 'flex',
				flexDirection: 'row',
				alignItems: 'center',
				justifyContent: 'center',
				gap: 6,
			}}
		>
			{bars}
		</div>
	);
};

// ---------- palmas reales que CRECEN (S5) / a toda altura (S10/S11) ----------
// Fila de PALMAS REALES (Roystonea regia, el árbol cubano por
// excelencia; encaja con Martí y «Nuestra América»): tres
// ilustraciones pictóricas estilo grabado botánico, en la paleta
// sepia del mundo Archivo, generadas con Pollinations Flux
// (scripts/gen-illustration.py; seeds 11, 23 y 37) y recortadas
// con rembg a PNG con alfa (public/img/v4/ai/palma-real-{a,b,c}.
// png). Variedad por variante (i%3), espejo (i impar) y altura/
// brillo por índice: 7 palmas sin dos iguales. La vía (1) de foto
// real CC0 se intentó y se descartó: no se encontró ninguna fila
// lateral de palmas con licencia libre (solo avenidas en
// perspectiva, postales antiguas o fotos con marca de agua).
// El crecimiento en secuencia SE MANTIENE (es lo que vende la
// cita): revelado por máscara (clip-path desde el suelo) + leve
// escala vertical desde la base — la palma BROTA del suelo,
// tronco primero y copa al final — con balanceo lento
// determinista. `tone` noche oscurece y enfría la palma para
// S10/S11 (el mismo arte, otro mundo).
type PalmVariantSet = readonly {file: string; aspect: number}[];
const PALM_VARIANTS = [
	{file: 'img/v4/ai/palma-real-a.png', aspect: 631 / 1194},
	{file: 'img/v4/ai/palma-real-b.png', aspect: 648 / 1114},
	{file: 'img/v4/ai/palma-real-c.png', aspect: 595 / 1153},
] as const;
const PALM_BRIGHT = [1.0, 0.94, 1.05, 0.97, 1.02, 0.95, 1.0];
// V4.1: sets propios por escena (el motivo se repite, la imagen
// nunca). S5: palmas FOTOGRÁFICAS a plena luz (verde vivo, tronco
// gris; Pollinations Flux seeds 111/808/2222 + rembg isnet +
// despill) — estilo claramente distinto al set botánico sepia de
// V4. S11: SILUETAS negras a contraluz con filo rojo-anaranjado
// (seeds 1212/3434/7878), las más dramáticas, para fundirse con
// la llamarada. Aspectos REALES medidos con ffprobe (los 6 son
// más anchos que el set viejo: 0,60–0,73 frente a ~0,53).
const PALM_VARIANTS_S5: PalmVariantSet = [
	{file: 'img/v4/ai/palma-s5-a.png', aspect: 737 / 1224},
	{file: 'img/v4/ai/palma-s5-b.png', aspect: 768 / 1084},
	{file: 'img/v4/ai/palma-s5-c.png', aspect: 710 / 1093},
];
const PALM_VARIANTS_S11: PalmVariantSet = [
	{file: 'img/v4/ai/palma-s11-a.png', aspect: 765 / 1054},
	{file: 'img/v4/ai/palma-s11-b.png', aspect: 731 / 1171},
	{file: 'img/v4/ai/palma-s11-c.png', aspect: 691 / 1120},
];
const TREE_CX = [110, 250, 390, 540, 690, 830, 970];
const TREE_H = [0.9, 1.02, 0.86, 1.08, 0.94, 1.0, 0.88];
const GrowingPalm: React.FC<{
	i: number;
	x: number;
	groundY: number;
	height: number;
	growAt: number;
	growDur: number;
	frame: number;
	sway?: boolean;
	tone?: 'paper' | 'night';
	variants?: PalmVariantSet;
}> = ({
	i,
	x,
	groundY,
	height,
	growAt,
	growDur,
	frame,
	sway = false,
	tone = 'paper',
	variants = PALM_VARIANTS,
}) => {
	const p = interpolate(frame, [growAt, growAt + growDur], [0, 1], {
		easing: Easing.out(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const inOp = clamp01(frame, growAt, growAt + 6);
	const rot = sway ? Math.sin(frame / 45 + i * 1.3) * 1.6 : 0;
	const v = variants[i % variants.length];
	const flip = i % 2 === 1 ? -1 : 1;
	const h = height * (TREE_H[i] ?? 1);
	const w = h * v.aspect;
	const filter =
		tone === 'night'
			? 'brightness(0.52) saturate(0.85) hue-rotate(-6deg)'
			: `brightness(${PALM_BRIGHT[i] ?? 1}) saturate(1.05)`;
	return (
		<div
			style={{
				position: 'absolute',
				left: x - w / 2,
				top: groundY - h,
				width: w,
				height: h,
			}}
		>
			{/* Sombra de suelo bajo el tronco (no crece con la palma). */}
			<div
				style={{
					position: 'absolute',
					left: w * 0.32,
					bottom: -8,
					width: w * 0.36,
					height: 14,
					borderRadius: '50%',
					background: 'rgba(0,0,0,0.35)',
					opacity: inOp,
				}}
			/>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					// Revelado por máscara desde el suelo: la palma
					// brota (tronco primero, copa al final).
					clipPath: `inset(${(1 - p) * 100}% 0 0 0)`,
					transform: `rotate(${rot}deg) scaleY(${0.92 + 0.08 * p}) scaleX(${flip})`,
					transformOrigin: '50% 100%',
					opacity: inOp,
				}}
			>
				<Img
					src={staticFile(v.file)}
					style={{width: '100%', height: '100%', filter}}
				/>
			</div>
		</div>
	);
};

// ---------- fila de palmas de fondo (profundidad, S5/S10/S11) ----------
// Las mismas palmas, más pequeñas, oscuras y difuminadas,
// desplazadas medio paso para asomar entre las del primer plano.
// Ya está plantada cuando la fila principal crece (aparece en
// fundido, no en secuencia): la profundidad la da la perspectiva
// aérea (tamaño + desenfoque + oscuridad), no una segunda línea
// de suelo — el mundo Archivo es un friso plano.
const PalmBackdropRow: React.FC<{
	groundY: number;
	height: number;
	frame: number;
	revealAt: number;
	tone: 'paper' | 'night';
	variants?: PalmVariantSet;
}> = ({groundY, height, frame, revealAt, tone, variants = PALM_VARIANTS}) => {
	const op = clamp01(frame, revealAt, revealAt + 18) * 0.55;
	return (
		<div style={{position: 'absolute', inset: 0, opacity: op}}>
			{[0, 1, 2, 3, 4, 5, 6].map((i) => {
				const v = variants[(i + 1) % variants.length];
				const h = height * (TREE_H[(i + 2) % 7] ?? 1);
				const w = h * v.aspect;
				const x = TREE_CX[i] + 70;
				const flip = i % 2 === 0 ? -1 : 1;
				const filter =
					tone === 'night'
						? 'brightness(0.38) saturate(0.8) blur(2px)'
						: 'brightness(0.62) saturate(0.9) blur(2px)';
				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: x - w / 2,
							top: groundY - h,
							width: w,
							height: h,
							transform: `scaleX(${flip})`,
						}}
					>
						<Img
							src={staticFile(v.file)}
							style={{width: '100%', height: '100%', filter}}
						/>
					</div>
				);
			})}
		</div>
	);
};

// ---------- polvo dorado flotando entre las palmas (S5) ----------
// El elemento vivo quieto de la escena: motas que suben despacio
// con vaivén lateral y se desvanecen al reiniciar el ciclo
// (sin saltos visibles). Posiciones deterministas.
const DustMotes: React.FC<{frame: number; top: number; bottom: number}> = ({
	frame,
	top,
	bottom,
}) => {
	const motes = [];
	for (let i = 0; i < 12; i++) {
		const x0 = 60 + rnd(i * 3 + 1) * 960;
		const y0 = top + rnd(i * 5 + 2) * (bottom - top);
		const size = 3 + rnd(i * 7 + 3) * 4;
		const speed = 0.12 + rnd(i * 11 + 5) * 0.22;
		const rise = (frame * speed + i * 37) % 130;
		const fade = clamp01(rise, 0, 15) * (1 - clamp01(rise, 115, 130));
		const wob = Math.sin(frame / 28 + i * 2.1) * 12;
		motes.push(
			<div
				key={i}
				style={{
					position: 'absolute',
					left: x0 + wob,
					top: y0 - rise,
					width: size,
					height: size,
					borderRadius: '50%',
					background: 'rgba(255,224,150,0.55)',
					boxShadow: '0 0 8px rgba(255,224,150,0.5)',
					opacity: (0.35 + 0.3 * rnd(i * 13 + 7)) * fade,
				}}
			/>,
		);
	}
	return <>{motes}</>;
};

// ================================================================
// S1 — GANCHO, EL CARIBE ROTO (0–167 f · 0,00–5,57 s, local 0–179)
// Mapa vivo del Caribe sobre azul noche. Los 7 CARICOM se
// separan y DERIVAN en cascada (T&T primero, pulso rojo del hilo;
// luego Jamaica, Haití, Antigua, Dominica, Santa Lucía, Guyana,
// oeste → este), cada uno con su BANDERA clavada junto a su
// centroide: la bandera viaja con el país al derivar.
// El chip «CARICOM · 33 AÑOS UNIDO» se QUIEBRA al decirse «DEJÓ»
// (local f112) con el sello «ROTOS». SEGUNDO TIEMPO (f126–140):
// el mapa retrocede y se atenúa al 30% y el tablero ONU toma el
// escenario como foto central (nunca foto sobre mapa: cada recurso
// tiene su tiempo). La cámara vuela (zoom 1,0→1,3 acelerando)
// y el zoom CONTINÚA durante el morfo a S2:
// el mapa SE CONVIERTE en papel (S2 entra con wipe circular desde
// el punto del arco). Sin contadores, sin el «19».
// ================================================================
const MAP_LEFT = 60;
const MAP_TOP = 200;
const MAP_SIZE = 960;
const TT_X = MAP_LEFT + (CARIBBEAN_TT.x / 1400) * MAP_SIZE;
const TT_Y = MAP_TOP + (CARIBBEAN_TT.y / 1400) * MAP_SIZE;
const BREAK_PT = (name: keyof typeof CARIBBEAN_BREAK) => ({
	x: MAP_LEFT + (CARIBBEAN_BREAK[name].x / 1400) * MAP_SIZE,
	y: MAP_TOP + (CARIBBEAN_BREAK[name].y / 1400) * MAP_SIZE,
});
// Deriva de cada BANDERA al separarse (px de pantalla, hacia
// fuera del arco caribeño): la ruptura SE VE, no solo se ilumina.
// El RELLENO ROJO queda FIJO sobre la frontera exacta del país
// (misma geometría que la base: un solo GeoJSON, un solo render;
// verificado píxel a píxel, 100% sobre tierra). Solo la bandera
// deriva, con una línea guía hasta su centroide real.
// Cada país lleva su BANDERA (SVG en public/img/v4/) clavada
// junto a su centroide: la bandera deriva y la línea guía marca
// de dónde se separó.
// pt: centroide en coords del contenedor 960; fo: desplazamiento
// del pie de la bandera respecto al centroide (abanico en el arco
// para que no se solapen).
const CASCADE = [
	{key: 'tt', file: 'img/map-caribbean-tt.png', flag: 'img/v4/flag-trinidad-tobago.svg', pt: {x: 818, y: 625}, fo: {x: 0, y: -34}, at: 0, dx: 16, dy: 20},
	{key: 'jm', file: 'img/map-caribbean-jm.png', flag: 'img/v4/flag-jamaica.svg', pt: {x: 392, y: 380}, fo: {x: 0, y: -18}, at: 28, dx: -26, dy: -8},
	{key: 'ht', file: 'img/map-caribbean-ht.png', flag: 'img/v4/flag-haiti.svg', pt: {x: 514, y: 358}, fo: {x: 0, y: -18}, at: 44, dx: -12, dy: -12},
	{key: 'ag', file: 'img/map-caribbean-ag.png', flag: 'img/v4/flag-antigua-barbuda.svg', pt: {x: 806, y: 414}, fo: {x: -40, y: -28}, at: 60, dx: 12, dy: -16},
	{key: 'dm', file: 'img/map-caribbean-dm.png', flag: 'img/v4/flag-dominica.svg', pt: {x: 817, y: 466}, fo: {x: 44, y: -22}, at: 76, dx: 16, dy: -6},
	{key: 'lc', file: 'img/map-caribbean-lc.png', flag: 'img/v4/flag-saint-lucia.svg', pt: {x: 827, y: 515}, fo: {x: 30, y: -30}, at: 92, dx: 18, dy: 6},
	{key: 'gy', file: 'img/map-caribbean-gy.png', flag: 'img/v4/flag-guyana.svg', pt: {x: 885, y: 820}, fo: {x: 0, y: -18}, at: 104, dx: 24, dy: 12},
] as const;

const HookMapScene: React.FC = () => {
	const f = useCurrentFrame();
	// V4.1: SIN fundido de entrada — el fotograma 0 es la
	// miniatura del reel y debe leerse como un still (mapa +
	// chips + T&T ya en rojo). Los fundidos 0–12f dejaban el f0
	// vacío (solo el logo sobre azul noche).
	const baseIn = 1;
	const titleIn = 1;
	// Ruptura al decirse «DEJÓ» (3,75 s → f112, VO real).
	const breakIn = clamp01(f, 112, 118);
	const breakScale = popIn(f, 112, 10);
	const split = interpolate(f, [112, 126], [0, 1], {
		easing: Easing.out(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	// Barrido de luz secuencial (Antillas Mayores → arco, f0–80).
	const sweepX = interpolate(f, [0, 80], [450, 880], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const sweepY = interpolate(f, [0, 80], [580, 660], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const glowOp = 0.28 * clamp01(f, 0, 8) * (1 - clamp01(f, 60, 87));
	// Anillo sobre el arco al decirse «CARIBE» (3,39 s → f102).
	const ringScale = interpolate(f, [102, 132], [0.5, 2.2], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const ringOp = interpolate(f, [102, 132], [0.9, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	// Cámara viva: vuelo que ACELERA hacia el morfo (el zoom sigue
	// durante el solape con S2: el mapa se convierte en papel).
	const mapScale = interpolate(f, [0, 167, 179], [1.0, 1.2, 1.3], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	// Segundo tiempo (f126–140): el mapa RETROCEDE y se atenúa a
	// fondo (la foto ONU toma el escenario; nunca foto sobre mapa).
	// El fondo queda al 40%: llena el tercio medio tras la foto.
	const recede = interpolate(f, [126, 140], [1, 0.96], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const mapOp = 1 - 0.6 * clamp01(f, 126, 140);
	// En el segundo tiempo, la cascada (rellenos rojos, banderas)
	// y los puntos se desvanecen del todo: solo queda la base del
	// mapa al 40% como atmósfera, sin banderas fantasma.
	const beat2Out = 1 - clamp01(f, 126, 140);
	const mapDrift = drift(f, 179, -8, 5);
	// Overlay ONU: entra al final (f128), tras decirse «UNIDO.»
	const onuIn = clamp01(f, 128, 140);
	const onuRise = interpolate(f, [128, 140], [18, 0], {
		easing: Easing.out(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const ag = BREAK_PT('Antigua and Barb.');
	const dm = BREAK_PT('Dominica');
	const lc = BREAK_PT('Saint Lucia');
	return (
		<AbsoluteFill style={{background: NAVY}}>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					// +150 px en Y: el mapa baja para cerrar el hueco
					// a media altura entre el mapa y el karaoke.
					transform: `scale(${mapScale * recede}) translate(${mapDrift.x}px, ${mapDrift.y + 150}px)`,
					transformOrigin: '850px 560px',
					opacity: mapOp,
				}}
			>
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
						src={staticFile('img/map-caribbean-base.png')}
						style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}
					/>
					{CASCADE.map((c) => {
						// V4.1: T&T YA ESTÁ EN ROJO en el fotograma 0
						// (la miniatura del reel muestra la ruptura
						// desde el primer cuadro; el resto de la
						// cascada sigue en secuencia). Su bandera
						// deriva igual desde f0.
						const op =
							(c.key === 'tt'
								? 1
								: clamp01(f, c.at, c.at + 16)) * beat2Out;
						const dx = interpolate(f, [c.at, c.at + 44], [0, c.dx], {
							easing: Easing.out(Easing.cubic),
							extrapolateLeft: 'clamp',
							extrapolateRight: 'clamp',
						});
						const dy = interpolate(f, [c.at, c.at + 44], [0, c.dy], {
							easing: Easing.out(Easing.cubic),
							extrapolateLeft: 'clamp',
							extrapolateRight: 'clamp',
						});
						// La BANDERA sí deriva (es anotación, no geografía);
						// el relleno rojo queda fijo sobre la frontera exacta.
						// Línea guía: del pie de la bandera derivada al
						// centroide real del país.
						const footX = c.pt.x + c.fo.x + dx;
						const footY = c.pt.y + c.fo.y + dy;
						const leadLen = Math.hypot(c.pt.x - footX, c.pt.y - footY);
						const leadAng =
							(Math.atan2(c.pt.y - footY, c.pt.x - footX) * 180) / Math.PI;
						return (
							<div
								key={c.key}
								style={{
									position: 'absolute',
									inset: 0,
									opacity: op,
								}}
							>
								<Img
									src={staticFile(c.file)}
									style={{width: '100%', height: '100%'}}
								/>
								{/* Bandera del país: DERIVA sola (el relleno rojo
								no se mueve: misma geometría que la base).
								La de T&T lleva el halo del hilo rojo. */}
								<div
									style={{
										position: 'absolute',
										left: c.pt.x + c.fo.x - 34,
										top: c.pt.y + c.fo.y - 48,
										width: 68,
										height: 48,
										transform: `translate(${dx}px, ${dy}px)`,
										background: 'rgba(6,12,20,0.65)',
										border: '2px solid rgba(255,255,255,0.85)',
										borderRadius: 4,
										boxShadow:
											c.key === 'tt'
												? RED_HALO(redPulse(f).glow)
												: '0 4px 14px rgba(0,0,0,0.6)',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										overflow: 'hidden',
									}}
								>
									<Img
										src={staticFile(c.flag)}
										style={{
											width: '100%',
											height: '100%',
											objectFit: 'contain',
										}}
									/>
								</div>
								{/* Línea guía: de la bandera derivada al centroide. */}
								{leadLen > 4 && (
									<div
										style={{
											position: 'absolute',
											left: footX,
											top: footY,
											width: leadLen,
											height: 2,
											background: 'rgba(255,255,255,0.55)',
											transform: `rotate(${leadAng}deg)`,
											transformOrigin: 'left center',
										}}
									/>
								)}
							</div>
						);
					})}
				</div>
				<div
					style={{
						position: 'absolute',
						left: sweepX - 350,
						top: sweepY - 350,
						width: 700,
						height: 700,
						background:
							'radial-gradient(circle, rgba(245,179,1,0.30) 0%, rgba(245,179,1,0) 70%)',
						opacity: glowOp,
					}}
				/>
				{f >= 102 && (
					<div
						style={{
							position: 'absolute',
							left: 877 - 60,
							top: 665 - 60,
							width: 120,
							height: 120,
							borderRadius: '50%',
							border: `4px solid ${AMBER}`,
							transform: `scale(${ringScale})`,
							opacity: ringOp,
						}}
					/>
				)}
				{/* El hilo rojo NACE aquí: pulso de T&T (f24). Los puntos
				se desvanecen en el segundo tiempo (beat2Out). */}
				<div style={{opacity: beat2Out}}>
					<MapDot x={TT_X} y={TT_Y} color={MEMORIAL_RED} appearAt={24} frame={f} />
					<MapDot x={ag.x} y={ag.y} color={MEMORIAL_RED} appearAt={60} frame={f} />
					<MapDot x={dm.x} y={dm.y} color={MEMORIAL_RED} appearAt={76} frame={f} />
					<MapDot x={lc.x} y={lc.y} color={MEMORIAL_RED} appearAt={92} frame={f} />
				</div>
			</div>
			{/* Fecha en la apertura (voz DATO). */}
			<DataChip top={54} left={40} opacity={titleIn}>
				28 OCT 2026 · ONU
			</DataChip>
			{/* Chip «CARICOM · 33 AÑOS UNIDO» que SE QUIEBRA en f112:
			dos mitades que se separan con rotación + grieta roja. */}
			<div
				style={{
					position: 'absolute',
					top: 128,
					left: 0,
					right: 0,
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'flex-start',
					opacity: titleIn,
				}}
			>
				<div
					style={{
						display: 'flex',
						transform: `translateX(${-18 * split}px) rotate(${-4 * split}deg)`,
					}}
				>
					<span
						style={{
							fontFamily: ARCHIVO,
							fontSize: 38,
							letterSpacing: 2,
							color: '#FFFFFF',
							background: 'rgba(6,12,20,0.72)',
							border: '2px solid rgba(255,255,255,0.35)',
							borderRight: 'none',
							borderRadius: '10px 0 0 10px',
							padding: '14px 6px 14px 30px',
							textShadow: textOutline(2),
						}}
					>
						CARICOM · 33 AÑOS
					</span>
				</div>
				{/* Grieta: hija del flex, cae EXACTO en la juntura. */}
				<div
					style={{
						width: interpolate(f, [112, 118], [0, 6], {
							extrapolateLeft: 'clamp',
							extrapolateRight: 'clamp',
						}),
						height: 62,
						marginTop: 8,
						background: MEMORIAL_RED,
						transform: 'rotate(14deg)',
						opacity: breakIn,
						boxShadow: RED_HALO(redPulse(f).glow),
						flexShrink: 0,
					}}
				/>
				<div
					style={{
						display: 'flex',
						transform: `translateX(${18 * split}px) rotate(${4 * split}deg)`,
					}}
				>
					<span
						style={{
							fontFamily: ARCHIVO,
							fontSize: 38,
							letterSpacing: 2,
							color: '#FFFFFF',
							background: 'rgba(6,12,20,0.72)',
							border: '2px solid rgba(255,255,255,0.35)',
							borderLeft: 'none',
							borderRadius: '0 10px 10px 0',
							padding: '14px 30px 14px 6px',
							textShadow: textOutline(2),
						}}
					>
						UNIDO
					</span>
				</div>
			</div>
			{/* Sello ROTOS (f112, al decirse «DEJÓ»). */}
			<div
				style={{
					position: 'absolute',
					top: 300,
					left: 0,
					right: 0,
					textAlign: 'center',
					opacity: breakIn,
					transform: `scale(${breakScale}) rotate(-6deg)`,
				}}
			>
				<span
					style={{
						fontFamily: ARCHIVO,
						fontSize: 84,
						letterSpacing: 6,
						color: MEMORIAL_RED,
						border: `7px solid ${MEMORIAL_RED}`,
						borderRadius: 14,
						padding: '8px 40px',
						textShadow: textOutline(3),
						background: 'rgba(10,20,32,0.55)',
						boxShadow: RED_HALO(redPulse(f).glow),
					}}
				>
					ROTOS
				</span>
			</div>
			{/* SEGUNDO TIEMPO: la foto ONU toma el escenario (f128–140)
			mientras el mapa retrocede y se atenúa al 40% (fondo).
			Nunca foto sobre mapa: cada recurso tiene su tiempo.
			La foto es apaisada: se muestra entera, sin recorte. */}
			<div
				style={{
					position: 'absolute',
					top: 620,
					left: 16,
					right: 16,
					height: 524,
					borderRadius: 12,
					overflow: 'hidden',
					background: '#000000',
					border: '1px solid rgba(255,255,255,0.25)',
					boxShadow: '0 18px 50px rgba(0,0,0,0.55)',
					opacity: onuIn,
					transform: `translateY(${onuRise}px) scale(${0.94 + 0.06 * onuIn})`,
				}}
			>
				<Img
					src={staticFile('img/v4/onu-votacion-28oct2026-unphoto.jpg')}
					style={{
						width: '100%',
						height: 474,
						objectFit: 'cover',
						objectPosition: '50% 50%',
						display: 'block',
					}}
				/>
				<div
					style={{
						fontFamily: MONO,
						fontSize: 20,
						fontWeight: 700,
						letterSpacing: 1,
						color: '#FFFFFF',
						textAlign: 'center',
						padding: '14px 0 12px',
						whiteSpace: 'nowrap',
					}}
				>
					TABLERO DE VOTACIÓN · ONU · 28 OCT 2026 · ACTA A/81/PV.28
				</div>
			</div>
		</AbsoluteFill>
	);
};

// ================================================================
// S2 — 1891 (167–269 f · 5,57–8,97 s, local 0–114)
// MORFO S1→S2: el papel entra con un wipe circular que nace en
// el punto del arco caribeño (878, 788 — Dominica, tras el
// desplazamiento +110 px del mapa) mientras el zoom del mapa
// sigue acelerando debajo: el mapa SE CONVIERTE en papel.
// Retrato clásico de Martí (1220×2035) con parallax y push-in;
// «1891» en serif gigante al decirse «1891.» (local f44).
// ================================================================
const Year1891Scene: React.FC = () => {
	const f = useCurrentFrame();
	// Wipe circular del morfo (f0–14): el papel nace del mapa.
	const wipeR = interpolate(f, [0, 14], [0, 1750], {
		easing: Easing.out(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const paperScale = interpolate(f, [0, 114], [1.14, 1.0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const paperDrift = drift(f, 114, -6, -10);
	// Retrato: parallax opuesto al papel + push-in.
	const cardIn = clamp01(f, 6, 14);
	const cardRise = interpolate(f, [6, 18], [30, 0], {
		easing: Easing.out(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const cardX = interpolate(f, [0, 114], [14, -10], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const cardScale = interpolate(f, [0, 114], [1, 1.05], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	// «1891» al decirse (7,03 s → local f44).
	const yearIn = clamp01(f, 44, 52);
	const yearScale = popIn(f, 44, 12);
	const ruleIn = clamp01(f, 52, 60);
	const folioIn = clamp01(f, 56, 64);
	const chipIn = clamp01(f, 10, 18);
	return (
		<AbsoluteFill
			style={{
				background: SEPIA_BG,
				clipPath: `circle(${wipeR}px at 878px 860px)`,
			}}
		>
			<Img
				src={staticFile('img/v4/papel-arrugado-marron.jpg')}
				style={{
					width: '100%',
					height: '100%',
					objectFit: 'cover',
					transform: `scale(${paperScale}) translate(${paperDrift.x}px, ${paperDrift.y}px)`,
				}}
			/>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					background:
						'linear-gradient(180deg, rgba(23,18,8,0.25) 0%, rgba(23,18,8,0.05) 45%, rgba(23,18,8,0.55) 100%)',
				}}
			/>
			<DataChip top={54} left={40} opacity={chipIn}>
				EL ARCHIVO
			</DataChip>
			{/* Retrato clásico de Martí, enmarcado, con parallax. */}
			<div
				style={{
					position: 'absolute',
					top: 130,
					left: 290,
					width: 500,
					opacity: cardIn,
					transform: `translate(${cardX}px, ${cardRise}px) rotate(-1.5deg) scale(${cardScale})`,
					background: '#F5F0E6',
					padding: 12,
					paddingBottom: 18,
					boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
				}}
			>
				<Img
					src={staticFile('img/v4/marti-retrato-clasico.jpg')}
					style={{width: '100%', height: 800, objectFit: 'cover', display: 'block'}}
				/>
				<div
					style={{
						fontFamily: MONO,
						fontSize: 22,
						fontWeight: 700,
						letterSpacing: 3,
						color: FOLIO,
						textAlign: 'center',
						marginTop: 12,
					}}
				>
					JOSÉ MARTÍ
				</div>
			</div>
			{/* «1891» en serif gigante (voz CITA). */}
			<div
				style={{
					position: 'absolute',
					top: 1030,
					left: 0,
					right: 0,
					textAlign: 'center',
					opacity: yearIn,
					transform: `scale(${yearScale}) rotate(-1deg)`,
				}}
			>
				<span
					style={{
						fontFamily: SERIF,
						fontWeight: 900,
						fontSize: 250,
						lineHeight: 1,
						color: INK,
						textShadow: '0 4px 0 rgba(255,255,255,0.25)',
					}}
				>
					1891
				</span>
			</div>
			<div
				style={{
					position: 'absolute',
					top: 1310,
					left: 390,
					width: 300,
					height: 6,
					background: MEMORIAL_RED,
					opacity: ruleIn,
					boxShadow: RED_HALO(redPulse(f).glow),
				}}
			/>
			<div
				style={{
					position: 'absolute',
					top: 1350,
					left: 0,
					right: 0,
					textAlign: 'center',
					opacity: folioIn,
				}}
			>
				<span
					style={{
						fontFamily: MONO,
						fontSize: 26,
						fontWeight: 700,
						letterSpacing: 3,
						color: INK,
						background: 'rgba(245,240,230,0.82)',
						padding: '10px 22px',
						borderRadius: 6,
					}}
				>
					NUESTRA AMÉRICA · LA REVISTA ILUSTRADA
				</span>
			</div>
		</AbsoluteFill>
	);
};

// ================================================================
// S3 — CITA 1, EL RECUENTO (269–382 f · 8,97–12,73 s, local 0–125)
// Tarjeta de cita sobre papel beige, revelado en tinta línea a
// línea (l1 f2, l2 al decirse «Y», f53). La portada de La Revista
// Ilustrada es la PROTAGONISTA (grande, centro del cuadro, con
// push-in propio); el retrato ovalado de Martí (México 1894) la
// apoya desde la esquina superior izquierda, solapando su esquina.
// El HILO ROJO une los tres elementos: la regla roja de la tarjeta
// se extiende hacia arriba (con punto pulsante) hasta el retrato.
// Cámara VIVA: push lento del papel + push-in de la portada +
// barrido de luz cálida y retrato que respira. Sin karaoke.
// ================================================================
const RecuentoScene: React.FC = () => {
	const f = useCurrentFrame();
	const dissolveIn = clamp01(f, 0, 12);
	const push = interpolate(f, [0, 125], [1, 1.03], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	// Barrido de luz cálida sobre el papel.
	const lightX = interpolate(f, [0, 125], [150, 900], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const portraitIn = clamp01(f, 8, 18);
	const portraitScale = interpolate(f, [0, 125], [1, 1.02], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const docIn = clamp01(f, 14, 24);
	// Push-in propio de la portada (la protagonista se acerca).
	const docPush = interpolate(f, [0, 125], [1, 1.06], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const cardIn = clamp01(f, 0, 8);
	const cardRise = interpolate(f, [0, 12], [24, 0], {
		easing: Easing.out(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	// Revelado en tinta: l1 al empezar, l2 al decirse «Y» (f53).
	const l1 = clamp01(f, 2, 10);
	const l2 = clamp01(f, 53, 61);
	return (
		<AbsoluteFill style={{background: SEPIA_BG, opacity: dissolveIn}}>
			<Img
				src={staticFile('img/v4/papel-antiguo-beige.jpg')}
				style={{
					width: '100%',
					height: '100%',
					objectFit: 'cover',
					transform: `scale(${push})`,
					transformOrigin: '50% 35%',
				}}
			/>
			<div
				style={{
					position: 'absolute',
					left: lightX - 400,
					top: -100,
					width: 800,
					height: 1200,
					background:
						'radial-gradient(ellipse, rgba(255,240,200,0.14) 0%, rgba(255,240,200,0) 70%)',
				}}
			/>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					background:
						'linear-gradient(180deg, rgba(23,18,8,0.15) 0%, rgba(23,18,8,0.05) 50%, rgba(23,18,8,0.35) 100%)',
				}}
			/>
			{/* La Revista Ilustrada (1891), PROTAGONISTA: grande, centro
			del cuadro, con push-in propio (el documento que contiene
			el ensayo manda en la escena). */}
			<div
				style={{
					position: 'absolute',
					top: 330,
					left: 290,
					width: 480,
					opacity: docIn,
					transform: `rotate(2deg) scale(${docPush})`,
					transformOrigin: '50% 40%',
					background: '#F5F0E6',
					padding: 10,
					boxShadow: '0 16px 40px rgba(0,0,0,0.55)',
				}}
			>
				<Img
					src={staticFile('img/revista-ilustrada-1891.jpg')}
					style={{width: '100%', display: 'block'}}
				/>
			</div>
			{/* Retrato ovalado (México 1894), apoyo en la esquina
			superior IZQUIERDA (la derecha la ocupa la marca de agua:
			nunca texto ni logo sobre el retrato). Solapa la esquina
			de la portada: los dos documentos se tocan. */}
			<div
				style={{
					position: 'absolute',
					top: 150,
					left: 90,
					width: 260,
					opacity: portraitIn,
					transform: `rotate(-2deg) scale(${portraitScale})`,
					background: '#F5F0E6',
					padding: 10,
					boxShadow: '0 16px 40px rgba(0,0,0,0.55)',
				}}
			>
				<Img
					src={staticFile('img/v4/marti-retrato-mexico-1894.jpg')}
					style={{
						width: '100%',
						height: 320,
						objectFit: 'cover',
						objectPosition: '50% 28%',
						display: 'block',
					}}
				/>
			</div>
			{/* El hilo rojo une retrato → portada → tarjeta: la regla
			roja de la tarjeta se extiende hacia arriba hasta la base
			del retrato (misma x que la regla, 78), con punto pulsante
			en el extremo (mismo ciclo de 45 f que la tarjeta). */}
			<div
				style={{
					position: 'absolute',
					left: 78,
					top: 490,
					width: 8,
					height: 660,
					background: MEMORIAL_RED,
					opacity: 0.55 * docIn,
				}}
			/>
			<div
				style={{
					position: 'absolute',
					left: 75,
					top: 482,
					width: 14,
					height: 14,
					borderRadius: '50%',
					border: `3px solid ${MEMORIAL_RED}`,
					transform: `scale(${redPulse(f).ringScale})`,
					opacity: redPulse(f).ringOp * docIn,
				}}
			/>
			<div
				style={{
					position: 'absolute',
					left: 77,
					top: 484,
					width: 10,
					height: 10,
					borderRadius: '50%',
					background: MEMORIAL_RED,
					boxShadow: RED_HALO(redPulse(f).glow),
					opacity: docIn,
				}}
			/>
			<PaperCard
				top={1150}
				folio="NUESTRA AMÉRICA · 1891"
				opacity={cardIn}
				rise={cardRise}
				redPulse
			>
				<div
					style={{
						textAlign: 'center',
						fontFamily: SERIF,
						fontWeight: 700,
						fontSize: 56,
						lineHeight: 1.4,
						color: INK,
					}}
				>
					<div style={{opacity: l1}}>
						«Es la hora del <span style={{color: MEMORIAL_RED}}>RECUENTO,</span>
					</div>
					<div style={{opacity: l2}}>y de la marcha unida»</div>
				</div>
			</PaperCard>
		</AbsoluteFill>
	);
};

// ================================================================
// S4 — EVIDENCIA BROWNE (382–562 f · 12,73–18,73 s, local 0–192)
// Mundo emisión: estudio de radio (Pexels, vertical) con push-in
// al micrófono + plano de detalle que entra en f60 + onda sonora
// animada + bug «EN VIVO». La tarjeta-chyron (estilo emisión,
// oscura, NO papel: este mundo no es el Archivo) entra al decirse
// «WASHINGTON» (local f89) con la cita completa y la foto de
// Browne recortada (solo él, sin Catalina); el karaoke se apaga
// en ese mismo instante (línea vacía): nunca texto doble.
// ================================================================
const EvidenceScene: React.FC = () => {
	const f = useCurrentFrame();
	const dissolveIn = clamp01(f, 0, 12);
	const push = interpolate(f, [0, 192], [1, 1.07], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const d = drift(f, 192, -8, 10);
	// Plano de detalle del micrófono (f60–75): segundo latido visual.
	const detailIn = clamp01(f, 60, 75);
	const detailScale = interpolate(f, [60, 192], [1.08, 1.14], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const waveIn = clamp01(f, 0, 12);
	// Tarjeta-chyron al decirse «WASHINGTON» (15,71 s → local f89).
	const cardIn = clamp01(f, 89, 97);
	const cardRise = interpolate(f, [89, 101], [24, 0], {
		easing: Easing.out(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	// Bug EN VIVO: parpadeo determinista (ciclo 30 f).
	const liveDot = 0.55 + 0.45 * Math.sin((f / 30) * Math.PI * 2);
	return (
		<AbsoluteFill style={{background: NAVY2, opacity: dissolveIn}}>
			<Img
				src={staticFile('img/v4/radio-estudio-retrato.jpg')}
				style={{
					width: '100%',
					height: '100%',
					objectFit: 'cover',
					transform: `scale(${push}) translate(${d.x}px, ${d.y}px)`,
					transformOrigin: '60% 35%',
					opacity: 0.62,
				}}
			/>
			<Img
				src={staticFile('img/v4/radio-microfono-primer-plano.jpg')}
				style={{
					position: 'absolute',
					inset: 0,
					width: '100%',
					height: '100%',
					objectFit: 'cover',
					transform: `scale(${detailScale})`,
					transformOrigin: '50% 40%',
					opacity: 0.62 * detailIn,
				}}
			/>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					background:
						'linear-gradient(180deg, rgba(10,20,32,0.55) 0%, rgba(10,20,32,0.25) 45%, rgba(10,20,32,0.92) 85%, rgba(10,20,32,0.97) 100%)',
				}}
			/>
			{/* Bug EN VIVO (voz DATO). La fecha vive solo en la
			tarjeta-chyron (sin duplicar). */}
			<div
				style={{
					position: 'absolute',
					top: 54,
					left: 40,
					display: 'flex',
					flexDirection: 'column',
					gap: 10,
				}}
			>
				<div style={{display: 'flex', alignItems: 'center', gap: 12}}>
					<div
						style={{
							width: 20,
							height: 20,
							borderRadius: '50%',
							background: MEMORIAL_RED,
							opacity: liveDot,
							boxShadow: RED_HALO(redPulse(f).glow),
						}}
					/>
					<span
						style={{
							fontFamily: ARCHIVO,
							fontSize: 32,
							letterSpacing: 4,
							color: '#FFFFFF',
							textShadow: textOutline(2),
						}}
					>
						EN VIVO
					</span>
				</div>
			</div>
			{/* La radio está «en el aire»: onda sonora animada. */}
			<div style={{opacity: waveIn}}>
				<Soundwave frame={f} top={950} />
			</div>
			{/* Tarjeta-chyron de evidencia (f89, «WASHINGTON»). */}
			<div
				style={{
					position: 'absolute',
					top: 1180,
					left: 56,
					right: 56,
					background: 'rgba(8,14,24,0.90)',
					borderTop: `6px solid ${MEMORIAL_RED}`,
					borderRadius: 10,
					boxShadow: '0 18px 50px rgba(0,0,0,0.6)',
					padding: '26px 30px 28px 30px',
					opacity: cardIn,
					transform: `translateY(${cardRise}px)`,
				}}
			>
				<div style={{display: 'flex', gap: 26}}>
					{/* Browne en la Cumbre 2015: cara + letrero
					«ANTIGUA Y BARBUDA» + micrófono, todo visible
					(la foto es apaisada; el marco conserva su
					proporción para no recortar el letrero). */}
					<Img
						src={staticFile('img/v4/browne-cumbre-2015.jpg')}
						style={{
							width: 320,
							height: 240,
							objectFit: 'cover',
							objectPosition: '50% 25%',
							border: '2px solid rgba(255,255,255,0.3)',
							borderRadius: 4,
							flexShrink: 0,
						}}
					/>
					<div style={{flex: 1}}>
						<div
							style={{
								fontFamily: MONO,
								fontSize: 23,
								fontWeight: 700,
								letterSpacing: 3,
								color: MEMORIAL_RED,
								marginBottom: 14,
							}}
						>
							LO CONTÓ EN LA RADIO
						</div>
						<div
							style={{
								fontFamily: SERIF,
								fontWeight: 700,
								fontSize: 44,
								lineHeight: 1.3,
								color: '#FFFFFF',
							}}
						>
							«Washington lo llamó para que{' '}
							<span style={{color: MEMORIAL_RED}}>cambiara</span> su voto»
						</div>
						<div
							style={{
								fontFamily: MONO,
								fontSize: 22,
								fontWeight: 700,
								letterSpacing: 1,
								color: '#FFFFFF',
								marginTop: 18,
							}}
						>
							GASTON BROWNE · PRIMER MINISTRO DE ANTIGUA Y BARBUDA
						</div>
						<div
							style={{
								fontFamily: MONO,
								fontSize: 21,
								letterSpacing: 1,
								color: AMBER,
								marginTop: 8,
							}}
						>
							RADIO · 9 NOV 2026
						</div>
					</div>
				</div>
			</div>
		</AbsoluteFill>
	);
};

// ================================================================
// S5 — LAS PALMAS CRECEN (562–768 f · 18,73–25,60 s, local 0–218)
// La metáfora de Martí ANIMADA: siete PALMAS REALES crecen en
// secuencia de izquierda a derecha al ritmo de la cita (f67–
// f139), brotando del suelo por revelado de máscara, con
// travelling lateral lento, fila de fondo en parallax (0,4×),
// barrido de luz cálida entre las hojas y polvo dorado flotando.
// La línea de suelo se traza bajo ellas. La cita va en tarjeta
// serif (sin karaoke). Fondo sepia con luz cálida.
// ================================================================
const TreesScene: React.FC = () => {
	const f = useCurrentFrame();
	const dissolveIn = clamp01(f, 0, 12);
	const push = interpolate(f, [0, 218], [1, 1.04], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const chipIn = clamp01(f, 8, 16);
	const cardIn = clamp01(f, 48, 56);
	const cardRise = interpolate(f, [48, 60], [24, 0], {
		easing: Easing.out(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	// Cita: l1 «¡LOS» (f67), l2 «FILA,» (f103), l3 «PASE» (f139),
	// l4 «GIGANTE» (f151).
	const l1 = clamp01(f, 67, 75);
	const l2 = clamp01(f, 103, 111);
	const l3 = clamp01(f, 139, 147);
	const l4 = clamp01(f, 151, 159);
	// Travelling lateral siguiendo el crecimiento.
	const travelX = interpolate(f, [0, 218], [-24, 24], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	// Barrido de luz cálida entre las hojas (de izquierda a
	// derecha, una sola pasada lenta en toda la escena).
	const sweepX = interpolate(f, [0, 218], [-320, 1240], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const groundDraw = interpolate(f, [67, 139], [0, 1], {
		easing: Easing.out(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	return (
		<AbsoluteFill style={{background: SEPIA_BG, opacity: dissolveIn}}>
			<Img
				src={staticFile('img/v4/papel-arrugado-marron.jpg')}
				style={{
					width: '100%',
					height: '100%',
					objectFit: 'cover',
					transform: `scale(${push})`,
					opacity: 0.35,
				}}
			/>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					background:
						'radial-gradient(ellipse 80% 50% at 30% 20%, rgba(245,179,1,0.20) 0%, rgba(23,18,8,0) 70%), linear-gradient(180deg, rgba(23,18,8,0.10) 0%, rgba(23,18,8,0.30) 60%, rgba(23,18,8,0.75) 100%)',
				}}
			/>
			<div
				style={{
					position: 'absolute',
					top: 310,
					left: 0,
					right: 0,
					textAlign: 'center',
					opacity: chipIn,
				}}
			>
				<span
					style={{
						fontFamily: ARCHIVO,
						fontSize: 44,
						letterSpacing: 2,
						color: '#FFFFFF',
						background: MEMORIAL_RED,
						padding: '10px 34px',
						borderRadius: 8,
						textShadow: textOutline(2),
						boxShadow: RED_HALO(redPulse(f).glow),
					}}
				>
					YA LO HABÍA DICHO MARTÍ:
				</span>
			</div>
			{/* Fila de fondo en parallax (0,4× del travelling). */}
			<div
				style={{
					position: 'absolute',
					inset: 0,
					transform: `translateX(${travelX * 0.4}px)`,
				}}
			>
				<PalmBackdropRow
					groundY={1200}
					height={430}
					frame={f}
					revealAt={40}
					tone="paper"
					variants={PALM_VARIANTS_S5}
				/>
			</div>
			{/* Banda de las palmas: crecen en secuencia, travelling. */}
			<div
				style={{
					position: 'absolute',
					inset: 0,
					transform: `translateX(${travelX}px)`,
				}}
			>
				{[0, 1, 2, 3, 4, 5, 6].map((i) => (
					<GrowingPalm
						key={i}
						i={i}
						x={TREE_CX[i]}
						groundY={1200}
						height={660}
						growAt={67 + i * 12}
						growDur={26}
						frame={f}
						sway
						variants={PALM_VARIANTS_S5}
					/>
				))}
				<div
					style={{
						position: 'absolute',
						top: 1200,
						left: 60,
						width: 960,
						height: 4,
						background: '#5A4632',
						transform: `scaleX(${groundDraw})`,
						transformOrigin: '0 50%',
					}}
				/>
			</div>
			{/* Barrido de luz cálida entre las hojas. */}
			<div
				style={{
					position: 'absolute',
					left: sweepX,
					top: 470,
					width: 260,
					height: 780,
					background:
						'linear-gradient(90deg, rgba(255,230,160,0) 0%, rgba(255,230,160,0.10) 50%, rgba(255,230,160,0) 100%)',
					transform: 'skewX(-18deg)',
					pointerEvents: 'none',
				}}
			/>
			<DustMotes frame={f} top={500} bottom={1200} />
			<PaperCard
				top={1300}
				folio="NUESTRA AMÉRICA · 1891"
				opacity={cardIn}
				rise={cardRise}
				redPulse
			>
				<div
					style={{
						textAlign: 'center',
						fontFamily: SERIF,
						fontWeight: 700,
						fontSize: 50,
						lineHeight: 1.4,
						color: INK,
					}}
				>
					<div style={{opacity: l1}}>«¡Los árboles se han de</div>
					<div style={{opacity: l2}}>
						poner en <span style={{color: MEMORIAL_RED}}>fila,</span>
					</div>
					<div style={{opacity: l3}}>
						para que no pase el <span style={{color: MEMORIAL_RED}}>gigante</span>
					</div>
					<div style={{opacity: l4}}>de las siete leguas!»</div>
				</div>
			</PaperCard>
		</AbsoluteFill>
	);
};

// ================================================================
// S6 — EL GIGANTE (768–1063 f · 25,60–35,43 s, local 0–307)
// Mapa de Nuestra América CON EE. UU. VISIBLE (map-latam-usa.png,
// Natural Earth 50m, bbox lon −125..−55 / lat −60..50: el EE. UU.
// continental completo; map-base.png NO lo contenía y el chip
// señalaba fuera de cuadro). Retroceso de cámara suave; el
// resplandor rojo del hilo EMANA de Florida como un resplandor
// RADIAL que crece al decirse «GIGANTE» (f28) y «ESTADOS UNIDOS»
// (f148) y se extiende al decirse «AMENAZA CON EXTENDER SU
// DOMINIO» (f190–274): filo difuminado, nunca borde duro. Las
// etiquetas DATO van pegadas al resplandor: «ESTADOS UNIDOS» sobre
// el punto, «PODERÍO ECONÓMICO Y MILITAR» justo bajo él con línea
// guía, «NUESTRA AMÉRICA» en el Pacífico con guía a la costa del
// Perú. Karaoke L6 abajo.
// ================================================================
const LATAM_LEFT = 80;
const LATAM_TOP = 90;
const LATAM_W = 920;
const LATAM_H = 1446;
// Canvas del mapa nuevo: 1400×2200 (20 px/grado, lon −125..−55 /
// lat −60..50). Florida (lon −81,5, lat 28) → canvas (870, 440).
const US_X = LATAM_LEFT + (870 / 1400) * LATAM_W;
const US_Y = LATAM_TOP + (440 / 2200) * LATAM_H;

const GiantMapScene: React.FC = () => {
	const f = useCurrentFrame();
	const dissolveIn = clamp01(f, 0, 12);
	// Retroceso suave (el continente entero ya se ve desde f0).
	const mapScale = interpolate(f, [0, 307], [1.08, 0.98], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const mapDrift = drift(f, 307, 10, -6);
	// EE. UU. se enciende al decirse «GIGANTE,» (26,53 s → f28).
	const usIn = clamp01(f, 28, 40);
	const pulse = redPulse(f);
	// Resplandor RADIAL que emana de Florida y crece: 140 px al
	// decirse «GIGANTE» (f28), 520 al decirse «ESTADOS UNIDOS»
	// (f148), 1080 al completarse «EXTENDER SU DOMINIO» (f274).
	const glowR = interpolate(f, [28, 148, 274], [140, 520, 1080], {
		easing: Easing.inOut(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	// Etiquetas DATO.
	const tag1In = clamp01(f, 104, 112);
	const tag2In = clamp01(f, 253, 261);
	return (
		<AbsoluteFill style={{background: NAVY, opacity: dissolveIn}}>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					transform: `scale(${mapScale}) translate(${mapDrift.x}px, ${mapDrift.y}px)`,
					transformOrigin: '540px 560px',
				}}
			>
				<div
					style={{
						position: 'absolute',
						left: LATAM_LEFT,
						top: LATAM_TOP,
						width: LATAM_W,
						height: LATAM_H,
					}}
				>
					<Img
						src={staticFile('img/map-latam-usa.png')}
						style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}
					/>
				</div>
				{/* Resplandor rojo RADIAL que emana de EE. UU.: crece
				en radio al ritmo de la voz, con filo difuminado
				(nunca borde duro ni rectángulo). */}
				<div
					style={{
						position: 'absolute',
						inset: 0,
						background: `radial-gradient(circle ${glowR}px at ${US_X}px ${US_Y}px, rgba(237,28,36,0.42) 0%, rgba(237,28,36,0.18) 45%, rgba(237,28,36,0) 70%)`,
						opacity: usIn * (0.85 + 0.15 * pulse.glow),
					}}
				/>
				{/* Núcleo caliente sobre Florida (el hilo rojo). */}
				<div
					style={{
						position: 'absolute',
						left: US_X - 280,
						top: US_Y - 170,
						width: 560,
						height: 340,
						background:
							'radial-gradient(ellipse, rgba(237,28,36,0.55) 0%, rgba(237,28,36,0) 70%)',
						opacity: usIn * (0.55 + 0.35 * pulse.glow),
					}}
				/>
				<MapDot x={US_X} y={US_Y} color={MEMORIAL_RED} appearAt={28} frame={f} />
				{/* Etiqueta DATO sobre el resplandor. */}
				<div
					style={{
						position: 'absolute',
						top: 300,
						left: US_X,
						transform: 'translateX(-50%)',
						textAlign: 'center',
						background: 'rgba(6,12,20,0.72)',
						border: `1px solid ${MEMORIAL_RED}`,
						borderRadius: 6,
						padding: '10px 22px',
						fontFamily: MONO,
						fontSize: 24,
						fontWeight: 700,
						letterSpacing: 3,
						color: '#FFFFFF',
						whiteSpace: 'nowrap',
						opacity: usIn,
						boxShadow: RED_HALO(pulse.glow),
					}}
				>
					ESTADOS UNIDOS
				</div>
				{/* PODERÍO pegado al resplandor, justo bajo el punto,
				con línea guía corta desde el punto. */}
				<div
					style={{
						position: 'absolute',
						left: US_X - 1,
						top: 404,
						width: 2,
						height: 28,
						background: MEMORIAL_RED,
						opacity: 0.8 * tag1In,
					}}
				/>
				<div
					style={{
						position: 'absolute',
						top: 432,
						left: US_X,
						transform: 'translateX(-50%)',
						display: 'flex',
						alignItems: 'center',
						gap: 12,
						background: 'rgba(6,12,20,0.72)',
						border: `1px solid ${MEMORIAL_RED}`,
						borderRadius: 6,
						padding: '10px 20px',
						fontFamily: MONO,
						fontSize: 24,
						fontWeight: 700,
						letterSpacing: 2,
						color: '#FFFFFF',
						whiteSpace: 'nowrap',
						opacity: tag1In,
						boxShadow: RED_HALO(pulse.glow),
					}}
				>
					<div
						style={{
							width: 14,
							height: 14,
							background: MEMORIAL_RED,
							flexShrink: 0,
						}}
					/>
					PODERÍO ECONÓMICO Y MILITAR
				</div>
				{/* NUESTRA AMÉRICA en el Pacífico (agua libre al oeste
				del Perú), con guía a la costa peruana. */}
				<div
					style={{
						position: 'absolute',
						top: 925,
						left: 250,
						display: 'flex',
						alignItems: 'center',
						gap: 14,
						opacity: tag2In,
					}}
				>
					<div
						style={{
							width: 16,
							height: 16,
							borderRadius: '50%',
							border: `3px solid ${MEMORIAL_RED}`,
						}}
					/>
					<span
						style={{
							fontFamily: MONO,
							fontSize: 26,
							fontWeight: 700,
							letterSpacing: 2,
							color: '#FFFFFF',
						}}
					>
						NUESTRA AMÉRICA
					</span>
				</div>
				<div
					style={{
						position: 'absolute',
						left: 520,
						top: 944,
						width: 189,
						height: 2,
						background: MEMORIAL_RED,
						opacity: 0.65 * tag2In,
						transform: 'rotate(-11.3deg)',
						transformOrigin: '0 50%',
					}}
				/>
			</div>
		</AbsoluteFill>
	);
};

// ================================================================
// S7 — FIDEL 2005 (1063–1345 f · 35,43–44,83 s, local 0–290)
// Foto de Fidel (La Habana 2003, uniforme verde, recorte
// vertical al Comandante) con push-in sostenido + textura de
// papel; la cita en tarjeta mecanografiada (serif). Chip «2005» al
// decirse (f19) + «FIDEL ADVIRTIÓ:» (f48); tarjeta al decirse
// «NO» (f137), líneas al ritmo de la voz.
// MORFO DURO S7→S8 (local f274–282): una cortina negra con filo
// rojo cae en 8 f sobre el papel: ruptura violenta, no disolución
// amable, pero transformación continua (el papel SE CONVIERTE en
// pantallas). La Sequence se extiende 8 f dentro de S8.
// ================================================================
const FidelScene: React.FC = () => {
	const f = useCurrentFrame();
	const dissolveIn = clamp01(f, 0, 12);
	const push = interpolate(f, [0, 290], [1, 1.1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	// Golpe de escala en el morfo duro (f274–282).
	const punch = interpolate(f, [274, 282], [0, 0.03], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const d = drift(f, 290, 12, -10);
	const stampIn = clamp01(f, 6, 14);
	const chipScale = popIn(f, 19, 10);
	const chipIn = clamp01(f, 19, 25);
	const advIn = clamp01(f, 48, 56);
	const cardIn = clamp01(f, 137, 145);
	const cardRise = interpolate(f, [137, 149], [24, 0], {
		easing: Easing.out(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const l1 = clamp01(f, 137, 145);
	const l2 = clamp01(f, 168, 176);
	const l3 = clamp01(f, 214, 222);
	// l4 arranca al decirse «de» (43,63 s → f246) y resuelve en 5 f:
	// la cita queda completa y uniforme 1 s antes de que la cortina
	// tape la tarjeta (f281); antes resolvía en f261, casi sobre el
	// morfo, y en f1320 se veía desvanecida.
	const l4 = clamp01(f, 246, 251);
	// Cortina negra del morfo duro (f274–282).
	const curtainH = interpolate(f, [274, 282], [0, 1920], {
		easing: Easing.in(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	return (
		<AbsoluteFill style={{background: NAVY, opacity: dissolveIn}}>
			{/* Fidel, La Habana 2003, uniforme verde (recorte vertical
			al Comandante desde la foto de grupo; la de Mercosur 2006
			queda como respaldo). El folio fecha la cita, no la foto. */}
			<Img
				src={staticFile('img/v4/fidel-la-habana-2003-crop.jpg')}
				style={{
					width: '100%',
					height: '100%',
					objectFit: 'cover',
					objectPosition: '42% 8%',
					transform: `scale(${push + punch}) translate(${d.x}px, ${d.y}px)`,
				}}
			/>
			<Img
				src={staticFile('img/paper-manuscript-dark.png')}
				style={{
					position: 'absolute',
					inset: 0,
					width: '100%',
					height: '100%',
					objectFit: 'cover',
					opacity: 0.16,
					mixBlendMode: 'multiply',
				}}
			/>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					background:
						'linear-gradient(180deg, rgba(10,20,32,0.10) 0%, rgba(10,20,32,0.15) 45%, rgba(10,20,32,0.92) 78%, rgba(10,20,32,0.97) 100%)',
				}}
			/>
			{/* La foto ES La Habana 2003; el folio fecha la cita, no la foto. */}
			<DataChip top={54} left={40} opacity={stampIn}>
				LA HABANA / 2003
			</DataChip>
			<div
				style={{
					position: 'absolute',
					top: 920,
					left: 0,
					right: 0,
					textAlign: 'center',
					opacity: chipIn,
					transform: `scale(${chipScale})`,
				}}
			>
				<span
					style={{
						fontFamily: ARCHIVO,
						fontSize: 110,
						color: '#FFFFFF',
						textShadow: textOutline(4),
					}}
				>
					2005
				</span>
			</div>
			<div
				style={{
					position: 'absolute',
					top: 1050,
					left: 0,
					right: 0,
					textAlign: 'center',
					opacity: advIn,
				}}
			>
				<span
					style={{
						fontFamily: ARCHIVO,
						fontSize: 44,
						letterSpacing: 2,
						color: '#FFFFFF',
						background: MEMORIAL_RED,
						padding: '10px 34px',
						borderRadius: 8,
						textShadow: textOutline(2),
						boxShadow: RED_HALO(redPulse(f).glow),
					}}
				>
					FIDEL ADVIRTIÓ:
				</span>
			</div>
			<PaperCard
				top={1180}
				folio="CIEN HORAS CON FIDEL"
				opacity={cardIn}
				rise={cardRise}
				redPulse
			>
				<div
					style={{
						textAlign: 'center',
						fontFamily: SERIF,
						fontWeight: 700,
						fontSize: 52,
						lineHeight: 1.4,
						color: INK,
					}}
				>
					<div style={{opacity: l1}}>«No es lo mismo estar</div>
					<div style={{opacity: l2}}>
						<span style={{color: MEMORIAL_RED}}>desinformado</span> que haber
					</div>
					<div style={{opacity: l3}}>
						<span style={{color: MEMORIAL_RED}}>perdido</span> la capacidad
					</div>
					<div style={{opacity: l4}}>
						de <span style={{color: MEMORIAL_RED}}>pensar.»</span>
					</div>
				</div>
			</PaperCard>
			{/* Cortina del morfo duro: el papel se oscurece de golpe. */}
			<div
				style={{
					position: 'absolute',
					top: 0,
					left: 0,
					right: 0,
					height: curtainH,
					background: '#000000',
					overflow: 'hidden',
				}}
			>
				<div
					style={{
						position: 'absolute',
						left: 0,
						right: 0,
						bottom: 0,
						height: 6,
						background: MEMORIAL_RED,
						boxShadow: RED_HALO(redPulse(f).glow),
					}}
				/>
			</div>
		</AbsoluteFill>
	);
};

// ================================================================
// S8 — LA INTERRUPCIÓN (1345–1590 f · 44,83–53,00 s, local 0–257)
// MORFO DURO desde S7: las pantallas entran de golpe con glitch
// y estática (flash f0–6, sin disolución suave). Pared de 5
// TELEVISORES que se leen como tales al primer vistazo (bisel,
// brillo de cristal, LED): un protagonista central grande y 4
// satélites, llenando el cuadro en vertical (y 250–1500, hasta
// la zona del karaoke; sin medio cuadro muerto). El protagonista
// arranca en y 250 para que el logotipo del Memorial (y 54–~230)
// no tape NADA de ninguna pantalla: ni su bug «EN VIVO»
// (y ~298), ni el ticker, ni el presentador. TODOS emiten LO
// MISMO — el mismo presentador, el mismo ticker «ÚLTIMA HORA»,
// el mismo bug «EN VIVO» —: eso es «repiten» en imagen. La
// estática es solo una capa encima, no el contenido. «REFLEJOS
// CONDICIONADOS» con glitch RGB (f80–140) cruza el televisor
// protagonista a la altura del pecho del presentador; el karaoke
// se suprime en f80–131 con una línea vacía en LINES_D (el
// título HACE de texto; nunca texto doble). Los televisores se
// apagan uno a uno con colapso CRT (satélites f131–179,
// protagonista f195–200, el último en morir) mientras «dejan de
// pensar». MORFO S8→S9: la última pantalla muere en f195–200 y
// el negro resultante ES el fondo de la tesis (sin corte).
// Karaoke L8 abajo.
// ================================================================
const TVS = [
	{x: 80, y: 895, w: 450, h: 290, offAt: 131, hero: false},
	{x: 550, y: 895, w: 450, h: 290, offAt: 147, hero: false},
	{x: 80, y: 1210, w: 450, h: 290, offAt: 163, hero: false},
	{x: 550, y: 1210, w: 450, h: 290, offAt: 179, hero: false},
	{x: 80, y: 250, w: 920, h: 620, offAt: 195, hero: true},
] as const;

// El MISMO noticiero en todas las pantallas: silueta de
// presentador (cabeza + hombros + camisa + corbata roja), mesa
// de estudio, ticker rojo «ÚLTIMA HORA» y bug «EN VIVO». Todo
// en porcentajes para que el contenido sea idéntico a cualquier
// tamaño: la única diferencia entre pantallas es la fase de la
// estática y el parpadeo.
const Broadcast: React.FC<{w: number; h: number; frame: number; seed: number}> = ({
	w,
	h,
	frame,
	seed,
}) => {
	const tile = (Math.floor(frame / 2) + seed * 3) % 8;
	const flicker = 0.75 + 0.25 * rnd(Math.floor(frame / 3) * 10 + seed);
	const tick = Math.max(13, Math.round(w * 0.032));
	const bug = Math.max(10, Math.round(w * 0.021));
	return (
		<div
			style={{
				position: 'absolute',
				inset: 0,
				background: '#0E1626',
				overflow: 'hidden',
			}}
		>
			{/* Estudio: degradado azul noche + focos azul y rojo. */}
			<div
				style={{
					position: 'absolute',
					inset: 0,
					background:
						'radial-gradient(ellipse 90% 70% at 20% 0%, rgba(70,110,180,0.55) 0%, rgba(70,110,180,0) 60%), radial-gradient(ellipse 70% 60% at 85% 10%, rgba(237,28,36,0.28) 0%, rgba(237,28,36,0) 55%), linear-gradient(180deg, #1B2A4A 0%, #0E1626 55%, #0A0F1E 100%)',
				}}
			/>
			{/* Mesa del estudio. */}
			<div
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					bottom: '11%',
					height: '12%',
					background: 'linear-gradient(180deg, #3A2C1C 0%, #171008 100%)',
					borderTop: '2px solid rgba(245,179,1,0.5)',
				}}
			/>
			{/* Presentador: hombros + cabeza + camisa + corbata. */}
			<div
				style={{
					position: 'absolute',
					left: '50%',
					bottom: '20%',
					width: '44%',
					height: '36%',
					transform: 'translateX(-50%)',
					background: '#16110D',
					borderRadius: '50% 50% 8% 8% / 55% 55% 8% 8%',
				}}
			/>
			<div
				style={{
					position: 'absolute',
					left: '50%',
					bottom: '47%',
					width: '17%',
					aspectRatio: '1',
					transform: 'translateX(-50%)',
					background: '#1D1712',
					borderRadius: '50%',
					boxShadow:
						'inset -4px -6px 10px rgba(0,0,0,0.6), inset 4px 4px 8px rgba(120,160,220,0.25)',
				}}
			/>
			<div
				style={{
					position: 'absolute',
					left: '50%',
					bottom: '38%',
					width: '10%',
					height: '9%',
					transform: 'translateX(-50%)',
					background: '#E8E4DA',
					clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
				}}
			/>
			<div
				style={{
					position: 'absolute',
					left: '50%',
					bottom: '24%',
					width: '4.5%',
					height: '15%',
					transform: 'translateX(-50%)',
					background: MEMORIAL_RED,
					clipPath: 'polygon(50% 0, 100% 12%, 78% 100%, 22% 100%, 0 12%)',
				}}
			/>
			{/* Ticker rojo. */}
			<div
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					bottom: 0,
					height: '11%',
					background: MEMORIAL_RED,
					display: 'flex',
					alignItems: 'center',
					paddingLeft: '4%',
					gap: 8,
				}}
			>
				<div
					style={{
						width: tick * 0.5,
						height: tick * 0.5,
						borderRadius: '50%',
						background: '#FFFFFF',
						flexShrink: 0,
					}}
				/>
				<span
					style={{
						fontFamily: ARCHIVO,
						fontSize: tick,
						letterSpacing: 1,
						color: '#FFFFFF',
						whiteSpace: 'nowrap',
					}}
				>
					ÚLTIMA HORA
				</span>
			</div>
			{/* Bug EN VIVO. */}
			<div
				style={{
					position: 'absolute',
					top: '6%',
					right: '5%',
					background: 'rgba(237,28,36,0.92)',
					borderRadius: 4,
					padding: `${bug * 0.25}px ${bug * 0.5}px`,
					display: 'flex',
					alignItems: 'center',
					gap: bug * 0.35,
				}}
			>
				<div
					style={{
						width: bug * 0.45,
						height: bug * 0.45,
						borderRadius: '50%',
						background: '#FFFFFF',
					}}
				/>
				<span
					style={{
						fontFamily: ARCHIVO,
						fontSize: bug,
						letterSpacing: 1,
						color: '#FFFFFF',
					}}
				>
					EN VIVO
				</span>
			</div>
			{/* Estática viva (capa, no contenido) + scanlines. */}
			<Img
				src={staticFile(`img/grain/grain-${tile}.png`)}
				style={{
					position: 'absolute',
					inset: 0,
					width: '100%',
					height: '100%',
					objectFit: 'cover',
					opacity: 0.16 * flicker,
				}}
			/>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					background:
						'repeating-linear-gradient(0deg, rgba(0,0,0,0.28) 0px, rgba(0,0,0,0.28) 2px, transparent 2px, transparent 6px)',
				}}
			/>
			{/* Brillo de cristal: lo que hace que se lea como pantalla. */}
			<div
				style={{
					position: 'absolute',
					inset: 0,
					background:
						'linear-gradient(115deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 28%, transparent 45%)',
				}}
			/>
		</div>
	);
};

const TV: React.FC<{
	x: number;
	y: number;
	w: number;
	h: number;
	offAt: number;
	hero: boolean;
	frame: number;
	seed: number;
}> = ({x, y, w, h, offAt, hero, frame, seed}) => {
	const off = frame >= offAt;
	// Colapso CRT: la imagen se aplasta a una línea en 5 f.
	const collapse = off
		? interpolate(frame, [offAt, offAt + 5], [1, 0.02], {
				extrapolateLeft: 'clamp',
				extrapolateRight: 'clamp',
		  })
		: 1;
	const flash = off
		? interpolate(frame, [offAt, offAt + 2, offAt + 5], [0, 0.9, 0], {
				extrapolateLeft: 'clamp',
				extrapolateRight: 'clamp',
		  })
		: 0;
	const afterglow = off
		? interpolate(frame, [offAt + 5, offAt + 40], [0.25, 0], {
				extrapolateLeft: 'clamp',
				extrapolateRight: 'clamp',
		  })
		: 0;
	const bezel = hero ? 12 : 9;
	return (
		<div
			style={{
				position: 'absolute',
				left: x,
				top: y,
				width: w,
				height: h,
				background: 'linear-gradient(180deg, #1E1E1E 0%, #0C0C0C 100%)',
				border: '1px solid #2A2A2A',
				borderRadius: hero ? 14 : 10,
				padding: bezel,
				boxShadow:
					'0 14px 34px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.09)',
			}}
		>
			<div
				style={{
					position: 'relative',
					width: '100%',
					height: '100%',
					background: '#000000',
					overflow: 'hidden',
					borderRadius: hero ? 6 : 4,
				}}
			>
				<div
					style={{
						position: 'absolute',
						inset: 0,
						transform: `scaleY(${collapse})`,
						opacity: off && frame > offAt + 5 ? 0 : 1,
					}}
				>
					<Broadcast
						w={w - bezel * 2}
						h={h - bezel * 2}
						frame={frame}
						seed={seed}
					/>
				</div>
				{/* Flash del colapso CRT. */}
				<div
					style={{
						position: 'absolute',
						inset: 0,
						background: '#FFFFFF',
						opacity: flash,
					}}
				/>
				{/* Resplandor residual que muere. */}
				<div
					style={{
						position: 'absolute',
						inset: 0,
						background:
							'radial-gradient(ellipse at 50% 50%, rgba(180,200,255,0.5) 0%, rgba(180,200,255,0) 70%)',
						opacity: afterglow,
					}}
				/>
			</div>
			{/* LED de encendido (muere con la pantalla). */}
			<div
				style={{
					position: 'absolute',
					right: bezel + 2,
					bottom: 3,
					width: 7,
					height: 7,
					borderRadius: '50%',
					background: MEMORIAL_RED,
					opacity: off ? 0.15 : 0.95,
					boxShadow: off ? 'none' : '0 0 8px rgba(237,28,36,0.9)',
				}}
			/>
		</div>
	);
};

const ScreensScene: React.FC = () => {
	const f = useCurrentFrame();
	// Entrada violenta: flash de estática f0–6 (sin disolución).
	const wallIn = clamp01(f, 0, 4);
	const wallScale = interpolate(f, [0, 12], [1.06, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const flashOp = interpolate(f, [0, 6], [0.9, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	// Temblor de cámara: fuerte al entrar, leve después.
	const trembleAmp = f < 12 ? 7 : 3;
	const tx = (rnd(f) * 2 - 1) * trembleAmp;
	const ty = (rnd(f + 500) * 2 - 1) * trembleAmp;
	// «REFLEJOS CONDICIONADOS» con glitch (f80–140).
	const glitchIn = clamp01(f, 80, 86);
	const glitchOut = 1 - clamp01(f, 140, 148);
	const glitchOp = glitchIn * glitchOut;
	const glitchScale = popIn(f, 80, 10);
	const sliceStep = Math.floor(f / 3);
	const slice1 = (rnd(sliceStep) * 2 - 1) * 14;
	const slice2 = (rnd(sliceStep + 77) * 2 - 1) * 14;
	const jitterX = (rnd(sliceStep + 31) * 2 - 1) * 5;
	return (
		<AbsoluteFill style={{background: '#050505'}}>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					opacity: wallIn,
					transform: `scale(${wallScale}) translate(${tx}px, ${ty}px)`,
				}}
			>
				{TVS.map((t, i) => (
					<TV key={i} {...t} frame={f} seed={i} />
				))}
			</div>
			{/* Flash de entrada: estática a pantalla completa. */}
			<Img
				src={staticFile(`img/grain/grain-${f % 8}.png`)}
				style={{
					position: 'absolute',
					inset: 0,
					width: '100%',
					height: '100%',
					objectFit: 'cover',
					opacity: flashOp,
				}}
			/>
			{/* Glitch RGB sobre el televisor protagonista: el título
			interrumpe el noticiero a la altura del pecho del
			presentador (la cara queda visible encima). */}
			<div
				style={{
					position: 'absolute',
					top: 600,
					left: 0,
					right: 0,
					textAlign: 'center',
					opacity: glitchOp,
					transform: `scale(${glitchScale}) translateX(${jitterX}px)`,
				}}
			>
				<div style={{position: 'relative', display: 'inline-block'}}>
					<span
						style={{
							position: 'absolute',
							left: -4,
							top: 0,
							fontFamily: ARCHIVO,
							fontSize: 62,
							letterSpacing: 2,
							color: MEMORIAL_RED,
							opacity: 0.75,
							whiteSpace: 'nowrap',
						}}
					>
						REFLEJOS CONDICIONADOS
					</span>
					<span
						style={{
							position: 'absolute',
							left: 4,
							top: 0,
							fontFamily: ARCHIVO,
							fontSize: 62,
							letterSpacing: 2,
							color: '#22D3EE',
							opacity: 0.75,
							whiteSpace: 'nowrap',
						}}
					>
						REFLEJOS CONDICIONADOS
					</span>
					<span
						style={{
							position: 'relative',
							fontFamily: ARCHIVO,
							fontSize: 62,
							letterSpacing: 2,
							color: '#FFFFFF',
							textShadow: textOutline(3),
							whiteSpace: 'nowrap',
						}}
					>
						REFLEJOS CONDICIONADOS
					</span>
					{/* Rebanadas con desplazamiento (glitch de corte). */}
					<span
						style={{
							position: 'absolute',
							left: slice1,
							top: 0,
							fontFamily: ARCHIVO,
							fontSize: 62,
							letterSpacing: 2,
							color: '#FFFFFF',
							clipPath: 'inset(0 0 55% 0)',
							whiteSpace: 'nowrap',
						}}
					>
						REFLEJOS CONDICIONADOS
					</span>
					<span
						style={{
							position: 'absolute',
							left: slice2,
							top: 0,
							fontFamily: ARCHIVO,
							fontSize: 62,
							letterSpacing: 2,
							color: '#FFFFFF',
							clipPath: 'inset(55% 0 0 0)',
							whiteSpace: 'nowrap',
						}}
					>
						REFLEJOS CONDICIONADOS
					</span>
				</div>
			</div>
		</AbsoluteFill>
	);
};

// ================================================================
// S9 — LA TESIS (1590–1724 f · 53,00–57,47 s, local 0–146)
// MORFO S8→S9: el fondo YA es negro (las pantallas murieron en
// S8); la tesis se ESCRIBE a mano (Caveat) palabra a palabra al
// ritmo de la voz, con resplandor de tinta en la línea activa y
// subrayado rojo que se traza bajo la última línea. SIN
// atribución (ni «— Martí» ni «— Suleris»). Sin karaoke.
// Cámara quieta: el momento más íntimo del reel.
// ================================================================
const THESIS_WORDS: {t: string; at: number; kw: boolean; line: number}[] = [
	{t: 'Cuando', at: 3, kw: false, line: 0},
	{t: 'un', at: 21, kw: false, line: 0},
	{t: 'pueblo', at: 28, kw: false, line: 0},
	{t: 'olvida', at: 32, kw: true, line: 0},
	{t: 'su', at: 42, kw: false, line: 1},
	{t: 'historia,', at: 48, kw: false, line: 1},
	{t: 'está', at: 70, kw: false, line: 1},
	{t: 'condenado', at: 79, kw: true, line: 1},
	{t: 'a', at: 93, kw: false, line: 2},
	{t: 'volverla', at: 95, kw: false, line: 2},
	{t: 'a', at: 108, kw: false, line: 2},
	{t: 'vivir.', at: 110, kw: true, line: 2},
];

const ThesisScene: React.FC = () => {
	const f = useCurrentFrame();
	const dissolveIn = clamp01(f, 0, 12);
	// Resplandor de tinta en la línea activa.
	const lineGlow = (line: number) => {
		const ranges: [number, number][] = [
			[3, 42],
			[42, 93],
			[93, 146],
		];
		const [a, b] = ranges[line];
		return clamp01(f, a, a + 6) * (1 - clamp01(f, b - 6, b));
	};
	// Subrayado rojo bajo la última línea (f110–125).
	const underDraw = interpolate(f, [110, 125], [0, 1], {
		easing: Easing.out(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const lines = [0, 1, 2].map((li) =>
		THESIS_WORDS.filter((w) => w.line === li),
	);
	return (
		<AbsoluteFill style={{background: '#000000', opacity: dissolveIn}}>
			{/* Resplandor de tinta por línea. */}
			{[0, 1, 2].map((li) => (
				<div
					key={li}
					style={{
						position: 'absolute',
						left: 90,
						top: 660 + li * 162,
						width: 900,
						height: 195,
						background:
							'radial-gradient(ellipse, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 70%)',
						opacity: lineGlow(li),
					}}
				/>
			))}
			<div
				style={{
					position: 'absolute',
					top: 660,
					left: 30,
					right: 30,
					textAlign: 'center',
					fontFamily: HAND,
					fontWeight: 700,
					fontSize: 102,
					lineHeight: 1.59,
					color: '#FFFFFF',
				}}
			>
				{lines.map((words, li) => (
					<div key={li}>
						{words.map((w, wi) => {
							const op = clamp01(f, w.at, w.at + 6);
							const sc = interpolate(f, [w.at, w.at + 6], [1.06, 1], {
								extrapolateLeft: 'clamp',
								extrapolateRight: 'clamp',
							});
							const rot = interpolate(f, [w.at, w.at + 6], [-2, 0], {
								extrapolateLeft: 'clamp',
								extrapolateRight: 'clamp',
							});
							return (
								<span
									key={wi}
									style={{
										display: 'inline-block',
										opacity: op,
										transform: `scale(${sc}) rotate(${rot}deg)`,
										color: w.kw ? MEMORIAL_RED : '#FFFFFF',
										marginRight: 12,
										textShadow: w.kw
											? RED_HALO(redPulse(f).glow)
											: '0 0 18px rgba(255,255,255,0.25)',
									}}
								>
									{w.t}
								</span>
							);
						})}
					</div>
				))}
			</div>
			{/* Subrayado rojo trazado a mano bajo la última línea. */}
			<div
				style={{
					position: 'absolute',
					top: 1168,
					left: 220,
					width: 640,
					height: 5,
					background: MEMORIAL_RED,
					borderRadius: 3,
					transform: `scaleX(${underDraw}) rotate(-1deg)`,
					transformOrigin: '0 50%',
					boxShadow: RED_HALO(redPulse(f).glow),
				}}
			/>
		</AbsoluteFill>
	);
};

// ---------- bosque lejano con niebla (S10/S11, IA) ----------
// Recurso generado con IA en V4 (Pollinations Flux, seed 7,
// scripts/gen-illustration.py; guardado en public/img/v4/ai/).
// Silueta de bosque de fronda redonda con niebla: la atmósfera
// y la profundidad que la fila de palmas no puede dar sola.
// Las palmas (también IA, pictóricas) sostienen el primer plano
// (crecen, se balancean); la IA solo da fondo y vegetación. Sin
// personas, sin texto, sin nada que parezca foto de archivo. Se
// funde por arriba y por abajo (máscara) y asciende a mitad de
// velocidad que la fila (parallax 0,5×): continuidad S10→S11
// garantizada porque ambas escenas comparten riseY (-70 al corte).
const ForestBackdrop: React.FC<{riseY: number; frame: number}> = ({
	riseY,
	frame,
}) => {
	const driftX = Math.sin(frame / 90) * 8;
	return (
		<div
			style={{
				position: 'absolute',
				left: -40,
				top: 660,
				width: 1160,
				height: 640,
				opacity: 0.9,
				transform: `translate(${driftX}px, ${riseY * 0.5}px)`,
				WebkitMaskImage:
					'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 25%, rgba(0,0,0,1) 75%, rgba(0,0,0,0) 100%)',
				maskImage:
					'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 25%, rgba(0,0,0,1) 75%, rgba(0,0,0,0) 100%)',
			}}
		>
			<Img
				src={staticFile('img/v4/ai/forest-silhouette-mist.jpg')}
				style={{width: '100%', height: '100%', objectFit: 'cover'}}
			/>
		</div>
	);
};

// ================================================================
// S10 — LEER. PENSAR. (1724–1916 f · 57,47–63,87 s, local 0–204)
// V4.1: SIN palmas — el visual propio es el PATIO TRASERO visto
// desde arriba (foto real de dron, Pexels, Benjamin White,
// Kansas City; recorte vertical 1462×2600 del tercio derecho:
// cobertizo azul, cerca de malla, césped y arriate). La cámara
// desciende lentamente sobre el patio mientras la voz dice
// «patio trasero». El resplandor rojo del horizonte crece hacia
// S11. El mapa NO se reutiliza aquí: es el visual de S6.
// Las dos afirmaciones son el karaoke L10 en grande, ABAJO en la
// posición base (bottom 235, 76 px, como S11): un solo texto,
// sin duplicar.
// ================================================================
const AffirmationScene: React.FC = () => {
	const f = useCurrentFrame();
	const dissolveIn = clamp01(f, 0, 12);
	// Descenso lento sobre el patio (push-in + deriva): la mirada
	// del imperio sobre su propiedad, mientras la voz dice «patio
	// trasero». La imagen es 1200×2133 (10% de margen para el zoom).
	const push = interpolate(f, [0, 204], [1, 1.08], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const driftY = interpolate(f, [0, 204], [0, 40], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	// El resplandor rojo del horizonte crece (hacia S11).
	const horizonGlow = interpolate(f, [0, 204], [0.15, 0.45], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	return (
		<AbsoluteFill style={{background: '#0A1A10', opacity: dissolveIn}}>
			<Img
				src={staticFile('img/v4/patio-aereo-s10-vertical.jpg')}
				style={{
					width: '100%',
					height: '100%',
					objectFit: 'cover',
					transform: `scale(${push}) translateY(${driftY}px)`,
				}}
			/>
			{/* Grado azul noche: ata la foto diurna a la paleta del
			reel sin matar la lectura del patio. */}
			<div
				style={{
					position: 'absolute',
					inset: 0,
					background: 'rgba(6,12,20,0.28)',
				}}
			/>
			{/* Degradado inferior para la legibilidad del karaoke
			(sobre el césped claro del tercio inferior). */}
			<div
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					bottom: 0,
					height: 800,
					background:
						'linear-gradient(180deg, rgba(6,12,20,0) 0%, rgba(6,12,20,0.55) 55%, rgba(6,12,20,0.78) 100%)',
				}}
			/>
			{/* Resplandor rojo del horizonte (hacia S11). */}
			<div
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					top: 1100,
					height: 820,
					background:
						'radial-gradient(ellipse 70% 60% at 50% 100%, rgba(237,28,36,0.35) 0%, rgba(245,179,1,0.12) 45%, rgba(30,51,32,0) 75%)',
					opacity: horizonGlow,
				}}
			/>
		</AbsoluteFill>
	);
};

// ================================================================
// S11 — EL GRITO + CIERRE (1916–2077 f · 63,87–69,23 s, local 0–161)
// El grito con la fila de palmas y la LLAMARADA ROJA del hilo
// (el mismo rojo de T&T, ahora a toda pantalla). Push-in final.
// A local f110 entra el sting del logo (Sequence aparte, a 2x
// para que la animación completa quepa en la cola de 1,5 s) con
// el CTA «GUARDA ESTE DATO».
// ================================================================
const GritoScene: React.FC = () => {
	const f = useCurrentFrame();
	const dissolveIn = clamp01(f, 0, 12);
	// El ascenso continúa y el push-in final cierra el viaje.
	const riseY = interpolate(f, [0, 161], [-70, -110], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const riseScale = interpolate(f, [0, 161], [1.06, 1.14], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	// Llamarada roja: el hilo rojo termina en fuego.
	const flare = interpolate(f, [0, 161], [0.35, 0.75], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	// Las palmas crecen un poco más durante el grito (640→700 en
	// los primeros 90 f): llenan algo más el tercio superior sin
	// salto en el corte con S10 (arrancan en 640, como allí).
	const palmH = 640 + 60 * clamp01(f, 0, 90);
	const flareScale = interpolate(f, [0, 161], [1, 1.45], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	// V4.1: puñetazo de la llamarada al decirse «¡FILA!» (local
	// f98; el karaoke lo revela en f2014 absoluto): el cierre no
	// termina en rampa suave sino en impacto, y se asienta un
	// poco hasta el sting.
	const filaPunch = clamp01(f, 98, 104);
	const filaSettle = 1 - 0.4 * clamp01(f, 104, 130);
	const flareOp = flare + 0.25 * filaPunch * filaSettle;
	const flareScalePunch =
		flareScale * (1 + 0.12 * filaPunch * (1 - 0.5 * clamp01(f, 104, 130)));
	return (
		<AbsoluteFill
			style={{
				background:
					'linear-gradient(180deg, #0B1A12 0%, #12241A 55%, #1E3320 100%)',
				opacity: dissolveIn,
			}}
		>
			{/* Luz de luna fría arriba a la izquierda (profundidad). */}
			<div
				style={{
					position: 'absolute',
					left: -250,
					top: -250,
					width: 800,
					height: 800,
					background:
						'radial-gradient(circle, rgba(200,220,255,0.10) 0%, rgba(200,220,255,0) 70%)',
				}}
			/>
			<ForestBackdrop riseY={riseY} frame={f} />
			<div
				style={{
					position: 'absolute',
					inset: 0,
					transform: `translateY(${riseY * 0.5}px)`,
				}}
			>
				<PalmBackdropRow
					groundY={1450}
					height={420}
					frame={f}
					revealAt={0}
					tone="night"
					variants={PALM_VARIANTS_S11}
				/>
				{/* Línea de suelo de la fila de fondo: viaja con ella
				(parallax 0,5×) para que sus bases no floten bajo la
				línea principal al ascender la cámara. */}
				<div
					style={{
						position: 'absolute',
						top: 1450,
						left: 60,
						width: 960,
						height: 3,
						background: '#2A3A24',
						opacity: 0.5,
					}}
				/>
			</div>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					transform: `translateY(${riseY}px) scale(${riseScale})`,
					transformOrigin: '50% 80%',
				}}
			>
				{[0, 1, 2, 3, 4, 5, 6].map((i) => (
					<GrowingPalm
						key={i}
						i={i}
						x={TREE_CX[i]}
						groundY={1450}
						height={palmH}
						growAt={0}
						growDur={1}
						frame={f}
						sway
						// V4.1: SIN tono noche — el brightness 0,52
						// mataría el filo rojo de las siluetas.
						variants={PALM_VARIANTS_S11}
					/>
				))}
				<div
					style={{
						position: 'absolute',
						top: 1450,
						left: 60,
						width: 960,
						height: 4,
						background: '#2A3A24',
					}}
				/>
			</div>
			{/* Llamarada roja (hilo rojo, mismo halo que T&T). */}
			<div
				style={{
					position: 'absolute',
					left: '50%',
					bottom: -300,
					width: 1400,
					height: 1400,
					marginLeft: -700,
					background:
						'radial-gradient(circle, rgba(237,28,36,0.55) 0%, rgba(237,28,36,0.22) 40%, rgba(237,28,36,0) 70%)',
					opacity: flareOp,
					transform: `scale(${flareScalePunch})`,
				}}
			/>
		</AbsoluteFill>
	);
};

// ================================================================
// STING (2026–2077 f · 67,53–69,23 s, local 0–51)
// Logo animado del Memorial con fondo negro (sting-black-2x.mp4,
// mismo de V3). La cola tras la VO es de solo 1,5 s y la
// animación completa dura 3,04 s (el logo queda completo a los
// 2,5 s y aguanta 0,5 s): se reproduce a 2x y entra 6 f antes
// del fin de la VO (el «¡FILA!» ya está revelado en karaoke
// desde f2014; el solape es imperceptible) para que el logo
// completo aguante ~13 f. CTA «GUARDA ESTE DATO» sobre el negro
// inferior del sting.
// ================================================================
const StingScene: React.FC = () => {
	const f = useCurrentFrame();
	const fadeIn = interpolate(f, [0, 4], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const ctaIn = clamp01(f, 12, 20);
	const ctaScale = popIn(f, 12, 12);
	return (
		<AbsoluteFill style={{background: '#000', opacity: fadeIn}}>
			<OffthreadVideo
				src={staticFile('video/sting-black-2x.mp4')}
				playbackRate={2}
				style={{
					width: '100%',
					height: '100%',
					objectFit: 'contain',
				}}
			/>
			<div
				style={{
					position: 'absolute',
					top: 1560,
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
// COMPOSICIÓN PRINCIPAL — MainReelV41 (2077 f = 69,23 s)
// S1 mapa (0–167) · S2 1891 (167–269) · S3 recuento (269–382) ·
// S4 Browne (382–562) · S5 palmas (562–768) · S6 gigante
// (768–1063) · S7 Fidel (1063–1345) · S8 pantallas (1345–1590) ·
// S9 tesis (1590–1724) · S10 leer/pensar (1724–1916) · S11 grito
// (1916–2077) · sting (2026–2077).
// Disoluciones de 12 f entre escenas, CON movimiento de cámara
// durante el solape; morfo circular S1→S2; morfo DURO de 8 f
// S7→S8 (cortina negra + entrada violenta); morfo S8→S9 por
// apagado de pantallas (el negro ya está ahí).
// ================================================================
export const MainReelV41: React.FC = () => {
	return (
		<AbsoluteFill style={{background: NAVY}}>
			<Audio src={staticFile('audio/v41/mix-v41.wav')} />
			<Sequence from={0} durationInFrames={179} name="S1 gancho mapa">
				<HookMapScene />
			</Sequence>
			<Sequence from={S2_START} durationInFrames={114} name="S2 1891">
				<Year1891Scene />
			</Sequence>
			<Sequence from={S3_START} durationInFrames={125} name="S3 recuento">
				<RecuentoScene />
			</Sequence>
			<Sequence from={S4_START} durationInFrames={192} name="S4 evidencia Browne">
				<EvidenceScene />
			</Sequence>
			<Sequence from={S5_START} durationInFrames={218} name="S5 arboles crecen">
				<TreesScene />
			</Sequence>
			<Sequence from={S6_START} durationInFrames={307} name="S6 gigante">
				<GiantMapScene />
			</Sequence>
			<Sequence from={S7_START} durationInFrames={290} name="S7 Fidel 2005">
				<FidelScene />
			</Sequence>
			<Sequence from={S8_START} durationInFrames={257} name="S8 pantallas">
				<ScreensScene />
			</Sequence>
			<Sequence from={S9_START} durationInFrames={146} name="S9 tesis">
				<ThesisScene />
			</Sequence>
			<Sequence from={S10_START} durationInFrames={204} name="S10 leer pensar">
				<AffirmationScene />
			</Sequence>
			<Sequence from={S11_START} durationInFrames={161} name="S11 grito">
				<GritoScene />
			</Sequence>
			<Sequence from={STING_START} durationInFrames={51} name="Sting logo">
				<StingScene />
			</Sequence>
			{/* Karaoke: A (L1–L2) · B (L4 truncada) · C (L6) · D (L8) ·
			    E1 (L10 grande, abajo como S11) · E2 (L11). */}
			<Sequence from={0} durationInFrames={269} name="Karaoke A (L1-L2)">
				<BottomKaraoke lines={LINES_A} />
			</Sequence>
			<Sequence from={S4_START} durationInFrames={180} name="Karaoke B (L4)">
				<BottomKaraoke lines={LINES_B} />
			</Sequence>
			<Sequence from={S6_START} durationInFrames={295} name="Karaoke C (L6)">
				<BottomKaraoke lines={LINES_C} />
			</Sequence>
			<Sequence from={S8_START} durationInFrames={245} name="Karaoke D (L8)">
				<BottomKaraoke lines={LINES_D} />
			</Sequence>
			<Sequence from={S10_START} durationInFrames={192} name="Karaoke E1 (L10)">
				<BottomKaraoke
					lines={LINES_E1}
					bottom={235}
					size={76}
					longSize={64}
					longThreshold={28}
				/>
			</Sequence>
			<Sequence from={S11_START} durationInFrames={110} name="Karaoke E2 (L11)">
				<BottomKaraoke lines={LINES_E2} />
			</Sequence>
			<Sequence from={0} durationInFrames={STING_START} name="Grano+vineta">
				<GrainVignette />
			</Sequence>
			<Sequence from={0} durationInFrames={STING_START} name="Logo">
				<LogoInner />
			</Sequence>
		</AbsoluteFill>
	);
};
