// El Libreto — Messi nunca dijo esto sobre Cuba (Facebook Reel, 30 s).
// 1080x1920, 30 fps, 900 fotogramas. Sin música: toda la banda sonora
// está en la mezcla (mix.wav); la composición es solo video.
// Zonas seguras Meta: texto dentro de x 65-1015, y 269-1248.
// NUNCA texto sobre una cara. La foto de la Casa Blanca (DT-1261) se
// muestra ENTERA (fondo difuminado detrás), nunca recortada dentro.
import React from 'react';
import {
	AbsoluteFill,
	Easing,
	Img,
	interpolate,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import {LibretoKaraoke} from './LibretoKaraoke';

const PAPEL = '#F5F1E8';
const TINTA = '#1A1A2E';
const ROJO = '#C0392B';
const RESALTADOR = '#FFD60A';

const POST = 'img/post-messi-cuba-falso.jpg';
const COMPARACION = 'img/messi-foto-98c58e7b73.jpg';
const CASA_BLANCA = 'img/casa-blanca-dt1261-messi-camiseta-47.jpg';
const BUKELE = 'img/post-bukele-1.jpg';
const MUSK = 'img/post-musk.jpg';
const BAD_BUNNY = 'img/post-bad-bunny.jpg';
const LOCKUP = 'img/watermark-lockup-libreto.png';

// Fondo difuminado: la imagen a cover, borrosa y oscurecida, detrás
// del documento (nunca bandas negras).
const BlurFill: React.FC<{src: string; brightness?: number}> = ({
	src,
	brightness = 0.45,
}) => (
	<div
		style={{
			position: 'absolute',
			inset: 0,
			backgroundImage: `url(${staticFile(src)})`,
			backgroundSize: 'cover',
			backgroundPosition: 'center',
			filter: `blur(40px) brightness(${brightness})`,
			transform: 'scale(1.15)',
		}}
	/>
);

const Pill: React.FC<{
	children: React.ReactNode;
	bg?: string;
	color?: string;
	fontSize?: number;
	style?: React.CSSProperties;
}> = ({children, bg = 'rgba(26,26,46,0.85)', color = PAPEL, fontSize = 28, style}) => (
	<div
		style={{
			display: 'inline-flex',
			alignItems: 'center',
			justifyContent: 'center',
			backgroundColor: bg,
			color,
			fontFamily: "'Noto Sans', sans-serif",
			fontWeight: 700,
			fontSize,
			lineHeight: 1.2,
			padding: '10px 22px',
			borderRadius: 999,
			textAlign: 'center',
			...style,
		}}
	>
		{children}
	</div>
);

const fmtMiles = (n: number) =>
	Math.round(n)
		.toString()
		.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

// ─── Escenas 1-3: la captura del post (0-10,3 s) ────────────────────────
// Una sola capa continua: punch-in (0-0,4), título, contador, zoom al
// encabezado (5,6-8,0), resaltado, píldoras. El corte duro es a 10,3.
const PostScenes: React.FC<{t: number}> = ({t}) => {
	// Punch-in exterior: escala 1 -> 1,10 sobre el centro (0-0,4 s).
	const punch = interpolate(t, [0, 0.4], [1, 1.1], {
		easing: Easing.out(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	// Zoom interior al encabezado (5,6-8,0 s): escala 1 -> 2 sobre el
	// punto del encabezado (180, 34) + traslación que lo centra en
	// (540, 750). Total 1,10 x 2 = 2,2.
	const zp = interpolate(t, [5.6, 8.0], [0, 1], {
		easing: Easing.inOut(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const zoom = 1 + zp;
	const ztx = 360 * zp;
	const zty = 311.6 * zp;

	const titleOpacity = interpolate(t, [2.55, 2.7], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const counterOpacity =
		interpolate(t, [2.7, 2.85], [0, 1], {
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
		}) *
		interpolate(t, [5.45, 5.6], [1, 0], {
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
		});
	// Contador 0 -> 62.000 entre 3,66 y 4,94 (aterriza al terminar
	// «reacciones»); luego se queda fijo.
	const count = interpolate(t, [3.66, 4.94], [0, 62000], {
		easing: Easing.out(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const highlightOpacity = interpolate(t, [8.7, 8.85], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const pill750Opacity = interpolate(t, [7.0, 7.15], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const taigerOpacity = interpolate(t, [9.6, 9.75], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	const wordPop = (s: number) =>
		t >= s
			? interpolate(t - s, [0, 0.1], [1.3, 1], {
					extrapolateLeft: 'clamp',
					extrapolateRight: 'clamp',
				})
			: 1;

	return (
		<AbsoluteFill>
			<BlurFill src={POST} />
			{/* Captura: 670x621 a 1080 de ancho -> 1003 de alto, y=420.
			    RECORTE VERTICAL: solo se muestra la parte superior
			    (encabezado + texto, y de imagen 0-380 = 613 px en
			    pantalla). Las caras de la foto (y de imagen >= 428)
			    quedarían en y 1110-1239, justo donde va la banda de
			    karaoke (1100-1240): el recorte evita texto sobre
			    caras. La foto completa se ve en la comparación. */}
			<div style={{position: 'absolute', left: 0, top: 420, width: 1080, height: 613, overflow: 'hidden'}}>
			<div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1003}}>
				<div
					style={{
						width: 1080,
						height: 1003,
						transform: `scale(${punch})`,
						transformOrigin: '540px 501.5px',
					}}
				>
					<div
						style={{
							width: 1080,
							height: 1003,
							transform: `translate(${ztx}px, ${zty}px) scale(${zoom})`,
							transformOrigin: '180px 34px',
						}}
					>
						<Img src={staticFile(POST)} style={{width: 1080, height: 1003}} />
						{/* Resaltado sobre «José Forever - El Taiger» (coords
						    de imagen x 90-305, y 20-50): escala con el zoom. */}
						<div
							style={{
								position: 'absolute',
								left: 90,
								top: 20,
								width: 215,
								height: 30,
								backgroundColor: RESALTADOR,
								opacity: 0.55 * highlightOpacity,
								borderRadius: 4,
							}}
						/>
					</div>
				</div>
			</div>
			</div>

			{/* Título del gancho, palabra a palabra con la VO. */}
			<div
				style={{
					position: 'absolute',
					left: 90,
					right: 90,
					top: 450,
					opacity: titleOpacity,
					backgroundColor: 'rgba(26,26,46,0.78)',
					borderRadius: 18,
					padding: '24px 20px',
					textAlign: 'center',
					fontFamily: "'Noto Sans', sans-serif",
					fontWeight: 700,
					fontSize: 84,
					lineHeight: 1.15,
					color: PAPEL,
				}}
			>
				<div>
					<span style={{display: 'inline-block', transform: `scale(${wordPop(0.18)})`, opacity: t >= 0.18 ? 1 : 0}}>MESSI&nbsp;</span>
					<span style={{display: 'inline-block', transform: `scale(${wordPop(0.9)})`, opacity: t >= 0.9 ? 1 : 0, backgroundColor: RESALTADOR, color: TINTA, padding: '0 14px', borderRadius: 10}}>NUNCA</span>
				</div>
				<div>
					<span style={{display: 'inline-block', transform: `scale(${wordPop(1.16)})`, opacity: t >= 1.16 ? 1 : 0}}>LO DIJO</span>
				</div>
			</div>

			{/* Píldora de sección, arriba a la derecha (toda la secuencia). */}
			<Pill
				bg={RESALTADOR}
				color={TINTA}
				fontSize={28}
				style={{position: 'absolute', right: 65, top: 310}}
			>
				DESMENTIDO #1
			</Pill>

			{/* Contador 62.000 reacciones. */}
			<div
				style={{
					position: 'absolute',
					left: 140,
					right: 140,
					top: 620,
					opacity: counterOpacity,
					backgroundColor: 'rgba(26,26,46,0.82)',
					borderRadius: 18,
					padding: '20px 0 16px',
					textAlign: 'center',
				}}
			>
				<div
					style={{
						fontFamily: "'Noto Sans', sans-serif",
						fontWeight: 700,
						fontSize: 140,
						lineHeight: 1,
						color: PAPEL,
					}}
				>
					{fmtMiles(count)}
				</div>
				<div
					style={{
						fontFamily: "'Noto Sans', sans-serif",
						fontWeight: 700,
						fontSize: 40,
						letterSpacing: 6,
						color: RESALTADOR,
						marginTop: 8,
					}}
				>
					REACCIONES
				</div>
			</div>
			<Pill
				fontSize={26}
				style={{position: 'absolute', left: 330, top: 860, opacity: counterOpacity}}
			>
				elTOQUE · 17-mar-2026
			</Pill>

			{/* 750.000 seguidores. */}
			<Pill
				bg={RESALTADOR}
				color={TINTA}
				fontSize={36}
				style={{position: 'absolute', left: 270, top: 430, opacity: pill750Opacity}}
			>
				750.000 SEGUIDORES
			</Pill>

			{/* Aclaración sobre El Taiger. */}
			<div
				style={{
					position: 'absolute',
					left: 140,
					right: 140,
					top: 960,
					opacity: taigerOpacity,
					backgroundColor: 'rgba(26,26,46,0.85)',
					borderRadius: 16,
					padding: '16px 20px',
					textAlign: 'center',
					fontFamily: "'Noto Sans', sans-serif",
					fontWeight: 700,
					fontSize: 30,
					lineHeight: 1.35,
					color: PAPEL,
				}}
			>
				Usa el nombre de El Taiger.
				<br />
				Nada que ver con él.
			</div>
		</AbsoluteFill>
	);
};

// ─── Escena 4: la comparación (10,3-15,2 s) ──────────────────────────────
const Comparacion: React.FC<{t: number}> = ({t}) => {
	// Mitades que entran desde lados opuestos (10,3-10,7 s).
	const slide = interpolate(t, [10.3, 10.7], [0, 1], {
		easing: Easing.out(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const leftX = interpolate(slide, [0, 1], [-540, 0]);
	const rightX = interpolate(slide, [0, 1], [540, 0]);

	// Punch-in a la estrella de la bandera (13,9-14,2 s): escala 1 -> 2,2
	// sobre la estrella (135, 355) + traslación que la centra en (540, 775).
	const pp = interpolate(t, [13.9, 14.2], [0, 1], {
		easing: Easing.inOut(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const pScale = 1 + 1.2 * pp;
	const pTx = 405 * pp;

	// Círculo rojo que se dibuja 13,9-14,4 s (elipse rx 86 ry 78,
	// perímetro ≈ 516).
	const circleP = interpolate(t, [13.9, 14.4], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const dashOffset = 516 * (1 - circleP);

	// Etiquetas 10,7-12,8; placa 12,8-13,9; sello 2022 cae a 12,4.
	const labelsOpacity =
		interpolate(t, [10.7, 10.85], [0, 1], {
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
		}) *
		interpolate(t, [12.65, 12.8], [1, 0], {
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
		});
	const plateOpacity =
		interpolate(t, [12.8, 12.95], [0, 1], {
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
		}) *
		interpolate(t, [13.75, 13.9], [1, 0], {
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
		});
	const stampScale = interpolate(t, [12.4, 12.55], [1.3, 1], {
		easing: Easing.out(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const stampOpacity =
		(t >= 12.4 ? 1 : 0) *
		interpolate(t, [13.75, 13.9], [1, 0], {
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
		});
	const geminiOpacity = interpolate(t, [14.5, 14.65], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	return (
		<AbsoluteFill>
			<BlurFill src={COMPARACION} />
			{/* Imagen 1113x713 a 1080 de ancho -> 692 de alto, y=420. */}
			<div
				style={{
					position: 'absolute',
					left: 0,
					top: 420,
					width: 1080,
					height: 692,
					transform: `translate(${pTx}px, 0px) scale(${pScale})`,
					transformOrigin: '135px 355px',
				}}
			>
				{/* Mitad izquierda (el post manipulado). */}
				<div
					style={{
						position: 'absolute',
						left: 0,
						top: 0,
						width: 540,
						height: 692,
						overflow: 'hidden',
						transform: `translateX(${leftX}px)`,
					}}
				>
					<Img
						src={staticFile(COMPARACION)}
						style={{width: 1080, height: 692, maxWidth: 'none'}}
					/>
				</div>
				{/* Mitad derecha (el original). */}
				<div
					style={{
						position: 'absolute',
						left: 540,
						top: 0,
						width: 540,
						height: 692,
						overflow: 'hidden',
						transform: `translateX(${rightX}px)`,
					}}
				>
					<Img
						src={staticFile(COMPARACION)}
						style={{width: 1080, height: 692, maxWidth: 'none', marginLeft: -540}}
					/>
				</div>
				{/* Círculo sobre la estrella de la bandera (escala con el punch). */}
				<svg
					style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}
					width={1080}
					height={692}
				>
					<ellipse
						cx={135}
						cy={355}
						rx={86}
						ry={78}
						fill="none"
						stroke={ROJO}
						strokeWidth={4}
						strokeDasharray={516}
						strokeDashoffset={dashOffset}
						strokeLinecap="round"
						opacity={t >= 13.9 ? 1 : 0}
					/>
				</svg>
			</div>

			{/* Etiquetas sobre el cielo (nunca sobre caras). */}
			<Pill
				fontSize={26}
				style={{position: 'absolute', left: 85, top: 435, opacity: labelsOpacity}}
			>
				EL POST
			</Pill>
			<Pill
				fontSize={26}
				style={{position: 'absolute', right: 85, top: 435, opacity: labelsOpacity}}
			>
				DIC 2022
			</Pill>

			{/* Sello «2022» sobre el original (debajo de las caras). */}
			<div
				style={{
					position: 'absolute',
					left: 700,
					top: 735,
					width: 220,
					height: 130,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					border: `4px solid ${ROJO}`,
					borderRadius: 10,
					fontFamily: "'Noto Serif Display', serif",
					fontWeight: 900,
					fontSize: 80,
					color: ROJO,
					transform: `rotate(-10deg) scale(${stampScale})`,
					opacity: stampOpacity,
					backgroundColor: 'rgba(245,241,232,0.25)',
				}}
			>
				2022
			</div>

			{/* Placa con la fuente de la foto original. */}
			<Pill
				fontSize={26}
				style={{position: 'absolute', left: 190, top: 435, opacity: plateOpacity}}
			>
				4-DIC-2022 · INSTAGRAM DE ANTONELA ROCCUZZO
			</Pill>

			{/* Marca de agua de Gemini. */}
			<Pill
				fontSize={26}
				style={{position: 'absolute', left: 330, top: 435, opacity: geminiOpacity}}
			>
				Marca de agua de Gemini
			</Pill>
		</AbsoluteFill>
	);
};

// ─── Escena 5: la Casa Blanca (15,2-19,5 s) ──────────────────────────────
// Foto DT-1261 ENTERA (1920x1280 -> 1080x720, y=450), fondo difuminado.
// Condiciones EXIF: publicación periodística, NO manipular.
const CasaBlanca: React.FC<{t: number}> = ({t}) => {
	const zoom = interpolate(t, [15.2, 19.5], [1, 1.08], {
		easing: Easing.inOut(Easing.quad),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const negOpacity = interpolate(t, [18.54, 18.74], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const negRise = interpolate(t, [18.54, 18.74], [20, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	return (
		<AbsoluteFill>
			<BlurFill src={CASA_BLANCA} brightness={0.5} />
			<div style={{position: 'absolute', left: 0, top: 450, width: 1080, height: 720}}>
				<Img
					src={staticFile(CASA_BLANCA)}
					style={{
						width: 1080,
						height: 720,
						transform: `scale(${zoom})`,
						transformOrigin: '540px 360px',
					}}
				/>
				<div
					style={{
						position: 'absolute',
						inset: 0,
						backgroundColor: 'rgba(0,0,0,0.35)',
						opacity: negOpacity,
					}}
				/>
			</div>

			<Pill fontSize={28} style={{position: 'absolute', left: 230, top: 410}}>
				5 DE MARZO DE 2026 · CASA BLANCA
			</Pill>

			{/* La negación: debajo de las caras de fondo (la más baja
			    termina en y 866 + margen de barbilla; el texto va en
			    y 950-1120). El karaoke se oculta durante este beat
			    (18,54-19,5 s): el texto grande ES el caption. */}
			<div
				style={{
					position: 'absolute',
					left: 65,
					right: 65,
					top: 950 + negRise,
					opacity: negOpacity,
					textAlign: 'center',
					fontFamily: "'Noto Sans', sans-serif",
					fontWeight: 700,
					fontSize: 64,
					lineHeight: 1.2,
					color: PAPEL,
					textShadow: '0 4px 24px rgba(0,0,0,0.8)',
				}}
			>
				<div>
					PERO{' '}
					<span style={{backgroundColor: RESALTADOR, color: TINTA, padding: '0 14px', borderRadius: 10, textShadow: 'none'}}>NO</span>{' '}
					HABLÓ
				</div>
				<div>DE CUBA.</div>
			</div>
		</AbsoluteFill>
	);
};

// ─── Escena 6: el trío (19,5-22,6 s) ─────────────────────────────────────
const TrioCard: React.FC<{
	src: string;
	name: string;
	popAt: number;
	x: number;
	t: number;
	frame: number;
	fps: number;
}> = ({src, name, popAt, x, t, frame, fps}) => {
	const popFrame = popAt * fps;
	const scale =
		frame >= popFrame
			? interpolate(frame - popFrame, [0, 8], [0.7, 1], {
					easing: Easing.out(Easing.back(1.6)),
					extrapolateLeft: 'clamp',
					extrapolateRight: 'clamp',
				})
			: 0.7;
	return (
		<div
			style={{
				position: 'absolute',
				left: x,
				top: 450,
				width: 320,
				height: 460,
				backgroundColor: '#FFFFFF',
				borderRadius: 16,
				boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
				opacity: t >= popAt ? 1 : 0,
				transform: `scale(${scale})`,
			}}
		>
			<div
				style={{
					position: 'absolute',
					left: 10,
					top: 10,
					width: 300,
					height: 400,
					backgroundColor: '#F0EDE4',
					borderRadius: 10,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					overflow: 'hidden',
				}}
			>
				<Img src={staticFile(src)} style={{width: 300, objectFit: 'contain'}} />
			</div>
			<div
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					top: 414,
					textAlign: 'center',
					fontFamily: "'Noto Sans', sans-serif",
					fontWeight: 700,
					fontSize: 28,
					color: TINTA,
				}}
			>
				{name}
			</div>
		</div>
	);
};

const Trio: React.FC<{t: number; frame: number; fps: number}> = ({t, frame, fps}) => (
	<AbsoluteFill style={{backgroundColor: TINTA}}>
		<TrioCard src={BUKELE} name="BUKELE" popAt={20.18} x={30} t={t} frame={frame} fps={fps} />
		<TrioCard src={MUSK} name="MUSK" popAt={21.12} x={380} t={t} frame={frame} fps={fps} />
		<TrioCard src={BAD_BUNNY} name="BAD BUNNY" popAt={21.94} x={730} t={t} frame={frame} fps={fps} />
	</AbsoluteFill>
);

// ─── Escena 7: el veredicto (22,6-25,15 s) ───────────────────────────────
const Veredicto: React.FC<{t: number}> = ({t}) => {
	const stampScale = interpolate(t, [23.15, 23.27], [1.3, 1], {
		easing: Easing.out(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	return (
		<AbsoluteFill style={{backgroundColor: PAPEL}}>
			{t >= 23.15 && (
				<div
					style={{
						position: 'absolute',
						left: 190,
						top: 660,
						width: 700,
						height: 260,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						border: `6px solid ${ROJO}`,
						borderRadius: 14,
						fontFamily: "'Noto Serif Display', serif",
						fontWeight: 900,
						fontSize: 200,
						letterSpacing: 4,
						color: ROJO,
						transform: `rotate(-8deg) scale(${stampScale})`,
					}}
				>
					FALSO
				</div>
			)}
		</AbsoluteFill>
	);
};

// ─── Escena 8: cierre (25,15-30 s) ───────────────────────────────────────
const Cierre: React.FC<{t: number}> = ({t}) => {
	// El sello viaja del centro a la esquina inferior derecha (25,15-25,6)
	// y se desvanece con la end card (27,5).
	const travel = interpolate(t, [25.15, 25.6], [0, 1], {
		easing: Easing.inOut(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const miniTx = 340 * travel;
	const miniTy = 245 * travel;
	const miniScale = 1 - 0.68 * travel;
	const miniOpacity = interpolate(t, [27.5, 27.7], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	// La pregunta aparece a 25,6 (cuando se oculta el karaoke) y sube
	// a 27,5 para dejar sitio al logo.
	const qOpacity = interpolate(t, [25.6, 25.8], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const qTop = interpolate(t, [27.5, 27.8], [600, 430], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const qRise = interpolate(t, [25.6, 25.8], [20, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	const sourceOpacity = interpolate(t, [25.6, 25.8], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	// End card: fondo Tinta + logo + CTA (27,5-30).
	const endOpacity = interpolate(t, [27.5, 27.8], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const logoScale = interpolate(t, [27.5, 27.8], [0.9, 1], {
		easing: Easing.out(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	return (
		<AbsoluteFill>
			<BlurFill src={POST} brightness={0.35} />
			{/* Captura atenuada con el mismo recorte vertical que el
			    gancho (sin las caras de la foto). */}
			<div style={{position: 'absolute', left: 0, top: 420, width: 1080, height: 613, overflow: 'hidden'}}>
			<Img
				src={staticFile(POST)}
				style={{
					position: 'absolute',
					left: 0,
					top: 0,
					width: 1080,
					height: 1003,
					opacity: 0.5,
					filter: 'brightness(0.6)',
				}}
			/>
			</div>
			{/* Fondo Tinta de la end card (debajo del texto). */}
			<div
				style={{
					position: 'absolute',
					inset: 0,
					backgroundColor: TINTA,
					opacity: endOpacity,
				}}
			/>

			{/* Mini sello FALSO en la esquina. */}
			<div
				style={{
					position: 'absolute',
					left: 190,
					top: 660,
					width: 700,
					height: 260,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					border: `6px solid ${ROJO}`,
					borderRadius: 14,
					fontFamily: "'Noto Serif Display', serif",
					fontWeight: 900,
					fontSize: 200,
					letterSpacing: 4,
					color: ROJO,
					transform: `translate(${miniTx}px, ${miniTy}px) rotate(-8deg) scale(${miniScale})`,
					transformOrigin: 'center center',
					opacity: miniOpacity,
				}}
			>
				FALSO
			</div>

			{/* Pregunta de marca. */}
			<div
				style={{
					position: 'absolute',
					left: 65,
					right: 65,
					top: qTop + qRise,
					opacity: qOpacity,
					textAlign: 'center',
					fontFamily: "'Noto Serif Display', serif",
					fontWeight: 900,
					fontSize: 72,
					lineHeight: 1.15,
					color: PAPEL,
					textShadow: '0 4px 24px rgba(0,0,0,0.7)',
				}}
			>
				<div>¿QUIÉN ESCRIBIÓ</div>
				<div>EL LIBRETO?</div>
			</div>

			{/* Logo de la end card. */}
			<div
				style={{
					position: 'absolute',
					left: 190,
					top: 650,
					width: 700,
					opacity: endOpacity,
					transform: `scale(${logoScale})`,
					transformOrigin: 'center center',
				}}
			>
				<Img src={staticFile(LOCKUP)} style={{width: 700}} />
			</div>

			{/* Fuente. */}
			<Pill
				fontSize={28}
				style={{position: 'absolute', left: 240, top: 1050, opacity: sourceOpacity}}
			>
				Verificado por elTOQUE, 17-mar-2026
			</Pill>

			{/* CTA. */}
			<Pill
				bg={RESALTADOR}
				color={TINTA}
				fontSize={32}
				style={{position: 'absolute', left: 400, top: 1150, opacity: endOpacity}}
			>
				COMPARTE
			</Pill>
		</AbsoluteFill>
	);
};

// ─── Composición ─────────────────────────────────────────────────────────
export const MainReel: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;

	return (
		<AbsoluteFill style={{backgroundColor: TINTA}}>
			{t < 10.3 && <PostScenes t={t} />}
			{t >= 10.3 && t < 15.2 && <Comparacion t={t} />}
			{t >= 15.2 && t < 19.5 && <CasaBlanca t={t} />}
			{t >= 19.5 && t < 22.6 && <Trio t={t} frame={frame} fps={fps} />}
			{t >= 22.6 && t < 25.15 && <Veredicto t={t} />}
			{t >= 25.15 && <Cierre t={t} />}

			<LibretoKaraoke />

			{/* Marca de agua: lockup, arriba-izquierda, desde el fotograma 0. */}
			<Img
				src={staticFile(LOCKUP)}
				style={{position: 'absolute', left: 65, top: 300, height: 100}}
			/>

			{/* Barra de progreso. */}
			<div
				style={{
					position: 'absolute',
					left: 0,
					bottom: 0,
					width: 1080,
					height: 5,
					backgroundColor: 'rgba(255,255,255,0.2)',
				}}
			/>
			<div
				style={{
					position: 'absolute',
					left: 0,
					bottom: 0,
					width: (1080 * t) / 30,
					height: 5,
					backgroundColor: RESALTADOR,
				}}
			/>
		</AbsoluteFill>
	);
};
