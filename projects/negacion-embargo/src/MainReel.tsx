import React from 'react';
import {
	AbsoluteFill,
	Audio,
	Easing,
	Img,
	OffthreadVideo,
	Sequence,
	interpolate,
	spring,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import {
	capSegmentsToLines,
	MEMORIAL_RED,
	textOutline,
	type KaraokeLine,
} from '../../../shared/captions';
import {TopKaraoke} from '../../../shared/motion/TopKaraoke';
import {KineticHeadline} from '../../../shared/motion/KineticHeadline';
import {CAPTIONS} from './captions';

// ================================================================
// «Dicen que no hay bloqueo» — Memorial de la Denuncia.
// 1080×1920 · 30 fps · 2325 f = 77,5 s.
// Fuente de verdad numérica: research/timeline.json.
// Plan escena por escena: AUDIT_PREEDIT.md §6 (C1–C12).
//
// AUDIO: la mezcla (audio/mix.wav: VO + cama + SFX) va con
// <Audio>. El audio del panel NO está en la mezcla: T1 viene de
// su OffthreadVideo; T2 va en su propia Sequence (J-cut: el audio
// arranca 0,4 s antes que la imagen, en 9,5 s); T3 va por
// separado (audio/panel-t3-audio.wav) porque el video lleva rampa
// de velocidad y el audio NO se puede estirar. El sting del logo
// suena desde la mezcla; el video del sting no lleva audio.
//
// TERMINOLOGÍA (regla de Suleris, permanente): en la voz del
// Memorial se dice BLOQUEO. «embargo» SOLO dentro de la cita
// textual de state.gov (L4) y su overlay en español (traducción
// fiel entrecomillada). En L4 en rojo va «sigue vigente hoy»,
// NUNCA «embargo» (kw en captions.ts).
//
// REGLA DE LA CARA (orden del usuario, permanente): NINGÚN
// gráfico tapa la cara de una persona (ojos, nariz, boca, frente;
// la línea del pelo incluida) en ningún fotograma. En L6, número
// y sello van al pecho/tercio inferior.
//
// ZONAS SEGURAS META (investigación 3, T1): en la app, la UI tapa
// el 14% superior (0–269) y el 35% inferior (1248–1920); lados
// 6% (65 px). TODO el texto clave vive en y 269–1248. Rejilla
// vertical de 3 zonas, IGUAL en todas las escenas: (A) arriba,
// títulos/rótulos/chips; (B) medio, caras y ojos; (C) abajo-pero-
// encima-de-la-UI, citas/tarjetas/karaoke. La guía visual
// (SHOW_SAFE_GUIDE) solo se enciende para el pre-vuelo: NUNCA se
// renderiza en el borrador ni en el final.
//
// TRANSICIONES (investigación 3, T3): CORTES DUROS en el
// fotograma exacto del impacto SFX — los latigazos dejaban 4 f
// de negro medidos con blackdetect y se eliminaron. El pre-lap de
// L4 reproduce la matemática del barrido (bezier 0.7,0,0.2,1 ·
// viaje 110% · estirado 1,12 · blur 24 px) en línea, a 23 f.
// J-cuts en S1→S2 (audio T2 desde 9,5 s),
// S9→S10 (VO L8 desde 68,5 s, la re-mezcla la mueve; aquí los
// chunks de karaoke L8 van −0,5 s en captions.ts) y S2→S3 (audio
// T3 desde 15,1 s). Wipe de la pantalla dividida SOBRE el final
// de L6 (1818–1830). Pre-lap visual: el documento entra durante
// los últimos ~0,8 s de L3 y se completa en «esto» (28,38 s).
// ================================================================

// Guía de zona segura: SOLO para stills de pre-vuelo. Se enciende
// con sed antes de renderizar stills y se APAGA antes del
// borrador/final. NUNCA commitear en true.
const SHOW_SAFE_GUIDE = false;
const SAFE_TOP = 269;
const SAFE_BOTTOM = 1248;
const SAFE_SIDE = 65;

const FPS = 30;
const ARCHIVO = "'Archivo Black', sans-serif";
const COND = "'Roboto Condensed', sans-serif";
const MONO = "'JetBrains Mono', monospace";
const SERIF = "'Playfair Display', serif";
const NAVY = '#0A1420';
const INK = '#050507';

// Fronteras de escena (fotogramas absolutos, 30 fps).
const S1_START = 171;
const S2_START = 297;
const S3_START = 465;
const S4_START = 585;
const S5_START = 705;
const S6_START = 861;
const S7_START = 1200;
const S8_START = 1515;
const S9_START = 1830;
const S10_START = 2055;
const S11_START = 2235;


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

/** Ventana de opacidad 0→1→0 con fades de 8 f en los bordes. */
const winOp = (f: number, a: number, b: number) =>
	clamp01(f, a, a + 8) * (1 - clamp01(f, b - 8, b));

// ---------- chip mono (voz DATO: fechas, fuentes, etiquetas) ----------
const DataChip: React.FC<{
	top: number;
	left?: number;
	right?: number;
	opacity?: number;
	children: React.ReactNode;
}> = ({top, left, right, opacity = 1, children}) => (
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

// ---------- barra de línea de tiempo del panel (C3) ----------
// MAY 20 → JUL 7 → OCT 27 → NOV 16: la negación es una campaña
// sostenida, no un desliz. El punto activo va en rojo.
const TL_DATES = ['MAY 20', 'JUL 7', 'OCT 27', 'NOV 16'];
const TL_X = [90, 390, 690, 990];
const TimelineBar: React.FC<{active: number}> = ({active}) => {
	const f = useCurrentFrame();
	const op = clamp01(f, 4, 12);
	return (
		<div style={{position: 'absolute', top: 252, left: 0, right: 0, opacity: op}}>
			<div
				style={{
					position: 'absolute',
					left: 90,
					top: 10,
					width: 900,
					height: 4,
					background: 'rgba(255,255,255,0.35)',
					borderRadius: 2,
				}}
			/>
			<div
				style={{
					position: 'absolute',
					left: 90,
					top: 10,
					width: TL_X[active] - 90,
					height: 4,
					background: MEMORIAL_RED,
					borderRadius: 2,
				}}
			/>
			{TL_DATES.map((d, i) => {
				const isActive = i === active;
				const size = isActive ? 20 : 12;
				return (
					<React.Fragment key={d}>
						<div
							style={{
								position: 'absolute',
								left: TL_X[i] - size / 2,
								top: 12 - size / 2,
								width: size,
								height: size,
								borderRadius: '50%',
								background: isActive ? MEMORIAL_RED : '#FFFFFF',
								border: isActive ? '3px solid #FFFFFF' : 'none',
								boxShadow: isActive
									? '0 0 18px rgba(237,28,36,0.9)'
									: '0 0 8px rgba(0,0,0,0.6)',
							}}
						/>
						<div
							style={{
								position: 'absolute',
								left: TL_X[i] - 80,
								top: 32,
								width: 160,
								textAlign: 'center',
								fontFamily: MONO,
								fontSize: 22,
								fontWeight: 700,
								letterSpacing: 2,
								color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.65)',
								textShadow: '0 2px 6px rgba(0,0,0,0.8)',
							}}
						>
							{d}
						</div>
					</React.Fragment>
				);
			})}
		</div>
	);
};

// ---------- guía de zona segura (SOLO pre-vuelo, nunca en render) ----------
// Rectángulo y 269–1248 + márgenes laterales 65 px. Se enciende
// con SHOW_SAFE_GUIDE (constante de módulo, arriba) y se APAGA
// antes del borrador/final. NUNCA commitear en true.
const SafeGuide: React.FC = () => {
	if (!SHOW_SAFE_GUIDE) return null;
	const band = (top: number, height: number): React.CSSProperties => ({
		position: 'absolute',
		left: 0,
		right: 0,
		top,
		height,
		background: 'rgba(237,28,36,0.08)',
	});
	const label = (top: number, text: string) => (
		<div
			style={{
				position: 'absolute',
				left: 12,
				top,
				fontFamily: MONO,
				fontSize: 20,
				fontWeight: 700,
				letterSpacing: 2,
				color: MEMORIAL_RED,
			}}
		>
			{text}
		</div>
	);
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<div style={band(0, SAFE_TOP)} />
			<div style={band(SAFE_BOTTOM, 1920 - SAFE_BOTTOM)} />
			<div
				style={{
					position: 'absolute',
					left: SAFE_SIDE,
					top: SAFE_TOP,
					width: 1080 - 2 * SAFE_SIDE,
					height: SAFE_BOTTOM - SAFE_TOP,
					border: '2px dashed rgba(237,28,36,0.85)',
				}}
			/>
			{label(SAFE_TOP - 30, 'ZONA SEGURA · y 269–1248')}
			{label(1920 - 40, 'UI META · y 1248–1920')}
		</AbsoluteFill>
	);
};

// ---------- grano global animado (T4) ----------
// Tile de ruido 256×256 repetido, blend overlay, opacidad 0,13.
// La posición salta con jitter pseudo-aleatorio por fotograma
// (re-semillado). Va sobre TODO (incluido el logo) como última
// capa de acabado; la guía de zona segura va por encima de él.
const GrainOverlay: React.FC = () => {
	const f = useCurrentFrame();
	const ox = (f * 73) % 256;
	const oy = (f * 149) % 256;
	return (
		<AbsoluteFill
			style={{
				backgroundImage: `url(${staticFile('img/grain-tile.png')})`,
				backgroundRepeat: 'repeat',
				backgroundPosition: `${-ox}px ${-oy}px`,
				mixBlendMode: 'overlay',
				opacity: 0.13,
			}}
		/>
	);
};

