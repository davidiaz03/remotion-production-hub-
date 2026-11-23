// El Libreto — Messi nunca dijo esto sobre Cuba (Facebook Reel, 30 s).
// 1080x1920, 30 fps, 900 fotogramas. Toda la banda sonora está en la
// mezcla (mix.wav: VO + cama Flow Music + SFX); la composición es
// solo video. El video de la Casa Blanca va MUDO (OffthreadVideo con
// volume 0): aporta imagen en movimiento, nunca audio.
// Zonas seguras Meta: texto dentro de x 65-1015, y 269-1248.
// NUNCA texto sobre una cara. La foto de la Casa Blanca (DT-1261) se
// muestra ENTERA (fondo difuminado detrás), nunca recortada dentro.
// V2 (auditoría H1-H11, 23-nov-2026): video real en la Casa Blanca,
// karaoke oculto donde el texto grande ES el caption, contador
// sincronizado, placa reposicionada, cierre rediseñado con CTA con
// motivo, push-in en el veredicto y transiciones rápidas.
import React from 'react';
import {
	AbsoluteFill,
	Easing,
	Img,
	OffthreadVideo,
	Sequence,
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
const CASA_BLANCA_VIDEO = 'video/casa-blanca-bienvenida-messi-15s.mp4';
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
	// H4 (v2): la caja aparece CON el inicio de la cuenta (3,66 s),
	// no 0,7 s antes: en la v1 se leía «0 REACCIONES». Al aparecer,
	// el número ya está subiendo (a 3,81 s va por ~19.000).
	const counterOpacity =
		interpolate(t, [3.66, 3.81], [0, 1], {
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
						{/* Resaltado sobre «José Forever - El Taiger».
						    Coords de DISPLAY de la captura (1080x1003):
						    el nombre mide x 124-398, y 44-81 (medido en
						    la captura original 670x621: x 77-247,
						    y 27-50, escala 1,612). La caja anterior
						    (x 90-305, y 20-50) quedaba arriba y a la
						    izquierda del nombre. Escala con el zoom. */}
						<div
							style={{
								position: 'absolute',
								left: 118,
								top: 40,
								width: 286,
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
	// Mitades que entran desde lados opuestos (10,07-10,37 s). El slide
	// arranca con la transición T1 (f302) y termina en f311: en el
	// corte f309 las mitades ya están al ~99% (ease-out cúbico), que
	// es lo que ghost-frames exige (la escena nueva completa en
	// B..B+3). Además sincroniza con la VO: L3 empieza a 10,44 s.
	const slide = interpolate(t, [10.07, 10.37], [0, 1], {
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

	// Etiquetas 10,4-12,8; placa 12,8-13,9; sello 2022 cae a 12,4.
	const labelsOpacity =
		interpolate(t, [10.4, 10.55], [0, 1], {
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

			{/* Placa con la fuente de la foto original. H5 (v2): en la v1
			    iba en una línea a la izquierda (x 190, y 435) y tapaba
			    la píldora «Original» de la imagen fuente (x 568-670).
			    Ahora va en DOS líneas arriba a la derecha (x ~550-1015,
			    y 320-409): fuera de la imagen (empieza en y 420), a la
			    derecha de la marca de agua (termina en x 514, medida
			    en el still f505) y sin tocar ninguna cara. Fuente 24
			    (mínimo de píldora de fuente) + padding 18: a 26 px la
			    placa medía ~509 px y su borde izquierdo (x~506)
			    tapaba el extremo derecho de la píldora de la marca de
			    agua. Las etiquetas «EL POST» / «DIC 2022»
			    ya se desvanecieron a 12,8 s; la píldora de Gemini no
			    aparece hasta 14,5 s: sin solapes temporales. */}
			<div
				style={{
					position: 'absolute',
					right: 65,
					top: 320,
					opacity: plateOpacity,
					backgroundColor: 'rgba(26,26,46,0.85)',
					borderRadius: 16,
					padding: '12px 18px',
					textAlign: 'center',
					fontFamily: "'Noto Sans', sans-serif",
					fontWeight: 700,
					fontSize: 24,
					lineHeight: 1.35,
					color: PAPEL,
				}}
			>
				<div>4-DIC-2022</div>
				<div>INSTAGRAM DE ANTONELA ROCCUZZO</div>
			</div>

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
// H1 (v2): VIDEO REAL de la bienvenida en la Casa Blanca (dominio
// público, corte 575-590 s del acto del 5-mar-2026), MUDO (volume 0:
// todo el audio está en mix.wav). La v1 usaba solo la foto DT-1261.
// El clip es 640x360 y lleva el faldón oficial «TEXT POTUS TO 45470»
// en el tercio inferior: el contenedor recorta a 480 px de alto
// (1080x480, y 465-945) para no mostrarlo. El faldón blanco empieza
// en y~493 del video a 608 de alto (medido en el fotograma f505:
// una franja blanca de 5 px asomaba con el contenedor a 500 px);
// con 480 px queda >=13 px por debajo del borde en toda la escena
// (a escala 1,06 el faldón baja a ~505). Fondo difuminado con la
// foto DT-1261 detrás (la foto sigue en la escena, como ambiente);
// nunca estirar el video a pantalla completa. Push-in lento 1->1,06
// sobre el video. Caras del video en y ~556-739: la negación va en
// y 950-1120 y el karaoke se oculta durante ese beat (18,54-19,5 s).
// La Sequence anidada pone el reloj local en 0: el clip corre 0-4,3 s.
const CasaBlanca: React.FC<{t: number}> = ({t}) => {
	const zoom = interpolate(t, [15.2, 19.5], [1, 1.06], {
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
			{/* Video 1080x608 dentro de un contenedor de 480 px: el
			    recorte inferior esconde el faldón «TEXT POTUS» (su
			    borde blanco empieza en y~493 del video; con 500 px
			    asomaban 5 px). Con el push-in (escala sobre el
			    centro) el faldón baja aún más: nunca asoma. */}
			<div style={{position: 'absolute', left: 0, top: 465, width: 1080, height: 480, overflow: 'hidden'}}>
				<Sequence from={456} durationInFrames={129} name="CasaBlancaVideo">
					<div
						style={{
							width: 1080,
							height: 608,
							transform: `scale(${zoom})`,
							transformOrigin: '540px 304px',
						}}
					>
						<OffthreadVideo
							src={staticFile(CASA_BLANCA_VIDEO)}
							muted
							volume={0}
							style={{width: 1080, height: 608, objectFit: 'fill'}}
						/>
					</div>
				</Sequence>
			</div>
			{/* Velo para la negación: oscurece el pie del video y la
			    zona del texto (465-1140) con degradado, sin tocar las
			    caras (terminan en y ~739). */}
			<div
				style={{
					position: 'absolute',
					left: 0,
					top: 465,
					width: 1080,
					height: 675,
					background:
						'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.25) 55%, rgba(0,0,0,0.55) 100%)',
					opacity: negOpacity,
				}}
			/>

			<Pill fontSize={28} style={{position: 'absolute', left: 230, top: 410}}>
				5 DE MARZO DE 2026 · CASA BLANCA
			</Pill>

			{/* La negación: debajo del video (termina en y 945) y de
			    las caras. El karaoke se oculta durante este beat
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
	// H7 (v2): push-in lento 1->1,06 tras la caída del sello (23,27 s):
	// en la v1 la escena quedaba congelada 1,9 s.
	const pushIn = interpolate(t, [23.27, 25.15], [1, 1.06], {
		easing: Easing.out(Easing.quad),
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
						transform: `rotate(-8deg) scale(${stampScale * pushIn})`,
					}}
				>
					FALSO
				</div>
			)}
		</AbsoluteFill>
	);
};

// ─── Escena 8: cierre (25,15-30 s) ───────────────────────────────────────
// H6 (v2): rediseño completo. Problemas de la v1: logo LIBRETO dos veces
// (marca de agua + logo grande — la marca de agua se desvanece a 27,5,
// ver MainReel), tercio inferior vacío, últimos 2 s congelados, CTA
// débil («COMPARTE» sin motivo) y pregunta sobre el texto del post.
// V2: la pregunta va en panel sólido (nada de texto sobre texto); un
// solo CTA con motivo («SÍGUENOS» + «El próximo bulo, desmentido
// aquí.»); composición vertical con ritmo (pregunta, logo, CTA,
// motivo, fuente) hasta y 1130; movimiento continuo hasta f900 (zoom
// lento del post, pulso del CTA, respiración del logo); la end card
// deja traslucir el post al 12% para que el último fotograma rime con
// el primero (loop) y la cama sigue sonando bajo el corte. La end card
// señalizada dura 2,5 s (27,5-30); el veredicto respira antes del CTA.
// T3 (H9): el corte en 25,15 s es duro (ghost-frames exige la escena
// nueva completa en el fotograma del corte; el fundido de papel que
// había aquí marcaba GHOST en f754). La entrada con movimiento la dan
// el viaje del sello y la deriva lenta del post.
const Cierre: React.FC<{t: number}> = ({t}) => {
	// Deriva lenta del post hasta f900.
	const postZoom = interpolate(t, [25.15, 30], [1, 1.04], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	// El sello viaja del centro a la esquina inferior derecha (25,15-25,6)
	// y se desvanece ANTES de la end card (26,8-27,1) para no cruzarse
	// con el CTA.
	const travel = interpolate(t, [25.15, 25.6], [0, 1], {
		easing: Easing.inOut(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const miniTx = 340 * travel;
	const miniTy = 245 * travel;
	const miniScale = 1 - 0.68 * travel;
	const miniOpacity = interpolate(t, [26.8, 27.1], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	// La pregunta aparece a 25,6 y sube a 27,5 para dejar sitio al logo.
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

	// End card (27,5-30): el fondo Tinta llega al 0,88 (el post se
	// trasluce: rima con el primer fotograma); el contenido, al 1.
	const endBg = interpolate(t, [27.5, 27.8], [0, 0.88], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const endFg = interpolate(t, [27.5, 27.8], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const logoScale = interpolate(t, [27.5, 27.8], [0.9, 1], {
		easing: Easing.out(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	// Respiración lenta del logo hasta f900.
	const logoBreathe = interpolate(t, [27.8, 30], [1, 1.02], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	// Pulso sutil del CTA (periodo 1 s) hasta f900.
	const ctaPulse =
		t >= 27.8
			? 1 + 0.03 * (0.5 + 0.5 * Math.sin(2 * Math.PI * (t - 27.8)))
			: 1;

	return (
		<AbsoluteFill>
			<BlurFill src={POST} brightness={0.35} />
			{/* Captura atenuada con el mismo recorte vertical que el
			    gancho (sin las caras de la foto), con deriva lenta. */}
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
					transform: `scale(${postZoom})`,
					transformOrigin: '540px 501.5px',
				}}
			/>
			</div>
			{/* Fondo Tinta de la end card (debajo del texto). */}
			<div
				style={{
					position: 'absolute',
					inset: 0,
					backgroundColor: TINTA,
					opacity: endBg,
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

			{/* Pregunta de marca, en panel sólido (nada de texto sobre
			    el texto del post). */}
			<div
				style={{
					position: 'absolute',
					left: 65,
					right: 65,
					top: qTop + qRise,
					opacity: qOpacity,
					backgroundColor: 'rgba(26,26,46,0.85)',
					borderRadius: 18,
					padding: '20px 28px',
					textAlign: 'center',
					fontFamily: "'Noto Serif Display', serif",
					fontWeight: 900,
					fontSize: 72,
					lineHeight: 1.15,
					color: PAPEL,
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
					opacity: endFg,
					transform: `scale(${logoScale * logoBreathe})`,
					transformOrigin: 'center center',
				}}
			>
				<Img src={staticFile(LOCKUP)} style={{width: 700}} />
			</div>

			{/* CTA con motivo: un solo objetivo, una sola acción. */}
			<div
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					top: 880,
					display: 'flex',
					justifyContent: 'center',
					opacity: endFg,
					transform: `scale(${ctaPulse})`,
					transformOrigin: 'center center',
				}}
			>
				<Pill bg={RESALTADOR} color={TINTA} fontSize={40}>
					SÍGUENOS
				</Pill>
			</div>
			<div
				style={{
					position: 'absolute',
					left: 65,
					right: 65,
					top: 975,
					opacity: endFg,
					textAlign: 'center',
					fontFamily: "'Noto Sans', sans-serif",
					fontWeight: 700,
					fontSize: 30,
					color: PAPEL,
				}}
			>
				El próximo bulo, desmentido aquí.
			</div>

			{/* Fuente. */}
			<Pill
				fontSize={28}
				style={{position: 'absolute', left: 240, top: 1080, opacity: sourceOpacity}}
			>
				Verificado por elTOQUE, 17-mar-2026
			</Pill>
		</AbsoluteFill>
	);
};

// ─── Composición ─────────────────────────────────────────────────────────
// Envoltorio para transiciones: escala + opacidad sobre la escena.
const XScene: React.FC<{
	scale?: number;
	opacity?: number;
	children: React.ReactNode;
}> = ({scale = 1, opacity = 1, children}) => (
	<div
		style={{
			position: 'absolute',
			inset: 0,
			transform: `scale(${scale})`,
			transformOrigin: '540px 960px',
			opacity,
		}}
	>
		{children}
	</div>
);

export const MainReel: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;

	// H9 (v2): transiciones zoom-cross rápidas (0,23 s) en los dos
	// cortes de más contraste. T1: post -> comparación (f302-309).
	// T2: trío -> veredicto (f671-678). La transición TERMINA en el
	// corte: en el fotograma B la escena nueva ya está completa.
	// (ghost-frames exige d_nueva < 0,07 en B..B+3: una transición
	// que empezara en B dejaría B como la escena vieja y el check
	// la marcaría GHOST. El fundido previo al corte es invisible
	// para el check: solo examina B..B+3 y la ref previa no decide
	// el veredicto cuando d_nueva es OK.) El whoosh de T1 barre
	// justo sobre la transición (10,07-10,3 s) y pica al llegar la
	// escena nueva. T3: el cierre entra con corte duro (como en la
	// v1, que pasaba el check) + el viaje del sello y la deriva del
	// post como movimiento de entrada. Los límites de escena
	// coinciden con preflight-scenes.json.
	const t1p = interpolate(frame, [302, 309], [0, 1], {
		easing: Easing.inOut(Easing.quad),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const t2p = interpolate(frame, [671, 678], [0, 1], {
		easing: Easing.inOut(Easing.quad),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	// H6 (v2): la marca de agua se desvanece cuando entra el logo grande
	// de la end card (27,5 s): nada de LIBRETO dos veces.
	const wmOpacity = interpolate(t, [27.5, 27.8], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	return (
		<AbsoluteFill style={{backgroundColor: TINTA}}>
			{/* Cortes por FOTOGRAMA (no por segundos): 25,15 s cae entre
			    f754 y f755 (754,5) y un condicional por tiempo retrasa
			    el corte un fotograma, lo que ghost-frames marca como
			    GHOST. Los límites coinciden con preflight-scenes.json. */}
			{frame < 309 && (
				<XScene scale={interpolate(t1p, [0, 1], [1, 1.12])} opacity={1 - t1p}>
					<PostScenes t={t} />
				</XScene>
			)}
			{frame >= 302 && frame < 456 && (
				<XScene scale={interpolate(t1p, [0, 1], [0.94, 1])} opacity={t1p}>
					<Comparacion t={t} />
				</XScene>
			)}
			{frame >= 456 && frame < 585 && <CasaBlanca t={t} />}
			{frame >= 585 && frame < 678 && (
				<XScene scale={interpolate(t2p, [0, 1], [1, 1.1])} opacity={1 - t2p}>
					<Trio t={t} frame={frame} fps={fps} />
				</XScene>
			)}
			{frame >= 671 && frame < 754 && (
				<XScene scale={interpolate(t2p, [0, 1], [1.08, 1])} opacity={t2p}>
					<Veredicto t={t} />
				</XScene>
			)}
			{frame >= 754 && <Cierre t={t} />}

			<LibretoKaraoke />

			{/* Marca de agua: lockup, arriba-izquierda, desde el fotograma 0. */}
			<Img
				src={staticFile(LOCKUP)}
				style={{position: 'absolute', left: 65, top: 300, height: 100, opacity: wmOpacity}}
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
