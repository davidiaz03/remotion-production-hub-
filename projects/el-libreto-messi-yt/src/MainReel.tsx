// El Libreto — Messi nunca dijo esto sobre Cuba (YouTube Short, 43 s).
// 1080x1920, 30 fps, 1290 fotogramas. Sin música: toda la banda sonora
// está en la mezcla (mix.wav); la composición es solo video.
// Adaptación de la versión Facebook (30 s): misma estructura y assets,
// con los beats exclusivos de YouTube — lupa sobre la marca de agua de
// Gemini (T2), checklist de ausencia (T8), tarjeta de pregunta (T15),
// resaltado suave sobre Messi y el veredicto con sus dos líneas.
// Zonas seguras: texto dentro de x 65-1015, y 269-1248 (Meta) — la
// versión YT respeta la misma banda para no rehacer el layout.
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

// ─── Escenas 1-3: la captura del post (0-13,0 s) ────────────────────────
// Una sola capa continua: punch-in (0-0,4), título, contador, zoom al
// encabezado (5,6-8,0), resaltado, píldoras. El corte duro es a 13,0.
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
	// Contador 0 -> 62.000 entre 3,52 y 4,82 (aterriza al terminar
	// «reacciones»); luego se queda fijo.
	const count = interpolate(t, [3.52, 4.82], [0, 62000], {
		easing: Easing.out(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const highlightOpacity = interpolate(t, [8.7, 8.85], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const pill750Opacity = interpolate(t, [6.9, 7.05], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const taigerOpacity = interpolate(t, [10.1, 10.25], [0, 1], {
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
						{/* Resaltado sobre «José Forever - El Taiger».
						    Coords de DISPLAY de la captura (1080x1003):
						    el nombre mide x 124-398, y 44-81 (medido en
						    la captura original 670x621: x 77-247,
						    y 27-50, escala 1,612). Escala con el zoom.
						    Corrección pre-vuelo 23-nov: el render mostró
						    que la «J» de José quedaba fuera (el nombre
						    empieza en x ~111, no 124); el resaltado
						    ahora abarca 108-404. */}
						<div
							style={{
								position: 'absolute',
								left: 108,
								top: 40,
								width: 296,
								height: 45,
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
					<span style={{display: 'inline-block', transform: `scale(${wordPop(0.53)})`, opacity: t >= 0.53 ? 1 : 0}}>MESSI&nbsp;</span>
					<span style={{display: 'inline-block', transform: `scale(${wordPop(0.8)})`, opacity: t >= 0.8 ? 1 : 0, backgroundColor: RESALTADOR, color: TINTA, padding: '0 14px', borderRadius: 10}}>NUNCA</span>
				</div>
				<div>
					<span style={{display: 'inline-block', transform: `scale(${wordPop(1.08)})`, opacity: t >= 1.08 ? 1 : 0}}>LO DIJO</span>
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

// ─── Escena 4: la comparación (13,0-22,3 s) ──────────────────────────────
// Slide-in, sello 2022, círculo en la bandera (punch-in), lupa sobre
// la marca de agua de Gemini y checklist de ausencia.
const Comparacion: React.FC<{t: number}> = ({t}) => {
	// Mitades que entran desde lados opuestos (13,0-13,4 s).
	const slide = interpolate(t, [13.0, 13.4], [0, 1], {
		easing: Easing.out(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const leftX = interpolate(slide, [0, 1], [-540, 0]);
	const rightX = interpolate(slide, [0, 1], [540, 0]);

	// Punch-in a la estrella de la bandera (15,87-16,37 s): escala
	// 1 -> 2,2 sobre la estrella (135, 355) + traslación que la centra
	// en (540, 775). Se mantiene hasta 17,4 y se libera 17,4-17,8,
	// antes de que entre la lupa.
	const ppIn = interpolate(t, [15.87, 16.37], [0, 1], {
		easing: Easing.inOut(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const ppOut = interpolate(t, [17.4, 17.8], [0, 1], {
		easing: Easing.inOut(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const pp = ppIn * (1 - ppOut);
	const pScale = 1 + 1.2 * pp;
	const pTx = 405 * pp;

	// Círculo rojo que se dibuja 15,87-16,37 s (elipse rx 86 ry 78,
	// perímetro ≈ 516).
	const circleP = interpolate(t, [15.87, 16.37], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const dashOffset = 516 * (1 - circleP);
	const circleOpacity =
		(t >= 15.87 ? 1 : 0) *
		interpolate(t, [17.4, 17.8], [1, 0], {
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
		});

	// Etiquetas 13,4-14,1; sello 2022 cae a 14,26; placa 15,0-15,55.
	const labelsOpacity =
		interpolate(t, [13.4, 13.55], [0, 1], {
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
		}) *
		interpolate(t, [14.1, 14.26], [1, 0], {
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
		});
	const plateOpacity =
		interpolate(t, [15.0, 15.15], [0, 1], {
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
		}) *
		interpolate(t, [15.55, 15.7], [1, 0], {
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
		});
	const stampScale = interpolate(t, [14.26, 14.41], [1.3, 1], {
		easing: Easing.out(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const stampOpacity =
		(t >= 14.26 ? 1 : 0) *
		interpolate(t, [15.7, 15.87], [1, 0], {
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
		});

	// Lupa sobre la marca de agua de Gemini (T2). La marca es el
	// destello blanco de 4 puntas de Gemini, en la esquina inferior
	// derecha de la foto manipulada: coords de imagen original
	// (1113x713) centro (479, 671); en display (1080x692) centro
	// (465, 651); absoluto en la composición (465, 1071). La lente
	// (360 px) se desplaza hasta la marca 17,9-18,4 s y la amplía 4x
	// dentro; sale 19,5-19,7 s. La palabra GEMINI aparece a 18,9 s,
	// cuando la voz la dice.
	const loupeIn = interpolate(t, [17.9, 18.4], [0, 1], {
		easing: Easing.out(Easing.back(1.4)),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const loupeOut = interpolate(t, [19.5, 19.7], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const loupeScale = loupeIn * (1 - loupeOut);
	const loupeDx = -100 * (1 - loupeIn);
	const loupeDy = -80 * (1 - loupeIn);
	const geminiOpacity =
		interpolate(t, [18.9, 19.05], [0, 1], {
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
		}) *
		interpolate(t, [19.5, 19.7], [1, 0], {
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
		});

	// Checklist de ausencia (T8): dos filas que aparecen una a una.
	const row1Opacity = interpolate(t, [20.0, 20.15], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const row2Opacity = interpolate(t, [21.0, 21.15], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const rowsFade = interpolate(t, [22.1, 22.3], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const rowPop = (s: number) =>
		t >= s
			? interpolate(t - s, [0, 0.15], [0.9, 1], {
					easing: Easing.out(Easing.cubic),
					extrapolateLeft: 'clamp',
					extrapolateRight: 'clamp',
				})
			: 0.9;

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
						opacity={circleOpacity}
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

			{/* Lupa sobre la marca de agua de Gemini. La lente (360 px)
			    va centrada en la marca (465, 1071); dentro, la imagen
			    a 4x con la marca centrada en la lente. */}
			<div
				style={{
					position: 'absolute',
					left: 285 + loupeDx,
					top: 891 + loupeDy,
					width: 360,
					height: 360,
					borderRadius: '50%',
					overflow: 'hidden',
					border: `6px solid ${PAPEL}`,
					boxShadow: '0 12px 40px rgba(0,0,0,0.55)',
					transform: `scale(${loupeScale})`,
					transformOrigin: 'center center',
					opacity: loupeScale > 0 ? 1 : 0,
				}}
			>
				<Img
					src={staticFile(COMPARACION)}
					style={{
						position: 'absolute',
						left: -1680,
						top: -2424,
						width: 4320,
						height: 2768,
						maxWidth: 'none',
					}}
				/>
			</div>

			{/* La palabra GEMINI, en grande debajo de la lupa. */}
			<div
				style={{
					position: 'absolute',
					left: 240,
					right: 240,
					top: 1290,
					opacity: geminiOpacity,
					backgroundColor: 'rgba(26,26,46,0.85)',
					borderRadius: 16,
					padding: '14px 0',
					textAlign: 'center',
					fontFamily: "'Noto Sans', sans-serif",
					fontWeight: 700,
					fontSize: 76,
					lineHeight: 1.1,
					color: PAPEL,
				}}
			>
				GEMINI
			</div>

			{/* Checklist de ausencia: «Messi no dijo nada. Ni en sus
			    cuentas.» — la pantalla muestra la ausencia. */}
			<div
				style={{
					position: 'absolute',
					left: 220,
					right: 220,
					top: 1130,
					opacity: row1Opacity * rowsFade,
					transform: `scale(${rowPop(20.0)})`,
					backgroundColor: 'rgba(26,26,46,0.9)',
					borderRadius: 16,
					padding: '18px 28px',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					gap: 20,
					fontFamily: "'Noto Sans', sans-serif",
					fontWeight: 700,
					fontSize: 48,
					color: PAPEL,
				}}
			>
				<span
					style={{
						display: 'inline-flex',
						alignItems: 'center',
						justifyContent: 'center',
						width: 56,
						height: 56,
						border: `4px solid ${PAPEL}`,
						borderRadius: 10,
						color: ROJO,
						fontSize: 44,
						lineHeight: 1,
					}}
				>
					✗
				</span>
				X: NADA
			</div>
			<div
				style={{
					position: 'absolute',
					left: 220,
					right: 220,
					top: 1290,
					opacity: row2Opacity * rowsFade,
					transform: `scale(${rowPop(21.0)})`,
					backgroundColor: 'rgba(26,26,46,0.9)',
					borderRadius: 16,
					padding: '18px 28px',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					gap: 20,
					fontFamily: "'Noto Sans', sans-serif",
					fontWeight: 700,
					fontSize: 48,
					color: PAPEL,
				}}
			>
				<span
					style={{
						display: 'inline-flex',
						alignItems: 'center',
						justifyContent: 'center',
						width: 56,
						height: 56,
						border: `4px solid ${PAPEL}`,
						borderRadius: 10,
						color: ROJO,
						fontSize: 44,
						lineHeight: 1,
					}}
				>
					✗
				</span>
				INSTAGRAM: NADA
			</div>
		</AbsoluteFill>
	);
};

// ─── Escena 5: la pregunta (22,3-24,0 s) ────────────────────────────────
// Tarjeta a pantalla completa en Tinta: la pregunta es el beat y la
// pantalla entera la dice. Disuelve al salir (23,7-24,0).
const Pregunta: React.FC<{t: number}> = ({t}) => {
	const fadeOut = interpolate(t, [23.7, 24.0], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const scaleIn = interpolate(t, [22.3, 22.6], [0.95, 1], {
		easing: Easing.out(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	return (
		<AbsoluteFill
			style={{backgroundColor: TINTA, opacity: fadeOut}}
		>
			<div
				style={{
					position: 'absolute',
					left: 90,
					right: 90,
					top: 700,
					transform: `scale(${scaleIn})`,
					textAlign: 'center',
					fontFamily: "'Noto Serif Display', serif",
					fontWeight: 900,
					fontSize: 72,
					lineHeight: 1.3,
					color: PAPEL,
				}}
			>
				¿POR QUÉ SE LO
				<br />
				CREYÓ TANTA
				<br />
				GENTE?
			</div>
		</AbsoluteFill>
	);
};

// ─── Escena 6: la Casa Blanca (24,0-29,9 s) ─────────────────────────────
// Foto DT-1261 ENTERA (1920x1280 a 1080 de ancho -> 720 de alto,
// y=450), con fondo difuminado. Nunca se recorta dentro de la foto
// (condiciones EXIF). Resaltado suave sobre el torso de Messi
// (24,0-25,5 s, glow radial centrado en (350, 950), SIN tocar su
// cara), placa de fuente a 25,75 s y negación a 28,51 s.
const CasaBlanca: React.FC<{t: number}> = ({t}) => {
	// Zoom lento y constante 100 -> 108% durante la escena.
	const zoom = interpolate(t, [24.0, 29.9], [1, 1.08], {
		easing: Easing.linear,
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const glowOpacity =
		interpolate(t, [24.0, 24.3], [0, 1], {
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
		}) *
		interpolate(t, [25.3, 25.5], [1, 0], {
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
		});
	const plateOpacity = interpolate(t, [25.75, 25.9], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const negationOpacity = interpolate(t, [28.51, 28.66], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const negationScale = interpolate(t, [28.51, 28.66], [0.9, 1], {
		easing: Easing.out(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	// Oscurece la foto cuando aparece la negación para que el texto
	// contraste (desde la misma banda de karaoke que usa la voz).
	const dim = interpolate(t, [28.51, 28.66], [0, 0.55], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	return (
		<AbsoluteFill>
			<BlurFill src={CASA_BLANCA} brightness={0.35} />
			<div
				style={{
					position: 'absolute',
					left: 0,
					top: 450,
					width: 1080,
					height: 720,
					transform: `scale(${zoom})`,
					transformOrigin: '540px 360px',
				}}
			>
				<Img src={staticFile(CASA_BLANCA)} style={{width: 1080, height: 720}} />
				{/* Resaltado suave sobre el torso de Messi: glow radial
				    amarillo (opacidad máx. 0,28) centrado en su torso
				    (350, 950 absoluto = 350, 500 en la imagen), radio
				    ~190x230: su borde superior queda en y=720, por
				    debajo de su mentón (~y=692). NO cubre su cara. */}
				<div
					style={{
						position: 'absolute',
						left: 160,
						top: 270,
						width: 380,
						height: 460,
						borderRadius: '50%',
						background:
							'radial-gradient(ellipse at center, rgba(255,214,10,0.45) 0%, rgba(255,214,10,0.18) 55%, rgba(255,214,10,0) 75%)',
						opacity: glowOpacity,
					}}
				/>
			</div>
			{/* Oscurecido al aparecer la negación. */}
			<div
				style={{
					position: 'absolute',
					inset: 0,
					backgroundColor: `rgba(0,0,0,${dim})`,
				}}
			/>
			<Pill
				fontSize={26}
				style={{position: 'absolute', left: 230, top: 410, opacity: plateOpacity}}
			>
				5 DE MARZO DE 2026 · CASA BLANCA
			</Pill>
			<div
				style={{
					position: 'absolute',
					left: 90,
					right: 90,
					top: 950,
					opacity: negationOpacity,
					transform: `scale(${negationScale})`,
					backgroundColor: 'rgba(26,26,46,0.88)',
					borderRadius: 18,
					padding: '20px 20px',
					textAlign: 'center',
					fontFamily: "'Noto Sans', sans-serif",
					fontWeight: 700,
					fontSize: 58,
					lineHeight: 1.25,
					color: PAPEL,
				}}
			>
				PERO NO HABLÓ DE CUBA
			</div>
		</AbsoluteFill>
	);
};

// ─── Escena 7: el trío (29,9-32,6 s) ────────────────────────────────────
// «Lo mismo con Bukele, con Musk, con Bad Bunny.» Tres tarjetas que
// aparecen una a una con cada nombre, en la misma composición vertical
// (izquierda, centro, derecha).
// Fila horizontal como en el FB (tarjetas 320x460, top 450):
// la cascada diagonal que tenía el YT ponía la tarjeta de Bukele
// bajo la marca de agua (letras LIBRETO sobre la cara) y la de
// Bad Bunny bajo la banda de karaoke. Pre-vuelo 23-nov: BLOQUEANTE
// text-on-face en Trío; la fila queda entre la marca (abajo 400)
// y el karaoke (arriba 1100). Tiempos de pop: los de la VO YT.
const Trio: React.FC<{t: number}> = ({t}) => {
	const cards = [
		{src: BUKELE, x: 30, label: 'BUKELE', s: 30.35},
		{src: MUSK, x: 380, label: 'MUSK', s: 31.07},
		{src: BAD_BUNNY, x: 730, label: 'BAD BUNNY', s: 31.73},
	];
	return (
		<AbsoluteFill style={{backgroundColor: TINTA}}>
			{cards.map((c, i) => {
				const pop = t >= c.s
					? interpolate(t - c.s, [0, 0.27], [0.7, 1], {
							easing: Easing.out(Easing.back(1.6)),
							extrapolateLeft: 'clamp',
							extrapolateRight: 'clamp',
						})
					: 0.7;
				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: c.x,
							top: 450,
							width: 320,
							height: 460,
							backgroundColor: '#FFFFFF',
							borderRadius: 16,
							boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
							opacity: t >= c.s ? 1 : 0,
							transform: `scale(${pop})`,
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
							<Img
								src={staticFile(c.src)}
								style={{width: 300, objectFit: 'contain'}}
							/>
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
							{c.label}
						</div>
					</div>
				);
			})}
			{/* Etiqueta de sección del patrón. */}
			<div
				style={{
					position: 'absolute',
					left: 90,
					right: 90,
					top: 1320,
					textAlign: 'center',
					fontFamily: "'Noto Sans', sans-serif",
					fontWeight: 700,
					fontSize: 34,
					color: RESALTADOR,
					letterSpacing: 4,
				}}
			>
				EL MISMO PATRÓN
			</div>
		</AbsoluteFill>
	);
};

// ─── Escena 8: el veredicto (32,6-37,0 s) ───────────────────────────────
// Fondo Papel. El sello FALSO cae a 32,81 s (al onset de la palabra);
// las dos líneas aparecen con la VO: 33,72 y 35,01.
const Veredicto: React.FC<{t: number}> = ({t}) => {
	const stampScale = interpolate(t, [32.81, 32.93], [1.3, 1], {
		easing: Easing.out(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const stampOpacity = t >= 32.81 ? 1 : 0;
	const line1Opacity = interpolate(t, [33.72, 33.87], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const line1Y = interpolate(t, [33.72, 33.87], [20, 0], {
		easing: Easing.out(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const line2Opacity = interpolate(t, [35.01, 35.16], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const line2Y = interpolate(t, [35.01, 35.16], [20, 0], {
		easing: Easing.out(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	return (
		<AbsoluteFill style={{backgroundColor: PAPEL}}>
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
					border: `8px solid ${ROJO}`,
					borderRadius: 16,
					fontFamily: "'Noto Serif Display', serif",
					fontWeight: 900,
					fontSize: 170,
					color: ROJO,
					transform: `rotate(-6deg) scale(${stampScale})`,
					opacity: stampOpacity,
				}}
			>
				FALSO
			</div>
			<div
				style={{
					position: 'absolute',
					left: 90,
					right: 90,
					top: 1000,
					opacity: line1Opacity,
					transform: `translateY(${line1Y}px)`,
					textAlign: 'center',
					fontFamily: "'Noto Sans', sans-serif",
					fontWeight: 700,
					fontSize: 56,
					lineHeight: 1.3,
					color: TINTA,
				}}
			>
				El mensaje no existe.
			</div>
			<div
				style={{
					position: 'absolute',
					left: 90,
					right: 90,
					top: 1110,
					opacity: line2Opacity,
					transform: `translateY(${line2Y}px)`,
					textAlign: 'center',
					fontFamily: "'Noto Sans', sans-serif",
					fontWeight: 700,
					fontSize: 56,
					lineHeight: 1.3,
					color: TINTA,
				}}
			>
				La foto está editada.
			</div>
		</AbsoluteFill>
	);
};

// ─── Escena 9: el cierre (37,0-43,0 s) ─────────────────────────────────
// La pregunta de marca («¿Quién escribió el libreto?») + el sello que
// viaja a la esquina (37,0-37,5) + la píldora de fuente (37,0) y la
// end card (40,5-43,0) con el logo, SUSCRÍBETE y el puente al largo.
const Cierre: React.FC<{t: number}> = ({t}) => {
	const cardOpacity = interpolate(t, [40.5, 40.8], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	// El sello viaja de su posición del veredicto (centro, y 660) a
	// la derecha (escala 0,32, 37,0-37,5 s) y se desvanece al entrar
	// la end card. Corrección pre-vuelo 23-nov: con stampY 245 el
	// sello quedaba en y 993-1076 y la píldora de fuente (top 1050)
	// lo tapaba por la mitad; con 130 queda en y 878-962, libre.
	const travel = interpolate(t, [37.0, 37.5], [0, 1], {
		easing: Easing.inOut(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const stampX = 340 * travel;
	const stampY = 130 * travel;
	const stampScale = 1 - 0.68 * travel;
	const stampOpacity =
		1 * interpolate(t, [40.5, 40.7], [1, 0], {
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
		});
	const questionOpacity = interpolate(t, [37.0, 37.2], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const questionY = interpolate(t, [40.5, 40.8], [600, 430], {
		easing: Easing.inOut(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const sourceOpacity = interpolate(t, [37.0, 37.2], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	return (
		<AbsoluteFill>
			<BlurFill src={POST} brightness={0.3} />
			{/* Captura del post atenuada al fondo. */}
			<div style={{position: 'absolute', left: 0, top: 420, width: 1080, height: 1003, opacity: 0.35}}>
				<Img src={staticFile(POST)} style={{width: 1080, height: 1003}} />
			</div>
			{/* Sello FALSO viajando a la esquina. */}
			<div
				style={{
					position: 'absolute',
					left: 190 + stampX,
					top: 660 + stampY,
					width: 700,
					height: 260,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					border: `8px solid ${ROJO}`,
					borderRadius: 16,
					fontFamily: "'Noto Serif Display', serif",
					fontWeight: 900,
					fontSize: 170,
					color: ROJO,
					transform: `rotate(-6deg) scale(${stampScale})`,
					transformOrigin: 'center center',
					opacity: stampOpacity,
					backgroundColor: 'rgba(245,241,232,0.85)',
				}}
			>
				FALSO
			</div>
			{/* La pregunta de marca. */}
			<div
				style={{
					position: 'absolute',
					left: 90,
					right: 90,
					top: questionY,
					opacity: questionOpacity,
					textAlign: 'center',
					fontFamily: "'Noto Serif Display', serif",
					fontWeight: 900,
					fontSize: 72,
					lineHeight: 1.3,
					color: PAPEL,
					textShadow: '0 4px 24px rgba(0,0,0,0.8)',
				}}
			>
				¿Quién escribió
				<br />
				el libreto?
			</div>
			{/* Píldora de fuente (26 px, por encima del mínimo de 24). */}
			<Pill
				fontSize={26}
				style={{
					position: 'absolute',
					left: 65,
					right: 65,
					top: 1050,
					opacity: sourceOpacity,
				}}
			>
				Verificado por elTOQUE, 17-mar-2026 · InfoVeritas, 19-mar-2026
			</Pill>
			{/* End card: overlay Tinta + logo + SUSCRÍBETE + puente. */}
			<div
				style={{
					position: 'absolute',
					inset: 0,
					backgroundColor: TINTA,
					opacity: cardOpacity,
				}}
			/>
			<Img
				src={staticFile(LOCKUP)}
				style={{
					position: 'absolute',
					left: 190,
					top: 650,
					width: 700,
					height: 156,
					opacity: cardOpacity,
				}}
			/>
			<Pill
				bg={RESALTADOR}
				color={TINTA}
				fontSize={32}
				style={{position: 'absolute', left: 408, top: 1150, opacity: cardOpacity}}
			>
				SUSCRÍBETE
			</Pill>
			<div
				style={{
					position: 'absolute',
					left: 90,
					right: 90,
					top: 1260,
					opacity: cardOpacity,
					textAlign: 'center',
					fontFamily: "'Noto Sans', sans-serif",
					fontWeight: 400,
					fontSize: 30,
					color: PAPEL,
				}}
			>
				El patrón completo, en el video largo
			</div>
		</AbsoluteFill>
	);
};

export const MainReel: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;

	// Cortes por FOTOGRAMA (lección del FB: el corte por tiempo
	// retrasaba el cierre un fotograma y daba GHOST).
	// f0-389 post · f390-668 comparación · f669-719 pregunta ·
	// f720-896 Casa Blanca · f897-977 trío · f978-1109 veredicto ·
	// f1110-1289 cierre.
	const scene =
		frame < 390 ? (
			<PostScenes t={t} />
		) : frame < 669 ? (
			<Comparacion t={t} />
		) : frame < 720 ? (
			<Pregunta t={t} />
		) : frame < 897 ? (
			<CasaBlanca t={t} />
		) : frame < 978 ? (
			<Trio t={t} />
		) : frame < 1110 ? (
			<Veredicto t={t} />
		) : (
			<Cierre t={t} />
		);

	return (
		<AbsoluteFill style={{backgroundColor: TINTA}}>
			{scene}
			{/* Marca de agua: lockup icono + LIBRETO, arriba-izquierda,
			    desde el fotograma 0 (decisión de marca 23-nov). */}
			<Img
				src={staticFile(LOCKUP)}
				style={{
					position: 'absolute',
					left: 65,
					top: 300,
					height: 100,
					width: 449,
					filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.45))',
				}}
			/>
			<LibretoKaraoke />
			{/* Barra de progreso inferior. */}
			<div
				style={{
					position: 'absolute',
					left: 0,
					bottom: 0,
					height: 8,
					width: (1080 * t) / 43,
					backgroundColor: RESALTADOR,
				}}
			/>
		</AbsoluteFill>
	);
};
