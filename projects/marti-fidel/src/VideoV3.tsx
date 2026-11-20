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
import {CAPTIONS} from './captions-v3';
import {CARIBBEAN_TT, CARIBBEAN_BREAK} from './mapDots';

// ================================================================
// «Martí-Fidel: leer, pensar» — V3 (19-nov-2026, rama work/marti-fidel-v3)
// Reel vertical 1080×1920, 30 fps. 1255 fotogramas = 41,83 s.
// REENFOQUE POR FEEDBACK DE LA DIRECTORA (2ª ronda, 19-nov) +
// OBJECIÓN DE LA LOCUTORA ADRIANA (misma noche): la secuencia V2
// se podía malinterpretar («19 de 33 no es la mayoría») y el gancho
// NO puede ser la confesión de Browne (es evidencia, no la idea
// central). La V3 elimina el «19» por completo (voz, pantalla y
// mapa) y abre con la ruptura del Caribe, la expresión más nítida
// del retroceso, que SÍ es la idea central.
// Espina V3 (cualitativa, intwistable): ruptura del Caribe (gancho,
// mapa) → Martí 1891 → recuento → Browne como evidencia → árboles
// → Fidel 2005 → tesis → «Leer. Pensar.»
// Guion V3 revisado: 8 líneas (L2: «Martí lo vio venir en 1891.»),
// VO Kokoro ef_dora de previsualización (37,31 s); la VO real de
// Adriana se sincroniza al recibirla.
// Escenas nuevas: HookMapScene (mapa del Caribe + «33 AÑOS DE
// UNIDAD, ROTOS»), TreesScene (los árboles SE PONEN EN FILA, la
// metáfora animada) y el interrupt duro al entrar Fidel (flash +
// whip + corte duro, el cliff P3). La tarjeta V2.5 («Los que se
// separaron de la mayoría…») y el «19 GOBIERNOS» están ELIMINADOS.
// Se reutilizan de V2.5: motivo «el manuscrito» (PaperCard),
// retratos Martí/Fidel, GrainVignette, LogoInner, ThesisScene.
// Mezcla V3 (audio/v3/mix-v3.wav): cama calm-documentary-a de la
// biblioteca + 21 SFX re-temporizados. V2.5 intacta en
// src/VideoV25.tsx (composición MainReelV25).
// ================================================================

// ================================================================

const FPS = 30;
const ARCHIVO = "'Archivo Black', sans-serif";
const COND = "'Roboto Condensed', sans-serif";
const AMBER = '#F5B301';
const NAVY = '#0A1420';
const NAVY2 = '#0E1E33';
const SEPIA_BG = '#171208';
// V2.1 — motivo «el manuscrito»: tinta y folio sobre papel crema.
const INK = '#211A12';
const FOLIO = '#6E5320';

// ---------- V2.1: deriva cinematográfica (Ken Burns con translate) ----------
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