// ---------- karaoke L4 atenuado durante los 3 tiempos (T3) ----------
// La tarjeta de traducción manda; el karaoke baja a 0,55 de
// opacidad (local 171–275) pero NUNCA desaparece (auditoría 4).
const DimmedKaraokeL4: React.FC<{lines: KaraokeLine[]}> = ({lines}) => {
	const f = useCurrentFrame();
	// Tamaño 44: las líneas de L4 («UN EMBARGO ECONÓMICO
	// INTEGRAL», 28 caracteres en mayúsculas Poppins 800) miden
	// ~1240 px a 60 px y no caben en una línea ni a ancho
	// completo; a 44 px miden ~912 px (< maxWidth 960). El
	// karaoke de L4 es texto de apoyo (atenuado durante los
	// 3 tiempos), no el protagonista: la tarjeta manda.
	const op = interpolate(f, [171, 183, 275, 287], [1, 0.55, 0.55, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	return (
		<div style={{opacity: op}}>
			<TopKaraoke
				lines={lines}
				top={1160}
				size={44}
				keywordColor={MEMORIAL_RED}
				keywordPop
				keywordDots={false}
				hold={1.6}
			/>
		</div>
	);
};

// ---------- video T2 en Sequence propia (J-cut S1→S2) ----------
// La Sequence arranca en 9,5 s (f285), 0,4 s antes de la imagen
// de S2: el AUDIO de Waltz («It's fake») se oye bajo los últimos
// 0,4 s de la tarjeta de Rubio. La imagen queda a opacidad 0
// hasta f297 (local 12). El push-in (T8) corre durante la pausa
// antes de «Period.» (local 71–115 = 11,88–13,32 s), anclado en
// la cara (50% 28%); se mantiene en 1,05 hasta el corte.
// CONSECUENCIA: «Period.» se oye a las 13,32 s (no 13,72 s) — el
// slam «PUNTO.» y su impacto SFX se mueven a 13,32 s.
const T2Video: React.FC = () => {
	const f = useCurrentFrame();
	const push = interpolate(f, [71, 115], [1, 1.05], {
		easing: Easing.inOut(Easing.sin),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	return (
		<AbsoluteFill style={{opacity: f >= 12 ? 1 : 0}}>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					transform: `scale(${push})`,
					transformOrigin: '50% 28%',
				}}
			>
				<OffthreadVideo
					src={staticFile('video/panel-t2.mp4')}
					style={{width: '100%', height: '100%', objectFit: 'cover'}}
				/>
			</div>
		</AbsoluteFill>
	);
};

// ---------- audio T3 en Sequence propia (J-cut S2→S3) ----------
// El audio de Waltz 27-oct arranca en 15,1 s (f453), 0,4 s antes
// de la imagen de S3, bajo la cola en silencio de S2. El video
// lleva rampa (panel-t3-ramp.mp4, MUDO); el audio va por
// separado a velocidad normal (2,5 s, termina limpio a 17,6 s).
// El leve desfase labial en los primeros 0,4 s es el precio
// del J-cut.
const T3Audio: React.FC = () => (
	<Audio src={staticFile('audio/panel-t3-audio.wav')} />
);

// ---------- pre-lap visual de L4 (T5) ----------
// Sequence 828–861 (27,6–28,7 s): el documento plano 1 entra
// deslizándose desde la derecha con la matemática del barrido
// (viaje 110% · estirado 1,12 · blur 24 px · bezier 0.7,0,0.2,1)
// durante local 0–23, completando EXACTAMENTE en «esto»
// (28,38 s, f851); mantiene 851–861. En S6 local 0 el documento
// ya está en su sitio (corte duro sin hueco).
const PreLapL4: React.FC = () => {
	const f = useCurrentFrame();
	const p = interpolate(f, [0, 23], [0, 1], {
		easing: Easing.bezier(0.7, 0, 0.2, 1),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const tx = interpolate(p, [0, 1], [110, 0]);
	const sx = interpolate(p, [0, 1], [1.12, 1]);
	const blur = interpolate(p, [0, 1], [24, 0]);
	return (
		<AbsoluteFill>
			<div
				style={{
					position: 'absolute',
					left: 0,
					top: 350,
					width: 1080,
					height: 608,
					overflow: 'hidden',
					transform: `translateX(${tx}%) scale(${sx}, 1)`,
					filter: `blur(${blur}px)`,
				}}
			>
				<div
					style={{
						width: 1080,
						height: 608,
						transform: 'scale(0.65)',
						transformOrigin: '543px 297px',
					}}
				>
					<Img
						src={staticFile('img/docs/statedept-cuba-sanctions.png')}
						style={{width: 1080, height: 608, objectFit: 'cover'}}
					/>
				</div>
			</div>
		</AbsoluteFill>
	);
};

// ---------- wipe de la pantalla dividida (auditoría 14) ----------
// Sequence 1818–1830 (12 f): el layout inicial de S9 (cabeceras
// + divisor + tarjeta 0 + documentos, todo a opacidad 1) se
// desliza desde la derecha SOBRE el final de L6. En 1830, S9
// arranca con el mismo layout (sin fade) — continuidad total,
// sin el fotograma negro de 61,0 s.
const CloseL7Wipe: React.FC = () => {
	const f = useCurrentFrame();
	const p = interpolate(f, [0, 12], [0, 1], {
		easing: Easing.out(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	return (
		<AbsoluteFill
			style={{transform: `translateX(${interpolate(p, [0, 1], [1080, 0])}px)`}}
		>
			<CloseL7Layout card={CLOSE_CARDS[0]} cardOp={1} cardScale={1} cardRot={-3} />
		</AbsoluteFill>
	);
};
// ---------- sello con golpe (slam + rotación) ----------
const StampSeal: React.FC<{
	at: number;
	top: number;
	rotate?: number;
	size?: number;
	lines: string[];
}> = ({at, top, rotate = -8, size = 44, lines}) => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	if (f < at) return null;
	const p = spring({
		frame: f - at,
		fps,
		config: {damping: 12, stiffness: 300, mass: 0.9},
	});
	const scale = interpolate(p, [0, 1], [1.7, 1]);
	const op = clamp01(f, at, at + 4);
	return (
		<div
			style={{
				position: 'absolute',
				top,
				left: 0,
				right: 0,
				display: 'flex',
				justifyContent: 'center',
				opacity: op,
				transform: `scale(${scale}) rotate(${rotate}deg)`,
			}}
		>
			<div
				style={{
					fontFamily: ARCHIVO,
					fontSize: size,
					lineHeight: 1.15,
					letterSpacing: 2,
					textAlign: 'center',
					color: MEMORIAL_RED,
					border: `6px solid ${MEMORIAL_RED}`,
					borderRadius: 14,
					padding: '18px 36px',
					background: 'rgba(5,5,7,0.55)',
					boxShadow:
						'0 0 30px rgba(237,28,36,0.45), 0 14px 40px rgba(0,0,0,0.5)',
					textShadow: textOutline(2),
				}}
			>
				{lines.map((l, i) => (
					<div key={i}>{l}</div>
				))}
			</div>
		</div>
	);
};

// ---------- banda de cita del panel (entrada con subida) ----------
const QuoteBand: React.FC<{
	bottom?: number;
	delay?: number;
	children: React.ReactNode;
}> = ({bottom = 320, delay = 6, children}) => {
	const f = useCurrentFrame();
	const op = clamp01(f, delay, delay + 8);
	const y = interpolate(f, [delay, delay + 12], [18, 0], {
		easing: Easing.out(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	return (
		<div
			style={{
				position: 'absolute',
				bottom,
				left: 56,
				right: 56,
				textAlign: 'center',
				opacity: op,
				transform: `translateY(${y}px)`,
			}}
		>
			{children}
		</div>
	);
};

// ---------- degradados del panel (legibilidad de barra y banda) ----------
const PanelGradients: React.FC = () => (
	<>
		<div
			style={{
				position: 'absolute',
				inset: 0,
				background:
					'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.12) 22%, rgba(0,0,0,0) 40%)',
			}}
		/>
		<div
			style={{
				position: 'absolute',
				inset: 0,
				background:
					'linear-gradient(0deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.45) 28%, rgba(0,0,0,0) 52%)',
			}}
		/>
	</>
);

// ---------- viñeta global ----------
const Vignette: React.FC = () => (
	<AbsoluteFill style={{pointerEvents: 'none'}}>
		<div
			style={{
				position: 'absolute',
				inset: 0,
				background:
					'radial-gradient(ellipse 90% 75% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.28) 100%)',
			}}
		/>
	</AbsoluteFill>
);

// ---------- marca de agua (logotipo COMPLETO, blanco/transparente) ----------
// 115 px, arriba derecha, desde el fotograma 0, fade de salida
// antes del sting (2225–2235). Nunca solo la estrella.
// El logo se OCULTA durante el punch de L4 (960–975 fuera,
// 1200–1215 dentro): el documento ampliado es blanco y se traga
// el logotipo blanco (pre-vuelo f990/f1050: ilegible sobre la
// página; un velo no basta). En el resto del reel el fondo es
// oscuro y el logo se lee.
const LogoInner: React.FC = () => {
	const frame = useCurrentFrame();
	const fadeOut = interpolate(frame, [2225, 2235], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	// Punch de L4: 981–1200 (fotogramas absolutos).
	const punchHide =
		clamp01(frame, 960, 975) * (1 - clamp01(frame, 1200, 1215));
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<Img
				src={staticFile('img/logo-white.png')}
				style={{
					position: 'absolute',
					top: 54,
					right: 40,
					width: 115,
					opacity: fadeOut * (1 - punchHide),
					filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.6))',
				}}
			/>
		</AbsoluteFill>
	);
};

// ---------- karaoke ----------
// Líneas preagrupadas desde los chunks de captions.ts (alineados
// por onsets acústicos; 125 palabras, 8 segmentos). TopKaraoke
// usa el reloj LOCAL de su Sequence: cada bloque se desplaza por
// el inicio de su escena. L2 NO lleva karaoke: el titular
// cinético «CUATRO VECES. / EN SEIS MESES.» YA dice esas palabras
// (nunca texto doble; patrón V3 de marti-fidel). L7 solo lleva
// sus 2 primeros chunks: a partir de «EL BLOQUEO…» el eslogan y
// el sello HACEN de texto.
const shiftLines = (lines: KaraokeLine[], sec: number): KaraokeLine[] =>
	lines.map((line) => ({
		words: line.words.map((w) => ({...w, s: w.s - sec, e: w.e - sec})),
	}));
const LINES_L1: KaraokeLine[] = capSegmentsToLines(CAPTIONS.slice(0, 1));
const LINES_L3: KaraokeLine[] = shiftLines(
	capSegmentsToLines(CAPTIONS.slice(2, 3)),
	S5_START / FPS,
);
const LINES_L4: KaraokeLine[] = shiftLines(
	capSegmentsToLines(CAPTIONS.slice(3, 4)),
	S6_START / FPS,
);
const LINES_L5: KaraokeLine[] = shiftLines(
	capSegmentsToLines(CAPTIONS.slice(4, 5)),
	S7_START / FPS,
);
const LINES_L6: KaraokeLine[] = shiftLines(
	capSegmentsToLines(CAPTIONS.slice(5, 6)),
	S8_START / FPS,
);
const LINES_L7: KaraokeLine[] = shiftLines(
	capSegmentsToLines([
		{...CAPTIONS[6], chunks: CAPTIONS[6].chunks.slice(0, 2)},
	]),
	S9_START / FPS,
);
const LINES_L8: KaraokeLine[] = shiftLines(
	capSegmentsToLines(CAPTIONS.slice(7, 8)),
	S10_START / FPS,
);

// ================================================================
// S0 — GANCHO (0–171 f · 0–5,7 s)
// VIDEO REAL mudo de Waltz 27-oct (soundbite 13,0–18,7 s: de
// frente, boca muy abierta a 14,0 s, puño levantado a 15,0 s;
// evita la pausa de 6,0–7,0 s y el inicio de perfil de 7,0 s)
// + punch-in 1,3→1,0 anclado en la cara (48% 26%, local 0–51,
// ~1,7 s) + título con revelado por líneas (HookTitle, formado
// a f12 = 0,4 s, con el slam a 0,3 s) + segundo latido a 3,5 s
// (el título sale con barrido a la izquierda y la cámara da un
// segundo punch 1,0→1,10 en 8 f) + flash-preview de T2 (local
// 105–119, MUDO, zoom 1,0→1,12) + karaoke L1. Cara libre en
// todo momento: título y karaoke van sobre el pecho (y 820–1244).
// ================================================================
// Título del gancho: revelado por líneas con máscara (NO
// KineticHeadline: no hace revelado por líneas y su spring tarda
// ~12–15 f). Cada línea sube 110%→0 en 6 f, stagger 3 f (línea 1
// f0–6, línea 2 f3–9, línea 3 f6–12). Formado a f12 (0,4 s); el
// slam a f9 coincide con el aterrizaje de la línea 2. Salida a
// 3,5 s (local 105–113): deslizamiento rápido a la izquierda +
// fade, stagger 2 f por línea.
const HookTitle: React.FC = () => {
	const f = useCurrentFrame();
	const lines = [
		['DICEN', 'QUE'],
		['NO', 'HAY'],
		['BLOQUEO'],
	];
	return (
		<div style={{position: 'absolute', top: 820, left: 0, right: 0}}>
			{lines.map((words, li) => {
				const inP = interpolate(f, [li * 3, li * 3 + 6], [0, 1], {
					easing: Easing.out(Easing.cubic),
					extrapolateLeft: 'clamp',
					extrapolateRight: 'clamp',
				});
				const outP = interpolate(f, [105 + li * 2, 113 + li * 2], [0, 1], {
					easing: Easing.out(Easing.cubic),
					extrapolateLeft: 'clamp',
					extrapolateRight: 'clamp',
				});
				const y = interpolate(inP, [0, 1], [110, 0]);
				return (
					<div
						key={li}
						style={{
							overflow: 'hidden',
							height: 100,
							opacity: 1 - outP,
							transform: `translateX(${interpolate(outP, [0, 1], [0, -200])}px)`,
						}}
					>
						<div
							style={{
								transform: `translateY(${y}%)`,
								textAlign: 'center',
								fontFamily: ARCHIVO,
								fontSize: 92,
								lineHeight: 1,
								color: '#FFFFFF',
							}}
						>
							{words.map((w, wi) => (
								<span
									key={w}
									style={{
										color: w === 'BLOQUEO' ? MEMORIAL_RED : '#FFFFFF',
										textShadow: '0 6px 30px rgba(0,0,0,0.6)',
									}}
								>
									{w}
									{wi < words.length - 1 ? ' ' : ''}
								</span>
							))}
						</div>
					</div>
				);
			})}
		</div>
	);
};

const HookScene: React.FC = () => {
	const f = useCurrentFrame();
	// Punch-in 1,3→1,0 (local 0–51, ease-out cúbico, anclado en
	// la cara 48% 26%) + segundo punch 1,0→1,10 (local 105–113,
	// aterrizaje duro sin rebote) que se mantiene hasta el fin.
	const punch = interpolate(f, [0, 51], [1.3, 1], {
		easing: Easing.out(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const punch2 = interpolate(f, [105, 113], [1, 1.1], {
		easing: Easing.out(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const scale = punch * punch2;
	// Flash-preview de T2 (local 105–119): Waltz a mitad de «It's
	// fake» (video 0,5–0,97 s), MUDO, zoom rápido 1,0→1,12.
	// Corte duro de vuelta al gancho en local 119. La Sequence
	// anidada pone el reloj local en 0 para el startFrom.
	const flashScale = interpolate(f, [105, 119], [1, 1.12], {
		easing: Easing.out(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	return (
		<AbsoluteFill style={{background: INK}}>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					transform: `scale(${scale})`,
					transformOrigin: '48% 26%',
				}}
			>
				<OffthreadVideo
					src={staticFile(
						'video/waltz-27oct-no-blockade-soundbite33.mp4',
					)}
					startFrom={390}
					endAt={561}
					volume={0}
					style={{width: '100%', height: '100%', objectFit: 'cover'}}
				/>
			</div>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					background:
						'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 25%, rgba(0,0,0,0.25) 55%, rgba(0,0,0,0.72) 100%)',
				}}
			/>
			<Sequence from={105} durationInFrames={14} name="Flash T2">
				<div
					style={{
						position: 'absolute',
						inset: 0,
						transform: `scale(${flashScale})`,
						transformOrigin: '50% 28%',
					}}
				>
					<OffthreadVideo
						src={staticFile('video/panel-t2.mp4')}
						startFrom={15}
						volume={0}
						style={{width: '100%', height: '100%', objectFit: 'cover'}}
					/>
				</div>
			</Sequence>
			<HookTitle />
		</AbsoluteFill>
	);
};
// ================================================================
// S1 — PANEL T1, RUBIO (171–297 f · 5,7–9,9 s, local 0–126)
// Video Rubio 5,9–9,9 s (panel-t1.mp4, 4,0 s). Encuadre de cabeza
// y hombros como Waltz (S2/S3): video inset 940×1670 en
// (70, 155) — equivalente a 0,87× + translateY 155, con
// geometría explícita (sin transforms encadenados).
//
// Geometría (fuente 1920×1080; cara medida en f230: pelo y≈104,
// mentón y≈521; subtítulos quemados fuente y ≥ 875; factor
// vertical 1670/1080 = 1,546 + offset 155): pelo en display 316,
// mentón 962. La barra de tiempo (línea 262, etiquetas 284–306)
// queda sobre el fondo azul, 10 px por encima del pelo. Los
// subtítulos quemados caen en display y ≥ 1452 (medido en el
// clip: top más alto fuente y 839, constante en los 4 s) y la
// BANDA INFERIOR OPACA (y 1420–1920, INK sólido) los traga: la
// banda va debajo de la cita y el chip. Los laterales (0–70, 1010–
// 1080) y la franja superior (0–155) los cubre el mismo video
// difuminado y mudo (brightness 0,9). La atribución va DENTRO
// de la tarjeta de cita (línea mono); el chip de fuente va a
// top 330 (bajo la línea de tiempo, fuera de la columna de
// botones de Meta). La tarjeta queda con el borde inferior en
// y 1220 (QuoteBand bottom 700) — dentro de la zona segura.
// El audio del clip termina en local f120, antes del corte.
// ================================================================
const PanelT1Scene: React.FC = () => {
	return (
		<AbsoluteFill style={{background: INK}}>
			{/* Fondo difuminado del mismo video (mudo): cubre los
			laterales y la franja superior del inset. */}
			<div style={{position: 'absolute', inset: 0}}>
				<OffthreadVideo
					src={staticFile('video/panel-t1.mp4')}
					volume={0}
					style={{
						width: '100%',
						height: '100%',
						objectFit: 'cover',
						filter: 'blur(40px) brightness(0.9)',
						transform: 'scale(1.1)',
					}}
				/>
			</div>
			{/* Video principal: inset 940×1670 en (70, 155). */}
			<div
				style={{
					position: 'absolute',
					left: 70,
					top: 155,
					width: 940,
					height: 1670,
				}}
			>
				<OffthreadVideo
					src={staticFile('video/panel-t1.mp4')}
					style={{width: '100%', height: '100%', objectFit: 'cover'}}
				/>
			</div>
			{/* Banda inferior OPACA (y 1420–1920): traga los
			subtítulos quemados (en display y ≥ 1452, medido).
			Debajo de la cita y el chip (que se dibujan sobre ella). */}
			<div
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					top: 1420,
					bottom: 0,
					background: INK,
				}}
			/>
			<PanelGradients />
			<TimelineBar active={0} />
			<DataChip top={330} right={40}>
				DEPT. DE ESTADO
			</DataChip>
			<QuoteBand bottom={700}>
				<div
					style={{
						fontFamily: ARCHIVO,
						fontSize: 58,
						lineHeight: 1.18,
						color: '#FFFFFF',
						textShadow: textOutline(3),
					}}
				>
					NO SE DEBE A UN “BLOQUEO” PETROLERO
				</div>
				<div
					style={{
						fontFamily: MONO,
						fontSize: 26,
						fontWeight: 700,
						letterSpacing: 2,
						marginTop: 14,
						color: 'rgba(255,255,255,0.75)',
					}}
				>
					MARCO RUBIO — SECRETARIO DE ESTADO · 20 MAY 2026
				</div>
			</QuoteBand>
		</AbsoluteFill>
	);
};
// ================================================================
// S2 — PANEL T2, WALTZ 7-JUL (297–465 f · 9,9–15,5 s, local 0–168)
// El VIDEO va en su propia Sequence (T2Video, desde 9,5 s):
// J-cut — el audio («It's fake») se oye bajo los últimos 0,4 s
// de la tarjeta de Rubio. Esta escena solo pinta los overlays
// (sin fondo opaco: el video se ve a través). La pausa de 1,44 s
// antes de «Period.» es el latido dramático: «PUNTO.» entra con
// slam en local f103 (13,32 s, NO 13,72 s — el J-cut adelanta
// «Period.» 0,4 s; el impacto SFX se mueve a 13,32 s).
// ================================================================
const PanelT2Scene: React.FC = () => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	const PUNTO_AT = 103;
	const puntoP = spring({
		frame: f - PUNTO_AT,
		fps,
		config: {damping: 11, stiffness: 260, mass: 0.8},
	});
	const puntoScale = interpolate(puntoP, [0, 1], [1.8, 1]);
	return (
		<AbsoluteFill>
			<PanelGradients />
			<TimelineBar active={1} />
			<DataChip top={330} right={40}>
				UN WEB TV · ONU
			</DataChip>
			<QuoteBand bottom={700}>
				<div
					style={{
						fontFamily: ARCHIVO,
						fontSize: 44,
						lineHeight: 1.18,
						color: '#FFFFFF',
						textShadow: textOutline(3),
					}}
				>
					<div>IT&rsquo;S FAKE. IT&rsquo;S FALSE.</div>
					<div>
						IT&rsquo;S A LIE.{' '}
						{f >= PUNTO_AT && (
							<span
								style={{
									color: MEMORIAL_RED,
									display: 'inline-block',
									transform: `scale(${puntoScale})`,
								}}
							>
								PERIOD.
							</span>
						)}
					</div>
				</div>
				<div
					style={{
						fontFamily: COND,
						fontWeight: 600,
						fontSize: 32,
						marginTop: 16,
						color: '#E5E7EB',
						textShadow: '0 2px 8px rgba(0,0,0,0.8)',
					}}
				>
					ES FALSO. ES MENTIRA.
				</div>
				{f >= PUNTO_AT && (
					<div
						style={{
							fontFamily: ARCHIVO,
							fontSize: 64,
							marginTop: 10,
							color: MEMORIAL_RED,
							transform: `scale(${puntoScale})`,
							textShadow: '0 6px 30px rgba(237,28,36,0.55)',
						}}
					>
						PUNTO.
					</div>
				)}
				<div
					style={{
						fontFamily: MONO,
						fontSize: 26,
						fontWeight: 700,
						letterSpacing: 2,
						marginTop: 14,
						color: 'rgba(255,255,255,0.75)',
					}}
				>
					MIKE WALTZ — EMBAJADOR ANTE LA ONU · 7 JUL 2026
				</div>
			</QuoteBand>
		</AbsoluteFill>
	);
};
// ================================================================
// S3 — PANEL T3, WALTZ 27-OCT (465–585 f · 15,5–19,5 s, local 0–120)
// Video Waltz 0,3–2,8 s CON RAMPA (panel-t3-ramp.mp4, MUDO, 87 f
// = 2,9 s: últimos 0,5 s de 100%→30%) + freeze-frame 1,1 s.
// El AUDIO va por separado (T3Audio, desde 15,1 s, J-cut) a
// velocidad normal — nunca se estira. El freeze aterriza en
// local 87 (global f552 = 18,40 s): ahí va el SFX de obturador.
// Disolución de 6 f (87–93) entre video y freeze. El freeze
// lleva push manual 1,0→1,05 durante su ventana (87–120): el
// KenBurns anterior tenía su zoom terminado antes de aparecer
// (bug, auditoría 16). Video + freeze bajados 230 px: pelo
// ~355 (la barra queda 49 px por encima), mentón ~930 (la
// tarjeta, con la itálica en una sola línea, empieza en ~981).
// ================================================================
const PanelT3Scene: React.FC = () => {
	const f = useCurrentFrame();
	const videoOp = 1 - clamp01(f, 87, 93);
	const freezeOp = clamp01(f, 87, 93);
	const freezeScale = interpolate(f, [87, 120], [1, 1.05], {
		easing: Easing.inOut(Easing.sin),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	return (
		<AbsoluteFill style={{background: INK}}>
			{/* Backdrop difuminado (cubre la franja superior de
			230 px que deja la bajada). Mismo clip rampado, mudo. */}
			<div style={{position: 'absolute', inset: 0}}>
				<OffthreadVideo
					src={staticFile('video/panel-t3-ramp.mp4')}
					volume={0}
					style={{
						width: '100%',
						height: '100%',
						objectFit: 'cover',
						filter: 'blur(40px) brightness(0.9)',
						transform: 'scale(1.1)',
					}}
				/>
			</div>
			{/* Video + freeze, bajados 230 px. */}
			<div
				style={{
					position: 'absolute',
					inset: 0,
					transform: 'translateY(230px)',
				}}
			>
				<div style={{position: 'absolute', inset: 0, opacity: videoOp}}>
					<OffthreadVideo
						src={staticFile('video/panel-t3-ramp.mp4')}
						volume={0}
						style={{width: '100%', height: '100%', objectFit: 'cover'}}
					/>
				</div>
				<div
					style={{
						position: 'absolute',
						inset: 0,
						opacity: freezeOp,
						transform: `scale(${freezeScale})`,
						transformOrigin: '48% 28%',
					}}
				>
					<Img
						src={staticFile('img/waltz-27oct-freeze.jpg')}
						style={{width: '100%', height: '100%', objectFit: 'cover'}}
					/>
				</div>
			</div>
			<PanelGradients />
			<TimelineBar active={2} />
			<DataChip top={330} right={40}>
				UNIFEED · ONU
			</DataChip>
			<QuoteBand bottom={700}>
				<div
					style={{
						fontFamily: ARCHIVO,
						fontSize: 50,
						lineHeight: 1.15,
						color: '#FFFFFF',
						textShadow: textOutline(3),
					}}
				>
					THERE IS NO BLOCKADE
				</div>
				<div
					style={{
						fontFamily: ARCHIVO,
						fontSize: 68,
						lineHeight: 1.1,
						marginTop: 12,
						color: MEMORIAL_RED,
						textShadow: '0 6px 30px rgba(237,28,36,0.5)',
					}}
				>
					NO HAY BLOQUEO
				</div>
				<div
					style={{
						fontFamily: COND,
						fontStyle: 'italic',
						fontWeight: 500,
						fontSize: 28,
						lineHeight: 1.3,
						marginTop: 18,
						color: '#D1D5DB',
						textShadow: '0 2px 8px rgba(0,0,0,0.8)',
						whiteSpace: 'nowrap',
					}}
				>
					«Un bloqueo es un anillo de barcos militares alrededor de una isla.»
				</div>
				<div
					style={{
						fontFamily: MONO,
						fontSize: 26,
						fontWeight: 700,
						letterSpacing: 2,
						marginTop: 14,
						color: 'rgba(255,255,255,0.75)',
					}}
				>
					MIKE WALTZ — EMBAJADOR ANTE LA ONU · 27 OCT 2026
				</div>
			</QuoteBand>
		</AbsoluteFill>
	);
};
// ================================================================
// S4 — PANEL T4, FOX (585–705 f · 19,5–23,5 s, local 0–120)
// Sándwich parallax 2.5D (T7) + título fantasma (T4) sobre la
// foto de Fox News (1280×720): fondo difuminado 100→102% →
// «CORDON» en rojo (110 px, deriva ±60 px, pulso 1,0→1,03,
// en display y 800–910, entre el mentón y la tarjeta: detrás
// del sujeto, se lee a ambos lados del cuello/pecho, NUNCA
// cubre la cara) → recorte del sujeto 100→105% (GrabCut,
// El hueco tras el recorte lo tapa la copia difuminada de la
// misma foto (R21: nunca píxeles generados). Reencuadre
// translate(−150, +190): el inset de Fox sale de cuadro (era
// el «fragmento» de la esquina superior izquierda, auditoría 3)
// y la cabeza baja bajo la barra (pelo ~340). Sin voz original
// (es un artículo de opinión).
// ================================================================
const PanelT4Scene: React.FC = () => {
	const f = useCurrentFrame();
	const bgScale = interpolate(f, [0, 120], [1, 1.02], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const fgScale = interpolate(f, [0, 120], [1, 1.05], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const ghostX = interpolate(f, [0, 120], [-60, 60], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	// Pulso 1,0→1,03, periodo 60 f, empieza en 1,0.
	const ghostPulse =
		1 + 0.03 * ((1 - Math.cos((f / 60) * Math.PI * 2)) / 2);
	return (
		<AbsoluteFill style={{background: INK}}>
			{/* Backdrop difuminado (cubre los huecos del reencuadre:
			arriba 190 px y derecha 150 px). */}
			<div style={{position: 'absolute', inset: 0}}>
				<Img
					src={staticFile('img/waltz-foxnews-16nov.jpg')}
					style={{
						width: '100%',
						height: '100%',
						objectFit: 'cover',
						filter: 'blur(40px) brightness(0.9)',
						transform: 'scale(1.1)',
					}}
				/>
			</div>
			{/* Sándwich parallax, reencuadrado. */}
			<div
				style={{
					position: 'absolute',
					inset: 0,
					transform: 'translate(-150px, 190px)',
					overflow: 'hidden',
				}}
			>
				<div
					style={{
						position: 'absolute',
						inset: 0,
						transform: `scale(${bgScale})`,
						transformOrigin: '52% 30%',
					}}
				>
					<Img
						src={staticFile('img/waltz-foxnews-16nov.jpg')}
						style={{
							width: '100%',
							height: '100%',
							objectFit: 'cover',
							filter: 'blur(8px)',
						}}
					/>
				</div>
				<div
					style={{
						position: 'absolute',
						inset: 0,
						background: 'rgba(5,5,7,0.45)',
					}}
				/>
				{/* Palabra fantasma: 110 px en display y 800–910
				(entre el mentón, 790, y la tarjeta, 946) — a
				170 px rozaba la boca y las letras se cortaban
				contra la tarjeta. Se lee a ambos lados del
				cuello/pecho, detrás del sujeto. */}
				<div
					style={{
						position: 'absolute',
						top: 610,
						left: 0,
						right: 0,
						textAlign: 'center',
						transform: `translateX(${ghostX}px) scale(${ghostPulse})`,
						fontFamily: ARCHIVO,
						fontSize: 110,
						letterSpacing: 4,
						color: MEMORIAL_RED,
						opacity: 0.45,
						textShadow: '0 8px 40px rgba(0,0,0,0.6)',
					}}
				>
					CORDON
				</div>
				<div
					style={{
						position: 'absolute',
						inset: 0,
						transform: `scale(${fgScale})`,
						transformOrigin: '52% 30%',
					}}
				>
					<Img
						src={staticFile('img/waltz-foxnews-cutout.png')}
						style={{width: '100%', height: '100%', objectFit: 'cover'}}
					/>
				</div>
			</div>
			<PanelGradients />
			<TimelineBar active={3} />
			<DataChip top={330} right={40}>
				FOX NEWS
			</DataChip>
			<QuoteBand bottom={700}>
				<div
					style={{
						fontFamily: ARCHIVO,
						fontSize: 52,
						lineHeight: 1.18,
						color: '#FFFFFF',
						textShadow: textOutline(3),
					}}
				>
					THERE IS NO AMERICAN NAVAL CORDON AROUND CUBA
				</div>
				<div
					style={{
						fontFamily: COND,
						fontWeight: 600,
						fontSize: 38,
						lineHeight: 1.25,
						marginTop: 16,
						color: '#E5E7EB',
						textShadow: '0 2px 8px rgba(0,0,0,0.8)',
					}}
				>
					NO HAY NINGÚN CORDÓN NAVAL ESTADOUNIDENSE ALREDEDOR
					DE CUBA
				</div>
				<div
					style={{
						fontFamily: MONO,
						fontSize: 26,
						fontWeight: 700,
						letterSpacing: 2,
						marginTop: 14,
						color: 'rgba(255,255,255,0.75)',
					}}
				>
					MIKE WALTZ — FOX NEWS · OPINIÓN · 16 NOV 2026
				</div>
			</QuoteBand>
		</AbsoluteFill>
	);
};
// ================================================================
// S5 — GIRO (705–861 f · 23,5–28,7 s, local 0–156)
// L2: rejilla 2×2 de las 4 tarjetas (pops en corcheas de la
// rejilla nominal: local f2/10/18/26 — 23,57/23,83/24,10/24,37 s,
// anclados a «Cuatro»@23,6 s) + «CUATRO VECES. / EN SEIS MESES.»
// cinético (delay −10: la primera palabra ya está al ~85% en
// el fotograma 0, sin el dip negro de 23,5 s). Collage «tablón»
// (T6): borde blanco 10 px, sombra grande, rotación ±2–4°,
// entrada 1,1→1,0 con spring, textura de tablón sutil. L3:
// («Vale. Ahora mira esto.») + pre-lap del documento (Sequence
// aparte, 828–861). La música está cortada a casi-silencio; la
// rejilla es el ancla visual del silencio (C4).
// ================================================================
const GRID_CARDS = [
	{file: 'img/rubio-20may-still.jpg', label: 'RUBIO · 20 MAY'},
	{file: 'img/real-un/waltz-7jul-podium.jpg', label: 'WALTZ · 7 JUL'},
	{file: 'img/real-un/waltz-27oct-podium.jpg', label: 'WALTZ · 27 OCT'},
	{file: 'img/waltz-foxnews-16nov.jpg', label: 'WALTZ · FOX 16 NOV'},
];
const GRID_POPS = [2, 10, 18, 26];
const GRID_ROT = [-3, 2, 3, -2];
const GiroScene: React.FC = () => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	// La rejilla y el titular se retiran al terminar L2 (26,2 s,
	// local 81), antes de que arranque el karaoke de L3 (26,5 s).
	const gridOut = 1 - clamp01(f, 81, 90);
	return (
		<AbsoluteFill style={{background: INK}}>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					background:
						'radial-gradient(ellipse 70% 45% at 50% 30%, rgba(237,28,36,0.14) 0%, rgba(237,28,36,0) 70%)',
				}}
			/>
			{/* Textura de tablón sutil (T6). */}
			<div
				style={{
					position: 'absolute',
					inset: 0,
					background:
						'repeating-linear-gradient(0deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 6px), repeating-linear-gradient(90deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 6px)',
				}}
			/>
			{/* Píldora tras el karaoke de L3 (local 90–137): el
			tramo es casi negro por diseño (la pausa), pero a 540p
			el texto solo cubre ~1,4% de píxeles claros y la puerta
			QA (blackdetect, umbral 98%) lo marca como negro. La
			píldora (blanco 0,16, luminancia ~41 > 25,5) sube los
			píxeles claros a ~6% sin cambiar el ánimo: se lee como
			fondo de subtítulo, no como luz. Aparece INSTANTÁNEA
			en local 90 (con fundido de entrada, los 2 primeros
			fotogramas seguían marcando negro); se desvanece con
			el karaoke en 133–139 (el pre-lap llega a 828 y el doc
			cubre la zona). */}
			<div
				style={{
					position: 'absolute',
					left: 190,
					top: 900,
					width: 700,
					height: 150,
					background: 'rgba(255,255,255,0.16)',
					borderRadius: 20,
					opacity: f >= 90 ? 1 - clamp01(f, 133, 139) : 0,
				}}
			/>
			<div style={{opacity: gridOut}}>
				<KineticHeadline
					lines={[
						[{t: 'CUATRO', accent: true}, {t: 'VECES.'}],
						[{t: 'EN'}, {t: 'SEIS'}, {t: 'MESES.'}],
					]}
					top={400}
					size={88}
					delay={-10}
					step={4}
					accentColor={MEMORIAL_RED}
					fontFamily={ARCHIVO}
				/>
				{GRID_CARDS.map((card, i) => {
					const at = GRID_POPS[i];
					const p = spring({
						frame: f - at,
						fps,
						config: {damping: 12, stiffness: 260, mass: 0.8},
					});
					const scale = interpolate(p, [0, 1], [1.1, 1]);
					const col = i % 2;
					const row = Math.floor(i / 2);
					return (
						<div
							key={card.label}
							style={{
								position: 'absolute',
								left: 60 + col * 490,
								top: 620 + row * 310,
								width: 470,
								opacity: p,
								transform: `rotate(${GRID_ROT[i]}deg) scale(${scale})`,
							}}
						>
							<div
								style={{
									width: 470,
									height: 264,
									boxSizing: 'border-box',
									borderRadius: 12,
									overflow: 'hidden',
									border: '10px solid #FFFFFF',
									boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
								}}
							>
								{/* Zoom 1,35× anclado arriba (igual en las 4
								tarjetas): las caras leen mejor en pequeño y
								la tarjeta de Rubio esconde sus subtítulos
								quemados (y ≥ 0,79 de la fuente queda fuera). */}
								<Img
									src={staticFile(card.file)}
									style={{
										width: '100%',
										height: '100%',
										objectFit: 'cover',
										transform: 'scale(1.35)',
										transformOrigin: '50% 0%',
									}}
								/>
							</div>
							<div
								style={{
									marginTop: 12,
									textAlign: 'center',
									fontFamily: MONO,
									fontSize: 22,
									fontWeight: 700,
									letterSpacing: 2,
									color: 'rgba(255,255,255,0.85)',
								}}
							>
								{card.label}
							</div>
						</div>
					);
				})}
			</div>
		</AbsoluteFill>
	);
};
// ================================================================
// S6 — L4, STATE.GOV (861–1200 f · 28,7–40 s, local 0–339)
// Plano 1 con zoom lento continuo 0,65→0,82 (local 0–120, T7:
// ningún plano quieto >2 s) → punch al párrafo 2,30× en local
// 120–138 (32,7 s) → punch 2 a 2,35× + reencuadre a la cláusula
// final en local 264–282 (37,5–38,1 s). El punch 2 es un empuje
// del 2% + reencuadre: a 2,5× la cláusula (445 px) mediría
// 1112 px y «place»/«today.» quedarían fuera; a 2,35× abarca
// 17–1063 px. El título «Cuba Sanctions» se esconde con
// clip-path animado 0→230 px durante el punch (el título está
// en contenedor y 164–198; el párrafo empieza en y ~250).
//
// T1 resaltador amarillo (sustituye las barras rojas): multiply,
// 0,35 vigente / 0,15 tenue, bordes rugosos, barrido con la VO.
// T2 subrayado rojo a mano (SVG, strokeDashoffset) bajo «which
// remains in place» (local 237–268) y «today.» (268–275), con
// SFX de marcador en 36,58 s. T3 traducción en 3 tiempos:
// (a) «un embargo económico integral» 171, (b) «contra Cuba,»
// 218, (c) «que sigue vigente hoy» en rojo 247 — tarjeta en
// top 930, compacta. T5 aislamiento de foco desde local 159:
// resto de la página a 30% de brillo + blur, solo el párrafo
// nítido (el recorte anima al rectángulo de la cláusula en el
// punch 2). Todo es hijo del contenedor transformado: se mueve
// y escala con el documento.
//
// Geometría medida en la captura (1920×1080 → contenedor
// 1080×608, factor 0,5625): centro del párrafo (543, 297);
// centro de la cláusula «which remains in place today»
// (551, 321); resaltador L1 (445, 257, ancho 147); L4
// (663, 308, ancho 111); L5 (329, 317, ancho 31).
// ================================================================
// T1 — resaltador amarillo palabra por palabra (con la VO, nunca
// por delante). Seg1/seg2 se desvanecen durante el punch 2.
const L4Highlights: React.FC = () => {
	const f = useCurrentFrame();
	const s1 = clamp01(f, 171, 218);
	const s2 = clamp01(f, 247, 268);
	const s3 = clamp01(f, 268, 275);
	const fade12 = 1 - clamp01(f, 264, 282);
	const op1 = (f < 218 ? 0.35 : 0.15) * fade12;
	const op2 = 0.35 * fade12;
	const hi = (
		left: number,
		top: number,
		w: number,
		sweep: number,
		opacity: number,
	) => (
		<div
			style={{
				position: 'absolute',
				left,
				top,
				width: w * sweep,
				height: 17,
				background: '#FFE600',
				mixBlendMode: 'multiply',
				opacity,
				clipPath:
					'polygon(0 15%, 2% 0, 98% 4%, 100% 30%, 99% 85%, 97% 100%, 3% 96%, 0 70%)',
			}}
		/>
	);
	return (
		<>
			{hi(445, 257, 147, s1, op1)}
			{hi(663, 308, 111, s2, op2)}
			{hi(329, 317, 31, s3, 0.35)}
		</>
	);
};

// T2 — subrayado rojo dibujado a mano en la frase clave.
// Trazo 1 bajo «which remains in place» (x 590–774, y ~330),
// local 237–268 (VO «QUE SIGUE VIGENTE»); trazo 2 bajo
// «today.» (x 329–360, y ~340), local 268–275 (VO «HOY.»).
// Ceñido a las palabras, nunca hasta el borde (auditoría 2).
const L4RedStrokes: React.FC = () => {
	const f = useCurrentFrame();
	const p1 = clamp01(f, 237, 268);
	const p2 = clamp01(f, 268, 275);
	const stroke = (d: string, len: number, p: number) => (
		<path
			d={d}
			fill="none"
			stroke={MEMORIAL_RED}
			strokeWidth={4}
			strokeLinecap="round"
			strokeDasharray={len}
			strokeDashoffset={len * (1 - p)}
		/>
	);
	return (
		<svg
			style={{
				position: 'absolute',
				inset: 0,
				width: 1080,
				height: 608,
				overflow: 'visible',
			}}
			viewBox="0 0 1080 608"
		>
			{stroke('M 590 330 Q 650 326 700 332 T 774 329', 190, p1)}
			{stroke('M 329 340 Q 344 337 360 340', 32, p2)}
		</svg>
	);
};

const DocL4Scene: React.FC = () => {
	const f = useCurrentFrame();
	// Escala por tramos: plano 1 (0,65→0,82, zoom lento continuo,
	// ease in-out sinusoidal) → punch (0,82→2,30, ease-out) →
	// hold → punch 2 (2,30→2,35, ease-out).
	const docScale =
		f < 120
			? interpolate(f, [0, 120], [0.65, 0.82], {
					easing: Easing.inOut(Easing.sin),
					extrapolateLeft: 'clamp',
					extrapolateRight: 'clamp',
				})
			: f < 138
				? interpolate(f, [120, 138], [0.82, 2.3], {
						easing: Easing.out(Easing.cubic),
						extrapolateLeft: 'clamp',
						extrapolateRight: 'clamp',
					})
				: f < 264
					? 2.3
					: interpolate(f, [264, 282], [2.3, 2.35], {
							easing: Easing.out(Easing.cubic),
							extrapolateLeft: 'clamp',
							extrapolateRight: 'clamp',
						});
	// Origen: centro del párrafo (543, 297) → centro de la
	// cláusula (551, 321) durante el punch 2.
	const ox = interpolate(f, [264, 282], [543, 551], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const oy = interpolate(f, [264, 282], [297, 321], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	// Clip del título: inset superior 0→230 px durante el punch
	// (esconde cabecera + «Cuba Sanctions», contenedor y 164–198;
	// el párrafo, y ≥ 250, queda intacto).
	const clipTop = interpolate(f, [120, 138], [0, 230], {
		easing: Easing.out(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const chipIn = clamp01(f, 6, 14);
	const captionOut = 1 - clamp01(f, 114, 122);
	// T5 — aislamiento de foco: la página atenuada y el párrafo
	// nítido entran en local 159–171 (con el overlay, 34,0 s).
	const focusOp = clamp01(f, 159, 171);
	// El recorte nítido anima del párrafo (x 180–1070, y 240–355)
	// a la cláusula (x 320–780, y 300–350) durante el punch 2.
	const clipL = interpolate(f, [264, 282], [180, 320], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const clipT = interpolate(f, [264, 282], [240, 300], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const clipR = interpolate(f, [264, 282], [10, 300], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const clipB = interpolate(f, [264, 282], [253, 258], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	// T3 — traducción en 3 tiempos (local 171 / 218 / 247).
	const beatA = clamp01(f, 171, 179);
	const beatB = clamp01(f, 218, 226);
	const beatC = clamp01(f, 247, 255);
	return (
		<AbsoluteFill style={{background: NAVY}}>
			<div style={{opacity: chipIn}}>
				<DataChip top={280} left={40}>
					STATE.GOV · CUBA SANCTIONS
				</DataChip>
			</div>
			<div
				style={{
					position: 'absolute',
					left: 0,
					top: 350,
					width: 1080,
					height: 608,
					transform: `scale(${docScale})`,
					transformOrigin: `${ox}px ${oy}px`,
					clipPath: `inset(${clipTop}px 0 0 0)`,
				}}
			>
				<Img
					src={staticFile('img/docs/statedept-cuba-sanctions.png')}
					style={{
						width: '100%',
						height: '100%',
						border: '1px solid rgba(255,255,255,0.25)',
					}}
				/>
				{/* T5 (2): copia atenuada de toda la página. */}
				<Img
					src={staticFile('img/docs/statedept-cuba-sanctions.png')}
					style={{
						position: 'absolute',
						inset: 0,
						width: '100%',
						height: '100%',
						filter: 'brightness(0.3) blur(2px)',
						opacity: focusOp,
					}}
				/>
				{/* T5 (3): copia nítida recortada al párrafo →
				cláusula, por encima de la atenuada. */}
				<Img
					src={staticFile('img/docs/statedept-cuba-sanctions.png')}
					style={{
						position: 'absolute',
						inset: 0,
						width: '100%',
						height: '100%',
						clipPath: `inset(${clipT}px ${clipR}px ${clipB}px ${clipL}px)`,
						opacity: focusOp,
					}}
				/>
				<L4Highlights />
				<L4RedStrokes />
			</div>
			{/* Velo inferior para el karaoke: el documento puncheado
			es blanco y el karaoke (blanco/gris) se pierde sobre él.
			Entra con el punch (120–138) y se queda. La tarjeta
			(oscura) se dibuja encima y no le afecta. */}
			<div
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					top: 1050,
					height: 250,
					background:
						'linear-gradient(180deg, rgba(5,5,7,0) 0%, rgba(5,5,7,0.7) 100%)',
					opacity: clamp01(f, 120, 138),
				}}
			/>
			<div
				style={{
					position: 'absolute',
					top: 930,
					left: 0,
					right: 0,
					textAlign: 'center',
					opacity: chipIn * captionOut,
				}}
			>
				<span
					style={{
						fontFamily: MONO,
						fontSize: 24,
						fontWeight: 700,
						letterSpacing: 3,
						color: 'rgba(255,255,255,0.75)',
						background: 'rgba(6,12,20,0.62)',
						border: '1px solid rgba(255,255,255,0.22)',
						borderRadius: 6,
						padding: '10px 18px',
					}}
				>
					LA PÁGINA OFICIAL · DEPARTAMENTO DE ESTADO
				</span>
			</div>
			{/* T3 — overlay en español en 3 tiempos (traducción fiel
			entrecomillada: conserva «embargo» porque es la cita
			textual; en rojo va «sigue vigente hoy», nunca
			«embargo»). Tarjeta oscura sólida y compacta: el
			QuoteCard compartido es cristal claro con texto blanco
			y sobre el documento blanco sería ilegible. La tarjeta
			aparece CON el tiempo (a) en local 171, no vacía en 159. */}
			{f >= 171 && (
				<div
					style={{
						position: 'absolute',
						top: 930,
						left: 40,
						right: 40,
						background: 'rgba(6,12,20,0.94)',
						border: '1px solid rgba(255,255,255,0.22)',
						borderRadius: 20,
						padding: '24px 24px 20px',
						boxShadow: '0 18px 50px rgba(0,0,0,0.55)',
						opacity: beatA,
					}}
				>
					<div
						style={{
							fontFamily: SERIF,
							fontStyle: 'italic',
							fontWeight: 700,
							fontSize: 42,
							lineHeight: 1.35,
							color: '#FFFFFF',
						}}
					>
						<div>
							«un embargo económico integral
							{f >= 218 && (
								<span style={{opacity: beatB}}> contra Cuba,</span>
							)}
						</div>
						{f >= 247 && (
							<div style={{opacity: beatC, color: MEMORIAL_RED}}>
								que sigue vigente hoy»
							</div>
						)}
					</div>
					<div
						style={{
							fontFamily: MONO,
							fontSize: 22,
							fontWeight: 700,
							letterSpacing: 2,
							color: 'rgba(255,255,255,0.6)',
							marginTop: 18,
						}}
					>
						STATE.GOV · CUBA SANCTIONS — TRADUCCIÓN
					</div>
				</div>
			)}
		</AbsoluteFill>
	);
};
// ================================================================
// S7 — L5, 5-NOV (1200–1515 f · 40–50,5 s, local 0–315)
// Comunicado del 5-nov + contador 1→10 ESCALONADO (un paso por
// clic, en la rejilla nominal del compás: local f120/136/152/168/
// 184/200/216/232/248/264 — 43,99–48,81 s, anclados al tick 1 en
// «10»@44,04 s, 1–2 f antes) + 10 nodos numerados en 2 filas +
// 3 etiquetas de categoría SIN cifras por grupo (C12: el dossier
// no da el desglose; las etiquetas son leyenda, no partición de
// los 10) + chip «5 BUQUES BLOQUEADOS» al final (local 285 =
// 49,5 s). Las líneas conectoras se ELIMINARON (auditoría 18: se
// enredaban); la conexión es por proximidad + alineación. Los
// 10 slots aparecen escalonados con pop (local 6–60) antes de
// iluminarse por tick, y el «0» respira mientras espera
// (auditoría 17: el conteo NO se adelanta, está anclado a la VO).
// El «10» final escala con anillo de pulso (local 264–285).
// Layout recompuesto DENTRO de la zona segura (y 269–1248):
// chip 272, banda 332–512, contador 528–748, nodos 804–950,
// categorías 962–1101, karaoke 1160. Deriva lenta de la escena
// (T7): 1,0→1,03 sobre local 0–315 (el karaoke no se escala).
//
// CountUp NO sirve aquí: cuenta con ease continuo y aterriza al
// final del intervalo; el contador debe CAMBIAR exactamente en
// cada clic de la mezcla. Contador escalonado propio.
// ================================================================
const L5_CLICKS = [120, 136, 152, 168, 184, 200, 216, 232, 248, 264];
const L5_CATEGORIES = [
	{label: 'RED DE PETRÓLEO', at: 167, y: 990},
	{label: 'ENTIDADES ESTATALES', at: 203, y: 1040},
	{label: 'PROVEEDORES CHINOS', at: 244, y: 1090},
];
const DocL5Scene: React.FC = () => {
	const f = useCurrentFrame();
	// Chip + banda SIN fundido de entrada: con el fundido
	// (6–14 f) los primeros 7 f solo tenían el «0» gris y la
	// puerta QA los marcaba como negro (98,6% de píxeles
	// oscuros a 540p). El corte desde S6 ya es duro: todo
	// aparece a la vez en el fotograma 0.
	const chipIn = 1;
	// Contador escalonado: valor = clics ya pasados.
	const value = L5_CLICKS.filter((c) => f >= c).length;
	const lastClick = [...L5_CLICKS].reverse().find((c) => f >= c) ?? -1;
	// El «0» respira sutilmente mientras espera (auditoría 17).
	const numScale =
		value > 0 ? popIn(f, lastClick, 8) : 1 + 0.02 * Math.sin((f / 30) * Math.PI * 2);
	// Anillo de pulso del «10» (local 264–285, antes del chip).
	const ringP = interpolate(f, [264, 285], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	// Deriva lenta de la escena (T7).
	const drift = interpolate(f, [0, 315], [1, 1.03], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	return (
		<AbsoluteFill style={{background: NAVY}}>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					transform: `scale(${drift})`,
					transformOrigin: '540px 758px',
				}}
			>
				<div style={{opacity: chipIn}}>
					<DataChip top={272} left={90}>
						STATE.GOV · 5 NOV 2026
					</DataChip>
				</div>
				{/* Banda del encabezado del comunicado (título + fecha). */}
				<div
					style={{
						position: 'absolute',
						left: 90,
						top: 332,
						width: 900,
						height: 180,
						overflow: 'hidden',
						borderRadius: 12,
						border: '1px solid rgba(255,255,255,0.25)',
						boxShadow: '0 14px 40px rgba(0,0,0,0.5)',
						opacity: chipIn,
					}}
				>
					<Img
						src={staticFile('img/docs/statedept-5nov-2026.png')}
						style={{width: 900}}
					/>
				</div>
				{/* Contador escalonado. */}
				<div
					style={{
						position: 'absolute',
						top: 528,
						left: 0,
						right: 0,
						textAlign: 'center',
						transform: `scale(${numScale})`,
					}}
				>
					<div
						style={{
							fontFamily: ARCHIVO,
							fontSize: 220,
							lineHeight: 1,
							color:
								value === 10
									? MEMORIAL_RED
									: value === 0
										? 'rgba(255,255,255,0.45)'
										: '#FFFFFF',
							textShadow: '0 6px 30px rgba(0,0,0,0.55)',
						}}
					>
						{value}
					</div>
					<div
						style={{
							fontFamily: COND,
							fontWeight: 600,
							fontSize: 40,
							letterSpacing: 6,
							marginTop: 8,
							color: 'rgba(255,255,255,0.85)',
						}}
					>
						SANCIONES NUEVAS
					</div>
				</div>
				{/* Anillo de pulso del «10». */}
				{f >= 264 && f <= 285 && (
					<div
						style={{
							position: 'absolute',
							left: 400,
							top: 498,
							width: 280,
							height: 280,
							borderRadius: '50%',
							border: `3px solid ${MEMORIAL_RED}`,
							opacity: interpolate(ringP, [0, 1], [0.8, 0]),
							transform: `scale(${interpolate(ringP, [0, 1], [0.8, 1.4])})`,
						}}
					/>
				)}
				{/* 10 nodos numerados (2 filas de 5): el slot aparece
				escalonado con pop (local 6+i×6) y se ilumina en su clic. */}
				{L5_CLICKS.map((at, i) => {
					const lit = f >= at;
					const row = Math.floor(i / 5);
					const col = i % 5;
					const scale = lit ? popIn(f, at, 8) : 1;
					const slotOp = clamp01(f, 6 + i * 6, 12 + i * 6);
					return (
						<div
							key={i}
							style={{
								position: 'absolute',
								left: 180 + col * 180 - 32,
								top: 804 + row * 82,
								width: 64,
								height: 64,
								borderRadius: '50%',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								background: lit ? MEMORIAL_RED : 'rgba(255,255,255,0.06)',
								border: lit
									? `2px solid ${MEMORIAL_RED}`
									: '2px solid rgba(255,255,255,0.35)',
								boxShadow: lit
									? '0 0 18px rgba(237,28,36,0.7)'
									: 'none',
								opacity: slotOp,
								transform: `scale(${scale})`,
								fontFamily: MONO,
								fontSize: 26,
								fontWeight: 700,
								color: lit ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
							}}
						>
							{i + 1}
						</div>
					);
				})}
				{/* Etiquetas de categoría (leyenda, sin cifras por grupo).
				Sin líneas conectoras (auditoría 18). */}
				{L5_CATEGORIES.map((cat) => {
					if (f < cat.at) return null;
					return (
						<div
							key={cat.label}
							style={{
								position: 'absolute',
								left: 90,
								top: cat.y - 28,
								display: 'flex',
								alignItems: 'center',
								gap: 16,
								opacity: clamp01(f, cat.at, cat.at + 6),
								transform: `scale(${popIn(f, cat.at, 8)})`,
								transformOrigin: 'left center',
							}}
						>
							<div
								style={{
									width: 14,
									height: 14,
									borderRadius: '50%',
									background: MEMORIAL_RED,
									flexShrink: 0,
								}}
							/>
							<div
								style={{
									fontFamily: COND,
									fontWeight: 600,
									fontSize: 34,
									letterSpacing: 1,
									color: '#FFFFFF',
									textShadow: '0 2px 8px rgba(0,0,0,0.7)',
								}}
							>
								{cat.label}
							</div>
						</div>
					);
				})}
				{/* Chip de buques (local 285 = 49,5 s). */}
				{f >= 285 && (
					<div
						style={{
							position: 'absolute',
							top: 1150,
							left: 0,
							right: 0,
							display: 'flex',
							justifyContent: 'center',
							opacity: clamp01(f, 285, 291),
							transform: `scale(${popIn(f, 285, 10)})`,
						}}
					>
						<div
							style={{
								fontFamily: ARCHIVO,
								fontSize: 40,
								letterSpacing: 2,
								color: '#FFFFFF',
								background: 'rgba(6,12,20,0.8)',
								border: `3px solid ${MEMORIAL_RED}`,
								borderRadius: 12,
								padding: '18px 36px',
								boxShadow: '0 0 26px rgba(237,28,36,0.4)',
							}}
						>
							5 BUQUES BLOQUEADOS
						</div>
					</div>
				)}
			</div>
		</AbsoluteFill>
	);
};
// ================================================================
// S8 — L6, EAR (1515–1830 f · 50,5–61 s, local 0–315)
// 4 tiempos (C6): (1) Waltz MUDO (soundbite 19,3–25,2 s, volume 0)
// + ODÓMETRO «$876 M» (T5: cuenta desde $0 con ease-out en local
// 36–66 = 52,2–53,2 s, mientras Adriana dice «876 millones»;
// cifras tabulares en 3 slots de ancho fijo, sin baile) + chip
// y «incluye $231,7 M en combustible» DESPUÉS de que el número
// se asiente (local 70–78); (2) sello «PERMISO REQUERIDO — EAR»
// sobre el número (local 145 = 55,34 s); (3) «COMERCIO LIBRE»
// tachado en rojo (local 228 = 58,11 s); (4) «CONTROL» en rojo
// + imagen NOAA de Cuba a oscuras (local 274 = 59,64 s). El
// video se retira con fundido en local 165–183 (su ventana
// termina en 177) y lleva push lento 1,0→1,04 (T7).
//
// REGLA DE LA CARA: número (top 900, 180 px), subtítulo (1088),
// chip (1128) y sello (960) van al PECHO/TERCIO INFERIOR — la
// cara de Waltz (y ~120–800) queda libre en todo momento. El
// bloque se retira en local 228–234 (antes del tachado, que
// ocupa su sitio: texto 990, línea 1045). CONTROL en el tercio
// superior (top 320) y NOAA debajo (500–1108, etiqueta 520):
// tarjeta equilibrada verticalmente (auditoría 8).
// ================================================================
const EarL6Scene: React.FC = () => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	const videoOp = 1 - clamp01(f, 165, 183);
	// Push lento sobre Waltz mudo (T7).
	const videoPush = interpolate(f, [0, 165], [1, 1.04], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	// Odómetro: $0 → $876 en local 36–66 (ease-out cúbico).
	const odom = Math.round(
		interpolate(f, [36, 66], [0, 876], {
			easing: Easing.out(Easing.cubic),
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
		}),
	);
	const digits = String(odom).padStart(3, ' ').split('');
	// Entradas: número 33–36; chip + subtítulo 70–78 (después de
	// que el número se asiente). Todo el bloque se retira en
	// local 228–234 (antes del tachado).
	const numOp = clamp01(f, 33, 36);
	const subOp = clamp01(f, 70, 78);
	const blockOut = 1 - clamp01(f, 228, 234);
	// «COMERCIO LIBRE» + tachado (local 228), retirado en 274–280.
	const strikeOp =
		clamp01(f, 228, 234) * (1 - clamp01(f, 274, 280));
	const strikeW = interpolate(f, [228, 242], [0, 880], {
		easing: Easing.out(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	// CONTROL + NOAA (local 274).
	const controlP =
		f >= 274
			? spring({
					frame: f - 274,
					fps,
					config: {damping: 11, stiffness: 260, mass: 0.8},
				})
			: 0;
	const controlScale = interpolate(controlP, [0, 1], [1.8, 1]);
	const noaaOp = clamp01(f, 280, 296);
	return (
		<AbsoluteFill style={{background: INK}}>
			<div style={{position: 'absolute', inset: 0, opacity: videoOp}}>
				<div
					style={{
						position: 'absolute',
						inset: 0,
						transform: `scale(${videoPush})`,
						transformOrigin: '48% 28%',
					}}
				>
					<OffthreadVideo
						src={staticFile(
							'video/waltz-27oct-no-blockade-soundbite33.mp4',
						)}
						startFrom={579}
						endAt={756}
						volume={0}
						style={{width: '100%', height: '100%', objectFit: 'cover'}}
					/>
				</div>
			</div>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					background:
						'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 30%, rgba(0,0,0,0.35) 70%, rgba(0,0,0,0.7) 100%)',
				}}
			/>
			{/* (1) Odómetro $876 M sobre el traje (top 900): la cara
			(y ~120–800) queda libre. Cifras tabulares: 3 slots de
			ancho fijo, blancos a la izquierda (nunca ceros). */}
			<div
				style={{
					position: 'absolute',
					top: 900,
					left: 0,
					right: 0,
					textAlign: 'center',
					opacity: numOp * blockOut,
					fontFamily: ARCHIVO,
					fontSize: 180,
					lineHeight: 1,
					color: '#FFFFFF',
					textShadow: '0 8px 40px rgba(0,0,0,0.7)',
				}}
			>
				<span>$</span>
				{digits.map((d, i) => (
					<span
						key={i}
						style={{
							display: 'inline-block',
							width: '0.62em',
							textAlign: 'center',
						}}
					>
						{d === ' ' ? ' ' : d}
					</span>
				))}
				<span> M</span>
			</div>
			<div
				style={{
					position: 'absolute',
					top: 1088,
					left: 0,
					right: 0,
					textAlign: 'center',
					opacity: subOp * blockOut,
					fontFamily: COND,
					fontWeight: 600,
					fontSize: 32,
					color: '#E5E7EB',
					textShadow: '0 2px 8px rgba(0,0,0,0.8)',
				}}
			>
				incluye $231,7 M en combustible
			</div>
			<div
				style={{
					position: 'absolute',
					top: 1128,
					left: 0,
					right: 0,
					textAlign: 'center',
					opacity: subOp * blockOut,
				}}
			>
				<span
					style={{
						fontFamily: MONO,
						fontSize: 22,
						fontWeight: 700,
						letterSpacing: 3,
						color: '#FFFFFF',
						background: 'rgba(6,12,20,0.62)',
						border: '1px solid rgba(255,255,255,0.28)',
						borderRadius: 6,
						padding: '10px 18px',
					}}
				>
					WALTZ · ONU 27-OCT
				</span>
			</div>
			{/* (2) Sello sobre el número (top 960: cruza el centro
			del número, nunca la cara). */}
			<div style={{opacity: blockOut}}>
				<StampSeal
					at={145}
					top={960}
					rotate={-8}
					size={44}
					lines={['PERMISO REQUERIDO — EAR']}
				/>
			</div>
			{/* (3) «COMERCIO LIBRE» tachado (ocupa el sitio del
			bloque retirado: texto 990, línea 1045). */}
			<div style={{opacity: strikeOp}}>
				<div
					style={{
						position: 'absolute',
						top: 990,
						left: 0,
						right: 0,
						textAlign: 'center',
						fontFamily: ARCHIVO,
						fontSize: 88,
						color: '#FFFFFF',
						textShadow: textOutline(3),
					}}
				>
					COMERCIO LIBRE
				</div>
				<div
					style={{
						position: 'absolute',
						left: 100,
						top: 1045,
						width: strikeW,
						height: 10,
						background: MEMORIAL_RED,
						borderRadius: 5,
						transform: 'rotate(-2deg)',
						boxShadow: '0 0 16px rgba(237,28,36,0.8)',
					}}
				/>
			</div>
			{/* (4) CONTROL + Cuba a oscuras (NOAA/CIRA). CONTROL en
			el tercio superior (top 320), NOAA debajo (500–1108):
			tarjeta equilibrada, sin tercio superior vacío. */}
			{f >= 274 && (
				<div
					style={{
						position: 'absolute',
						top: 320,
						left: 0,
						right: 0,
						textAlign: 'center',
						opacity: controlP,
						transform: `scale(${controlScale})`,
						fontFamily: ARCHIVO,
						fontSize: 170,
						lineHeight: 1,
						color: MEMORIAL_RED,
						textShadow: '0 0 40px rgba(237,28,36,0.6)',
					}}
				>
					CONTROL
				</div>
			)}
			<div style={{position: 'absolute', inset: 0, opacity: noaaOp}}>
				<Img
					src={staticFile('img/Cuba_blackout_NOAA_CIRA_2026.png')}
					style={{
						position: 'absolute',
						top: 500,
						left: 0,
						width: 1080,
						height: 608,
						objectFit: 'contain',
						borderTop: '1px solid rgba(255,255,255,0.2)',
						borderBottom: '1px solid rgba(255,255,255,0.2)',
					}}
				/>
				<div
					style={{
						position: 'absolute',
						top: 520,
						left: 40,
						background: 'rgba(6,12,20,0.72)',
						border: '1px solid rgba(255,255,255,0.28)',
						borderRadius: 6,
						padding: '10px 18px',
						fontFamily: MONO,
						fontSize: 22,
						fontWeight: 700,
						letterSpacing: 2,
						color: '#FFFFFF',
					}}
				>
					CUBA A OSCURAS · NOAA / CIRA
				</div>
			</div>
		</AbsoluteFill>
	);
};
// ================================================================
// S9 — CIERRE L7 (1830–2055 f · 61–68,5 s, local 0–225)
// Pantalla dividida (C7): negaciones a la izquierda (4
// mini-tarjetas CICLANDO cada 48 f = 3 compases de la rejilla
// nominal, con fundido cruzado de 4 f entre slots), documentos
// a la derecha. Eslogan en dos tiempos: «EL BLOQUEO NO ES UN
// RELATO.» (local 118 = 64,94 s) → el sello «ES UN DOCUMENTO
// OFICIAL» (local 166 = 66,52 s, con el slam). El karaoke solo
// cubre los 2 primeros chunks de L7; el eslogan y el sello
// hacen de texto para el resto. Eslogan y sello van al tercio
// inferior (top 900, dentro de la zona segura): las 3 caras de
// mini-tarjeta quedan libres en todo momento (regla de caras)
// y el eslogan llena el vacío que dejaba el punto 7 de la
// auditoría. Collage «tablón» (T6) en mini-tarjetas y
// documentos: borde blanco 10 px, sombra grande, rotación.
// Push lento (T7): 1,0→1,03 sobre local 0–225. La entrada es
// un wipe SOBRE el final de L6 (CloseL7Wipe, 1818–1830): por
// eso el layout inicial NO tiene fade — en local 0 todo está a
// opacidad 1 y el wipe enlaza sin parpadeo.
// ================================================================
const CLOSE_CARDS = [
	{file: 'img/rubio-20may-still.jpg', label: 'RUBIO · 20 MAY'},
	{file: 'img/real-un/waltz-7jul-podium.jpg', label: 'WALTZ · 7 JUL'},
	{file: 'img/real-un/waltz-27oct-podium.jpg', label: 'WALTZ · 27 OCT'},
	{file: 'img/waltz-foxnews-16nov.jpg', label: 'WALTZ · FOX 16 NOV'},
];
const CLOSE_ROT = [-3, 2, 3, -2];
// Layout estático de la pantalla dividida (cabeceras + divisor
// + mini-tarjeta + documentos), compartido por CloseL7Scene y
// por el wipe de entrada (CloseL7Wipe): el wipe muestra el
// mismo layout con la tarjeta 0, así que el corte en 1830 es
// continuo.
const CloseL7Layout: React.FC<{
	card: {file: string; label: string};
	cardOp: number;
	cardScale: number;
	cardRot: number;
}> = ({card, cardOp, cardScale, cardRot}) => (
	<AbsoluteFill style={{background: NAVY}}>
		{/* Textura de tablón sutil (T6). */}
		<div
			style={{
				position: 'absolute',
				inset: 0,
				background:
					'repeating-linear-gradient(0deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 6px), repeating-linear-gradient(90deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 6px)',
			}}
		/>
		<div
			style={{
				position: 'absolute',
				top: 290,
				left: 40,
				fontFamily: COND,
				fontWeight: 600,
				fontSize: 30,
				letterSpacing: 4,
				color: 'rgba(255,255,255,0.6)',
			}}
		>
			DICEN
		</div>
		<div
			style={{
				position: 'absolute',
				top: 290,
				left: 580,
				fontFamily: COND,
				fontWeight: 600,
				fontSize: 30,
				letterSpacing: 4,
				color: 'rgba(255,255,255,0.6)',
			}}
		>
			SUS DOCUMENTOS
		</div>
		<div
			style={{
				position: 'absolute',
				left: 540,
				top: 340,
				width: 2,
				height: 542,
				background: 'rgba(255,255,255,0.2)',
			}}
		/>
		{/* Mini-tarjeta activa (izquierda, ciclando). */}
		<div
			style={{
				position: 'absolute',
				left: 40,
				top: 340,
				width: 460,
				opacity: cardOp,
				transform: `rotate(${cardRot}deg) scale(${cardScale})`,
			}}
		>
			<div
				style={{
					width: 460,
					height: 480,
					boxSizing: 'border-box',
					borderRadius: 12,
					overflow: 'hidden',
					border: '10px solid #FFFFFF',
					boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
				}}
			>
				{/* Zoom 1,35× anclado arriba: la tarjeta de Rubio
				esconde sus subtítulos quemados (igual que en S5). */}
				<Img
					src={staticFile(card.file)}
					style={{
						width: '100%',
						height: '100%',
						objectFit: 'cover',
						objectPosition: '50% 28%',
						transform: 'scale(1.35)',
						transformOrigin: '50% 0%',
					}}
				/>
			</div>
			<div
				style={{
					marginTop: 12,
					textAlign: 'center',
					fontFamily: MONO,
					fontSize: 22,
					fontWeight: 700,
					letterSpacing: 2,
					color: 'rgba(255,255,255,0.85)',
				}}
			>
				{card.label}
			</div>
		</div>
		{/* Documentos (derecha, fijos). */}
		<div
			style={{
				position: 'absolute',
				left: 580,
				top: 340,
				width: 460,
				transform: 'rotate(-1.5deg)',
			}}
		>
			<Img
				src={staticFile('img/docs/statedept-cuba-sanctions.png')}
				style={{
					width: 460,
					height: 220,
					boxSizing: 'border-box',
					objectFit: 'cover',
					objectPosition: '50% 0%',
					borderRadius: 12,
					border: '10px solid #FFFFFF',
					boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
				}}
			/>
			<div
				style={{
					marginTop: 12,
					textAlign: 'center',
					fontFamily: MONO,
					fontSize: 20,
					fontWeight: 700,
					letterSpacing: 2,
					color: 'rgba(255,255,255,0.85)',
				}}
			>
				STATE.GOV · CUBA SANCTIONS
			</div>
		</div>
		<div
			style={{
				position: 'absolute',
				left: 580,
				top: 620,
				width: 460,
				transform: 'rotate(2deg)',
			}}
		>
			<Img
				src={staticFile('img/docs/statedept-5nov-2026.png')}
				style={{
					width: 460,
					height: 220,
					boxSizing: 'border-box',
					objectFit: 'cover',
					objectPosition: '50% 0%',
					borderRadius: 12,
					border: '10px solid #FFFFFF',
					boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
				}}
			/>
			<div
				style={{
					marginTop: 12,
					textAlign: 'center',
					fontFamily: MONO,
					fontSize: 20,
					fontWeight: 700,
					letterSpacing: 2,
					color: 'rgba(255,255,255,0.85)',
				}}
			>
				5 NOV 2026 · 10 SANCIONES
			</div>
		</div>
	</AbsoluteFill>
);

const CloseL7Scene: React.FC = () => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	// Ciclo de 48 f (3 compases). El slot 0 entra instantáneo
	// (el wipe ya lo mostró deslizándose); los siguientes
	// entran con fundido cruzado de 4 f (44–52) + escala
	// 1,1→1,0 con spring.
	const slot = Math.floor(f / 48);
	const slotStart = slot * 48;
	const slotEnd = slotStart + 48;
	const cardIdx = slot % 4;
	const card = CLOSE_CARDS[cardIdx];
	const cardOp =
		slot === 0
			? 1 - clamp01(f, 40, 48)
			: clamp01(f, slotStart - 4, slotStart + 4) *
				(1 - clamp01(f, slotEnd - 8, slotEnd));
	const p = spring({
		frame: f - (slotStart - 4),
		fps,
		config: {damping: 12, stiffness: 260, mass: 0.8},
	});
	const cardScale = slot === 0 ? 1 : interpolate(p, [0, 1], [1.1, 1]);
	const scrimOp = clamp01(f, 118, 130) * 0.65;
	const sloganOut = 1 - clamp01(f, 166, 174);
	// Push lento sobre la pantalla dividida (T7).
	const push = interpolate(f, [0, 225], [1, 1.03], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	return (
		<AbsoluteFill style={{background: NAVY}}>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					transform: `scale(${push})`,
					transformOrigin: '540px 758px',
				}}
			>
				<CloseL7Layout
					card={card}
					cardOp={cardOp}
					cardScale={cardScale}
					cardRot={CLOSE_ROT[cardIdx]}
				/>
				{/* Velo para el eslogan + sello. */}
				<div
					style={{
						position: 'absolute',
						inset: 0,
						background: 'rgba(5,5,7,1)',
						opacity: scrimOp,
					}}
				/>
				<div style={{opacity: sloganOut}}>
					<KineticHeadline
						lines={[
							[{t: 'EL'}, {t: 'BLOQUEO'}, {t: 'NO'}, {t: 'ES'}],
							[{t: 'UN'}, {t: 'RELATO.'}],
						]}
						top={900}
						size={84}
						delay={118}
						step={4}
						accentColor={MEMORIAL_RED}
						fontFamily={ARCHIVO}
					/>
				</div>
				<StampSeal
					at={166}
					top={900}
					rotate={-4}
					size={72}
					lines={['ES UN DOCUMENTO', 'OFICIAL.']}
				/>
			</div>
		</AbsoluteFill>
	);
};
// ================================================================
// S10 — PREGUNTA L8 (2055–2235 f · 68,5–74,5 s, local 0–180)
// J-cut: la VO de L8 empieza en 68,5 s (la re-mezcla la mueve;
// los chunks de karaoke van −0,5 s en captions.ts). Botones A/B
// (C8): aparecen en local 0/9 (68,5 / 68,8 s, no 69,0/69,3 s)
// y se ILUMINAN al nombrarse en la VO («no existe» local 70 =
// 70,82 s; «no les conviene» local 113 = 72,28 s) + línea
// «Comenta A o B». Todo dentro de la zona segura (botones 750 /
// 900, «Comenta» 1080). El sello «ES UN DOCUMENTO OFICIAL»
// queda visible ATENUADO (~30%) detrás de los botones los
// primeros 0,5 s (StampSeal con at negativo = estático) para
// que ningún fotograma quede vacío (dip de 68,5 s). Push sutil
// (T7): 1,0→1,02 sobre local 0–180.
// ================================================================
const QuestionL8Scene: React.FC = () => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	const btn = (
		label: string,
		top: number,
		at: number,
		litAt: number,
	) => {
		const p = spring({
			frame: f - at,
			fps,
			config: {damping: 12, stiffness: 260, mass: 0.8},
		});
		const scale = interpolate(p, [0, 1], [0.6, 1]);
		const lit = f >= litAt;
		return (
			<div
				style={{
					position: 'absolute',
					top,
					left: 140,
					width: 800,
					textAlign: 'center',
					opacity: p,
					transform: `scale(${scale})`,
					fontFamily: ARCHIVO,
					fontSize: 50,
					letterSpacing: 1,
					color: '#FFFFFF',
					background: lit
						? 'rgba(237,28,36,0.16)'
						: 'rgba(255,255,255,0.06)',
					border: lit
						? `3px solid ${MEMORIAL_RED}`
						: '3px solid rgba(255,255,255,0.7)',
					borderRadius: 16,
					padding: '28px 20px',
					boxShadow: lit
						? '0 0 30px rgba(237,28,36,0.55)'
						: '0 10px 30px rgba(0,0,0,0.4)',
				}}
			>
				{label}
			</div>
		);
	};
	// Sello fantasma del cierre: 30% de opacidad, se desvanece
	// en local 0–15 (los primeros 0,5 s de L8).
	const ghostOp = 0.3 * (1 - clamp01(f, 0, 15));
	// Push sutil (T7).
	const push = interpolate(f, [0, 180], [1, 1.02], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	return (
		<AbsoluteFill style={{background: INK}}>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					transform: `scale(${push})`,
					transformOrigin: '50% 50%',
				}}
			>
				<div
					style={{
						position: 'absolute',
						inset: 0,
						background:
							'radial-gradient(ellipse 75% 45% at 50% 62%, rgba(237,28,36,0.12) 0%, rgba(237,28,36,0) 70%)',
					}}
				/>
				<div style={{opacity: ghostOp}}>
					<StampSeal
						at={-100}
						top={900}
						rotate={-4}
						size={72}
						lines={['ES UN DOCUMENTO', 'OFICIAL.']}
					/>
				</div>
				{btn('A · NO EXISTE', 750, 0, 70)}
				{btn('B · NO LES CONVIENE', 900, 9, 113)}
				<div
					style={{
						position: 'absolute',
						top: 1080,
						left: 0,
						right: 0,
						textAlign: 'center',
						opacity: clamp01(f, 40, 52),
						fontFamily: COND,
						fontWeight: 600,
						fontSize: 44,
						color: 'rgba(255,255,255,0.85)',
					}}
				>
					Comenta <span style={{color: MEMORIAL_RED}}>A</span> o{' '}
					<span style={{color: MEMORIAL_RED}}>B</span>
				</div>
			</div>
		</AbsoluteFill>
	);
};
// ================================================================
// S11 — LOGO (2235–2325 f · 74,5–77,5 s, local 0–90)
// Logo animado del Memorial (sting-black-2x, 720×1280, 3,04 s, SIN
// audio: el sting suena desde la mezcla). Escalar a cover (el
// aspecto 9:16 es exacto).
// ================================================================
const LogoScene: React.FC = () => {
	return (
		<AbsoluteFill style={{background: '#000000'}}>
			<OffthreadVideo
				src={staticFile('video/sting-black-2x.mp4')}
				style={{width: '100%', height: '100%', objectFit: 'cover'}}
			/>
		</AbsoluteFill>
	);
};

// ================================================================
// COMPOSICIÓN PRINCIPAL — MainReel (2325 f = 77,5 s)
// S0 gancho (0–171) · S1 T1 Rubio (171–297) · S2 T2 Waltz 7-jul
// (297–465) · S3 T3 Waltz 27-oct (465–585) · S4 T4 Fox (585–705) ·
// S5 giro (705–861) · S6 L4 state.gov (861–1200) · S7 L5 5-nov
// (1200–1515) · S8 L6 EAR (1515–1830) · S9 cierre L7 (1830–2055) ·
// S10 pregunta L8 (2055–2235) · S11 logo (2235–2325).
// CORTES DUROS en el fotograma exacto (sin solapes whip):
// duraciones nominales en todas las escenas. J-cuts: T2 video
// (285–465, audio desde 9,5 s), T3 audio (453–528, desde
// 15,1 s), VO L8 (la re-mezcla la mueve a 68,5 s). Pre-lap
// visual de L4 (828–861). Wipe de S9 sobre el final de L6
// (1818–1830). Deriva global lenta (T4): 1,0→1,015 sobre todo
// el reel; grano animado por encima; guía de zona segura solo
// en pre-vuelo (SHOW_SAFE_GUIDE, nunca en render).
// ================================================================
export const MainReel: React.FC = () => {
	const f = useCurrentFrame();
	const drift = interpolate(f, [0, 2325], [1, 1.015], {
		easing: Easing.inOut(Easing.sin),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	return (
		<AbsoluteFill style={{background: NAVY}}>
			<Audio src={staticFile('audio/mix.wav')} />
			<div
				style={{
					position: 'absolute',
					inset: 0,
					transform: `scale(${drift})`,
					transformOrigin: '50% 50%',
				}}
			>
				<Sequence from={0} durationInFrames={171} name="S0 gancho">
					<HookScene />
				</Sequence>
				<Sequence from={S1_START} durationInFrames={126} name="S1 panel T1 Rubio">
					<PanelT1Scene />
				</Sequence>
				<Sequence from={285} durationInFrames={180} name="T2 video (J-cut)">
					<T2Video />
				</Sequence>
				<Sequence from={S2_START} durationInFrames={168} name="S2 panel T2 Waltz 7-jul">
					<PanelT2Scene />
				</Sequence>
				<Sequence from={453} durationInFrames={75} name="T3 audio (J-cut)">
					<T3Audio />
				</Sequence>
				<Sequence from={S3_START} durationInFrames={120} name="S3 panel T3 Waltz 27-oct">
					<PanelT3Scene />
				</Sequence>
				<Sequence from={S4_START} durationInFrames={120} name="S4 panel T4 Fox">
					<PanelT4Scene />
				</Sequence>
				<Sequence from={S5_START} durationInFrames={156} name="S5 giro">
					<GiroScene />
				</Sequence>
				<Sequence from={828} durationInFrames={33} name="Pre-lap L4">
					<PreLapL4 />
				</Sequence>
				<Sequence from={S6_START} durationInFrames={339} name="S6 L4 state.gov">
					<DocL4Scene />
				</Sequence>
				<Sequence from={S7_START} durationInFrames={315} name="S7 L5 5-nov">
					<DocL5Scene />
				</Sequence>
				<Sequence from={S8_START} durationInFrames={315} name="S8 L6 EAR">
					<EarL6Scene />
				</Sequence>
				<Sequence from={1818} durationInFrames={12} name="Wipe S9">
					<CloseL7Wipe />
				</Sequence>
				<Sequence from={S9_START} durationInFrames={225} name="S9 cierre L7">
					<CloseL7Scene />
				</Sequence>
				<Sequence from={S10_START} durationInFrames={180} name="S10 pregunta L8">
					<QuestionL8Scene />
				</Sequence>
				<Sequence from={S11_START} durationInFrames={90} name="S11 logo">
					<LogoScene />
				</Sequence>
				{/* Karaoke (TopKaraoke, palabra clave en rojo #ED1C24,
				pop solo en kw, sin puntos en las esquinas). */}
				<Sequence from={0} durationInFrames={171} name="Karaoke L1">
					<TopKaraoke lines={LINES_L1} top={1160} size={74} keywordColor={MEMORIAL_RED} keywordPop keywordDots={false} />
				</Sequence>
				<Sequence from={S5_START} durationInFrames={156} name="Karaoke L3">
					<TopKaraoke lines={LINES_L3} top={930} size={100} keywordColor={MEMORIAL_RED} keywordPop keywordDots={false} />
				</Sequence>
				<Sequence from={S6_START} durationInFrames={339} name="Karaoke L4">
					<DimmedKaraokeL4 lines={LINES_L4} />
				</Sequence>
				<Sequence from={S7_START} durationInFrames={315} name="Karaoke L5">
					<TopKaraoke lines={LINES_L5} top={1160} size={68} keywordColor={MEMORIAL_RED} keywordPop keywordDots={false} />
				</Sequence>
				<Sequence from={S8_START} durationInFrames={274} name="Karaoke L6">
					<TopKaraoke lines={LINES_L6} top={1178} size={60} keywordColor={MEMORIAL_RED} keywordPop keywordDots={false} />
				</Sequence>
				<Sequence from={S9_START} durationInFrames={225} name="Karaoke L7">
					<TopKaraoke lines={LINES_L7} top={1140} size={44} keywordColor={MEMORIAL_RED} keywordPop keywordDots={false} hold={0.5} />
				</Sequence>
				<Sequence from={S10_START} durationInFrames={180} name="Karaoke L8">
					<TopKaraoke lines={LINES_L8} top={420} size={72} keywordColor={MEMORIAL_RED} keywordPop keywordDots={false} />
				</Sequence>
				<Sequence from={0} durationInFrames={S11_START} name="Vineta">
					<Vignette />
				</Sequence>
				<Sequence from={0} durationInFrames={S11_START} name="Logo">
					<LogoInner />
				</Sequence>
			</div>
			<GrainOverlay />
			<SafeGuide />
		</AbsoluteFill>
	);
};