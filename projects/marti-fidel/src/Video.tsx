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
import {MAP_DOTS} from './mapDots';

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
const LINES_A: KaraokeLine[] = capSegmentsToLines(CAPTIONS.slice(0, 7));
const L9_START = 40.686;
const LINES_B: KaraokeLine[] = capSegmentsToLines(CAPTIONS.slice(9, 10)).map(
	(line) => ({
		words: line.words.map((w) => ({
			...w,
			s: w.s - L9_START,
			e: w.e - L9_START,
		})),
	}),
);

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
const LogoInner: React.FC = () => {
	const frame = useCurrentFrame();
	const fadeOut = interpolate(frame, [1406, 1416], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
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
// Salón ONU + «130» gigante con count-up + «35 VOTOS MENOS QUE EN 2025»
// ================================================================
const HookScene: React.FC = () => {
	const f = useCurrentFrame();
	const n = countUp(f, 2, 38, 130);
	const push = interpolate(f, [0, 97], [1, 1.08], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const subIn = clamp01(f, 40, 48);
	const subScale = popIn(f, 40);
	return (
		<AbsoluteFill style={{background: NAVY}}>
			<Img
				src={staticFile('img/bg-un-hall.png')}
				style={{
					width: '100%',
					height: '100%',
					objectFit: 'cover',
					transform: `scale(${push})`,
					opacity: 0.55,
				}}
			/>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					background:
						'linear-gradient(180deg, rgba(10,20,32,0.55) 0%, rgba(10,20,32,0.15) 40%, rgba(10,20,32,0.88) 100%)',
				}}
			/>
			{/* Fecha + foro */}
			<div
				style={{
					position: 'absolute',
					top: 120,
					left: 0,
					right: 0,
					textAlign: 'center',
					fontFamily: COND,
					fontSize: 34,
					fontWeight: 700,
					letterSpacing: 6,
					color: '#BFD4E6',
				}}
			>
				28 OCT 2026 · ONU
			</div>
			{/* 130 gigante */}
			<div
				style={{
					position: 'absolute',
					top: 330,
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
					top: 730,
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
			{/* Subtítulo con el contraste (5 palabras) */}
			<div
				style={{
					position: 'absolute',
					top: 880,
					left: 0,
					right: 0,
					textAlign: 'center',
					fontFamily: ARCHIVO,
					fontSize: 52,
					lineHeight: 1.25,
					opacity: subIn,
					transform: `scale(${subScale})`,
					textShadow: textOutline(3),
				}}
			>
				<span style={{color: MEMORIAL_RED}}>35 VOTOS MENOS</span>
				<br />
				<span style={{color: '#FFFFFF'}}>QUE EN 2025</span>
			</div>
			<div
				style={{
					position: 'absolute',
					top: 1080,
					left: 440,
					width: 200,
					height: 8,
					background: MEMORIAL_RED,
					opacity: subIn,
				}}
			/>
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
			{/* Barras horizontales */}
			{BARS.map((b, i) => {
				const grow = interpolate(f, [b.at, b.at + 14], [0, 1], {
					easing: Easing.out(Easing.cubic),
					extrapolateLeft: 'clamp',
					extrapolateRight: 'clamp',
				});
				const val = countUp(f, b.at, b.at + 14, b.value);
				const top = 520 + i * 150;
				return (
					<div key={b.year} style={{position: 'absolute', top, left: 90, right: 90}}>
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
								}}
							>
								{val}
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
// 130 A FAVOR / 17 EN CONTRA / 25 ABSTENCIONES, al ritmo de la voz
// ================================================================
const COUNTERS = [
	{value: 130, label: 'A FAVOR', at: 0, color: '#FFFFFF', sub: 'PAÍSES'},
	{value: 17, label: 'EN CONTRA', at: 30, color: MEMORIAL_RED, sub: 'PAÍSES'},
	{value: 25, label: 'ABSTENCIONES', at: 70, color: AMBER, sub: ''},
];

const CountersScene: React.FC = () => {
	const f = useCurrentFrame();
	const titleIn = clamp01(f, 0, 8);
	return (
		<AbsoluteFill style={{background: NAVY}}>
			<Img
				src={staticFile('img/bg-un-hall.png')}
				style={{
					width: '100%',
					height: '100%',
					objectFit: 'cover',
					opacity: 0.14,
				}}
			/>
			<div
				style={{
					position: 'absolute',
					top: 150,
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
				const val = countUp(f, c.at, c.at + 12, c.value);
				const top = 330 + i * 300;
				return (
					<div
						key={c.label}
						style={{
							position: 'absolute',
							top,
							left: 80,
							right: 80,
							height: 240,
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
								fontSize: 150,
								color: c.color,
								minWidth: 370,
								flexShrink: 0,
							}}
						>
							{val}
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
			<div
				style={{
					position: 'absolute',
					top: 1290,
					left: 0,
					right: 0,
					textAlign: 'center',
					fontFamily: COND,
					fontSize: 30,
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
	const ringScale = interpolate(cycle, [0, 45], [1, 2.8]);
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

const MapScene: React.FC = () => {
	const f = useCurrentFrame();
	const baseIn = clamp01(f, 0, 12);
	const titleIn = clamp01(f, 0, 8);
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
			{/* Puntos luminosos en las islas */}
			{MAP_GROUPS.map((g) =>
				g.dots.map((name) => {
					const d = MAP_DOTS[name as keyof typeof MAP_DOTS];
					return (
						<MapDot
							key={name}
							x={MAP_LEFT + (d.x / 1400) * MAP_SIZE}
							y={MAP_TOP + (d.y / 1400) * MAP_SIZE}
							color={g.color}
							appearAt={g.at}
							frame={f}
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
			{f >= 155 && (
				<div
					style={{
						position: 'absolute',
						left: venX + 34,
						top: venY - 16,
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
			{/* Tarjeta de evidencia */}
			<div
				style={{
					position: 'absolute',
					top: 1010,
					left: 70,
					right: 70,
					background: 'rgba(8,15,24,0.88)',
					borderLeft: `10px solid ${MEMORIAL_RED}`,
					borderRadius: 12,
					padding: '36px 40px',
					opacity: cardOp,
					transform: `translateY(${cardSlide}px)`,
				}}
			>
				<div
					style={{
						fontFamily: ARCHIVO,
						fontSize: 26,
						letterSpacing: 4,
						color: MEMORIAL_RED,
						marginBottom: 16,
					}}
				>
					LO CONTÓ EN LA RADIO
				</div>
				<div
					style={{
						fontFamily: ARCHIVO,
						fontSize: 44,
						lineHeight: 1.3,
						color: '#FFFFFF',
					}}
				>
					«Washington lo llamó para que cambiara su voto»
				</div>
				<div
					style={{
						fontFamily: COND,
						fontSize: 28,
						lineHeight: 1.35,
						color: '#BFD4E6',
						marginTop: 18,
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
			<div
				style={{
					position: 'absolute',
					top: 200,
					left: 0,
					right: 0,
					textAlign: 'center',
					fontFamily: COND,
					fontSize: 36,
					fontWeight: 700,
					letterSpacing: 8,
					color: SEPIA_GOLD,
					opacity: clamp01(f, 0, 8),
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
					opacity: attr,
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
			{/* Chip 2005 */}
			<div
				style={{
					position: 'absolute',
					top: 150,
					left: 80,
					fontFamily: ARCHIVO,
					fontSize: 64,
					color: '#FFFFFF',
					background: 'rgba(0,0,0,0.55)',
					border: `3px solid ${MEMORIAL_RED}`,
					padding: '12px 28px',
					borderRadius: 12,
					opacity: chipIn,
				}}
			>
				2005
			</div>
			<div
				style={{
					position: 'absolute',
					top: 270,
					left: 80,
					fontFamily: ARCHIVO,
					fontSize: 36,
					letterSpacing: 3,
					color: '#FFFFFF',
					textShadow: textOutline(3),
					opacity: advIn,
				}}
			>
				FIDEL ADVIRTIÓ:
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
// Vuelve «130» + título + «GUARDA ESTE DATO»
// ================================================================
const CallbackScene: React.FC = () => {
	const f = useCurrentFrame();
	const n = countUp(f, 0, 15, 130);
	const subIn = clamp01(f, 18, 26);
	const divIn = clamp01(f, 60, 68);
	const titleIn = clamp01(f, 93, 101);
	const leerIn = clamp01(f, 125, 131);
	const pensarScale = popIn(f, 135, 10);
	const pensarIn = clamp01(f, 135, 141);
	const ctaIn = clamp01(f, 150, 158);
	const ctaScale = popIn(f, 150, 12);
	return (
		<AbsoluteFill style={{background: NAVY}}>
			<Img
				src={staticFile('img/bg-un-hall.png')}
				style={{
					width: '100%',
					height: '100%',
					objectFit: 'cover',
					opacity: 0.2,
				}}
			/>
			<div
				style={{
					position: 'absolute',
					top: 260,
					left: 0,
					right: 0,
					textAlign: 'center',
					fontFamily: ARCHIVO,
					fontSize: 300,
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
					top: 590,
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
					top: 830,
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
					top: 900,
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
					top: 990,
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
					top: 1180,
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
