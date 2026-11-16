// Escenas del reel escaparate — Marabana 40.
// Cada escena recibe fotogramas LOCALES de TransitionSeries (el reloj
// empieza al inicio de la transición entrante; el corte nominal es local 12).
// Tiempos de VO en src/timeline.ts (globales) convertidos con local().
import React from 'react';
import {
	Easing,
	Img,
	OffthreadVideo,
	interpolate,
	spring,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {EyeOff, MapPin, Timer, Trophy, ZapOff} from 'lucide-react';
import {
	AlertBanner,
	CountUp,
	DiagramFlow,
	GlowStage,
	KineticHeadline,
	LottieSticker,
	ParallaxStill,
	QuoteCard,
} from '../../../shared/motion';
import {MOTION_COLORS} from '../../../shared/motion/theme';
import {ARCHIVO_BLACK} from '../../../shared/captions';
import {local, VO} from './timeline';

const RED = MOTION_COLORS.red;
const POPPINS = "'Poppins', sans-serif";

/** Marco de evidencia estilo pegatina (lenguaje V1.3: foto = prueba exhibida). */
const Sticker: React.FC<{
	top: number;
	left: number;
	width: number;
	rotate?: number;
	children: React.ReactNode;
}> = ({top, left, width, rotate = 0, children}) => (
	<div
		style={{
			position: 'absolute',
			top,
			left,
			width,
			background: '#FFFFFF',
			padding: 10,
			borderRadius: 16,
			boxShadow: '0 18px 50px rgba(0,0,0,0.55)',
			transform: `rotate(${rotate}deg)`,
		}}
	>
		<div style={{borderRadius: 8, overflow: 'hidden'}}>{children}</div>
	</div>
);

/** Píldora de etiqueta (fuente / dato). */
const Pill: React.FC<{
	children: React.ReactNode;
	top: number;
	left?: number;
	bg?: string;
	color?: string;
	size?: number;
}> = ({children, top, left, bg = 'rgba(0,0,0,0.55)', color = '#FFF', size = 30}) => (
	<div
		style={{
			position: 'absolute',
			top,
			left: left ?? 0,
			right: left === undefined ? 0 : undefined,
			display: 'flex',
			justifyContent: 'center',
			pointerEvents: 'none',
		}}
	>
		<div
			style={{
				background: bg,
				color,
				fontFamily: POPPINS,
				fontWeight: 700,
				fontSize: size,
				letterSpacing: 2,
				padding: '10px 26px',
				borderRadius: 999,
				border: '1px solid rgba(255,255,255,0.25)',
				whiteSpace: 'nowrap',
			}}
		>
			{children}
		</div>
	</div>
);

/** Entrada con spring (escala desde 1.15 + fade), reutilizable. */
const useEnter = (delay: number, duration = 10) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const s = spring({frame: frame - delay, fps, config: {damping: 200, stiffness: 260}, durationInFrames: duration});
	return {
		opacity: interpolate(s, [0, 0.6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
		transform: `scale(${interpolate(s, [0, 1], [1.15, 1])})`,
	};
};

/* ------------------------------------------------------------------ */
/* ESCENA 1 — GANCHO: 1.449 → 70 (globales 0–185)                      */
/* ------------------------------------------------------------------ */
export const HookScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	// El conteo cae cuando la VO dice «Hoy, setenta» (f151–169).
	const t = interpolate(frame, [VO.hoySetenta, VO.countdownLand], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const eased = Easing.out(Easing.cubic)(t);
	const value = Math.round(1449 + (70 - 1449) * eased);
	// Separador de miles explícito: toLocaleString('es-ES') escribe 1449
	// sin separador (norma RAE para 4 cifras); el reel usa «1.449».
	const formatted =
		value >= 1000
			? `${Math.floor(value / 1000)}.${String(value % 1000).padStart(3, '0')}`
			: String(value);
	const numColor = frame >= VO.countdownLand ? RED : '#FFFFFF';
	const pop = spring({frame: frame - 6, fps, config: {damping: 200, stiffness: 300}, durationInFrames: 8});
	const land = spring({frame: frame - VO.countdownLand, fps, config: {damping: 12, stiffness: 200}, durationInFrames: 12});
	const strip = useEnter(VO.countdownLand + 2, 10);
	const pill = useEnter(3, 10);

	return (
		<div style={{position: 'absolute', inset: 0, background: '#050507'}}>
			<ParallaxStill bg="img/hero-vertical.jpg" move="push-in" durationInFrames={185} dim={0.28} seed={7} />
			<div
				style={{
					position: 'absolute',
					inset: 0,
					background: 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.8) 100%)',
				}}
			/>
			<div style={{position: 'absolute', inset: 0, ...pill}}>
				<Pill top={300}>40ª MARABANA · LA HABANA · 15 NOV 2026</Pill>
			</div>
			{/* El número: pop al entrar, caída con motion blur, golpe al aterrizar. */}
			<CameraMotionBlur samples={4} shutterAngle={180}>
				<div
					style={{
						position: 'absolute',
						top: 620,
						left: 0,
						right: 0,
						textAlign: 'center',
						opacity: interpolate(pop, [0, 0.5], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
						transform: `scale(${interpolate(pop, [0, 1], [1.15, 1]) * interpolate(land, [0, 1], [1.25, 1])})`,
					}}
				>
					<div
						style={{
							fontFamily: POPPINS,
							fontWeight: 700,
							fontSize: 34,
							letterSpacing: 6,
							color: 'rgba(255,255,255,0.85)',
							textTransform: 'uppercase',
						}}
					>
						Extranjeros en Marabana
					</div>
					<div
						style={{
							fontFamily: ARCHIVO_BLACK,
							fontSize: 240,
							lineHeight: 1,
							color: numColor,
							textShadow: '0 8px 40px rgba(0,0,0,0.7)',
						}}
					>
						{formatted}
					</div>
					<div
						style={{
							fontFamily: POPPINS,
							fontWeight: 800,
							fontSize: 52,
							letterSpacing: 4,
							color: frame < VO.countdownLand ? 'rgba(255,255,255,0.9)' : RED,
						}}
					>
						{frame < VO.countdownLand ? '· 2019 ·' : '· HOY · 2026 ·'}
					</div>
				</div>
			</CameraMotionBlur>
			{/* La serie completa: 2019 → 2025 → 2026. */}
			<div style={{position: 'absolute', inset: 0, ...strip}}>
				<div
					style={{
						position: 'absolute',
						top: 1240,
						left: 0,
						right: 0,
						textAlign: 'center',
						fontFamily: POPPINS,
						fontWeight: 600,
						fontSize: 36,
						color: 'rgba(255,255,255,0.9)',
						textShadow: '0 2px 12px rgba(0,0,0,0.8)',
					}}
				>
					2019 · <b>1.449</b> &nbsp;→&nbsp; 2025 · <b>275</b> &nbsp;→&nbsp; 2026 ·{' '}
					<b style={{color: RED}}>70</b>
				</div>
			</div>
		</div>
	);
};

/* ------------------------------------------------------------------ */
/* ESCENA 2 — EL CERCO (globales 185–430; nominal local 12)            */
/* Dos fases: (1) Adidas/Meliá + foto nocturna; (2) apagones + Gattorno. */
/* El cambio de fase cae sobre «apagones» (local 143).                 */
/* ------------------------------------------------------------------ */
export const SiegeScene: React.FC = () => {
	const frame = useCurrentFrame();
	const meliaAt = local(VO.melia, 185); // 88
	const apagonesAt = local(VO.apagones, 185); // 143
	// La foto entra con el banner (local 20): si espera a «Meliá» (88),
	// la escena queda vacía 2,5 s (QA f250).
	const photo = useEnter(20, 12);
	const pillMelia = useEnter(meliaAt + 4, 10);
	// Fase 1 se retira con fundido al llegar «apagones»; fase 2 entra.
	const phase1Out = interpolate(frame, [apagonesAt - 4, apagonesAt + 10], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const phase2In = interpolate(frame, [apagonesAt + 6, apagonesAt + 18], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const kb = interpolate(frame, [20, apagonesAt], [1, 1.06], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

	return (
		<div style={{position: 'absolute', inset: 0}}>
			<GlowStage glow="danger" particles={40} seed={11} />
			{/* FASE 1 — los patrocinadores se van. */}
			<div style={{position: 'absolute', inset: 0, opacity: phase1Out}}>
				<LottieSticker id="lock" size={96} atFrame={18} direction="backward" top={310} left={492} />
				<AlertBanner text="ADIDAS SE RETIRÓ" top={440} delay={18} xs={3} />
				<div style={{position: 'absolute', inset: 0, ...photo}}>
					<Sticker top={630} left={100} width={880} rotate={-1}>
						<div style={{overflow: 'hidden'}}>
							<Img
								src={staticFile('img/cubadebate-marabana-2.jpg')}
								style={{width: '100%', display: 'block', transform: `scale(${kb})`}}
							/>
						</div>
						<div
							style={{
								fontFamily: POPPINS,
								fontSize: 24,
								fontWeight: 600,
								color: '#444',
								padding: '10px 6px 2px',
								letterSpacing: 1,
							}}
						>
							FOTO: INDER / CUBADEBATE — «CUBA NO ESTÁ SOLA»
						</div>
					</Sticker>
				</div>
				<div style={{position: 'absolute', inset: 0, ...pillMelia}}>
					<Pill top={1230} bg="rgba(237,28,36,0.9)" size={30}>
						MELIÁ TAMBIÉN
					</Pill>
				</div>
			</div>
			{/* FASE 2 — sin luz, sin conexión: la voz de Gattorno. */}
			<div style={{position: 'absolute', inset: 0, opacity: phase2In}}>
				<LottieSticker id="alert-triangle" size={100} atFrame={apagonesAt + 6} top={330} left={490} color="#FFD60A" />
				<QuoteCard
					quote="Sufrimos las mismas adversidades de todos, la falta de electricidad, de conexión"
					attribution="Carlos Gattorno Correa"
					role="Director de Marabana · Granma"
					top={500}
					delay={apagonesAt + 10}
					size={48}
				/>
				<div
					style={{
						position: 'absolute',
						top: 1080,
						left: 0,
						right: 0,
						display: 'flex',
						justifyContent: 'center',
					}}
				>
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: 14,
							background: 'rgba(0,0,0,0.6)',
							border: '1px solid rgba(255,255,255,0.3)',
							borderRadius: 999,
							padding: '14px 32px',
							fontFamily: POPPINS,
							fontWeight: 700,
							fontSize: 34,
							letterSpacing: 2,
							color: '#FFF',
							whiteSpace: 'nowrap',
						}}
					>
						<ZapOff size={38} color="#FFD60A" /> APAGONES DE MÁS DE 30 HORAS
					</div>
				</div>
			</div>
		</div>
	);
};

/* ------------------------------------------------------------------ */
/* ESCENA 3a — LOS QUE VINIERON (globales 430–570; nominal local 12)   */
/* ------------------------------------------------------------------ */
export const CameScene: React.FC = () => {
	const quinceAt = local(VO.quince, 430); // 63
	const amenazasAt = local(VO.amenazas, 430); // 105
	const paises = useEnter(quinceAt, 10);
	const presion = useEnter(amenazasAt, 10);
	return (
		<div style={{position: 'absolute', inset: 0, background: '#050507'}}>
			<ParallaxStill
				bg="img/cubadebate-marabana-1.jpg"
				fg="img/cutouts/flag-runner-full.png"
				move="push-in"
				durationInFrames={152}
				dim={0.5}
				seed={3}
			/>
			<div
				style={{
					position: 'absolute',
					top: 420,
					left: 0,
					right: 0,
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
				}}
			>
				<CountUp to={70} from={0} delay={14} durationInFrames={18} size={210} label="vinieron igual" labelSize={44} />
			</div>
			<div style={{position: 'absolute', inset: 0, ...paises}}>
				<Pill top={830} bg="rgba(46,224,111,0.9)" color="#062B16" size={36}>
					DE 15 PAÍSES
				</Pill>
			</div>
			{/* 15 países → La Habana: el viaje del diagrama. */}
			<div
				style={{
					position: 'absolute',
					top: 1080,
					left: 90,
					fontFamily: POPPINS,
					fontWeight: 700,
					fontSize: 30,
					color: '#FFF',
					letterSpacing: 2,
				}}
			>
				15 PAÍSES
			</div>
			<div
				style={{
					position: 'absolute',
					top: 1080,
					right: 90,
					fontFamily: POPPINS,
					fontWeight: 700,
					fontSize: 30,
					color: '#FFF',
					letterSpacing: 2,
				}}
			>
				LA HABANA
			</div>
			<DiagramFlow
				from={{x: 200, y: 1150}}
				to={{x: 880, y: 1150}}
				startFrame={70}
				durationInFrames={45}
				traveler={<MapPin size={44} color={RED} fill={RED} />}
				travelerSize={64}
				trailColor={RED}
			/>
			<div style={{position: 'absolute', inset: 0, ...presion}}>
				<div
					style={{
						position: 'absolute',
						top: 1330,
						left: 0,
						right: 0,
						textAlign: 'center',
						fontFamily: POPPINS,
						fontWeight: 600,
						fontSize: 34,
						color: 'rgba(255,255,255,0.92)',
						textShadow: '0 2px 12px rgba(0,0,0,0.8)',
					}}
				>
					Pese a las amenazas y la presión
				</div>
			</div>
		</div>
	);
};

/* ------------------------------------------------------------------ */
/* ESCENA 3b — ANTES DEL AMANECER (globales 570–717; nominal local 12) */
/* ------------------------------------------------------------------ */
export const DawnScene: React.FC = () => {
	const amanecerAt = local(VO.amanecer, 570); // 62
	const corredoresAt = local(VO.corredores, 570); // 103
	const video = useEnter(14, 12);
	return (
		<div style={{position: 'absolute', inset: 0}}>
			<GlowStage glow="curiosity" particles={30} seed={5} />
			<div
				style={{
					position: 'absolute',
					top: 300,
					left: 0,
					right: 0,
					textAlign: 'center',
				}}
			>
				<div
					style={{
						fontFamily: ARCHIVO_BLACK,
						fontSize: 150,
						lineHeight: 1,
						color: '#FFF',
						textShadow: '0 8px 30px rgba(0,0,0,0.6)',
					}}
				>
					6:00
				</div>
			</div>
			<LottieSticker id="clock" size={96} atFrame={16} top={310} left={730} />
			<div style={{position: 'absolute', inset: 0, ...video}}>
				<Sticker top={520} left={70} width={940} rotate={1}>
					<OffthreadVideo
						src={staticFile('video/cc-start.mp4')}
						style={{width: '100%', display: 'block'}}
						pauseWhenBuffering
					/>
					<div
						style={{
							fontFamily: POPPINS,
							fontSize: 24,
							fontWeight: 600,
							color: '#444',
							padding: '10px 6px 2px',
							letterSpacing: 1,
						}}
					>
						VIDEO: CANAL CARIBE — LA SALIDA, 15 NOV 2026
					</div>
				</Sticker>
			</div>
			{/* Dato que la VO NO dice: la hora exacta del amanecer (weather.com).
				El titular anterior («ANTES DEL AMANECER») duplicaba el karaoke. */}
			<KineticHeadline
				lines={[[{t: 'EL'}, {t: 'SOL'}, {t: 'SALÍA'}], [{t: 'A'}, {t: 'LAS'}, {t: '6:43', accent: true}]]}
				top={1140}
				size={76}
				delay={amanecerAt}
				step={4}
			/>
			<div
				style={{
					position: 'absolute',
					top: 1360,
					left: 0,
					right: 0,
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
				}}
			>
				<CountUp to={3000} from={0} delay={corredoresAt} durationInFrames={18} size={120} label="corredores en las calles" labelSize={34} />
			</div>
		</div>
	);
};

/* ------------------------------------------------------------------ */
/* ESCENA 4 — BUCLE ABIERTO (globales 717–812; nominal local 12)       */
/* ------------------------------------------------------------------ */
export const LoopScene: React.FC = () => {
	const frame = useCurrentFrame();
	const eye = interpolate(frame, [20, 32], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const pulse = 1 + 0.04 * Math.sin((frame / 30) * Math.PI * 2 * 0.8);
	return (
		<div style={{position: 'absolute', inset: 0, background: '#050507'}}>
			<ParallaxStill bg="img/cubadebate-marabana-4.jpg" move="lateral-pan" durationInFrames={107} dim={0.68} seed={9} />
			<div
				style={{
					position: 'absolute',
					top: 560,
					left: 0,
					right: 0,
					display: 'flex',
					justifyContent: 'center',
					opacity: eye,
					transform: `scale(${pulse})`,
				}}
			>
				<EyeOff size={130} color="rgba(255,255,255,0.9)" strokeWidth={1.5} />
			</div>
			{/* La pregunta que la VO no hace: intensifica el bucle sin duplicar
				el karaoke («UN HOMBRE QUE NO VEÍA LA META» lo repetía). */}
			<KineticHeadline
				lines={[[{t: '¿QUIÉN'}, {t: 'ERA?', accent: true}]]}
				top={860}
				size={130}
				delay={48}
				step={5}
			/>
		</div>
	);
};

/* ------------------------------------------------------------------ */
/* ESCENA 5 — LA DENUNCIA (globales 812–1073; nominal local 12)        */
/* ------------------------------------------------------------------ */
export const DenunciaScene: React.FC = () => {
	const frame = useCurrentFrame();
	const cartelAt = local(VO.cartel, 812); // 39
	const cavaAt = local(VO.cava, 812); // 152
	const photo = useEnter(cartelAt, 12);
	// El contenedor de QuoteCard se renderiza siempre: sin este fundido,
	// la tarjeta vacía se ve desde el inicio de la escena (QA f950).
	const quoteIn = interpolate(frame, [cavaAt, cavaAt + 8], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const kb = interpolate(frame, [cartelAt, 273], [1, 1.07], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	return (
		<div style={{position: 'absolute', inset: 0}}>
			<GlowStage glow="danger" particles={40} seed={13} />
			<KineticHeadline
				lines={[
					[{t: 'CUBA'}, {t: 'NO'}, {t: 'ES'}, {t: 'UNA'}, {t: 'AMENAZA,'}],
					[{t: 'EL'}, {t: 'BLOQUEO', accent: true}, {t: 'SÍ.'}],
				]}
				top={300}
				size={82}
				delay={78}
				step={5}
			/>
			<div style={{position: 'absolute', inset: 0, ...photo}}>
				<Sticker top={600} left={180} width={720} rotate={1}>
					<div style={{overflow: 'hidden'}}>
						<Img
							src={staticFile('img/cubadebate-marabana-3.jpg')}
							style={{width: '100%', display: 'block', transform: `scale(${kb})`}}
						/>
					</div>
					<div
						style={{
							fontFamily: POPPINS,
							fontSize: 24,
							fontWeight: 600,
							color: '#444',
							padding: '10px 6px 2px',
							letterSpacing: 1,
						}}
					>
						FOTO: INDER / CUBADEBATE — CARTELES EN LA CARRERA
					</div>
				</Sticker>
			</div>
			<div style={{position: 'absolute', inset: 0, opacity: quoteIn}}>
				<QuoteCard
					quote="El bloqueo asfixia al pueblo cubano"
					attribution="Yuraldi Cava"
					role="Corredor, 58 años · AP"
					top={1190}
					delay={cavaAt}
					size={50}
				/>
			</div>
		</div>
	);
};

/* ------------------------------------------------------------------ */
/* ESCENA 6a — GANADORES (globales 1073–1201; nominal local 12)        */
/* ------------------------------------------------------------------ */
const WINNERS: {dist: string; name: string; time: string; at: number}[] = [
	{dist: '42K', name: 'ESTÉVEZ', time: '2:25:31', at: local(VO.estevez, 1073)},
	{dist: '42K', name: 'BACALLAO', time: '2:45:41', at: 52},
	{dist: '21K', name: 'TAMERÓN', time: '1:06:53', at: 63},
	{dist: '21K', name: 'LÓPEZ GUISAO', time: '1:17:24', at: 74},
];

const WinnerRow: React.FC<{w: (typeof WINNERS)[number]; index: number}> = ({w, index}) => {
	const e = useEnter(w.at, 8);
	return (
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between',
				padding: '18px 30px',
				borderBottom: index < 3 ? '1px solid rgba(255,255,255,0.14)' : 'none',
				...e,
			}}
		>
			<div style={{display: 'flex', alignItems: 'baseline', gap: 18}}>
				<span style={{fontFamily: POPPINS, fontWeight: 800, fontSize: 30, color: RED}}>{w.dist}</span>
				<span style={{fontFamily: ARCHIVO_BLACK, fontSize: 44, color: '#FFF'}}>{w.name}</span>
			</div>
			<span style={{fontFamily: ARCHIVO_BLACK, fontSize: 44, color: '#FFD60A'}}>{w.time}</span>
		</div>
	);
};

export const WinnersScene: React.FC = () => {
	const v1 = useEnter(14, 10);
	const v2 = useEnter(30, 10);
	const v3 = useEnter(46, 10);
	const pill = useEnter(local(VO.doblete, 1073), 10);
	const label = useEnter(14, 10);
	return (
		<div style={{position: 'absolute', inset: 0}}>
			<GlowStage glow="neutral" particles={30} seed={17} />
			<div style={{position: 'absolute', inset: 0, ...label}}>
				<div
					style={{
						position: 'absolute',
						top: 300,
						left: 0,
						right: 0,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						gap: 16,
						fontFamily: POPPINS,
						fontWeight: 800,
						fontSize: 36,
						letterSpacing: 6,
						color: '#FFF',
					}}
				>
					<Trophy size={40} color="#FFD60A" /> LOS GANADORES
				</div>
			</div>
			{/* Tres ventanas de video: las caras de los ganadores (Canal Caribe). */}
			<div style={{position: 'absolute', inset: 0, ...v1}}>
				<Sticker top={390} left={40} width={320} rotate={-2}>
					<OffthreadVideo src={staticFile('video/cc-estevez.mp4')} style={{width: '100%', display: 'block'}} pauseWhenBuffering />
				</Sticker>
			</div>
			<div style={{position: 'absolute', inset: 0, ...v2}}>
				<Sticker top={390} left={380} width={320} rotate={1}>
					<OffthreadVideo src={staticFile('video/cc-lopez.mp4')} style={{width: '100%', display: 'block'}} pauseWhenBuffering />
				</Sticker>
			</div>
			<div style={{position: 'absolute', inset: 0, ...v3}}>
				<Sticker top={390} left={720} width={320} rotate={-1}>
					<OffthreadVideo src={staticFile('video/cc-tameron.mp4')} style={{width: '100%', display: 'block'}} pauseWhenBuffering />
				</Sticker>
			</div>
			<div
				style={{
					position: 'absolute',
					top: 680,
					left: 60,
					width: 960,
					background: 'rgba(8,12,16,0.82)',
					border: '1px solid rgba(255,255,255,0.18)',
					borderRadius: 20,
					overflow: 'hidden',
				}}
			>
				{WINNERS.map((w, i) => (
					<WinnerRow key={w.name} w={w} index={i} />
				))}
			</div>
			<div style={{position: 'absolute', inset: 0, ...pill}}>
				<Pill top={1160} bg="rgba(255,214,10,0.95)" color="#1A1A00" size={32}>
					DOBLETE TUNERO EN 21K
				</Pill>
			</div>
		</div>
	);
};

/* ------------------------------------------------------------------ */
/* ESCENA 6b — EL ZAPATO (globales 1201–1327; nominal local 12)        */
/* ------------------------------------------------------------------ */
export const ShoeScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const minutoAt = local(VO.minuto, 1201); // 58
	const zapatosAt = local(VO.zapatos, 1201); // 87
	const ganoAt = local(VO.gano, 1201); // 126
	const slam = spring({frame: frame - minutoAt, fps, config: {damping: 12, stiffness: 260}, durationInFrames: 10});
	const timer = useEnter(16, 10);
	return (
		<div style={{position: 'absolute', inset: 0, background: '#050507'}}>
			<ParallaxStill bg="img/cubadebate-marabana-4.jpg" move="push-in" durationInFrames={138} dim={0.72} seed={21} />
			<div style={{position: 'absolute', inset: 0, ...timer}}>
				<div style={{position: 'absolute', top: 380, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
					<Timer size={110} color="rgba(255,255,255,0.9)" strokeWidth={1.5} />
				</div>
			</div>
			{/* El minuto perdido: golpe de sello. */}
			<div
				style={{
					position: 'absolute',
					top: 520,
					left: 0,
					right: 0,
					textAlign: 'center',
					opacity: interpolate(slam, [0, 0.5], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
					transform: `scale(${interpolate(slam, [0, 1], [1.6, 1])}) rotate(-3deg)`,
				}}
			>
				<div
					style={{
						fontFamily: ARCHIVO_BLACK,
						fontSize: 200,
						lineHeight: 1,
						color: RED,
						textShadow: '0 0 0 #000, 0 10px 40px rgba(0,0,0,0.8)',
						WebkitTextStroke: '3px rgba(0,0,0,0.35)',
					}}
				>
					-1:00
				</div>
				<div style={{fontFamily: POPPINS, fontWeight: 700, fontSize: 34, letterSpacing: 4, color: '#FFF'}}>
					EN LA PRIMERA VUELTA
				</div>
			</div>
			{/* Sus propias palabras a Granma (no están en la VO): la frase que
				explica el drama. El titular anterior («CAMBIANDO DE ZAPATOS…»)
				duplicaba el karaoke. */}
			<KineticHeadline
				lines={[[{t: '«ESO'}, {t: 'ME'}, {t: 'ROMPIÓ'}], [{t: 'LA'}, {t: 'ESTRATEGIA»', accent: true}]]}
				top={860}
				size={72}
				delay={zapatosAt}
				step={4}
			/>
			<div
				style={{
					position: 'absolute',
					top: 1080,
					left: 0,
					right: 0,
					textAlign: 'center',
					fontFamily: POPPINS,
					fontWeight: 600,
					fontSize: 28,
					letterSpacing: 2,
					color: 'rgba(255,255,255,0.75)',
					opacity: interpolate(frame, [zapatosAt + 16, zapatosAt + 26], [0, 1], {
						extrapolateLeft: 'clamp',
						extrapolateRight: 'clamp',
					}),
				}}
			>
				— ESTÉVEZ · GRANMA
			</div>
			<KineticHeadline
				lines={[[{t: 'Y'}, {t: 'GANÓ.', accent: true}]]}
				top={1180}
				size={130}
				delay={ganoAt}
				step={4}
			/>
		</div>
	);
};

/* ------------------------------------------------------------------ */
/* ESCENA 7 — SARDIÑAS (globales 1327–1424; nominal local 12)          */
/* ------------------------------------------------------------------ */
export const SardinasScene: React.FC = () => {
	const ciegoAt = local(VO.ciego, 1327); // 50
	const completoAt = local(VO.completo, 1327); // 65
	const pill = useEnter(ciegoAt, 10);
	const time = useEnter(completoAt, 10);
	return (
		<div style={{position: 'absolute', inset: 0, background: '#050507'}}>
			<ParallaxStill bg="img/cubadebate-marabana-5.jpg" move="push-in" durationInFrames={109} dim={0.55} seed={25} />
			<KineticHeadline
				lines={[[{t: 'ELVIS'}, {t: 'SARDIÑAS', accent: true}]]}
				top={560}
				size={84}
				delay={16}
				step={5}
			/>
			<div style={{position: 'absolute', inset: 0, ...pill}}>
				<Pill top={760} bg="rgba(0,0,0,0.6)" size={36}>
					CIEGO · MEDIA MARATÓN
				</Pill>
			</div>
			<div style={{position: 'absolute', inset: 0, ...time}}>
				<div
					style={{
						position: 'absolute',
						top: 900,
						left: 0,
						right: 0,
						textAlign: 'center',
					}}
				>
					<div style={{fontFamily: ARCHIVO_BLACK, fontSize: 130, lineHeight: 1, color: '#FFD60A', textShadow: '0 8px 30px rgba(0,0,0,0.7)'}}>
						1:48:52
					</div>
					<div style={{fontFamily: POPPINS, fontWeight: 700, fontSize: 30, letterSpacing: 4, color: '#FFF', marginTop: 8}}>
						TIEMPO OFICIAL
					</div>
				</div>
			</div>
			<LottieSticker id="flag" size={110} atFrame={completoAt} top={1120} left={485} />
		</div>
	);
};

/* ------------------------------------------------------------------ */
/* ESCENA 8 — CIERRE (globales 1424–1587; nominal local 12)            */
/* ------------------------------------------------------------------ */
export const CloseScene: React.FC = () => {
	const frame = useCurrentFrame();
	const comenzoAt = local(VO.comenzo, 1424); // 144
	const cta = useEnter(comenzoAt - 4, 10);
	// Fundido de entrada de la tarjeta (su contenedor se renderiza siempre).
	const quoteIn = interpolate(frame, [18, 26], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	return (
		<div style={{position: 'absolute', inset: 0, background: '#050507'}}>
			<ParallaxStill bg="img/hero-vertical-dim.jpg" move="push-in" durationInFrames={175} dim={0.1} seed={29} />
			<div style={{position: 'absolute', inset: 0, opacity: quoteIn}}>
				<QuoteCard
					quote="Marabana está vivo. Era ahora o nunca, y fue ahora"
					attribution="Carlos Gattorno Correa"
					role="Director de Marabana · Granma"
					top={360}
					delay={18}
					size={56}
				/>
			</div>
			<KineticHeadline
				lines={[
					[{t: 'LA'}, {t: '41', accent: true}, {t: 'YA'}],
					[{t: 'COMENZÓ.', accent: true}],
				]}
				top={820}
				size={110}
				delay={124}
				step={5}
			/>
			<LottieSticker id="checkmark" size={120} atFrame={comenzoAt} top={1120} left={480} />
			<div style={{position: 'absolute', inset: 0, ...cta}}>
				<div
					style={{
						position: 'absolute',
						top: 1300,
						left: 90,
						right: 90,
						textAlign: 'center',
						fontFamily: POPPINS,
						fontWeight: 800,
						fontSize: 38,
						lineHeight: 1.35,
						color: '#FFF',
						textShadow: '0 2px 14px rgba(0,0,0,0.9)',
					}}
				>
					<span style={{color: RED}}>COMPARTE</span> SI CREES QUE EL DEPORTE
					<br />
					NO TIENE BLOQUEO
				</div>
			</div>
		</div>
	);
};

/* ------------------------------------------------------------------ */
/* STING — cierre animado oficial a 2x (globales 1587–1677)            */
/* ------------------------------------------------------------------ */
export const StingScene: React.FC = () => {
	return (
		<div style={{position: 'absolute', inset: 0, background: '#000'}}>
			<OffthreadVideo
				src={staticFile('video/sting-black-2x.mp4')}
				style={{width: '100%', height: '100%', objectFit: 'cover'}}
			/>
		</div>
	);
};