// ---------- V2.1: tarjeta de papel del manuscrito ----------
const PaperCard: React.FC<{
	top: number;
	folio: string;
	opacity: number;
	rise?: number;
	children: React.ReactNode;
}> = ({top, folio, opacity, rise = 0, children}) => (
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
			}}
		/>
		<div style={{position: 'relative', padding: '30px 44px 34px 58px'}}>
			<div
				style={{
					fontFamily: COND,
					fontSize: 26,
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

// ---------- V2.1: grano de película + viñeta globales (f0–1185) ----------
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

// ---------- karaoke (BottomKaraoke, patrón Pilar V30 / Marabana V1.3) ----------
// Solo las líneas HABLADAS llevan karaoke: L1 (seg 1, gancho), L2
// (seg 2) y L4 (seg 4, Browne — solo hasta que entra la tarjeta de
// la cita). Las citas (L3, L5, L6), la tesis (L7) y «Leer. Pensar.»
// (L8) van como texto estático, sin karaoke — mismo patrón V1/V2
// (las citas no se karaokean). `captions-v3.ts` contiene los 8
// segmentos completos (la auditoría exige guion↔karaoke 1:1); aquí
// se filtran los segmentos hablados para mostrar.
// Ventana A: segs 1–2 (0–8,01 s), Sequence desde f0 (tiempos
// absolutos).
// Ventana B: seg 4 (10,91–15,78 s), Sequence desde f327: los
// tiempos se desplazan −327/30 s (BottomKaraoke lee tiempos locales
// de su Sequence). Se truncan los chunks 3–4 («WASHINGTON LO LLAMÓ
// PARA» / «QUE CAMBIARA SU VOTO.», la tarjeta muestra la cita
// completa desde f77 local) y se inserta una línea VACÍA en 13,46 s
// (inicio de «WASHINGTON»): BottomKaraoke es «pegajoso» y sin la
// línea vacía el último chunk quedaría visible sobre la tarjeta.
const LINES_A: KaraokeLine[] = capSegmentsToLines(CAPTIONS.slice(0, 2));
const B_START = 327 / FPS;
const CAPTIONS_B = CAPTIONS.slice(3, 4).map((seg) => ({
	...seg,
	chunks: seg.chunks.slice(0, 2),
}));
const LINES_B: KaraokeLine[] = (() => {
	const lines = capSegmentsToLines(CAPTIONS_B).map((line) => ({
		words: line.words.map((w) => ({
			...w,
			s: w.s - B_START,
			e: w.e - B_START,
		})),
	}));
	// Línea vacía en 13,46 s (local 2,56 s): apaga el karaoke
	// mientras la tarjeta de Browne muestra la cita completa.
	const clear: KaraokeLine = {
		words: [{t: '', s: 13.46 - B_START, e: 15.78 - B_START}],
	};
	const out: KaraokeLine[] = [];
	for (const line of lines) {
		const s = line.words[0]?.s ?? 0;
		if (s >= clear.words[0].s && !out.includes(clear)) out.push(clear);
		out.push(line);
	}
	if (!out.includes(clear)) out.push(clear);
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

// ---------- marca de agua (logotipo COMPLETO, blanco/transparente) ----------
// Patrón Marabana V1.3 / marti-fidel V1: 115 px, arriba derecha,
// desde el fotograma 0, solo fade de salida antes del sting. Nunca
// solo la estrella.
// Scrim radial oscuro SUAVE detrás del logo solo en las escenas
// sepia claras (S2/S3, f139–327; S5 árboles, f494–706): el blanco
// se lava sobre el sepia claro. NO es una placa: degradado radial
// sin bordes, a transparente antes del centro del fotograma.
/** Ventana de opacidad 0→1→0 con fades de 8 f en los bordes. */
const winOp = (f: number, a: number, b: number) =>
	clamp01(f, a, a + 8) * (1 - clamp01(f, b - 8, b));
const LogoInner: React.FC = () => {
	const frame = useCurrentFrame();
	const fadeOut = interpolate(frame, [1154, 1164], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const scrimOp = Math.max(winOp(frame, 139, 327), winOp(frame, 494, 706));
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
// S1 — GANCHO, EL CARIBE ROTO (0–139 f · 0,00–4,63 s, local 0–139)
// V3: el gancho es la ruptura del Caribe (la idea central), no
// Browne. Mapa del Caribe dedicado (research/map-build-caribbean.py,
// Natural Earth 50m) + «33 AÑOS DE UNIDAD» desde el fotograma 0
// (P1: afirmación corta EN TEXTO) + sello «ROTOS» al decirse
// «dejó» (local f87) + Trinidad y Tobago en rojo desde el primer
// segundo + overlay de evidencia «PRIMER VOTO EN CONTRA DEL
// CARICOM». Sin contadores, sin el «19», sin desglose 6-7-6.
// Hallazgos redes V3 (research/social-trends-v3-2026-11-19.md):
// fecha «28 OCT 2026» en la apertura; T&T se vuelve rojo en el
// PRIMER SEGUNDO (el primer cuadro se lee como still en silencio);
// barrido de luz secuencial (las islas «se encienden» de las
// Antillas Mayores al arco, estilo @map_sody); zoom 0,92→1,12
// desde el Caribe general; sello de fecha y lugar + fuente al pie
// («ONU, NUEVA YORK / 28 OCT 2026 · ACTA A/81/PV.28»). Un anillo
// pulsante marca el Caribe al decirse «CARIBE» (f77).
// Investigación visual V3 #1 (19-nov-2026 noche): CASCADA — los
// otros 6 países que rompieron la unidad se vuelven rojos uno por
// uno, oeste -> este (Jamaica f36, Haití f54, Rep. Dominicana f72,
// Antigua f90, Dominica f108, Santa Lucía f126), TODOS en el mismo
// rojo, sin distinguir en contra / abstención / ausencia.
// ================================================================
const MAP_LEFT = 60;
const MAP_TOP = 200;
const MAP_SIZE = 960;
// Trinidad y Tobago en pantalla (canvas Caribe 1400 → mapa 960).
const TT_X = MAP_LEFT + (CARIBBEAN_TT.x / 1400) * MAP_SIZE;
const TT_Y = MAP_TOP + (CARIBBEAN_TT.y / 1400) * MAP_SIZE;
// Islas pequeñas de la cascada (puntos luminosos; las grandes se
// leen por el relleno). Conversión canvas → pantalla igual que TT.
const AG_X =
	MAP_LEFT + (CARIBBEAN_BREAK['Antigua and Barb.'].x / 1400) * MAP_SIZE;
const AG_Y =
	MAP_TOP + (CARIBBEAN_BREAK['Antigua and Barb.'].y / 1400) * MAP_SIZE;
const DM_X = MAP_LEFT + (CARIBBEAN_BREAK['Dominica'].x / 1400) * MAP_SIZE;
const DM_Y = MAP_TOP + (CARIBBEAN_BREAK['Dominica'].y / 1400) * MAP_SIZE;
const LC_X = MAP_LEFT + (CARIBBEAN_BREAK['Saint Lucia'].x / 1400) * MAP_SIZE;
const LC_Y = MAP_TOP + (CARIBBEAN_BREAK['Saint Lucia'].y / 1400) * MAP_SIZE;

/** Punto luminoso con anillo pulsante (ciclo determinista de 45 f). */
const MapDot: React.FC<{
	x: number;
	y: number;
	color: string;
	appearAt: number;
	frame: number;
}> = ({x, y, color, appearAt, frame}) => {
	if (frame < appearAt) return null;
	const age = frame - appearAt;
	const cycle = age % 45;
	const ringScale = interpolate(cycle, [0, 45], [1, 2.0]);
	const ringOp = interpolate(cycle, [0, 45], [0.9, 0]);
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
					transform: `scale(${ringScale})`,
					opacity: ringOp,
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
					boxShadow: '0 0 14px rgba(255,255,255,0.7)',
				}}
			/>
		</>
	);
};

const HookMapScene: React.FC = () => {
	const f = useCurrentFrame();
	const baseIn = clamp01(f, 0, 12);
	const titleIn = clamp01(f, 0, 8);
	const numScale = popIn(f, 0, 12);
	// T&T se vuelve rojo en el PRIMER SEGUNDO (0-1 s): el primer
	// cuadro se lee como still en silencio (hallazgo redes V3 #1).
	const ttIn = clamp01(f, 0, 30);
	// CASCADA (investigación visual #1): los otros 6 países que
	// rompieron la unidad se vuelven rojos uno por uno, oeste ->
	// este, en rampas de 18 f (~0,6 s). La cadencia literal de
	// 2–3 s por país no cabe en el gancho de 4,63 s (7 países
	// serían 14–21 s); la cascada rápida es la adaptación. Todos
	// en el MISMO rojo, sin distinguir en contra / abstención /
	// ausencia y sin contadores (prohibición del «19»).
	const jmIn = clamp01(f, 36, 54);
	const htIn = clamp01(f, 54, 72);
	const doIn = clamp01(f, 72, 90);
	const agIn = clamp01(f, 90, 108);
	const dmIn = clamp01(f, 108, 126);
	const lcIn = clamp01(f, 126, 139);
	// «ROTOS» + chip: al decirse «dejó» (local f87).
	const breakIn = clamp01(f, 87, 93);
	const breakScale = popIn(f, 87, 10);
	// Barrido de luz secuencial estilo @map_sody: el resplandor
	// viaja de las Antillas Mayores al arco (f0-77) y muere con
	// la ruptura (f60-87). Hallazgo redes V3 #2.
	const sweepX = interpolate(f, [0, 77], [500, 900], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const sweepY = interpolate(f, [0, 77], [450, 600], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const glowOp = 0.28 * clamp01(f, 0, 8) * (1 - clamp01(f, 60, 87));
	// Anillo pulsante sobre el arco al decirse «CARIBE» (f77).
	const ringScale = interpolate(f, [77, 107], [0.5, 2.2], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const ringOp = interpolate(f, [77, 107], [0.9, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	// Cámara viva: zoom 1→1,07 con centro en el arco caribeño.
	const mapScale = interpolate(f, [0, 139], [0.92, 1.12], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const mapDrift = drift(f, 139, -8, 5);
	return (
		<AbsoluteFill style={{background: NAVY}}>
			{/* Contenedor de cámara: todo lo geográfico se mueve junto */}
			<div
				style={{
					position: 'absolute',
					inset: 0,
					transform: `scale(${mapScale}) translate(${mapDrift.x}px, ${mapDrift.y}px)`,
					transformOrigin: '850px 560px',
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
						style={{
							position: 'absolute',
							inset: 0,
							width: '100%',
							height: '100%',
						}}
					/>
					<Img
						src={staticFile('img/map-caribbean-tt.png')}
						style={{
							position: 'absolute',
							inset: 0,
							width: '100%',
							height: '100%',
							opacity: ttIn,
						}}
					/>
					<Img
						src={staticFile('img/map-caribbean-jm.png')}
						style={{
							position: 'absolute',
							inset: 0,
							width: '100%',
							height: '100%',
							opacity: jmIn,
						}}
					/>
					<Img
						src={staticFile('img/map-caribbean-ht.png')}
						style={{
							position: 'absolute',
							inset: 0,
							width: '100%',
							height: '100%',
							opacity: htIn,
						}}
					/>
					<Img
						src={staticFile('img/map-caribbean-do.png')}
						style={{
							position: 'absolute',
							inset: 0,
							width: '100%',
							height: '100%',
							opacity: doIn,
						}}
					/>
					<Img
						src={staticFile('img/map-caribbean-ag.png')}
						style={{
							position: 'absolute',
							inset: 0,
							width: '100%',
							height: '100%',
							opacity: agIn,
						}}
					/>
					<Img
						src={staticFile('img/map-caribbean-dm.png')}
						style={{
							position: 'absolute',
							inset: 0,
							width: '100%',
							height: '100%',
							opacity: dmIn,
						}}
					/>
					<Img
						src={staticFile('img/map-caribbean-lc.png')}
						style={{
							position: 'absolute',
							inset: 0,
							width: '100%',
							height: '100%',
							opacity: lcIn,
						}}
					/>
				</div>
				{/* Barrido de luz: las islas «se encienden» en secuencia */}
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
				{/* Anillo pulsante sobre el arco («CARIBE», f77) */}
				{f >= 77 && (
					<div
						style={{
							position: 'absolute',
							left: 917 - 60,
							top: 577 - 60,
							width: 120,
							height: 120,
							borderRadius: '50%',
							border: `4px solid ${AMBER}`,
							transform: `scale(${ringScale})`,
							opacity: ringOp,
						}}
					/>
				)}
				{/* Punto luminoso en Trinidad y Tobago (f24, con el rojo) */}
				<MapDot
					x={TT_X}
					y={TT_Y}
					color={MEMORIAL_RED}
					appearAt={24}
					frame={f}
				/>
				{/* Puntos en las islas pequeñas de la cascada */}
				<MapDot
					x={AG_X}
					y={AG_Y}
					color={MEMORIAL_RED}
					appearAt={90}
					frame={f}
				/>
				<MapDot
					x={DM_X}
					y={DM_Y}
					color={MEMORIAL_RED}
					appearAt={108}
					frame={f}
				/>
				<MapDot
					x={LC_X}
					y={LC_Y}
					color={MEMORIAL_RED}
					appearAt={126}
					frame={f}
				/>
			</div>
			{/* Fecha en la apertura (13/75 ganadores la ponían) */}
			<div
				style={{
					position: 'absolute',
					top: 54,
					left: 40,
					background: 'rgba(6,12,20,0.6)',
					borderRadius: 6,
					padding: '10px 18px',
					fontFamily: COND,
					fontSize: 28,
					fontWeight: 700,
					letterSpacing: 3,
					color: '#FFFFFF',
					opacity: titleIn,
				}}
			>
				28 OCT 2026
			</div>
			{/* Título del gancho (fuera de la cámara, UI estática) */}
			<div
				style={{
					position: 'absolute',
					top: 45,
					left: 0,
					right: 0,
					textAlign: 'center',
					opacity: titleIn,
				}}
			>
				<div
					style={{
						fontFamily: ARCHIVO,
						fontSize: 110,
						lineHeight: 1,
						color: '#FFFFFF',
						textShadow: textOutline(4),
						transform: `scale(${numScale})`,
					}}
				>
					33 AÑOS
				</div>
				<div
					style={{
						fontFamily: ARCHIVO,
						fontSize: 50,
						letterSpacing: 8,
						color: '#FFFFFF',
						textShadow: textOutline(3),
						marginTop: 10,
					}}
				>
					DE UNIDAD
				</div>
			</div>
			{/* Sello ROTOS (f87, al decirse «dejó») */}
			<div
				style={{
					position: 'absolute',
					top: 255,
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
					}}
				>
					ROTOS
				</span>
			</div>
			{/* Sello de fecha y lugar + fuente (visual #3 + redes #5):
			una sola línea al pie del mapa; el chip superior mantiene
			«28 OCT 2026» como fecha del gancho. */}
			<div
				style={{
					position: 'absolute',
					top: 1360,
					left: 70,
					fontFamily: COND,
					fontSize: 24,
					letterSpacing: 2,
					color: '#FFFFFF',
					opacity: 0.75 * titleIn,
				}}
			>
				ONU, NUEVA YORK / 28 OCT 2026 · ACTA A/81/PV.28
			</div>
			{/* Overlay de evidencia: Trinidad y Tobago (f87) */}
			<div
				style={{
					position: 'absolute',
					top: 1230,
					left: 70,
					right: 70,
					textAlign: 'center',
					background: 'rgba(6,12,20,0.72)',
					borderRadius: 12,
					padding: '18px 20px',
					opacity: breakIn,
				}}
			>
				<div
					style={{
						fontFamily: ARCHIVO,
						fontSize: 36,
						letterSpacing: 2,
						color: MEMORIAL_RED,
					}}
				>
					TRINIDAD Y TOBAGO
				</div>
				<div
					style={{
						fontFamily: COND,
						fontSize: 30,
						fontWeight: 600,
						letterSpacing: 1,
						color: '#FFFFFF',
						marginTop: 6,
					}}
				>
					PRIMER VOTO EN CONTRA DEL CARICOM
				</div>
			</div>
		</AbsoluteFill>
	);
};

// ================================================================
// S2 — 1891 (139–236 f · 4,63–7,87 s, local 0–97)
// Retrato busto Martí (Jamaica 1892), sepia + «1891» gigante.
// Reutiliza HookScene de V2.5 (era la S1): el «1891» en dígitos
// no duplica al karaoke en palabras. El folio aparece al decirse
// «1891.» (local f40) como segundo cambio visual de la escena.
// ================================================================
const Year1891Scene: React.FC = () => {
	const f = useCurrentFrame();
	const dissolveIn = clamp01(f, 0, 12);
	const push = interpolate(f, [0, 97], [1, 1.08], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const d = drift(f, 97, -12, -8);
	const yearScale = popIn(f, 40, 12);
	const yearIn = clamp01(f, 40, 48);
	const folioIn = clamp01(f, 48, 56);
	return (
		<AbsoluteFill style={{background: SEPIA_BG, opacity: dissolveIn}}>
			<Img
				src={staticFile('img/marti-jamaica-1892.jpg')}
				style={{
					width: '100%',
					height: '100%',
					objectFit: 'cover',
					objectPosition: '50% 18%',
					transform: `scale(${push}) translate(${d.x}px, ${d.y}px)`,
				}}
			/>
			{/* Sello de fecha y lugar (visual #3, modelo @nmas): una
			línea, arriba izquierda (el logo va arriba derecha). */}
			<div
				style={{
					position: 'absolute',
					top: 54,
					left: 40,
					background: 'rgba(6,12,20,0.6)',
					borderRadius: 6,
					padding: '10px 18px',
					fontFamily: COND,
					fontSize: 24,
					fontWeight: 700,
					letterSpacing: 3,
					color: '#FFFFFF',
					opacity: dissolveIn,
				}}
			>
				LA HABANA / 1891
			</div>
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
					top: 1130,
					left: 0,
					right: 0,
					height: 330,
					overflow: 'hidden',
					boxShadow: '0 18px 50px rgba(0,0,0,0.55)',
					opacity: yearIn,
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
				<div
					style={{
						position: 'absolute',
						left: 0,
						top: 0,
						bottom: 0,
						width: 12,
						background: MEMORIAL_RED,
					}}
				/>
				<div
					style={{
						position: 'absolute',
						top: 18,
						left: 0,
						right: 0,
						textAlign: 'center',
						fontFamily: ARCHIVO,
						fontSize: 240,
						lineHeight: 1,
						color: INK,
						transform: `scale(${yearScale})`,
					}}
				>
					1891
				</div>
				<div
					style={{
						position: 'absolute',
						bottom: 26,
						left: 0,
						right: 0,
						textAlign: 'center',
						fontFamily: COND,
						fontSize: 26,
						fontWeight: 700,
						letterSpacing: 3,
						color: FOLIO,
						opacity: folioIn,
					}}
				>
					NUESTRA AMÉRICA · LA REVISTA ILUSTRADA · 1891
				</div>
			</div>
		</AbsoluteFill>
	);
};

// ================================================================
// S3 — CITA 1, EL RECUENTO (236–327 f · 7,87–10,90 s, local 0–91)
// Martí Temple Hall cuerpo entero + cita estática (sin karaoke).
// Reutiliza RecuentoScene de V2.5, re-temporizada: l2 al decirse
// «Y» (local f35). La portada de La Revista Ilustrada (ene-1891)
// como documento que asoma, arriba derecha.
// ================================================================
const RecuentoScene: React.FC = () => {
	const f = useCurrentFrame();
	const dissolveIn = clamp01(f, 0, 12);
	const push = interpolate(f, [0, 91], [1, 1.06], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const d = drift(f, 91, 10, -8);
	const photoIn = clamp01(f, 0, 10);
	const cardIn = clamp01(f, 0, 8);
	const cardRise = interpolate(f, [0, 12], [24, 0], {
		easing: Easing.out(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const l1 = clamp01(f, 0, 8);
	const l2 = clamp01(f, 35, 43);
	const insetIn = clamp01(f, 12, 22);
	return (
		<AbsoluteFill style={{background: SEPIA_BG, opacity: dissolveIn}}>
			<Img
				src={staticFile('img/marti-temple-hall-1892.jpg')}
				style={{
					width: '100%',
					height: '100%',
					objectFit: 'cover',
					transform: `scale(${push}) translate(${d.x}px, ${d.y}px)`,
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
			<div
				style={{
					position: 'absolute',
					top: 300,
					right: 90,
					width: 230,
					opacity: insetIn,
					transform: 'rotate(-3deg)',
					background: '#F5F0E6',
					padding: 10,
					boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
				}}
			>
				<Img
					src={staticFile('img/revista-ilustrada-1891.jpg')}
					style={{width: '100%', display: 'block'}}
				/>
			</div>
			<PaperCard
				top={1150}
				folio="NUESTRA AMÉRICA · 1891"
				opacity={cardIn}
				rise={cardRise}
			>
				<div
					style={{
						textAlign: 'center',
						fontFamily: ARCHIVO,
						fontSize: 56,
						lineHeight: 1.35,
						color: INK,
					}}
				>
					<div style={{opacity: l1}}>
						«ES LA HORA DEL <span style={{color: MEMORIAL_RED}}>RECUENTO,</span>
					</div>
					<div style={{opacity: l2}}>Y DE LA MARCHA UNIDA»
					</div>
				</div>
			</PaperCard>
		</AbsoluteFill>
	);
};

// ================================================================
// S4 — EVIDENCIA BROWNE (327–494 f · 10,90–16,47 s, local 0–167)
// V3: Browne vuelve a su papel de evidencia a mitad del reel.
// Fondo de micrófono de radio + onda sonora animada (la radio
// está «en el aire») + tarjeta con la cita COMPLETA al decirse
// «WASHINGTON» (local f77, 13,46 s), con atribución. El karaoke
// (ventana B) se apaga en ese momento con la línea vacía.
// ELIMINADO: el contador «19 GOBIERNOS» de V2 (la cifra está
// prohibida en V3) y la escena de datos de V2.5.
// ================================================================
const WAVE_BARS = 28;
const Soundwave: React.FC<{frame: number}> = ({frame}) => {
	const t = frame / FPS;
	// La radio «sube» al decirse «primer ministro» (local f15).
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
				top: 960,
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

const EvidenceScene: React.FC = () => {
	const f = useCurrentFrame();
	const dissolveIn = clamp01(f, 0, 12);
	const push = interpolate(f, [0, 167], [1, 1.06], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const d = drift(f, 167, -8, 10);
	const waveIn = clamp01(f, 0, 12);
	const cardIn = clamp01(f, 77, 85);
	const cardRise = interpolate(f, [77, 89], [24, 0], {
		easing: Easing.out(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	return (
		<AbsoluteFill style={{background: NAVY2, opacity: dissolveIn}}>
			<Img
				src={staticFile('img/bg-radio-mic.png')}
				style={{
					width: '100%',
					height: '100%',
					objectFit: 'cover',
					transform: `scale(${push}) translate(${d.x}px, ${d.y}px)`,
					opacity: 0.6,
				}}
			/>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					background:
						'linear-gradient(180deg, rgba(10,20,32,0.45) 0%, rgba(10,20,32,0.15) 45%, rgba(10,20,32,0.92) 85%, rgba(10,20,32,0.97) 100%)',
				}}
			/>
			{/* La radio está «en el aire»: onda sonora animada */}
			<div style={{opacity: waveIn}}>
				<Soundwave frame={f} />
			</div>
			{/* Tarjeta de evidencia (f77, «WASHINGTON») */}
			<PaperCard
				top={1240}
				folio="LO CONTÓ EN LA RADIO"
				opacity={cardIn}
				rise={cardRise}
			>
				<div
					style={{
						textAlign: 'center',
						fontFamily: ARCHIVO,
						fontSize: 50,
						lineHeight: 1.35,
						color: INK,
					}}
				>
					<div>
						«WASHINGTON LO LLAMÓ PARA QUE{' '}
						<span style={{color: MEMORIAL_RED}}>CAMBIARA</span> SU VOTO»
					</div>
				</div>
				<div
					style={{
						textAlign: 'center',
						fontFamily: COND,
						fontSize: 26,
						fontWeight: 700,
						letterSpacing: 1,
						color: FOLIO,
						marginTop: 16,
					}}
				>
					GASTON BROWNE · PRIMER MINISTRO DE ANTIGUA Y BARBUDA
				</div>
				<div
					style={{
						textAlign: 'center',
						fontFamily: COND,
						fontSize: 24,
						letterSpacing: 1,
						color: FOLIO,
						marginTop: 6,
					}}
				>
					RADIO · 9 NOV 2026 · CMC
				</div>
			</PaperCard>
		</AbsoluteFill>
	);
};

// ================================================================
// S5 — LOS ÁRBOLES SE PONEN EN FILA (494–706 f · 16,47–23,53 s,
// local 0–212). La metáfora de Martí ANIMADA: siete árboles
// dispersos se deslizan hasta formar una línea recta mientras la
// voz dice «se han de poner en fila» (local f53–93, «¡LOS» →
// «FILA,»), con un pulso de «encaje» al llegar «FILA,» y la línea
// de suelo que se traza bajo ellos. La cita va en tarjeta
// (sin karaoke). Reutiliza el retrato medio de Martí de V2.5.
// ================================================================
const TREE_COLORS = ['#2F4A2B', '#3A5A33', '#26401F'];
const TREE_DX = [-60, 45, -75, 30, 65, -40, 50];
const TREE_DY = [10, -8, 14, 0, -12, 8, -6];
const TREE_ROT = [-6, 4, -5, 3, 6, -4, 5];
const TREE_SCALE = [0.9, 1.06, 0.86, 1.12, 0.94, 1.03, 0.88];
const TREE_CX = [130, 265, 400, 535, 670, 805, 940];
const GROUND_Y = 1170;

const Tree: React.FC<{i: number; frame: number}> = ({i, frame}) => {
	// La fila se forma entre f53 («¡LOS») y f93 («FILA,»).
	const p = interpolate(frame, [53, 93], [0, 1], {
		easing: Easing.out(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const dx = interpolate(p, [0, 1], [TREE_DX[i], 0]);
	const dy = interpolate(p, [0, 1], [TREE_DY[i], 0]);
	const rot = interpolate(p, [0, 1], [TREE_ROT[i], 0]);
	const scale = interpolate(p, [0, 1], [TREE_SCALE[i], 1]);
	// Pulso de encaje al llegar «FILA,» (f93–105).
	const lock =
		frame >= 93
			? interpolate(frame, [93, 99, 105], [1, 1.07, 1], {
					extrapolateLeft: 'clamp',
					extrapolateRight: 'clamp',
			  })
			: 1;
	const color = TREE_COLORS[i % TREE_COLORS.length];
	return (
		<div
			style={{
				position: 'absolute',
				left: TREE_CX[i] - 116 + dx,
				top: GROUND_Y - 950 - 190 + dy,
				width: 120,
				height: 190,
				transform: `rotate(${rot}deg) scale(${scale * lock})`,
				transformOrigin: '50% 100%',
			}}
		>
			{/* Tronco */}
			<div
				style={{
					position: 'absolute',
					left: 54,
					bottom: 0,
					width: 13,
					height: 62,
					background: '#3A2E1F',
					borderRadius: 4,
				}}
			/>
			{/* Copa: tres círculos solapados */}
			<div
				style={{
					position: 'absolute',
					left: 10,
					top: 20,
					width: 60,
					height: 60,
					borderRadius: '50%',
					background: color,
				}}
			/>
			<div
				style={{
					position: 'absolute',
					left: 46,
					top: 6,
					width: 70,
					height: 70,
					borderRadius: '50%',
					background: color,
					filter: 'brightness(1.15)',
				}}
			/>
			<div
				style={{
					position: 'absolute',
					left: 26,
					top: 44,
					width: 66,
					height: 66,
					borderRadius: '50%',
					background: color,
					filter: 'brightness(0.85)',
				}}
			/>
		</div>
	);
};

const TreesScene: React.FC = () => {
	const f = useCurrentFrame();
	const dissolveIn = clamp01(f, 0, 12);
	const push = interpolate(f, [0, 212], [1, 1.08], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const d = drift(f, 212, -10, -8);
	const chipIn = clamp01(f, 8, 16);
	const treesIn = clamp01(f, 8, 20);
	const cardIn = clamp01(f, 48, 56);
	const cardRise = interpolate(f, [48, 60], [24, 0], {
		easing: Easing.out(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	// Cita: l1 «¡LOS» (f53), l2 «FILA,» (f93), l3+l4 «PASE» (f124:
	// la cita completa queda >=3 s en pantalla, hallazgo #3).
	const l1 = clamp01(f, 53, 61);
	const l2 = clamp01(f, 93, 101);
	const l3 = clamp01(f, 124, 132);
	const groundDraw = interpolate(f, [53, 93], [0, 1], {
		easing: Easing.out(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	return (
		<AbsoluteFill style={{background: SEPIA_BG, opacity: dissolveIn}}>
			<Img
				src={staticFile('img/marti-loc-half.jpg')}
				style={{
					width: '100%',
					height: '100%',
					objectFit: 'cover',
					objectPosition: '50% 25%',
					transform: `scale(${push}) translate(${d.x}px, ${d.y}px)`,
				}}
			/>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					background:
						'linear-gradient(180deg, rgba(23,18,8,0.10) 0%, rgba(23,18,8,0.10) 45%, rgba(23,18,8,0.92) 78%, rgba(23,18,8,0.97) 100%)',
				}}
			/>
			{/* Chip «MARTÍ YA LO HABÍA DICHO:» */}
			<div
				style={{
					position: 'absolute',
					top: 860,
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
					}}
				>
					MARTÍ YA LO HABÍA DICHO:
				</span>
			</div>
			{/* Banda de los árboles */}
			<div
				style={{
					position: 'absolute',
					top: 950,
					left: 56,
					right: 56,
					height: 240,
					background: 'rgba(10,8,4,0.45)',
					borderRadius: 12,
					opacity: treesIn,
				}}
			>
				{[0, 1, 2, 3, 4, 5, 6].map((i) => (
					<Tree key={i} i={i} frame={f} />
				))}
				{/* Línea de suelo que se traza mientras se forma la fila */}
				<div
					style={{
						position: 'absolute',
						top: GROUND_Y - 950,
						left: 44,
						width: 880,
						height: 4,
						background: '#5A4632',
						transform: `scaleX(${groundDraw})`,
						transformOrigin: '0 50%',
					}}
				/>
			</div>
			<PaperCard
				top={1240}
				folio="NUESTRA AMÉRICA · 1891"
				opacity={cardIn}
				rise={cardRise}
			>
				<div
					style={{
						textAlign: 'center',
						fontFamily: ARCHIVO,
						fontSize: 52,
						lineHeight: 1.35,
						color: INK,
					}}
				>
					<div style={{opacity: l1}}>«¡LOS ÁRBOLES SE HAN DE</div>
					<div style={{opacity: l2}}>
						PONER EN <span style={{color: MEMORIAL_RED}}>FILA,</span> PARA QUE
						NO
					</div>
					<div style={{opacity: l3}}>
						PASE EL <span style={{color: MEMORIAL_RED}}>GIGANTE</span>
					</div>
					<div style={{opacity: l3}}>DE LAS SIETE LEGUAS!»</div>
				</div>
			</PaperCard>
		</AbsoluteFill>
	);
};

// ================================================================
// S6 — FIDEL 2005 + INTERRUPT (706–930 f · 23,53–31,01 s, local
// 0–224). CORTE DURO desde los árboles (sin disolución) + flash
// blanco de 6 f + whip del retrato + slam del chip «2005»:
// el cliff P3 de la guía (el cambio de voz y de era). La cita va
// en tarjeta (sin karaoke). Foto: Fidel en la Asamblea General
// de la ONU, 1960 (dominio público, Library of Congress;
// investigación visual V3 #2) — la foto es de 1960, la cita de
// 2005 («CIEN HORAS CON FIDEL»). Sello de fecha y lugar
// «ONU, NUEVA YORK / 1960» (visual #3). Reutiliza
// FidelQuoteScene de V2.5, re-temporizada: chip slam f0,
// «FIDEL ADVIRTIÓ:» f43, tarjeta al decirse «NO» (f76).
// ================================================================
const FidelScene: React.FC = () => {
	const f = useCurrentFrame();
	// SIN disolución de entrada: el corte duro ES el interrupt.
	const push = interpolate(f, [0, 224], [1, 1.08], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const whip = interpolate(f, [0, 18], [0.14, 0], {
		easing: Easing.out(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const d = drift(f, 224, 12, -10);
	const flashOp = interpolate(f, [0, 6], [0.85, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const chipScale = popIn(f, 0, 10);
	const chipIn = clamp01(f, 0, 6);
	const advIn = clamp01(f, 43, 51);
	const cardIn = clamp01(f, 76, 84);
	const cardRise = interpolate(f, [76, 88], [24, 0], {
		easing: Easing.out(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const l1 = clamp01(f, 76, 84);
	const l2 = clamp01(f, 94, 102);
	const l3 = clamp01(f, 132, 140);
	const l4 = clamp01(f, 155, 163);
	// Sello de fecha y lugar (visual #3): entra tras el flash.
	const stampIn = clamp01(f, 6, 14);
	return (
		<AbsoluteFill style={{background: NAVY}}>
			<Img
				src={staticFile('img/fidel-onu-1960.jpg')}
				style={{
					width: '100%',
					height: '100%',
					objectFit: 'cover',
					objectPosition: '55% 50%',
					transform: `scale(${push + whip}) translate(${d.x}px, ${d.y}px)`,
				}}
			/>
			{/* Sello de fecha y lugar (visual #3): la foto ES la ONU
			1960 (dominio público, Library of Congress); el folio de
			la tarjeta («CIEN HORAS CON FIDEL · 2005») fecha la cita,
			no la foto. */}
			<div
				style={{
					position: 'absolute',
					top: 54,
					left: 40,
					background: 'rgba(6,12,20,0.6)',
					borderRadius: 6,
					padding: '10px 18px',
					fontFamily: COND,
					fontSize: 24,
					fontWeight: 700,
					letterSpacing: 3,
					color: '#FFFFFF',
					opacity: stampIn,
				}}
			>
				ONU, NUEVA YORK / 1960
			</div>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					background:
						'linear-gradient(180deg, rgba(10,20,32,0.10) 0%, rgba(10,20,32,0.15) 45%, rgba(10,20,32,0.92) 78%, rgba(10,20,32,0.97) 100%)',
				}}
			/>
			{/* Flash blanco del interrupt (6 f) */}
			<div
				style={{
					position: 'absolute',
					inset: 0,
					background: '#FFFFFF',
					opacity: flashOp,
				}}
			/>
			{/* Chip «2005» (slam en f0) + «FIDEL ADVIRTIÓ:» (f43) */}
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
					}}
				>
					FIDEL ADVIRTIÓ:
				</span>
			</div>
			<PaperCard
				top={1140}
				folio="CIEN HORAS CON FIDEL · 2005"
				opacity={cardIn}
				rise={cardRise}
			>
				<div
					style={{
						textAlign: 'center',
						fontFamily: ARCHIVO,
						fontSize: 52,
						lineHeight: 1.35,
						color: INK,
					}}
				>
					<div style={{opacity: l1}}>
						«NO ES LO <span style={{color: MEMORIAL_RED}}>MISMO</span> ESTAR
					</div>
					<div style={{opacity: l2}}>
						<span style={{color: MEMORIAL_RED}}>DESINFORMADO</span> QUE HABER
					</div>
					<div style={{opacity: l3}}>
						<span style={{color: MEMORIAL_RED}}>PERDIDO</span> LA CAPACIDAD
					</div>
					<div style={{opacity: l4}}>
						DE <span style={{color: MEMORIAL_RED}}>PENSAR.»</span>
					</div>
				</div>
			</PaperCard>
		</AbsoluteFill>
	);
};

// ================================================================
// S7 — TESIS (930–1164 f · 31,01–38,80 s, local 0–234)
// «Cuando un pueblo olvida su historia, está condenado a volverla
// a vivir» — la tesis del reel, SIN atribución a Martí (no es una
// cita martiana: la tesis la formula el reel; la S1 lo atribuyó a
// Martí por error y la V3 lo corrige por orden de la directora).
// Tampoco se firma «— Suleris» (vetado por ella). Reutiliza
// ThesisScene de V2.5, re-temporizada: l1 f4, l2 f19 («OLVIDA»),
// l3 f69 («CONDENADO»), l4 f107 («VIVIR.»), «LEER.» f164,
// «PENSAR.» f172, CTA f185.
// ================================================================
const ThesisScene: React.FC = () => {
	const f = useCurrentFrame();
	const dissolveIn = clamp01(f, 0, 12);
	const l1 = clamp01(f, 4, 12);
	const l2 = clamp01(f, 19, 27);
	const l3 = clamp01(f, 69, 77);
	const l4 = clamp01(f, 107, 115);
	const divider = clamp01(f, 135, 143);
	const titleIn = clamp01(f, 145, 153);
	const leerIn = clamp01(f, 164, 172);
	const pensarScale = popIn(f, 172, 10);
	const pensarIn = clamp01(f, 172, 180);
	const ctaIn = clamp01(f, 185, 193);
	const ctaScale = popIn(f, 185, 12);
	const paperPush = interpolate(f, [0, 234], [1, 1.04], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	return (
		<AbsoluteFill style={{background: '#06090F', opacity: dissolveIn}}>
			{/* V2.1: la tesis va sobre la misma textura de papel,
			    oscurecida — la página de cierre del ensayo. */}
			<Img
				src={staticFile('img/paper-manuscript-dark.png')}
				style={{
					position: 'absolute',
					inset: 0,
					width: '100%',
					height: '100%',
					objectFit: 'cover',
					transform: `scale(${paperPush})`,
					transformOrigin: '50% 35%',
				}}
			/>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					background:
						'radial-gradient(ellipse at 50% 35%, rgba(46,90,122,0.30) 0%, rgba(6,9,15,0) 70%)',
				}}
			/>
			<div
				style={{
					position: 'absolute',
					top: 480,
					left: 70,
					right: 70,
					textAlign: 'center',
					fontFamily: ARCHIVO,
					fontSize: 64,
					lineHeight: 1.28,
					color: '#FFFFFF',
					textShadow: textOutline(3),
				}}
			>
				<div style={{opacity: l1}}>CUANDO UN PUEBLO</div>
				<div style={{opacity: l2}}>
					<span style={{color: MEMORIAL_RED}}>OLVIDA</span> SU HISTORIA,
				</div>
				<div style={{opacity: l3}}>
					ESTÁ <span style={{color: MEMORIAL_RED}}>CONDENADO</span>
				</div>
				<div style={{opacity: l4}}>
					A VOLVERLA A <span style={{color: MEMORIAL_RED}}>VIVIR.</span>
				</div>
			</div>
			<div
				style={{
					position: 'absolute',
					top: 950,
					left: 390,
					width: 300,
					height: 6,
					background: MEMORIAL_RED,
					opacity: divider,
				}}
			/>
			<div
				style={{
					position: 'absolute',
					top: 1010,
					left: 0,
					right: 0,
					textAlign: 'center',
					fontFamily: ARCHIVO,
					fontSize: 56,
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
					top: 1100,
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
					top: 1400,
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
// S8 — STING (1164–1255 f · 38,80–41,83 s, local 0–91)
// Fondo negro + video del logo animado (sting-black-2x.mp4,
// mismo de V1.5/V2.5). El logo blanco (marca de agua) ya se
// apagó en 1154–1164: aquí solo queda el logo animado de cierre.
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
				style={{
					width: '100%',
					height: '100%',
					objectFit: 'contain',
				}}
			/>
		</AbsoluteFill>
	);
};

// ================================================================
// COMPOSICIÓN PRINCIPAL — MainReelV3 (1255 f = 41,83 s)
// Escenas: S1 gancho mapa (0–139) · S2 1891 (139–236) · S3
// recuento (236–327) · S4 evidencia Browne (327–494) · S5 árboles
// (494–706) · S6 Fidel + interrupt (706–930) · S7 tesis
// (930–1164) · S8 sting (1164–1255). Disoluciones de 12 f entre
// escenas EXCEPTO S5→S6 (corte duro del interrupt) y S7→S8
// (corte duro al sting).
// ================================================================
export const MainReelV3: React.FC = () => {
	return (
		<AbsoluteFill style={{background: NAVY}}>
			<Audio src={staticFile('audio/v3/mix-v3.wav')} />
			<Sequence from={0} durationInFrames={151} name="S1 gancho mapa">
				<HookMapScene />
			</Sequence>
			<Sequence from={139} durationInFrames={109} name="S2 1891">
				<Year1891Scene />
			</Sequence>
			<Sequence from={236} durationInFrames={103} name="S3 recuento">
				<RecuentoScene />
			</Sequence>
			<Sequence from={327} durationInFrames={179} name="S4 evidencia Browne">
				<EvidenceScene />
			</Sequence>
			<Sequence from={494} durationInFrames={212} name="S5 arboles en fila">
				<TreesScene />
			</Sequence>
			<Sequence from={706} durationInFrames={236} name="S6 Fidel 2005">
				<FidelScene />
			</Sequence>
			<Sequence from={930} durationInFrames={234} name="S7 tesis">
				<ThesisScene />
			</Sequence>
			<Sequence from={1164} durationInFrames={91} name="S8 sting">
				<StingScene />
			</Sequence>
			{/* Karaoke: ventanas A (L1–L2, 0–252) y B (L4, 343–510) */}
			<Sequence from={0} durationInFrames={236} name="Karaoke A (L1-L2)">
				<BottomKaraoke lines={LINES_A} />
			</Sequence>
			<Sequence from={327} durationInFrames={167} name="Karaoke B (L4)">
				<BottomKaraoke lines={LINES_B} />
			</Sequence>
			<Sequence from={0} durationInFrames={1164} name="Grano+vineta">
				<GrainVignette />
			</Sequence>
			<Sequence from={0} durationInFrames={1164} name="Logo">
				<LogoInner />
			</Sequence>
		</AbsoluteFill>
	);
};
