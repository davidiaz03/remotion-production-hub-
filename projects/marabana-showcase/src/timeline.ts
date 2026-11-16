// Línea de tiempo del reel escaparate — Marabana 40.
// Total: 1677 fotogramas (55,9 s) = 1587 de contenido + 90 de sting.
// Cortes sobre fronteras de frase de la VO (vo-lines.json, Kokoro 1.1x);
// donde el beat de shadows-and-evidence (BPM 93) cae a ≤0,15 s del corte,
// se usa el beat. Las transiciones son de 12 f y SOLAPAN: la duración de
// cada Sequence incluye el solape (Σ seq − Σ trans = total).

export const FPS = 30;
export const TRANSITION_FRAMES = 12;

/** Cortes nominales (fotograma global donde la escena entrante está completa). */
export const CUTS = {
	hook: 0,
	siege: 185, // 6,17 s — beat 6,18; «Adidas» 6,08
	came: 430, // 14,33 s — «Pero setenta vinieron» 14,34
	dawn: 570, // 19,00 s — «seis de la mañana» 19,12
	loop: 717, // 23,90 s — «Y entre ellos corría» 24,04
	denuncia: 812, // 27,07 s — «Muchos llevaban un cartel» 27,06
	winners: 1073, // 35,77 s — «En el maratón ganaron» 35,78
	shoe: 1201, // 40,03 s — «Estévez debutaba» 40,04
	sardinas: 1327, // 44,23 s — beat 44,24; «Elvis Sardiñas» 44,52
	close: 1424, // 47,47 s — beat 47,46; «Marabana está vivo» 47,65
	sting: 1587, // 52,90 s — VO termina 52,47; cola 0,43 s
	end: 1677, // 55,90 s
} as const;

/** Duraciones de Sequence (incluyen el solape de 12 f con cada transición). */
export const SEQ = {
	hook: 185,
	siege: 257,
	came: 152,
	dawn: 159,
	loop: 107,
	denuncia: 273,
	winners: 140,
	shoe: 138,
	sardinas: 109,
	close: 175,
	sting: 102,
} as const;

/** Eventos de VO en fotogramas globales (captions.ts, faster-whisper). */
export const VO = {
	hoySetenta: 151, // «Hoy, setenta.» 5,02 s
	countdownLand: 169, // el 70 aterriza (18 f de caída)
	melia: 261, // «Meliá» 8,70 s
	apagones: 316, // «apagones» 10,52 s
	electricidad: 379, // «electricidad» 12,62 s
	quince: 481, // «quince» 16,04 s
	amenazas: 523, // «amenazas» 17,42 s
	seis: 574, // «seis» 19,12 s
	amanecer: 620, // «amanecer» 20,68 s
	corredores: 661, // «corredores» 22,04 s
	hombre: 759, // «hombre» 25,30 s
	veia: 778, // «veía» 25,92 s
	cartel: 839, // «cartel» 27,96 s
	cuba: 869, // «Cuba» 28,96 s
	amenaza: 897, // «amenaza» 29,90 s
	bloqueo: 918, // «bloqueo» 30,60 s
	cava: 952, // «Cava» 31,74 s
	asfixia: 1024, // «asfixia» 34,12 s
	estevez: 1102, // «Estévez» 36,72 s
	bacallao: 1121, // «Bacallao» 37,38 s
	doblete: 1160, // «doblete» 38,66 s
	minuto: 1247, // «minuto» 41,56 s
	zapatos: 1276, // «zapatos» 42,54 s
	gano: 1315, // «ganó» 43,84 s
	ciego: 1365, // «ciego» 45,50 s
	completo: 1380, // «completó» 46,00 s
	vivo: 1446, // «vivo» 48,20 s
	nunca: 1480, // «nunca» 49,32 s
	comenzo: 1556, // «comenzó» 51,86 s
} as const;

/** Fotograma local dentro de una escena entrante (reloj local empieza al inicio de la transición). */
export const local = (globalFrame: number, cut: number) =>
	globalFrame - cut + TRANSITION_FRAMES;
