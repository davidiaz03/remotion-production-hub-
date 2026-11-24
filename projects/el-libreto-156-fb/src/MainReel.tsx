// El Libreto — ¿Quién compra el combustible de Cuba? (Facebook Reel, 27,5 s).
// 1080x1920, 30 fps, 825 fotogramas. Toda la banda sonora está en la
// mezcla (mix.wav: VO + cama Flow Music + SFX); la composición es
// solo video. El video del buque tanque va MUDO (OffthreadVideo con
// volume 0): aporta imagen en movimiento, nunca audio.
// Zonas seguras Meta: texto dentro de x 65-1015, y 269-1248.
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

// ─── Escena 1: el gancho (0-6,37 s) ──────────────────────────────────────
// El gráfico viral de Estíu (621x702 -> 1080x1220 en pantalla).
// Medido: titular azul y 25-385 (display 31-470), foto de tanques
// y 530-755 (display 647-921), pregunta roja y 755-1000 (display
// 921-1220). Paneo vertical del titular a la pregunta al empezar L2
// (4,48 s); círculo rojo sobre la pregunta a 5,2 s (lápiz SFX).
const Gancho: React.FC<{t: number}> = ({t}) => {
	// Punch-in 1 -> 1,05 sobre el centro (0-0,4 s).
	const punch = interpolate(t, [0, 0.4], [1, 1.05], {
		easing: Easing.out(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	// Paneo 0 -> -300 (4,48-5,2 s): al final se ve la imagen de
	// y 300 a 1220 (la pregunta entera, display 1001-1300).
	const pan = interpolate(t, [4.48, 5.2], [0, -300], {
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
			<div style={{position: 'absolute', left: 0, top: 380, width: 1080, height: 920, overflow: 'hidden'}}>
				<div
					style={{
						width: 1080,
						height: 1220,
						transform: `scale(${punch})`,
						transformOrigin: '540px 610px',
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

// ─── Escena 2: el documento (6,4-12,43 s) ────────────────────────────────
// Portada del informe del Council (datos de julio 2026). La línea
// «Trump-Vance Administration Fuels Authorization - US$61.140.685»
// está en x 247-1028, y 488-522 del original (1275x1650); en la
// portada a 760 de ancho: x 147-613, y 291-311, centro (380, 301).
// Zoom 1 -> 1,35 sobre esa línea (7,88-9,08 s, con L4 «Yo fui al
// documento»); resaltado amarillo sobre la línea (8,0 s); píldora
// «DATOS DE JULIO 2026» (8,98 s); contador 156,8 -> 284,4 que
// aterriza a 12,4 s con L6 (el karaoke está oculto: el contador ES
// el caption).
const Documento: React.FC<{t: number}> = ({t}) => {
	const zoom = interpolate(t, [7.88, 9.08], [1, 1.35], {
		easing: Easing.inOut(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const highlightOpacity = interpolate(t, [8.0, 8.15], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const pillJulOpacity =
		interpolate(t, [8.98, 9.13], [0, 1], {
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
		}) *
		interpolate(t, [9.76, 9.91], [1, 0], {
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
		});
	const pillSepOpacity = interpolate(t, [9.76, 9.91], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const counterOpacity = interpolate(t, [9.76, 9.91], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	// Contador 156,8 -> 284,4 entre 9,76 y 12,4 (aterriza al terminar
	// «millones», 12,46); luego se queda fijo hasta el corte.
	const count = interpolate(t, [9.76, 12.4], [156.8, 284.4], {
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

// ─── Escena 3: el comprador (12,47-16,57 s) ──────────────────────────────
// Pág. 3 del informe de septiembre: «RE-EMERGING PRIVATE SECTOR
// EXPORTS» + «to individuals and entities not affiliated with the
// government of the Republic of Cuba» (x 145-1130, y 624-678 del
// original; a 760 de ancho: x 86-674, y 372-404). La página entra
// deslizando desde la derecha (12,47-12,77 s, movimiento de entrada
// del corte duro); el resaltado aparece con «empresas privadas»
// (14,36 s) y el texto grande «EMPRESAS PRIVADAS» sube a 15,40 s
// para dejar libre la banda de karaoke («CON LICENCIAS ESPECIALES.»).
const Comprador: React.FC<{t: number}> = ({t}) => {
	const slide = interpolate(t, [12.47, 12.77], [0, 1], {
		easing: Easing.out(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const pageX = interpolate(slide, [0, 1], [1080, 0]);
	const highlightOpacity = interpolate(t, [14.36, 14.51], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const bigOpacity = interpolate(t, [14.36, 14.46], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const bigScale = interpolate(t, [14.36, 14.51], [1.3, 1], {
		easing: Easing.out(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	// El panel sube de 1000 a 830 cuando vuelve el karaoke (15,40 s).
	const bigTop = interpolate(t, [15.4, 15.55], [1000, 830], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	return (
		<AbsoluteFill>
			<BlurFill src={COUNCIL_P3} brightness={0.4} />
			<div
				style={{
					position: 'absolute',
					left: 160,
					top: 400,
					width: 760,
					height: 983,
					transform: `translateX(${pageX}px)`,
				}}
			>
				<Img src={staticFile(COUNCIL_P3)} style={{width: 760, height: 983}} />
				{/* Resaltado sobre «not affiliated with the government». */}
				<div
					style={{
						position: 'absolute',
						left: 80,
						top: 368,
						width: 600,
						height: 40,
						backgroundColor: RESALTADOR,
						opacity: 0.55 * highlightOpacity,
						borderRadius: 4,
					}}
				/>
			</div>

			<Pill
				fontSize={26}
				style={{position: 'absolute', right: 65, top: 310}}
			>
				EL DOCUMENTO, PÁG. 3
			</Pill>

			{/* EMPRESAS PRIVADAS: el texto grande ES el caption del
			    chunk «SON EMPRESAS PRIVADAS,» (karaoke oculto). */}
			<div
				style={{
					position: 'absolute',
					left: 65,
					right: 65,
					top: bigTop,
					opacity: bigOpacity,
					transform: `scale(${bigScale})`,
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
		</AbsoluteFill>
	);
};

// ─── Escena 4: el buque (16,6-18,77 s) ───────────────────────────────────
// VIDEO REAL: buque tanque Empire State entrando a Pearl Harbor
// (DVIDS 900133, U.S. Army, 11-oct-2023, dominio público; corte de
// 3 s, MUDO). Metraje ilustrativo del hecho, no el buque que fue a
// Cuba: el texto en pantalla enuncia el hecho, sin afirmar que el
// video sea ese buque. La Sequence anidada pone el reloj local en 0:
// el clip corre 0-2,17 s.
const Buque: React.FC<{t: number}> = ({t}) => {
	const zoom = interpolate(t, [16.6, 18.77], [1, 1.06], {
		easing: Easing.inOut(Easing.quad),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const textOpacity = interpolate(t, [16.94, 17.14], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const textRise = interpolate(t, [16.94, 17.14], [20, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	return (
		<AbsoluteFill style={{backgroundColor: TINTA}}>
			<div style={{position: 'absolute', left: 0, top: 465, width: 1080, height: 560, overflow: 'hidden'}}>
				<Sequence from={498} durationInFrames={66} name="BuqueVideo">
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

			{/* El texto grande ES el caption de L9 (karaoke oculto). */}
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

// ─── Escena 5: el veredicto (18,8-22,07 s) ───────────────────────────────
// «LA CIFRA ES REAL.» (19,20) / «LA CONCLUSIÓN, NO.» (20,12) / sello
// «SIN CONTEXTO» que cae a 21,66 s (golpe del SFX de sello). Push-in
// lento 1->1,03 tras la caída del sello: la escena no queda congelada.
const Veredicto: React.FC<{t: number}> = ({t}) => {
	const line1Opacity = interpolate(t, [19.2, 19.35], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const line1Rise = interpolate(t, [19.2, 19.35], [20, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const line2Opacity = interpolate(t, [20.12, 20.27], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const line2Rise = interpolate(t, [20.12, 20.27], [20, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const stampScale = interpolate(t, [21.66, 21.78], [1.3, 1], {
		easing: Easing.out(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const pushIn = interpolate(t, [21.78, 22.07], [1, 1.03], {
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
			{t >= 21.66 && (
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

// ─── Escena 6: cierre (22,1-27,5 s) ──────────────────────────────────────
// El sello viaja del centro a la esquina inferior derecha (22,1-22,55)
// y se desvanece ANTES de la end card (23,9-24,2) para no cruzarse
// con el CTA. La pregunta va en panel sólido (nada de texto sobre
// texto); un solo CTA con motivo («SÍGUENOS» + «El próximo número,
// verificado aquí.»); la end card deja traslucir el gráfico al 12%
// para que el último fotograma rime con el primero (loop) y la cama
// sigue sonando bajo el corte. La end card señalizada dura ~3 s
// (24,5-27,5). El corte en 22,1 s es duro (ghost-frames exige la
// escena nueva completa en el fotograma del corte); la entrada con
// movimiento la dan el viaje del sello y la deriva lenta del gráfico.
const Cierre: React.FC<{t: number}> = ({t}) => {
	// Deriva lenta del gráfico hasta f825.
	const postZoom = interpolate(t, [22.1, 27.5], [1, 1.04], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	// El sello viaja y se desvanece antes de la end card.
	const travel = interpolate(t, [22.1, 22.55], [0, 1], {
		easing: Easing.inOut(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const miniTx = 150 * travel;
	const miniTy = 150 * travel;
	const miniScale = 1 - 0.68 * travel;
	const miniOpacity = interpolate(t, [23.9, 24.2], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	// La pregunta aparece a 22,68 y sube a 24,5 para dejar sitio al logo.
	const qOpacity = interpolate(t, [22.68, 22.83], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const qTop = interpolate(t, [24.5, 24.8], [600, 430], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const qRise = interpolate(t, [22.68, 22.83], [20, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	const sourceOpacity = interpolate(t, [22.68, 22.83], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	// End card (24,5-27,5): el fondo Tinta llega al 0,88 (el gráfico
	// se trasluce: rima con el primer fotograma); el contenido, al 1.
	const endBg = interpolate(t, [24.5, 24.8], [0, 0.88], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const endFg = interpolate(t, [24.5, 24.8], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const logoScale = interpolate(t, [24.5, 24.8], [0.9, 1], {
		easing: Easing.out(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	// Respiración lenta del logo hasta f825.
	const logoBreathe = interpolate(t, [24.8, 27.5], [1, 1.02], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	// Pulso sutil del CTA (periodo 1 s) hasta f825.
	const ctaPulse =
		t >= 24.8
			? 1 + 0.03 * (0.5 + 0.5 * Math.sin(2 * Math.PI * (t - 24.8)))
			: 1;

	return (
		<AbsoluteFill>
			<BlurFill src={ESTIU} brightness={0.35} />
			{/* Gráfico atenuado en la vista de la pregunta (la misma
			    del final del gancho: rima con el primer fotograma),
			    con deriva lenta. */}
			<div style={{position: 'absolute', left: 0, top: 380, width: 1080, height: 920, overflow: 'hidden'}}>
			<Img
				src={staticFile(ESTIU)}
				style={{
					position: 'absolute',
					left: 0,
					top: -300,
					width: 1080,
					height: 1220,
					opacity: 0.5,
					filter: 'brightness(0.6)',
					transform: `scale(${postZoom})`,
					transformOrigin: '540px 610px',
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

	// Transiciones zoom-cross rápidas (0,23 s) en los dos cortes de
	// más contraste. T1: gancho -> documento (f185-192). T2: buque ->
	// veredicto (f556-563). La transición TERMINA en el corte: en el
	// fotograma B la escena nueva ya está completa (ghost-frames exige
	// d_nueva < 0,07 en B..B+3). El whoosh de T1 pica al llegar la
	// escena nueva (6,4 s). Los demás cortes son duros con movimiento
	// de entrada (desliz de la página, video, viaje del sello).
	// Los límites de escena coinciden con preflight-scenes.json.
	const t1p = interpolate(frame, [185, 192], [0, 1], {
		easing: Easing.inOut(Easing.quad),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const t2p = interpolate(frame, [556, 563], [0, 1], {
		easing: Easing.inOut(Easing.quad),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	// La marca de agua se desvanece cuando entra el logo grande
	// de la end card (24,5 s): nada de LIBRETO dos veces.
	const wmOpacity = interpolate(t, [24.5, 24.8], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	return (
		<AbsoluteFill style={{backgroundColor: TINTA}}>
			{/* Cortes por FOTOGRAMA (no por segundos): un condicional
			    por tiempo puede retrasar el corte un fotograma, lo
			    que ghost-frames marca como GHOST. */}
			{frame < 192 && (
				<XScene scale={interpolate(t1p, [0, 1], [1, 1.12])} opacity={1 - t1p}>
					<Gancho t={t} />
				</XScene>
			)}
			{frame >= 185 && frame < 374 && (
				<XScene scale={interpolate(t1p, [0, 1], [0.94, 1])} opacity={t1p}>
					<Documento t={t} />
				</XScene>
			)}
			{frame >= 374 && frame < 498 && <Comprador t={t} />}
			{frame >= 498 && frame < 564 && (
				<XScene scale={interpolate(t2p, [0, 1], [1, 1.1])} opacity={1 - t2p}>
					<Buque t={t} />
				</XScene>
			)}
			{frame >= 556 && frame < 663 && (
				<XScene scale={interpolate(t2p, [0, 1], [1.08, 1])} opacity={t2p}>
					<Veredicto t={t} />
				</XScene>
			)}
			{frame >= 663 && <Cierre t={t} />}

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
					width: (1080 * t) / 27.5,
					height: 5,
					backgroundColor: RESALTADOR,
				}}
			/>
		</AbsoluteFill>
	);
};
