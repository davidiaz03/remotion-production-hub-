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
// «Martí-Fidel: leer, pensar» — V2 (18-nov-2026, rama work/marti-fidel-v2)
// Reel vertical 1080×1920, 30 fps. 1447 fotogramas = 48,23 s.
// Tiempos anclados a la VO Kokoro em_alex V2 (43,98 s):
// ver public/audio/v2/vo-lines.json y CREATIVE_BRIEF.md §V2.
//
// REENFOQUE por feedback de la directora Suleris Coss Díaz (18-nov):
// la espina ya NO es la votación ONU (las cifras se pueden manipular
// y virar el reel al revés) sino EL RETROCESO en Latinoamérica
// entrelazado con Martí, con la tesis «cuando un pueblo olvida su
// historia, está condenado a volverla a vivir» como cierre.
// PROHIBIDO en V2: abrir con la Asamblea de la ONU; contadores
// 130/17/25; barras de caída; callback al 130. El mapa se queda,
// reenmarcado como EL RETROCESO. La tesis es formulación de Suleris
// (idea de Santayana), NO cita de Martí: va SIN atribución.
// Estructura: Martí 1891 → retroceso (mapa + 33 años + Browne) →
// Martí + Fidel → tesis → título. La votación ONU es solo contexto.
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
// Solo las líneas HABLADAS llevan karaoke: L1 (seg 1) y L3–L5
// (segs 3–5). Las citas (L2, L6, L7), la tesis (L8) y «Leer. Pensar.»
// (L9) van como texto estático, sin karaoke — mismo patrón V1 (las
// citas no se karaokean). `captions.ts` contiene los 9 segmentos
// completos (la auditoría exige guion↔karaoke 1:1); aquí se filtran
// los segmentos hablados para mostrar.
// Ventana A: seg 1 (0–4,06 s), Sequence desde f0 (tiempos absolutos).
// Ventana B: segs 3–5 (7,74–23,36 s), Sequence desde f232: los
// tiempos se desplazan −232/30 s (BottomKaraoke lee tiempos locales
// de su Sequence, como LINES_B en V1).
// V1.2 (auditoría densa): BottomKaraoke es «pegajoso» — la última
// línea cuyo inicio pasó queda visible hasta que empieza la siguiente.
// Por eso, suprimir un chunk NO basta: hay que insertar una línea
// VACÍA (palabra '') en su lugar.
//   - Seg 5: se suprimen «WASHINGTON LO LLAMÓ PARA» y «QUE CAMBIARA SU
//     VOTO.» (la tarjeta de Browne muestra la cita completa desde
//     f77 local); línea vacía en 20,42 s (inicio de «WASHINGTON»).
const LINES_A: KaraokeLine[] = capSegmentsToLines(CAPTIONS.slice(0, 1));
const B_START = 232 / FPS;
const CAPTIONS_B = CAPTIONS.slice(2, 5).map((seg) => {
	if (seg.id === 5)
		return {...seg, chunks: seg.chunks.slice(0, 2)};
	return seg;
});
const LINES_B: KaraokeLine[] = (() => {
	const lines = capSegmentsToLines(CAPTIONS_B).map((line) => ({
		words: line.words.map((w) => ({
			...w,
			s: w.s - B_START,
			e: w.e - B_START,
		})),
	}));
	// Línea vacía en 20,42 s (local 12,687 s): apaga el karaoke
	// mientras la tarjeta de Browne muestra la cita completa.
	const clear: KaraokeLine = {
		words: [{t: '', s: 20.42 - B_START, e: 23.356 - B_START}],
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
// Patrón Marabana V1.3 / marti-fidel V1: 115 px, arriba derecha,
// desde el fotograma 0, solo fade de salida antes del sting. Nunca
// solo la estrella.
// Scrim radial oscuro SUAVE detrás del logo solo en las escenas
// sepia claras (S1/S2, f0–232; S6, f701–913): el blanco se lava sobre
// el sepia claro de Martí (auditoría V1). NO es una placa: degradado
// radial sin bordes, a transparente antes del centro del fotograma.
/** Ventana de opacidad 0→1→0 con fades de 8 f en los bordes. */
const winOp = (f: number, a: number, b: number) =>
	clamp01(f, a, a + 8) * (1 - clamp01(f, b - 8, b));
const LogoInner: React.FC = () => {
	const frame = useCurrentFrame();
	const fadeOut = interpolate(frame, [1346, 1356], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const scrimOp = Math.max(winOp(frame, 0, 232), winOp(frame, 701, 913));
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
// S1 — GANCHO MARTÍ (0–122 f · 0,00–4,06 s)
// Retrato busto Martí (Jamaica 1892), sepia + «1891» gigante.
// El gancho sale del ENSAYO / de Martí, NUNCA de la ONU (directora).
// Solo el «1891» como texto estático: el karaoke lleva las palabras
// («EN 1891, MARTÍ / ESCRIBIÓ UNA ADVERTENCIA.») y un subtítulo
// estático las duplicaría (lección V1: EXIGEN / LEER. PENSAR.).
// El «1891» en dígitos no duplica al karaoke en palabras (mismo
// criterio que las tarjetas numéricas de V1 S3).
// ================================================================
const HookScene: React.FC = () => {
	const f = useCurrentFrame();
	const push = interpolate(f, [0, 122], [1, 1.05], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const yearScale = popIn(f, 0, 12);
	const yearIn = clamp01(f, 0, 8);
	return (
		<AbsoluteFill style={{background: SEPIA_BG}}>
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
			{/* 1891 gigante en el tercio inferior (la cara queda libre
			    en los 2/3 superiores; el karaoke va debajo, a 1 línea). */}
			<div
				style={{
					position: 'absolute',
					top: 1150,
					left: 0,
					right: 0,
					textAlign: 'center',
					fontFamily: ARCHIVO,
					fontSize: 240,
					lineHeight: 1,
					color: '#FFFFFF',
					textShadow: textOutline(4),
					opacity: yearIn,
					transform: `scale(${yearScale})`,
				}}
			>
				1891
			</div>
		</AbsoluteFill>
	);
};

// ================================================================
// S2 — CITA 1, EL RECUENTO (122–232 f · 4,06–7,74 s, local 0–110)
// Martí Temple Hall cuerpo entero + cita estática (sin karaoke).
// «Es la hora del recuento, y de la marcha unida» — primera cláusula
// de la oración verificada de «Nuestra América» (ver CREATIVE_BRIEF).
// ================================================================
const RecuentoScene: React.FC = () => {
	const f = useCurrentFrame();
	const push = interpolate(f, [0, 110], [1, 1.05], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const photoIn = clamp01(f, 0, 10);
	const l1 = clamp01(f, 8, 16);
	const l2 = clamp01(f, 35, 43);
	const attr = clamp01(f, 55, 63);
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
				}}
			>
				<div style={{opacity: l1}}>
					«ES LA HORA DEL <span style={{color: MEMORIAL_RED}}>RECUENTO,</span>
				</div>
				<div style={{opacity: l2}}>Y DE LA MARCHA UNIDA»
				</div>
			</div>
			<div
				style={{
					position: 'absolute',
					top: 1420,
					left: 0,
					right: 0,
					textAlign: 'center',
					fontFamily: COND,
					fontSize: 30,
					fontWeight: 700,
					letterSpacing: 3,
					color: SEPIA_GOLD,
					opacity: attr,
				}}
			>
				— JOSÉ MARTÍ · NUESTRA AMÉRICA, 1891
			</div>
		</AbsoluteFill>
	);
};

// ================================================================
// S3 — MAPA, EL RETROCESO (232–401 f · 7,74–13,36 s, local 0–169)
// Mapa Natural Earth + overlays por grupo + puntos + lista + art. 19.
// Reutiliza MapScene de V1 con el REENMARQUE de la directora: el
// título es «EL RETROCESO», no «EL MAPA CAMBIÓ». La VO ya no enumera
// los grupos uno a uno, así que los overlays se iluminan escalonados
// durante la línea (rojo al decirse «diecinueve», local f63).
// ================================================================
const MAP_LEFT = 60;
const MAP_TOP = 200;
const MAP_SIZE = 960;
const MAP_GROUPS = [
	{
		key: 'red',
		title: 'EN CONTRA · 6',
		color: MEMORIAL_RED,
		at: 63,
		names: ['Argentina', 'Colombia', 'Costa Rica', 'Ecuador', 'Paraguay', 'Trinidad y Tobago'],
		dots: ['Trinidad and Tobago'],
	},
	{
		key: 'yellow',
		title: 'SE ABSTUVIERON · 7',
		color: AMBER,
		at: 95,
		names: ['Chile', 'Rep. Dominicana', 'Guyana', 'Haití', 'Honduras', 'Jamaica', 'Perú'],
		dots: ['Jamaica', 'Haiti', 'Dominican Rep.'],
	},
	{
		key: 'gray',
		title: 'AUSENTES · 6',
		color: GRAY,
		at: 125,
		names: ['Antigua y Barbuda', 'Bolivia', 'Dominica', 'El Salvador', 'Guatemala', 'Santa Lucía'],
		dots: ['Antigua and Barb.', 'Dominica', 'Saint Lucia'],
	},
] as const;

/** Punto luminoso con anillo pulsante (ciclo determinista de 45 f).
    V1.2: si el punto lleva desplazamiento (dx, dy), se dibuja en la
    posición desplazada con una línea guía fina hasta su centroide real
    y un ancla pequeña en el centroide. */
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
	const subTitleIn = clamp01(f, 40, 48);
	const venIn = clamp01(f, 145, 155);
	const footIn = clamp01(f, 145, 155);
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
					EL RETROCESO
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
			{f >= 145 && (
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
			    hasta el anillo. */}
			{f >= 145 && (
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
// S4 — «33 AÑOS» (401–536 f · 13,36–17,86 s, local 0–135)
// Tarjeta gráfica: «33» gigante + «AÑOS DE UNANIMIDAD CARIBEÑA» +
// sello rojo «ROTA» al decirse «dejó» (local f87). El dato verificado
// (§7.1): Trinidad y Tobago, primer país del CARICOM en contra; fin
// de 33 años de unanimidad caribeña. Es la prueba más fuerte del
// retroceso — por eso tiene escena propia, no un rincón del mapa.
// ================================================================
const ThirtyThreeScene: React.FC = () => {
	const f = useCurrentFrame();
	const numScale = popIn(f, 28, 12);
	const numIn = clamp01(f, 28, 36);
	const subIn = clamp01(f, 40, 48);
	const stampScale = popIn(f, 87, 10);
	const stampIn = clamp01(f, 87, 93);
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
			{/* 33 gigante (entra al decirse «treinta», local f28) */}
			<div
				style={{
					position: 'absolute',
					top: 420,
					left: 0,
					right: 0,
					textAlign: 'center',
					fontFamily: ARCHIVO,
					fontSize: 320,
					lineHeight: 1,
					color: '#FFFFFF',
					textShadow: textOutline(4),
					opacity: numIn,
					transform: `scale(${numScale})`,
				}}
			>
				33
			</div>
			<div
				style={{
					position: 'absolute',
					top: 780,
					left: 0,
					right: 0,
					textAlign: 'center',
					fontFamily: ARCHIVO,
					fontSize: 52,
					letterSpacing: 2,
					color: '#FFFFFF',
					textShadow: textOutline(3),
					opacity: subIn,
				}}
			>
				AÑOS DE UNANIMIDAD
				<br />
				CARIBEÑA
			</div>
			{/* Sello ROTA (entra al decirse «dejó», local f87) */}
			<div
				style={{
					position: 'absolute',
					top: 1080,
					left: 0,
					right: 0,
					textAlign: 'center',
					opacity: stampIn,
					transform: `scale(${stampScale}) rotate(-6deg)`,
				}}
			>
				<span
					style={{
						fontFamily: ARCHIVO,
						fontSize: 120,
						letterSpacing: 6,
						color: MEMORIAL_RED,
						border: `8px solid ${MEMORIAL_RED}`,
						borderRadius: 16,
						padding: '12px 48px',
						textShadow: textOutline(3),
					}}
				>
					ROTA
				</span>
			</div>
		</AbsoluteFill>
	);
};

// ================================================================
// S5 — EVIDENCIA (536–701 f · 17,86–23,36 s, local 0–165)
// «19 GOBIERNOS» + micrófono + tarjeta de la confesión de Browne.
// Reutiliza EvidenceScene de V1 con los tiempos V2: la tarjeta entra
// al decirse «Washington» (local f77). El karaoke se apaga con la
// línea vacía CLEAR (20,42 s) mientras la tarjeta está en pantalla.
// ================================================================
const EvidenceScene: React.FC = () => {
	const f = useCurrentFrame();
	const n = countUp(f, 0, 24, 19);
	const push = interpolate(f, [0, 165], [1, 1.06], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const cardSlide = interpolate(f, [77, 89], [60, 0], {
		easing: Easing.out(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const cardOp = clamp01(f, 77, 85);
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
			{/* Tarjeta de evidencia (V1.2: achicada y bajada para que la
			    cabeza del micrófono quede íntegra y visible). */}
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
// S6 — CITA 2, LOS ÁRBOLES (701–913 f · 23,36–30,43 s, local 0–212)
// Retrato busto Martí + cita estática (sin karaoke). La cita larga
// de «Nuestra América», texto exacto verificado. «GIGANTE» en rojo:
// es la palabra que conecta 1891 con el retroceso de hoy.
// Difiere de S1 en encuadre (objectPosition 50% 12%, más cerrado
// sobre la cara) y en contenido (cita, no gancho).
// ================================================================
const ArbolesScene: React.FC = () => {
	const f = useCurrentFrame();
	const push = interpolate(f, [0, 212], [1, 1.04], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const chipIn = clamp01(f, 8, 16);
	const l1 = clamp01(f, 50, 58);
	const l2 = clamp01(f, 95, 103);
	const l3 = clamp01(f, 140, 148);
	const attr = clamp01(f, 170, 178);
	return (
		<AbsoluteFill style={{background: SEPIA_BG}}>
			<Img
				src={staticFile('img/marti-jamaica-1892.jpg')}
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
						'linear-gradient(180deg, rgba(23,18,8,0.15) 0%, rgba(23,18,8,0.10) 45%, rgba(23,18,8,0.92) 78%, rgba(23,18,8,0.97) 100%)',
				}}
			/>
			<div
				style={{
					position: 'absolute',
					top: 1035,
					left: 0,
					right: 0,
					textAlign: 'center',
					fontFamily: ARCHIVO,
					fontSize: 36,
					letterSpacing: 3,
					color: '#FFFFFF',
					textShadow: textOutline(3),
					opacity: chipIn,
				}}
			>
				MARTÍ YA LO HABÍA DICHO:
			</div>
			<div
				style={{
					position: 'absolute',
					top: 1120,
					left: 70,
					right: 70,
					textAlign: 'center',
					fontFamily: ARCHIVO,
					fontSize: 52,
					lineHeight: 1.3,
					color: '#FFFFFF',
					textShadow: textOutline(3),
				}}
			>
				<div style={{opacity: l1}}>«¡LOS ÁRBOLES SE HAN DE</div>
				<div style={{opacity: l2}}>PONER EN FILA, PARA QUE NO</div>
				<div style={{opacity: l3}}>
					PASE EL <span style={{color: MEMORIAL_RED}}>GIGANTE</span>
				</div>
				<div style={{opacity: l3}}>DE LAS SIETE LEGUAS!»
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
					color: SEPIA_GOLD,
					opacity: attr,
				}}
			>
				— JOSÉ MARTÍ · NUESTRA AMÉRICA, 1891
			</div>
		</AbsoluteFill>
	);
};

// ================================================================
// S7 — CITA 3, FIDEL (913–1135 f · 30,43–37,84 s, local 0–222)
// Retrato MATS 1959 + «2005 · FIDEL ADVIRTIÓ:» + cita estática
// (sin karaoke). Reutiliza FidelQuoteScene de V1 con los tiempos V2:
// «FIDEL» en local f36, la cita empieza en local f60, «PENSAR.» en
// local f177. Layout V1.2 (chip + rótulo en una línea sobre la cita,
// fuera de la cara).
// ================================================================
const FidelQuoteScene: React.FC = () => {
	const f = useCurrentFrame();
	const fadeIn = clamp01(f, 0, 8);
	const push = interpolate(f, [0, 222], [1, 1.05], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const chipIn = clamp01(f, 12, 20);
	const advIn = clamp01(f, 44, 52);
	const l1 = clamp01(f, 60, 68);
	const l2 = clamp01(f, 95, 103);
	const l3 = clamp01(f, 130, 138);
	const l4 = clamp01(f, 165, 173);
	const attr = clamp01(f, 195, 203);
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
// S8 — TESIS + TÍTULO (1135–1356 f · 37,84–45,20 s, local 0–221)
// Fondo oscuro, tesis en texto grande SIN atribución (es la tesis
// del reel, formulación de la directora — idea de Santayana —, NO
// cita de Martí: nunca llevar «— Martí» ni «— Suleris»).
// «OLVIDA» y «CONDENADO» en rojo. El título «MARTÍ-FIDEL: LEER,
// PENSAR» entra con los golpes de voz de L9 (local f157/f166) y el
// CTA al terminar la voz (local f185). Sin karaoke.
// ================================================================
const ThesisScene: React.FC = () => {
	const f = useCurrentFrame();
	const l1 = clamp01(f, 8, 16);
	const l2 = clamp01(f, 35, 43);
	const l3 = clamp01(f, 70, 78);
	const l4 = clamp01(f, 105, 113);
	const divIn = clamp01(f, 140, 148);
	const titleIn = clamp01(f, 150, 158);
	const leerIn = clamp01(f, 157, 163);
	const pensarScale = popIn(f, 166, 10);
	const pensarIn = clamp01(f, 166, 172);
	const ctaIn = clamp01(f, 185, 193);
	const ctaScale = popIn(f, 185, 12);
	return (
		<AbsoluteFill style={{background: '#06090F'}}>
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
				<div style={{opacity: l4}}>A VOLVERLA A VIVIR.</div>
			</div>
			<div
				style={{
					position: 'absolute',
					top: 950,
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
					GUARDA ESTE REEL
				</span>
			</div>
		</AbsoluteFill>
	);
};

// ================================================================
// S9 — STING (1356–1447 f · 45,20–48,23 s)
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
// COMPOSICIÓN PRINCIPAL V2 — 1447 f (48,23 s)
// ================================================================
export const MainReelV2: React.FC = () => {
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<Sequence from={0} durationInFrames={122} name="hook-marti">
				<HookScene />
			</Sequence>
			<Sequence from={122} durationInFrames={110} name="recuento">
				<RecuentoScene />
			</Sequence>
			<Sequence from={232} durationInFrames={169} name="map-retroceso">
				<MapScene />
			</Sequence>
			<Sequence from={401} durationInFrames={135} name="33-anos">
				<ThirtyThreeScene />
			</Sequence>
			<Sequence from={536} durationInFrames={165} name="evidence">
				<EvidenceScene />
			</Sequence>
			<Sequence from={701} durationInFrames={212} name="arboles">
				<ArbolesScene />
			</Sequence>
			<Sequence from={913} durationInFrames={222} name="fidel">
				<FidelQuoteScene />
			</Sequence>
			<Sequence from={1135} durationInFrames={221} name="thesis">
				<ThesisScene />
			</Sequence>
			<Sequence from={1356} durationInFrames={91} name="sting">
				<StingScene />
			</Sequence>

			{/* Marca de agua: logotipo completo desde el fotograma 0 */}
			<LogoInner />

			{/* Karaoke: solo líneas habladas — L1 (0–4,06 s) y L3–L5
			    (7,74–23,36 s). Citas, tesis y «Leer. Pensar.» sin karaoke. */}
			<Sequence from={0} durationInFrames={122} name="karaoke-a">
				<BottomKaraoke lines={LINES_A} />
			</Sequence>
			<Sequence from={232} durationInFrames={469} name="karaoke-b">
				<BottomKaraoke lines={LINES_B} />
			</Sequence>

			{/* Mezcla V2: VO Kokoro + música Flow + SFX + sting */}
			<Audio src={staticFile('audio/v2/mix-v2.wav')} />
		</AbsoluteFill>
	);
};
