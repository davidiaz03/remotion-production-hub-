// El Libreto — ¿Quién Compra el Combustible de Cuba? (YouTube Short, 46,5 s).
// 1080x1920, 30 fps, 1395 fotogramas. Toda la banda sonora está en la
// mezcla (mix.wav: VO + cama Flow Music + SFX); la composición es
// solo video. El video del buque tanque va MUDO (OffthreadVideo con
// volume 0): aporta imagen en movimiento, nunca audio.
// Zonas seguras: texto dentro de x 65-1015, y 269-1248.
// NUNCA texto sobre una cara. El gráfico de Estíu (621x702, baja
// resolución) se muestra con fondo difuminado detrás, nunca a pantalla
// completa. Los totales (156,8M / 284,4M) los publica el Council en la
// página web de cada informe, no dentro del PDF: en pantalla se cita
// «U.S.-Cuba Trade and Economic Council, datos del U.S. Census Bureau».
// Veredicto: SIN CONTEXTO (la palabra «FALSO» no aparece en la voz).
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

const ESTIU = 'img/grafico-viral-esti-u.jpg';
const PROTO = 'img/grafico-viral-proto-news.jpg';
const COUNCIL_JUL = 'img/council-jul-p-01.png';
const COUNCIL_P3 = 'img/council-p-03.png';
const BUQUE_VIDEO = 'video/buque-tanque-aereo-3s.mp4';
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

// Decimal con coma (español): 156,8.
const fmtDec = (n: number) => n.toFixed(1).replace('.', ',');

// ─── Escena 1: el gancho (0-6,43 s) ──────────────────────────────────────
// El gráfico viral de Estíu (621x702 -> 1048x1184 en pantalla, con
// 16 px de margen por lado: el titular toca los dos bordes del
// original (x 0-620) y el punch-in 1,05 de la v1 recortaba la «C» de
// «Cuba» (27 px por lado). SIN punch: escala fija 1048/1080 para
// que el texto nunca toque el borde izquierdo.
// Medido (PIL, 23-nov-2026): titular azul L1 47-132, L2 162-249,
// L3 278-367, L4 400-487 («enero y julio de 2026.»); foto de
// tanques y 614-800; pregunta roja y 882-1219 (1ª línea 882-1012,
// 2ª línea 1083-1219; llega hasta el borde inferior de la imagen).
// La ventana es 776 de alto (inner 0-800): al inicio la pregunta
// queda FUERA (82 px de margen) y ningún texto se corta a medias
// en ningún fotograma de 0-5 s (v2: la ventana de 920 mostraba la
// 1ª línea cortada a media letra por el borde inferior).
// Paneo vertical del titular a la pregunta al empezar L2
// (4,52 s); círculo rojo sobre la pregunta a 5,2 s (lápiz SFX).
// La vista empieza en y 404 (no 380): con el paneo, el titular
// subía bajo la marca de agua (y 300-400) y la píldora tapaba una
// línea; el paneo compensa (-500) para que la pregunta termine
// entera en la ventana (display 775-1102) y la 4ª línea del
// titular (inner 400-487) quede FUERA por arriba (con -430 la
// 4ª línea quedaba cortada a media letra en el reposo del paneo).
const Gancho: React.FC<{t: number}> = ({t}) => {
	// Paneo 0 -> -500 (4,52-5,24 s): al final se ve inner 500-1220
	// (la pregunta entera, display 775-1102; la 4ª línea del
	// titular queda 13 px por encima del borde superior).
	const pan = interpolate(t, [4.52, 5.24], [0, -500], {
		easing: Easing.inOut(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	// Círculo sobre la pregunta (elipse rx 500 ry 150, centro en
	// coords de imagen (540, 1070); perímetro ≈ 2193). Se dibuja
	// 5,2-5,7 s. Va DENTRO del div del paneo: se mueve con la imagen.
	const circleP = interpolate(t, [5.2, 5.7], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const dashOffset = 2193 * (1 - circleP);

	return (
		<AbsoluteFill>
			<BlurFill src={ESTIU} />
			<div style={{position: 'absolute', left: 16, top: 404, width: 1048, height: 776, overflow: 'hidden'}}>
				<div
					style={{
						width: 1080,
						height: 1220,
						transform: 'scale(0.97037)',
						transformOrigin: '0px 0px',
					}}
				>
					<div
						style={{
							width: 1080,
							height: 1220,
							transform: `translateY(${pan}px)`,
						}}
					>
						<Img src={staticFile(ESTIU)} style={{width: 1080, height: 1220}} />
						<svg
							style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}
							width={1080}
							height={1220}
						>
							<ellipse
								cx={540}
								cy={1070}
								rx={500}
								ry={150}
								fill="none"
								stroke={ROJO}
								strokeWidth={6}
								strokeDasharray={2193}
								strokeDashoffset={dashOffset}
								strokeLinecap="round"
								opacity={t >= 5.2 ? 1 : 0}
							/>
						</svg>
					</div>
				</div>
			</div>

			{/* Píldora de sección, arriba a la derecha. */}
			<Pill
				bg={RESALTADOR}
				color={TINTA}
				fontSize={28}
				style={{position: 'absolute', right: 65, top: 310}}
			>
				EL NÚMERO
			</Pill>
		</AbsoluteFill>
	);
};

// ─── Escena 2: el documento (6,47-12,7 s) ────────────────────────────────
// Portada del informe del Council (datos de julio 2026). La línea
// «Trump-Vance Administration Fuels Authorization - US$61.140.685»
// está en x 247-1028, y 488-522 del original (1275x1650); en la
// portada a 760 de ancho: x 147-613, y 291-311, centro (380, 301).
// Zoom 1 -> 1,35 sobre esa línea (8,02-9,22 s, con L4 «Yo fui al
// documento»); resaltado amarillo sobre la línea (8,14 s); píldora
// «DATOS DE JULIO 2026» (9,76 s); contador 156,8 -> 284,4 que
// aterriza a 12,66 s con L7 (el karaoke está oculto: el contador ES
// el caption).
const Documento: React.FC<{t: number}> = ({t}) => {
	const zoom = interpolate(t, [8.02, 9.22], [1, 1.35], {
		easing: Easing.inOut(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const highlightOpacity = interpolate(t, [8.14, 8.29], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const pillJulOpacity =
		interpolate(t, [9.76, 9.91], [0, 1], {
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
		}) *
		interpolate(t, [10.66, 10.81], [1, 0], {
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
		});
	const pillSepOpacity = interpolate(t, [10.66, 10.81], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const counterOpacity = interpolate(t, [10.66, 10.81], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	// Contador 156,8 -> 284,4 entre 10,66 y 12,66 (aterriza al
	// terminar «millones», 12,72); luego se queda fijo hasta el corte.
	const count = interpolate(t, [10.66, 12.66], [156.8, 284.4], {
		easing: Easing.out(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	return (
		<AbsoluteFill>
			<BlurFill src={COUNCIL_JUL} brightness={0.4} />
			<div style={{position: 'absolute', left: 0, top: 380, width: 1080, height: 1020, overflow: 'hidden'}}>
				<div
					style={{
						position: 'absolute',
						left: 160,
						top: 20,
						width: 760,
						height: 983,
						transform: `scale(${zoom})`,
						transformOrigin: '380px 301px',
					}}
				>
					<Img src={staticFile(COUNCIL_JUL)} style={{width: 760, height: 983}} />
					{/* Resaltado sobre la línea Fuels Authorization. */}
					<div
						style={{
							position: 'absolute',
							left: 140,
							top: 287,
							width: 480,
							height: 28,
							backgroundColor: RESALTADOR,
							opacity: 0.55 * highlightOpacity,
							borderRadius: 4,
						}}
					/>
				</div>
			</div>

			<Pill
				fontSize={26}
				style={{position: 'absolute', right: 65, top: 310, opacity: pillJulOpacity}}
			>
				DATOS DE JULIO 2026
			</Pill>
			<Pill
				bg={RESALTADOR}
				color={TINTA}
				fontSize={26}
				style={{position: 'absolute', right: 65, top: 310, opacity: pillSepOpacity}}
			>
				ACTUALIZADO A SEPTIEMBRE 2026
			</Pill>

			{/* Contador 156,8 -> 284,4. Panel compacto (top 980, alto
			    ~258): queda dentro de la zona segura (termina ~1238). */}
			<div
				style={{
					position: 'absolute',
					left: 140,
					right: 140,
					top: 980,
					opacity: counterOpacity,
					backgroundColor: 'rgba(26,26,46,0.82)',
					borderRadius: 18,
					padding: '16px 0 14px',
					textAlign: 'center',
				}}
			>
				<div
					style={{
						fontFamily: "'Noto Sans', sans-serif",
						fontWeight: 700,
						fontSize: 120,
						lineHeight: 1,
						color: PAPEL,
					}}
				>
					{fmtDec(count)}
				</div>
				<div
					style={{
						fontFamily: "'Noto Sans', sans-serif",
						fontWeight: 700,
						fontSize: 32,
						letterSpacing: 4,
						color: RESALTADOR,
						marginTop: 6,
					}}
				>
					MILLONES DE DÓLARES
				</div>
				<div
					style={{
						fontFamily: "'Noto Sans', sans-serif",
						fontWeight: 700,
						fontSize: 24,
						color: PAPEL,
						marginTop: 4,
					}}
				>
					COMBUSTIBLES · ENE–SEP 2026
				</div>
				<div
					style={{
						fontFamily: "'Noto Sans', sans-serif",
						fontWeight: 700,
						fontSize: 24,
						color: PAPEL,
						marginTop: 2,
					}}
				>
					U.S.-CUBA TRADE AND ECONOMIC COUNCIL
				</div>
			</div>
		</AbsoluteFill>
	);
};

// ─── Escena 3: quién compra (12,73-19,87 s) ──────────────────────────────
// PROTO NEWS (1296x1616), la segunda versión viral del gráfico:
// se muestra recortada al 88% superior (la franja inferior
// «Empresas privadas...» queda fuera: es la respuesta, y el beat
// es la pregunta). A 15,58 s («Lo interesante es quién compra»)
// aparece el panel «¿QUIÉN COMPRA?» arriba a la derecha. A 17,44 s
// («El gráfico no dice quién») el gráfico se atenúa y un círculo
// rojo tachado se dibuja sobre el titular. A 18,82 s («El documento
// sí») la pág. 3 del Council entra deslizando desde la derecha, el
// gráfico se encoge a tarjeta a la izquierda y el resaltado marca
// «not affiliated with the government» (escaneo SFX).
const QuienCompra: React.FC<{t: number}> = ({t}) => {
	// Panel «¿QUIÉN COMPRA?» (15,58 s).
	const qOpacity = interpolate(t, [15.58, 15.73], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const qScale = interpolate(t, [15.58, 15.73], [1.3, 1], {
		easing: Easing.out(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	// Atenuado del gráfico (17,44 s) + círculo tachado (17,44-17,94 s).
	const protoDim = interpolate(t, [17.44, 17.59], [1, 0.6], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const slashP = interpolate(t, [17.44, 17.94], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	// El círculo se desvanece al reordenar las tarjetas (18,82 s).
	const slashOpacity =
		(t >= 17.44 ? 1 : 0) *
		interpolate(t, [18.82, 18.97], [1, 0], {
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
		});
	const circleDash = 1131 * (1 - slashP);
	const lineOpacity = interpolate(t, [17.74, 17.89], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	// Reordenación SECUENCIAL (v2): en la v1 PROTO se encogía a la
	// izquierda y la pág. 3 entraba desde la derecha EN EL MISMO
	// intervalo (18,82-19,12 s) y las dos tarjetas se cruzaban por
	// el centro. Ahora PROTO se mueve primero (18,82-19,12 s) y la
	// página entra DESPUÉS (19,02-19,32 s): la página no se hace
	// visible hasta que PROTO ya está aparcada (su borde izquierdo
	// no cruza x=1080 hasta ~19,19 s). El resaltado aparece con la
	// página asentada (19,22-19,37 s); el SFX de escaneo se mueve
	// a 19,22 s en timeline.json. La tenencia de dos tarjetas
	// (19,32-19,87 s) sigue siendo de 0,55 s.
	const reorder = interpolate(t, [18.82, 19.12], [0, 1], {
		easing: Easing.inOut(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const protoLeft = interpolate(reorder, [0, 1], [230, 40]);
	const protoTop = interpolate(reorder, [0, 1], [420, 450]);
	const protoW = interpolate(reorder, [0, 1], [620, 420]);
	const protoH = interpolate(reorder, [0, 1], [680, 460]);
	const protoImgH = interpolate(reorder, [0, 1], [773, 524]);
	const docP = interpolate(t, [19.02, 19.32], [0, 1], {
		easing: Easing.inOut(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const docX = interpolate(docP, [0, 1], [1080, 0]);
	const docHighlightOpacity = interpolate(t, [19.22, 19.37], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	return (
		<AbsoluteFill>
			<BlurFill src={PROTO} brightness={0.4} />
			{/* PROTO NEWS recortada (sin la franja inferior). */}
			<div
				style={{
					position: 'absolute',
					left: protoLeft,
					top: protoTop,
					width: protoW,
					height: protoH,
					overflow: 'hidden',
					opacity: protoDim,
				}}
			>
				<Img
					src={staticFile(PROTO)}
					style={{width: protoW, height: protoImgH}}
				/>
				{/* Círculo tachado sobre el titular (coords del
				    contenedor a 620 de ancho: titular centrado en
				    (242, 556), r 180; perímetro 1131). */}
				<svg
					style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: slashOpacity}}
					width={620}
					height={680}
				>
					<circle
						cx={242}
						cy={556}
						r={180}
						fill="none"
						stroke={ROJO}
						strokeWidth={6}
						strokeDasharray={1131}
						strokeDashoffset={circleDash}
						strokeLinecap="round"
					/>
					<line
						x1={242 - 127}
						y1={556 - 127}
						x2={242 + 127}
						y2={556 + 127}
						stroke={ROJO}
						strokeWidth={6}
						strokeLinecap="round"
						opacity={lineOpacity}
					/>
				</svg>
			</div>

			{/* Pág. 3 del Council (tarjeta derecha). */}
			<div
				style={{
					position: 'absolute',
					left: 620,
					top: 450,
					width: 420,
					height: 544,
					transform: `translateX(${docX}px)`,
					opacity: t >= 19.02 ? 1 : 0,
				}}
			>
				<Img src={staticFile(COUNCIL_P3)} style={{width: 420, height: 544}} />
				{/* Resaltado sobre «not affiliated with the government»
				    (a 420 de ancho: x 48-372, y 205-223). */}
				<div
					style={{
						position: 'absolute',
						left: 44,
						top: 202,
						width: 330,
						height: 22,
						backgroundColor: RESALTADOR,
						opacity: 0.55 * docHighlightOpacity,
						borderRadius: 4,
					}}
				/>
			</div>

			{/* Panel «¿QUIÉN COMPRA?» arriba a la derecha (fontSize 48:
			    a 56 px su borde izquierdo rozaba la marca de agua). */}
			<div
				style={{
					position: 'absolute',
					right: 65,
					top: 300,
					opacity: qOpacity,
					transform: `scale(${qScale})`,
					transformOrigin: 'right center',
					backgroundColor: 'rgba(26,26,46,0.85)',
					borderRadius: 18,
					padding: '16px 24px',
					fontFamily: "'Noto Sans', sans-serif",
					fontWeight: 700,
					fontSize: 48,
					lineHeight: 1.15,
					color: PAPEL,
				}}
			>
				¿QUIÉN COMPRA?
			</div>
		</AbsoluteFill>
	);
};

// ─── Escena 4: la licencia (19,9-25,57 s) ────────────────────────────────
// La pág. 3 crece de tarjeta a documento completo (19,9-20,4 s,
// continuidad con la escena anterior: el mismo documento, la misma
// frase resaltada). L12 «No es el Estado.» va con karaoke. L13 va
// con texto grande (karaoke oculto): «EMPRESAS PRIVADAS» (21,62 s)
// y «APOYO AL PUEBLO CUBANO» (23,88 s) + píldora «LICENCIA SCP · BIS».
const Licencia: React.FC<{t: number}> = ({t}) => {
	// La página crece de tarjeta (420, izquierda 620, arriba 450) a
	// documento (760, izquierda 160, arriba 400).
	const grow = interpolate(t, [19.9, 20.4], [0, 1], {
		easing: Easing.inOut(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const pageLeft = interpolate(grow, [0, 1], [620, 160]);
	const pageTop = interpolate(grow, [0, 1], [450, 400]);
	const pageW = interpolate(grow, [0, 1], [420, 760]);
	const pageH = interpolate(grow, [0, 1], [544, 983]);
	// El resaltado crece con la página (de tarjeta a documento).
	const hlLeft = interpolate(grow, [0, 1], [44, 80]);
	const hlTop = interpolate(grow, [0, 1], [202, 368]);
	const hlW = interpolate(grow, [0, 1], [330, 600]);
	const hlH = interpolate(grow, [0, 1], [22, 40]);

	// Panel «EMPRESAS PRIVADAS» (21,62-23,88 s).
	const empOpacity =
		interpolate(t, [21.62, 21.77], [0, 1], {
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
		}) *
		interpolate(t, [23.88, 24.03], [1, 0], {
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
		});
	const empScale = interpolate(t, [21.62, 21.77], [1.3, 1], {
		easing: Easing.out(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	// Panel «APOYO AL PUEBLO CUBANO» (23,88 s).
	const apoOpacity = interpolate(t, [23.88, 24.03], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const apoScale = interpolate(t, [23.88, 24.03], [1.3, 1], {
		easing: Easing.out(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const scpOpacity = interpolate(t, [23.88, 24.03], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	return (
		<AbsoluteFill>
			<BlurFill src={COUNCIL_P3} brightness={0.4} />
			<div
				style={{
					position: 'absolute',
					left: pageLeft,
					top: pageTop,
					width: pageW,
					height: pageH,
				}}
			>
				<Img src={staticFile(COUNCIL_P3)} style={{width: pageW, height: pageH}} />
				{/* Resaltado sobre «not affiliated with the government». */}
				<div
					style={{
						position: 'absolute',
						left: hlLeft,
						top: hlTop,
						width: hlW,
						height: hlH,
						backgroundColor: RESALTADOR,
						opacity: 0.55,
						borderRadius: 4,
					}}
				/>
			</div>

			<Pill
				bg={RESALTADOR}
				color={TINTA}
				fontSize={26}
				style={{position: 'absolute', right: 65, top: 310, opacity: scpOpacity}}
			>
				LICENCIA SCP · BIS
			</Pill>

			{/* EMPRESAS PRIVADAS: el texto grande ES el caption del
			    chunk (karaoke oculto). */}
			<div
				style={{
					position: 'absolute',
					left: 65,
					right: 65,
					top: 1000,
					opacity: empOpacity,
					transform: `scale(${empScale})`,
					transformOrigin: 'center center',
					backgroundColor: 'rgba(26,26,46,0.85)',
					borderRadius: 18,
					padding: '20px 28px',
					textAlign: 'center',
					fontFamily: "'Noto Sans', sans-serif",
					fontWeight: 700,
					fontSize: 84,
					lineHeight: 1.15,
					color: PAPEL,
				}}
			>
				<div>EMPRESAS</div>
				<div>
					<span style={{backgroundColor: RESALTADOR, color: TINTA, padding: '0 14px', borderRadius: 10}}>PRIVADAS</span>
				</div>
			</div>

			{/* APOYO AL PUEBLO CUBANO: el texto grande ES el caption. */}
			<div
				style={{
					position: 'absolute',
					left: 65,
					right: 65,
					top: 1000,
					opacity: apoOpacity,
					transform: `scale(${apoScale})`,
					transformOrigin: 'center center',
					backgroundColor: 'rgba(26,26,46,0.85)',
					borderRadius: 18,
					padding: '20px 28px',
					textAlign: 'center',
					fontFamily: "'Noto Sans', sans-serif",
					fontWeight: 700,
					fontSize: 72,
					lineHeight: 1.15,
					color: PAPEL,
				}}
			>
				<div>APOYO AL PUEBLO</div>
				<div>
					<span style={{backgroundColor: RESALTADOR, color: TINTA, padding: '0 14px', borderRadius: 10}}>CUBANO</span>
				</div>
			</div>
		</AbsoluteFill>
	);
};

// ─── Escena 5: el buque (25,6-27,87 s) ───────────────────────────────────
// VIDEO REAL: buque tanque Empire State entrando a Pearl Harbor
// (DVIDS 900133, U.S. Army, 11-oct-2023, dominio público; corte de
// 3 s, MUDO; segundo distinto al del reel de Facebook). Metraje
// ilustrativo del hecho, no el buque que fue a Cuba: el texto en
// pantalla enuncia el hecho, sin afirmar que el video sea ese buque.
// La Sequence anidada pone el reloj local en 0: el clip corre 0-2,27 s.
const Buque: React.FC<{t: number}> = ({t}) => {
	const zoom = interpolate(t, [25.6, 27.87], [1, 1.06], {
		easing: Easing.inOut(Easing.quad),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const textOpacity = interpolate(t, [25.6, 25.8], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const textRise = interpolate(t, [25.6, 25.8], [20, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	return (
		<AbsoluteFill style={{backgroundColor: TINTA}}>
			<div style={{position: 'absolute', left: 0, top: 465, width: 1080, height: 560, overflow: 'hidden'}}>
				<Sequence from={768} durationInFrames={69} name="BuqueVideo">
					<div
						style={{
							width: 1080,
							height: 608,
							transform: `scale(${zoom})`,
							transformOrigin: '540px 304px',
						}}
					>
						<OffthreadVideo
							src={staticFile(BUQUE_VIDEO)}
							muted
							volume={0}
							style={{width: 1080, height: 608, objectFit: 'fill'}}
						/>
					</div>
				</Sequence>
			</div>

			<Pill fontSize={24} style={{position: 'absolute', left: 65, top: 410}}>
				VIDEO: U.S. ARMY · DVIDS
			</Pill>

			{/* El texto grande ES el caption de L14 (karaoke oculto). */}
			<div
				style={{
					position: 'absolute',
					left: 65,
					right: 65,
					top: 1040 + textRise,
					opacity: textOpacity,
					textAlign: 'center',
					fontFamily: "'Noto Sans', sans-serif",
					fontWeight: 700,
					color: PAPEL,
					textShadow: '0 4px 24px rgba(0,0,0,0.8)',
				}}
			>
				<div style={{fontSize: 110, lineHeight: 1.1}}>1 BUQUE</div>
				<div style={{fontSize: 36, letterSpacing: 4, color: RESALTADOR, marginTop: 8, textShadow: 'none'}}>
					AL GOBIERNO · DESDE ENERO
				</div>
			</div>
		</AbsoluteFill>
	);
};

// ─── Escena 6: el salto (27,9-37,77 s) ───────────────────────────────────
// Gráfico en motion: 2025 (todo el año, 311 mil dólares) contra 2026
// (ene-sep, 284 millones). La barra de 2025 es una astilla de 8 px:
// la proporción real (311 mil / 284 M ≈ 0,1%) es el mensaje. Sin
// multiplicador impreso: la voz dice los números y el contraste
// visual hace el resto. El valor «$311 MIL» aparece a 31,74 s (con
// el chunk «FUE DE 311 MIL DÓLARES.», karaoke oculto desde ahí); la
// barra de 2026 crece 34,44-37,51 s y «$284 MILLONES» aterriza a
// 36,04 s (con «284»; el SFX data-number-land sigue a 37,51,
// marcando el fin de la barra).
const Salto: React.FC<{t: number}> = ({t}) => {
	// Las filas entran deslizando desde la izquierda, escalonadas.
	const row25 = interpolate(t, [27.9, 28.2], [0, 1], {
		easing: Easing.out(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const row26 = interpolate(t, [28.05, 28.35], [0, 1], {
		easing: Easing.out(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const row25X = interpolate(row25, [0, 1], [-1080, 0]);
	const row26X = interpolate(row26, [0, 1], [-1080, 0]);
	// La astilla de 2025 aparece con «En todo 2025» (29,44 s).
	const bar25Opacity = interpolate(t, [29.44, 29.74], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	// «$311 MIL» aparece a 31,74 s (chunk «FUE DE 311 MIL DÓLARES.»).
	const val25Opacity = interpolate(t, [31.74, 31.89], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const val25Scale = interpolate(t, [31.74, 31.89], [1.3, 1], {
		easing: Easing.out(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	// La barra de 2026 crece 34,44-37,51 s.
	const bar26W = interpolate(t, [34.44, 37.51], [0, 950], {
		easing: Easing.out(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	// «$284 MILLONES» aterriza a 36,04 s, con «284» (36,04-37,24):
	// con el aterrizaje a 37,51 (fin de la barra) la etiqueta solo
	// vivía 0,27 s y toda dentro del fundido de la transición T3
	// (f1126-1133), sin llegar nunca a opacidad plena. A 36,04
	// queda 1,5 s a plena vista mientras la barra termina de crecer
	// (el SFX de aterrizaje sigue a 37,51, marcando el fin de la
	// barra; la etiqueta de 2025 tampoco lleva SFX).
	const val26Opacity = interpolate(t, [36.04, 36.19], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const val26Scale = interpolate(t, [36.04, 36.19], [1.3, 1], {
		easing: Easing.out(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const sourceOpacity = interpolate(t, [28.35, 28.5], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	return (
		<AbsoluteFill style={{backgroundColor: TINTA}}>
			<Pill
				bg={RESALTADOR}
				color={TINTA}
				fontSize={28}
				style={{position: 'absolute', right: 65, top: 310}}
			>
				EL SALTO
			</Pill>

			{/* Fila 2025. */}
			<div
				style={{
					position: 'absolute',
					left: 65,
					top: 470,
					width: 950,
					transform: `translateX(${row25X}px)`,
				}}
			>
				<div
					style={{
						fontFamily: "'Noto Sans', sans-serif",
						fontWeight: 700,
						fontSize: 36,
						letterSpacing: 2,
						color: PAPEL,
					}}
				>
					2025 · TODO EL AÑO
				</div>
				<div
					style={{
						marginTop: 12,
						width: 950,
						height: 60,
						borderRadius: 30,
						backgroundColor: 'rgba(255,255,255,0.15)',
						overflow: 'hidden',
					}}
				>
					<div
						style={{
							width: 8,
							height: 60,
							borderRadius: 30,
							backgroundColor: 'rgba(245,241,232,0.7)',
							opacity: bar25Opacity,
						}}
					/>
				</div>
				<div
					style={{
						marginTop: 12,
						fontFamily: "'Noto Sans', sans-serif",
						fontWeight: 700,
						fontSize: 90,
						lineHeight: 1,
						color: PAPEL,
						opacity: val25Opacity,
						transform: `scale(${val25Scale})`,
						transformOrigin: 'left center',
					}}
				>
					$311 MIL
				</div>
			</div>

			{/* Fila 2026. */}
			<div
				style={{
					position: 'absolute',
					left: 65,
					top: 780,
					width: 950,
					transform: `translateX(${row26X}px)`,
				}}
			>
				<div
					style={{
						fontFamily: "'Noto Sans', sans-serif",
						fontWeight: 700,
						fontSize: 36,
						letterSpacing: 2,
						color: PAPEL,
					}}
				>
					2026 · ENERO–SEPTIEMBRE
				</div>
				<div
					style={{
						marginTop: 12,
						width: 950,
						height: 60,
						borderRadius: 30,
						backgroundColor: 'rgba(255,255,255,0.15)',
						overflow: 'hidden',
					}}
				>
					<div
						style={{
							width: bar26W,
							height: 60,
							borderRadius: 30,
							backgroundColor: RESALTADOR,
						}}
					/>
				</div>
				<div
					style={{
						marginTop: 12,
						fontFamily: "'Noto Sans', sans-serif",
						fontWeight: 700,
						fontSize: 90,
						lineHeight: 1,
						color: PAPEL,
						opacity: val26Opacity,
						transform: `scale(${val26Scale})`,
						transformOrigin: 'left center',
					}}
				>
					$284 MILLONES
				</div>
			</div>

			{/* Fuente (top 1040: la banda de karaoke empieza en 1100). */}
			<Pill
				fontSize={24}
				style={{position: 'absolute', left: 240, top: 1040, opacity: sourceOpacity}}
			>
				FUENTE: U.S.-CUBA TRADE AND ECONOMIC COUNCIL
			</Pill>
		</AbsoluteFill>
	);
};

// ─── Escena 7: el veredicto (37,8-41,73 s) ───────────────────────────────
// «LA CIFRA ES REAL.» (38,44) / «LA CONCLUSIÓN, NO.» (39,58) / sello
// «SIN CONTEXTO» que cae a 41,22 s (golpe del SFX de sello). Push-in
// lento 1->1,03 tras la caída del sello: la escena no queda congelada.
const Veredicto: React.FC<{t: number}> = ({t}) => {
	const line1Opacity = interpolate(t, [38.44, 38.59], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const line1Rise = interpolate(t, [38.44, 38.59], [20, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const line2Opacity = interpolate(t, [39.58, 39.73], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const line2Rise = interpolate(t, [39.58, 39.73], [20, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const stampScale = interpolate(t, [41.22, 41.34], [1.3, 1], {
		easing: Easing.out(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const pushIn = interpolate(t, [41.34, 41.73], [1, 1.03], {
		easing: Easing.out(Easing.quad),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	return (
		<AbsoluteFill style={{backgroundColor: PAPEL}}>
			<div
				style={{
					position: 'absolute',
					left: 65,
					right: 65,
					top: 620 + line1Rise,
					opacity: line1Opacity,
					textAlign: 'center',
					fontFamily: "'Noto Sans', sans-serif",
					fontWeight: 700,
					fontSize: 84,
					lineHeight: 1.15,
					color: TINTA,
				}}
			>
				LA CIFRA ES REAL.
			</div>
			<div
				style={{
					position: 'absolute',
					left: 65,
					right: 65,
					top: 760 + line2Rise,
					opacity: line2Opacity,
					textAlign: 'center',
					fontFamily: "'Noto Sans', sans-serif",
					fontWeight: 700,
					fontSize: 84,
					lineHeight: 1.15,
					color: TINTA,
				}}
			>
				LA CONCLUSIÓN,{' '}
				<span style={{backgroundColor: RESALTADOR, padding: '0 14px', borderRadius: 10}}>NO.</span>
			</div>
			{t >= 41.22 && (
				<div
					style={{
						position: 'absolute',
						left: 110,
						top: 955,
						width: 860,
						height: 170,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						border: `6px solid ${ROJO}`,
						borderRadius: 14,
						fontFamily: "'Noto Serif Display', serif",
						fontWeight: 900,
						fontSize: 80,
						whiteSpace: 'nowrap',
						lineHeight: 1,
						letterSpacing: 4,
						color: ROJO,
						transform: `rotate(-8deg) scale(${stampScale * pushIn})`,
					}}
				>
					SIN CONTEXTO
				</div>
			)}
		</AbsoluteFill>
	);
};

// ─── Escena 8: cierre (41,77-46,5 s) ─────────────────────────────────────
// El sello viaja del centro a la esquina inferior derecha (41,77-42,22)
// y se desvanece ANTES de la end card (43,6-43,9) para no cruzarse
// con el CTA. La pregunta va en panel sólido sobre fondo Tinta
// LISO: la v1 reutilizaba el gráfico del gancho de fondo (opacidad
// 0,5) y su texto seguía legible bajo la tarjeta, el karaoke y la
// fuente — tres capas de texto compitiendo (v2: sin gráfico, sin
// BlurFill; el karaoke está apagado en todo el cierre por
// HIDE_RANGES y la fuente aparece solo con la end card). Un solo CTA
// con motivo («SUSCRÍBETE» + «El próximo número, verificado aquí.»).
// La end card señalizada dura ~3 s (43,5-46,5). El corte en 41,77 s
// es duro (ghost-frames exige la escena nueva completa en el
// fotograma del corte); la entrada con movimiento la da el viaje
// del sello.
const Cierre: React.FC<{t: number}> = ({t}) => {
	// El sello viaja y se desvanece antes de la end card.
	const travel = interpolate(t, [41.77, 42.22], [0, 1], {
		easing: Easing.inOut(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const miniTx = 150 * travel;
	const miniTy = 150 * travel;
	const miniScale = 1 - 0.68 * travel;
	const miniOpacity = interpolate(t, [43.6, 43.9], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	// La pregunta entra en fundido 41,9-42,32 (llena el hueco que deja
	// el viaje del sello; en la v2 ese ~1 s quedaba casi vacío) y está
	// al 1 cuando la VO la dice (42,32). Sube a 43,5 para dejar sitio
	// al logo.
	const qOpacity = interpolate(t, [41.9, 42.32], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const qTop = interpolate(t, [43.5, 43.8], [600, 430], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const qRise = interpolate(t, [41.9, 42.32], [20, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	// La fuente aparece SOLO con la end card (43,5 s): en la v1 salía
	// con la pregunta (42,32 s) y se amontonaba sobre el karaoke y el
	// texto rojo del gráfico de fondo.
	const sourceOpacity = interpolate(t, [43.5, 43.8], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	// End card (43,5-46,5): el fondo ya es Tinta sólido; solo el
	// contenido entra al 1.
	const endFg = interpolate(t, [43.5, 43.8], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const logoScale = interpolate(t, [43.5, 43.8], [0.9, 1], {
		easing: Easing.out(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	// Respiración lenta del logo hasta f1395.
	const logoBreathe = interpolate(t, [43.8, 46.5], [1, 1.02], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	// Pulso sutil del CTA (periodo 1 s) hasta f1395.
	const ctaPulse =
		t >= 43.8
			? 1 + 0.03 * (0.5 + 0.5 * Math.sin(2 * Math.PI * (t - 43.8)))
			: 1;

	return (
		<AbsoluteFill style={{backgroundColor: TINTA}}>
			{/* Mini sello SIN CONTEXTO en la esquina. */}
			<div
				style={{
					position: 'absolute',
					left: 110,
					top: 955,
					width: 860,
					height: 170,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					border: `6px solid ${ROJO}`,
					borderRadius: 14,
					fontFamily: "'Noto Serif Display', serif",
					fontWeight: 900,
					fontSize: 80,
					whiteSpace: 'nowrap',
					lineHeight: 1,
					letterSpacing: 4,
					color: ROJO,
					transform: `translate(${miniTx}px, ${miniTy}px) rotate(-8deg) scale(${miniScale})`,
					transformOrigin: 'center center',
					opacity: miniOpacity,
				}}
			>
				SIN CONTEXTO
			</div>

			{/* Pregunta de marca, en panel sólido (nada de texto sobre
			    el texto del gráfico). */}
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
					SUSCRÍBETE
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
				El próximo número, verificado aquí.
			</div>

			{/* Fuente. */}
			<Pill
				fontSize={28}
				style={{position: 'absolute', left: 240, top: 1080, opacity: sourceOpacity}}
			>
				Fuente: U.S.-Cuba Trade and Economic Council
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

	// Transiciones zoom-cross rápidas (0,23 s) en los tres cortes de
	// más contraste. T1: gancho -> documento (f187-194). T2: documento
	// -> quién-compra (f375-382; el desliz de papel barre sobre la
	// transición). T3: salto -> veredicto (f1126-1133). La transición
	// TERMINA en el corte: en el fotograma B la escena nueva ya está
	// completa (ghost-frames exige d_nueva < 0,07 en B..B+3). Los
	// demás cortes son duros con movimiento de entrada (crecimiento
	// del documento, video, barras, viaje del sello).
	// Los límites de escena coinciden con preflight-scenes.json.
	const t1p = interpolate(frame, [187, 194], [0, 1], {
		easing: Easing.inOut(Easing.quad),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const t2p = interpolate(frame, [375, 382], [0, 1], {
		easing: Easing.inOut(Easing.quad),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const t3p = interpolate(frame, [1126, 1133], [0, 1], {
		easing: Easing.inOut(Easing.quad),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	// La marca de agua se desvanece cuando entra el logo grande
	// de la end card (43,5 s): nada de LIBRETO dos veces.
	const wmOpacity = interpolate(t, [43.5, 43.8], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	return (
		<AbsoluteFill style={{backgroundColor: TINTA}}>
			{/* Cortes por FOTOGRAMA (no por segundos): un condicional
			    por tiempo puede retrasar el corte un fotograma, lo
			    que ghost-frames marca como GHOST. */}
			{frame < 194 && (
				<XScene scale={interpolate(t1p, [0, 1], [1, 1.12])} opacity={1 - t1p}>
					<Gancho t={t} />
				</XScene>
			)}
			{frame >= 187 && frame < 382 && (
				<XScene
					scale={interpolate(t1p, [0, 1], [0.94, 1]) * interpolate(t2p, [0, 1], [1, 1.12])}
					opacity={t1p * (1 - t2p)}
				>
					<Documento t={t} />
				</XScene>
			)}
			{frame >= 375 && frame < 597 && (
				<XScene scale={interpolate(t2p, [0, 1], [0.94, 1])} opacity={t2p}>
					<QuienCompra t={t} />
				</XScene>
			)}
			{frame >= 597 && frame < 768 && <Licencia t={t} />}
			{frame >= 768 && frame < 837 && <Buque t={t} />}
			{frame >= 837 && frame < 1134 && (
				<XScene scale={interpolate(t3p, [0, 1], [1, 1.1])} opacity={1 - t3p}>
					<Salto t={t} />
				</XScene>
			)}
			{frame >= 1126 && frame < 1253 && (
				<XScene scale={interpolate(t3p, [0, 1], [1.08, 1])} opacity={t3p}>
					<Veredicto t={t} />
				</XScene>
			)}
			{frame >= 1253 && <Cierre t={t} />}

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
					width: (1080 * t) / 46.5,
					height: 5,
					backgroundColor: RESALTADOR,
				}}
			/>
		</AbsoluteFill>
	);
};
