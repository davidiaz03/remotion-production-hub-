import React from 'react';
import {
  AbsoluteFill, Audio, Easing, Img, OffthreadVideo, Sequence, interpolate,
  spring, staticFile, useCurrentFrame, useVideoConfig,
} from 'remotion';
import {BASTON_FRAME, BEATS, COLORS, CONTENT_END, FPS, LOGO_FROM, LOGO_TO, STAMP_FRAME, STING_DUR, VO_LINES} from './timeline';
import {CAPTIONS} from './captions';

// REEL MARABANA V1.1 — «La carrera que el bloqueo no pudo parar»
// Voz en off (Piper, previsualización) + karaoke palabra a palabra +
// música original IA (MusicGen) con ducking bajo la voz.
// Estrategia: STRATEGY.md. 1080x1920, 30 fps, 1347 fotogramas (44.9 s).
// La narración manda el ritmo: los beats siguen las líneas de la VO
// (vo-lines.json). Los titulares que repetían la narración palabra por
// palabra se eliminaron — quedan solo los rótulos con información nueva
// (números, nombres, citas, datos) y el karaoke lleva el guion.
// V1.1 (auditoría 15-nov-2026): gancho con el dato OFAC en el fotograma 1,
// sting a 3 s (2x), ganadores sin vacío, sin rótulos duplicados,
// «cuadragésima» en la VO.

// ---------- helpers ----------

const outline = (px: number) =>
  `${px}px 0 0 #000, -${px}px 0 0 #000, 0 ${px}px 0 #000, 0 -${px}px 0 #000, ` +
  `${px * 0.7}px ${px * 0.7}px 0 #000, -${px * 0.7}px -${px * 0.7}px 0 #000, ` +
  `${px * 0.7}px -${px * 0.7}px 0 #000, -${px * 0.7}px ${px * 0.7}px 0 #000, 0 8px 22px rgba(0,0,0,0.65)`;

const ARCHIVO = "'Archivo Black', sans-serif";
const CONDENSED = "'Roboto Condensed', sans-serif";

// Fade in/out estándar de beat: entra en 6f, sale en los últimos 8f
// (la Sequence dura dur+8; el beat siguiente empieza en dur).
const useBeatFade = (dur: number) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const fadeOut = interpolate(frame, [dur, dur + 8], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return Math.min(fadeIn, fadeOut);
};

// ---------- fondo tinta + viñeta ----------

const Background: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        'radial-gradient(ellipse 90% 70% at 50% 42%, #182028 0%, #0A0E11 65%, #05070A 100%)',
    }}
  />
);

// ---------- imagen Ken Burns (nada estático) ----------

const KenBurnsImg: React.FC<{
  src: string;
  dur: number;
  fromScale?: number;
  toScale?: number;
  origin?: string;
  panX?: [number, number];
  panY?: [number, number];
}> = ({src, dur, fromScale = 1, toScale = 1.1, origin = '50% 50%', panX = [0, 0], panY = [0, 0]}) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, dur], [fromScale, toScale], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const x = interpolate(frame, [0, dur], panX, {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const y = interpolate(frame, [0, dur], panY, {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{width: '100%', height: '100%', overflow: 'hidden'}}>
      <Img
        src={staticFile(src)}
        style={{
          width: '100%', height: '100%', objectFit: 'cover', display: 'block',
          transform: `translate(${x}px, ${y}px) scale(${scale})`,
          transformOrigin: origin,
        }}
      />
    </div>
  );
};

// ---------- tarjeta de evidencia (foto enmarcada estilo pegatina) ----------

const EvidenceCard: React.FC<{
  top: number;
  width: number;
  height: number;
  rotate?: number;
  label?: string;
  delay?: number;
  children: React.ReactNode;
}> = ({top, width, height, rotate = 0, label, delay = 0, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame: frame - delay, fps, config: {damping: 200, stiffness: 260, mass: 0.7}});
  return (
    <AbsoluteFill style={{alignItems: 'center'}}>
      <div
        style={{
          position: 'absolute',
          top,
          opacity: Math.min(1, Math.max(0, enter)),
          transform: `rotate(${rotate}deg) scale(${interpolate(Math.min(1, Math.max(0, enter)), [0, 1], [0.93, 1])})`,
          border: '6px solid #FFFFFF',
          borderRadius: 14,
          overflow: 'hidden',
          boxShadow: '0 14px 48px rgba(0,0,0,0.55)',
          background: '#000',
          width,
        }}
      >
        <div style={{width, height}}>{children}</div>
        {label ? (
          <div
            style={{
              background: COLORS.ink,
              color: '#fff',
              fontFamily: CONDENSED,
              fontWeight: 700,
              fontSize: 27,
              letterSpacing: 2,
              textAlign: 'center',
              padding: '9px 0 10px',
            }}
          >
            {label}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

// ---------- píldora de etiqueta ----------

const Pill: React.FC<{text: string; bg?: string; color?: string; size?: number}> =
({text, bg = COLORS.red, color = '#fff', size = 30}) => (
  <span
    style={{
      display: 'inline-block',
      background: bg,
      color,
      fontFamily: CONDENSED,
      fontWeight: 700,
      fontSize: size,
      letterSpacing: 1.5,
      padding: '8px 20px',
      borderRadius: 999,
      boxShadow: '0 6px 24px rgba(0,0,0,0.45)',
    }}
  >
    {text}
  </span>
);

// ---------- línea de titular con entrada por spring ----------

const Headline: React.FC<{
  lines: Array<Array<{t: string; red?: boolean}>>;
  top: number;
  size?: number;
  delay?: number;
  step?: number;
  align?: 'center' | 'left';
}> = ({lines, top, size = 58, delay = 0, step = 9, align = 'center'}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{alignItems: align === 'center' ? 'center' : 'flex-start'}}>
      <div style={{position: 'absolute', top, marginLeft: 56, marginRight: 56, textAlign: align}}>
        {lines.map((line, li) => {
          const enter = spring({frame: frame - delay - li * step, fps, config: {damping: 200, stiffness: 300, mass: 0.6}});
          const o = Math.min(1, Math.max(0, enter));
          return (
            <div
              key={li}
              style={{
                opacity: o,
                transform: `translateY(${interpolate(o, [0, 1], [26, 0])}px)`,
                fontFamily: ARCHIVO,
                fontSize: size,
                lineHeight: 1.16,
                whiteSpace: 'nowrap',
              }}
            >
              {line.map((w, wi) => (
                <span key={wi} style={{color: w.red ? COLORS.red : '#fff', textShadow: outline(3)}}>
                  {w.t}{wi < line.length - 1 ? ' ' : ''}
                </span>
              ))}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---------- karaoke (patrón Pilar V30): subtítulos = la voz en off ----------

const ALL_CHUNKS = CAPTIONS.flatMap((s) => s.chunks);

const KaraokeInner: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  let active = null as (typeof ALL_CHUNKS)[number] | null;
  for (const c of ALL_CHUNKS) {
    if (c.start <= t) active = c; else break;
  }
  if (!active) return null;
  const text = active.words.map((w) => w.t).join(' ');
  const size = text.length > 28 ? 52 : 60;
  return (
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center'}}>
      <div
        style={{
          marginBottom: 235,
          marginLeft: 40,
          marginRight: 40,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          fontFamily: ARCHIVO,
          fontSize: size,
          lineHeight: 1.18,
        }}
      >
        {active.words.map((w, i) => {
          const revealed = w.s <= t;
          const isCurrent = revealed && (i === active.words.length - 1 || active.words[i + 1].s > t);
          // Pop crece desde el borde IZQUIERDO de la palabra para no comerse
          // el hueco con la anterior (la siguiente aún está oculta al hacer pop).
          const pop = isCurrent
            ? interpolate(t - w.s, [0, 0.1], [1.2, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
            : 1;
          return (
            <span
              key={i}
              style={{
                visibility: revealed ? 'visible' : 'hidden',
                color: w.kw ? COLORS.red : '#FFFFFF',
                display: 'inline-block',
                transform: `scale(${pop})`,
                transformOrigin: '0% 50%',
                margin: '0 12px',
                textShadow: outline(3),
              }}
            >
              {w.t}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const Karaoke: React.FC = () => (
  <Sequence from={0} durationInFrames={CONTENT_END} name="karaoke">
    <KaraokeInner />
  </Sequence>
);

// ---------- marca de agua (logotipo completo oficial) ----------
// Regla general del Memorial (15-nov-2026, corrección del usuario): la
// marca es el LOGOTIPO COMPLETO (estrella roja + «MEMORIAL DE LA
// DENUNCIA»), nunca solo la estrella. Lockup vertical 573×907; a 130 px
// de ancho las letras se leen y no tapa contenido. La sombra suave es
// solo legibilidad sobre fotos claras (no es caja ni borde).

const LogoInner: React.FC<{dur: number}> = ({dur}) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const fadeOut = interpolate(frame, [dur - 10, dur], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill>
      <Img
        src={staticFile('img/logo-full.png')}
        style={{
          position: 'absolute',
          top: 54,
          right: 40,
          width: 130,
          opacity: Math.min(fadeIn, fadeOut) * 0.95,
          filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.55))',
        }}
      />
    </AbsoluteFill>
  );
};

// ---------- audio: VO + música con ducking + sting ----------

// Ducking: la música baja a 0.25 mientras habla la VO (ataque 0.12 s antes
// de cada línea, liberación 0.2 s después). Las ventanas que se solapan
// (pausas de 0.2 s entre líneas) se fusionan: la música solo respira en
// las dos pausas dramáticas y en la cola antes del sting.
const DUCK = 0.25;
const DUCK_KEYS: Array<[number, number]> = (() => {
  const keys: Array<[number, number]> = [];
  const push = (t: number, v: number) => {
    const tt = Math.max(0, t);
    if (keys.length && keys[keys.length - 1][0] === tt) keys[keys.length - 1][1] = v;
    else keys.push([tt, v]);
  };
  const windows: Array<[number, number]> = [];
  for (const l of VO_LINES) {
    const s = l.start - 0.12;
    const e = l.end + 0.2;
    const last = windows[windows.length - 1];
    if (last && s <= last[1]) last[1] = Math.max(last[1], e);
    else windows.push([s, e]);
  }
  push(0, 1);
  for (const [s, e] of windows) {
    push(s, 1);
    push(s + 0.12, DUCK);
    push(e - 0.2, DUCK);
    push(e, 1);
  }
  push(CONTENT_END / FPS, 1);
  return keys;
})();

const musicVolume = (frame: number): number =>
  interpolate(
    frame / FPS,
    DUCK_KEYS.map((k) => k[0]),
    DUCK_KEYS.map((k) => k[1]),
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );

const VoiceOverInner: React.FC = () => (
  <Audio src={staticFile('audio/vo-preview.wav')} volume={1} />
);

const MusicInner: React.FC = () => {
  const frame = useCurrentFrame();
  return <Audio src={staticFile('audio/music-ai.wav')} volume={musicVolume(frame)} />;
};

const StingAudioInner: React.FC = () => <Audio src={staticFile('audio/sting-2x.wav')} volume={1} />;

// ================================================================
// BEAT 1 — GANCHO (0-2.90 s): foto héroe a pantalla completa + el dato
// OFAC como rótulo grande desde el FOTOGRAMA 1 (V1.1, auditoría: el
// gancho de V1 era solo la pregunta del karaoke, que tardaba 2,7 s en
// leerse y no había cara en los primeros 3 s). El titular va FUERA del
// fade de entrada del beat (opacidad 1 desde el frame 0; solo hereda el
// fade de salida), para que se lea en el primer fotograma. La VO sigue
// con la pregunta «¿Sabías que...?» como eco retórico. El rótulo va en
// el tercio superior (cielo del amanecer), sin tapar al corredor ni
// chocar con el karaoke inferior ni con la marca de agua (entra en f30).
// ================================================================

const HookInner: React.FC = () => {
  const frame = useCurrentFrame();
  // Sin fade de ENTRADA: el gancho es el primer fotograma del reel (no hay
  // nada desde lo que fundir) y la foto debe verse en el frame 0 junto al
  // titular. Solo hereda el fade de salida hacia el beat 2.
  const fadeOut = interpolate(frame, [BEATS.hook.dur, BEATS.hook.dur + 8], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const pillIn = interpolate(frame, [55, 65], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const hookLines: Array<Array<{t: string; red?: boolean}>> = [
    [{t: 'EE.UU.'}, {t: 'PROHIBIÓ', red: true}],
    [{t: 'QUE SUS CORREDORES'}],
    [{t: 'VINIERAN A MARABANA'}],
  ];
  return (
    <>
      <AbsoluteFill style={{opacity: fadeOut}}>
        <KenBurnsImg src="img/hero-vertical.jpg" dur={BEATS.hook.dur} fromScale={1} toScale={1.09} origin="50% 62%" />
        {/* scrims: arriba para el rótulo y la marca de agua, abajo para la píldora */}
        <AbsoluteFill style={{background: 'linear-gradient(to bottom, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.35) 26%, rgba(0,0,0,0.08) 38%, transparent 48%, transparent 82%, rgba(0,0,0,0.45) 100%)'}} />
        <AbsoluteFill style={{alignItems: 'center', opacity: pillIn}}>
          <div style={{position: 'absolute', top: 1700}}>
            <Pill text="40ª MARABANA · LA HABANA · 15 NOV 2026" bg="rgba(10,14,17,0.85)" size={28} />
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
      {/* titular del gancho: visible desde el frame 0, solo fade de salida */}
      <AbsoluteFill style={{alignItems: 'center', opacity: fadeOut}}>
        <div style={{position: 'absolute', top: 300, marginLeft: 56, marginRight: 56, textAlign: 'center'}}>
          {hookLines.map((line, li) => (
            <div key={li} style={{fontFamily: ARCHIVO, fontSize: 62, lineHeight: 1.18, whiteSpace: 'nowrap'}}>
              {line.map((w, wi) => (
                <span key={wi} style={{color: w.red ? COLORS.red : '#fff', textShadow: outline(3)}}>
                  {w.t}{wi < line.length - 1 ? ' ' : ''}
                </span>
              ))}
            </div>
          ))}
        </div>
      </AbsoluteFill>
    </>
  );
};

// ================================================================
// BEAT 2 — EL DATO 2012 (2.90-8.43 s): 2012 gigante + gráfico vectorial
// + nota OFAC. El sello CANCELADO golpea DENTRO del beat, en la palabra
// "canceló" (abs 133 = local 46), y queda sobre la tarjeta.
// ================================================================

const Dato2012Inner: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const opacity = useBeatFade(BEATS.dato2012.dur);
  const STAMP_LOCAL = STAMP_FRAME - BEATS.dato2012.from; // 46
  // Sacudida del contenido cuando golpea el sello (local 46-58)
  const shakeAmp = interpolate(frame, [STAMP_LOCAL, STAMP_LOCAL + 12], [9, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const shakeX = frame >= STAMP_LOCAL && frame <= STAMP_LOCAL + 12 ? Math.sin((frame - STAMP_LOCAL) * 1.9) * shakeAmp : 0;
  const year = spring({frame, fps, config: {damping: 200, stiffness: 240, mass: 0.7}});
  const smallIn = interpolate(frame, [75, 85], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  // Sello: spring con sobreimpulso; escala 2.4->1 (rebote a ~0.86).
  const slam = spring({frame: frame - STAMP_LOCAL, fps, config: {damping: 11, stiffness: 280, mass: 0.9}});
  const flash = interpolate(frame, [STAMP_LOCAL, STAMP_LOCAL + 2, STAMP_LOCAL + 14], [0, 0.55, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const slamScale = interpolate(slam, [0, 1], [2.4, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'extend'});
  return (
    <AbsoluteFill style={{opacity, transform: `translateX(${shakeX}px)`}}>
      <AbsoluteFill style={{alignItems: 'center'}}>
        <div
          style={{
            position: 'absolute',
            top: 150,
            opacity: Math.min(1, Math.max(0, year)),
            transform: `scale(${interpolate(Math.min(1, Math.max(0, year)), [0, 1], [0.7, 1])})`,
            fontFamily: ARCHIVO,
            fontSize: 190,
            color: '#fff',
            textShadow: outline(3),
            lineHeight: 1,
          }}
        >
          2012
        </div>
        <div
          style={{
            position: 'absolute',
            top: 362,
            width: 340,
            height: 10,
            background: COLORS.red,
            borderRadius: 5,
            opacity: Math.min(1, Math.max(0, year)),
          }}
        />
      </AbsoluteFill>
      <EvidenceCard top={430} width={920} height={613} delay={12}>
        <KenBurnsImg src="img/vector-2012.png" dur={BEATS.dato2012.dur} fromScale={1} toScale={1.04} />
      </EvidenceCard>
      <AbsoluteFill style={{alignItems: 'center', opacity: smallIn}}>
        <div
          style={{
            position: 'absolute',
            top: 1330,
            marginLeft: 70,
            marginRight: 70,
            textAlign: 'center',
            fontFamily: CONDENSED,
            fontSize: 30,
            color: COLORS.gray,
            lineHeight: 1.45,
          }}
        >
          OFAC: OFICINA DE CONTROL DE ACTIVOS EXTRANJEROS DE EE. UU.
          <br />
          LA CARRERA «NO CALIFICABA» COMO PROGRAMA PUEBLO A PUEBLO
        </div>
      </AbsoluteFill>
      {/* destello rojo al golpear el sello */}
      <AbsoluteFill
        style={{
          opacity: flash,
          background: 'radial-gradient(ellipse at center, rgba(237,28,36,0.5) 0%, rgba(237,28,36,0.18) 55%, transparent 75%)',
        }}
      />
      {/* sello CANCELADO sobre la tarjeta */}
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        <div
          style={{
            transform: `rotate(-12deg) scale(${slamScale})`,
            opacity: frame < STAMP_LOCAL ? 0 : 1,
            border: `9px solid ${COLORS.red}`,
            borderRadius: 14,
            padding: '16px 36px',
            fontFamily: ARCHIVO,
            fontSize: 96,
            color: COLORS.red,
            letterSpacing: 2,
            textShadow: '0 6px 30px rgba(0,0,0,0.7)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
            marginTop: -230,
          }}
        >
          CANCELADO
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ================================================================
// BEAT 3 — CONTRASTE (8.43-11.77 s): «21» gigante + línea de tiempo.
// La VO dice la frase; en pantalla solo el número y el arco 2011→2012.
// ================================================================

const ContrasteInner: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const opacity = useBeatFade(BEATS.contraste.dur);
  const lineDraw = interpolate(frame, [10, 50], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const node2011 = spring({frame: frame - 18, fps, config: {damping: 200, stiffness: 300, mass: 0.6}});
  const node2012 = spring({frame: frame - 42, fps, config: {damping: 200, stiffness: 300, mass: 0.6}});
  return (
    <AbsoluteFill style={{opacity}}>
      <Headline
        top={400}
        size={72}
        delay={0}
        step={10}
        lines={[
          [{t: 'EN 2011,'}],
        ]}
      />
      <AbsoluteFill style={{alignItems: 'center'}}>
        <div
          style={{
            position: 'absolute',
            top: 500,
            fontFamily: ARCHIVO,
            fontSize: 280,
            color: COLORS.red,
            textShadow: outline(3),
            lineHeight: 1,
            opacity: interpolate(frame, [8, 16], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
            transform: `scale(${interpolate(frame, [8, 16], [0.7, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})})`,
          }}
        >
          21
        </div>
      </AbsoluteFill>
      {/* línea de tiempo */}
      <AbsoluteFill style={{alignItems: 'center'}}>
        <div style={{position: 'absolute', top: 1080, width: 800, height: 6, background: 'rgba(255,255,255,0.25)', borderRadius: 3}}>
          <div style={{width: `${lineDraw * 100}%`, height: 6, background: '#fff', borderRadius: 3}} />
        </div>
        {/* nodo 2011 */}
        <div
          style={{
            position: 'absolute', top: 1052, left: 190,
            width: 62, height: 62, borderRadius: 31, background: '#fff',
            transform: `scale(${Math.min(1, Math.max(0, node2011))})`,
            boxShadow: '0 0 0 8px rgba(255,255,255,0.18)',
          }}
        />
        <div style={{position: 'absolute', top: 1140, left: 140, fontFamily: CONDENSED, fontWeight: 700, fontSize: 30, color: '#fff', opacity: Math.min(1, Math.max(0, node2011))}}>
          2011 · CORRIERON
        </div>
        {/* nodo 2012 */}
        <div
          style={{
            position: 'absolute', top: 1052, left: 828,
            width: 62, height: 62, borderRadius: 31, background: COLORS.red,
            transform: `scale(${Math.min(1, Math.max(0, node2012))})`,
            boxShadow: '0 0 0 8px rgba(237,28,36,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: ARCHIVO, fontSize: 34, color: '#fff',
          }}
        >
          ✕
        </div>
        <div style={{position: 'absolute', top: 1140, left: 770, fontFamily: CONDENSED, fontWeight: 700, fontSize: 30, color: COLORS.red, opacity: Math.min(1, Math.max(0, node2012))}}>
          2012 · CANCELADO
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ================================================================
// BEAT 4 — EL GIRO (11.77-13.22 s): whip + multitud. Beat corto de
// transición (44 f): todo entra rápido. V1.1: sin el titular «PERO A
// PESAR DE ELLO…» — el karaoke ya dice exactamente eso; la foto sube y
// crece para llenar el cuadro (el whip + la foto + el karaoke bastan).
// ================================================================

const GiroInner: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = useBeatFade(BEATS.giro.dur);
  const whip = interpolate(frame, [0, 12], [1.18, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  return (
    <AbsoluteFill style={{opacity, transform: `scale(${whip})`}}>
      <EvidenceCard top={300} width={920} height={980} rotate={-1.5} label="FOTO: INDER / CUBADEBATE" delay={2}>
        <KenBurnsImg src="img/photo-1.jpg" dur={BEATS.giro.dur} fromScale={1} toScale={1.08} origin="50% 40%" />
      </EvidenceCard>
    </AbsoluteFill>
  );
};

// ================================================================
// BEAT 5 — LA SALIDA (13.22-14.97 s): ventana de video real.
// 55 fotogramas de arrancada; el corte cae en «tres» (VO L5).
// ================================================================

const SalidaInner: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = useBeatFade(BEATS.salida.dur);
  const creditIn = interpolate(frame, [20, 28], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const pillsIn = interpolate(frame, [15, 23], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{opacity}}>
      <Headline top={270} size={72} delay={0} lines={[[{t: '40ª MARABANA'}]]} />
      <AbsoluteFill style={{alignItems: 'center'}}>
        <div
          style={{
            position: 'absolute',
            top: 370,
            fontFamily: CONDENSED,
            fontWeight: 600,
            fontSize: 34,
            color: COLORS.gray,
            letterSpacing: 3,
            opacity: interpolate(frame, [8, 16], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
          }}
        >
          15 DE NOVIEMBRE DE 2026
        </div>
      </AbsoluteFill>
      <EvidenceCard top={480} width={920} height={518} label="ARRANCADA · SALA POLIVALENTE RAMÓN FONST" delay={3}>
        <OffthreadVideo
          src={staticFile('video/start.mp4')}
          style={{width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'brightness(1.18) contrast(1.05)'}}
        />
      </EvidenceCard>
      <AbsoluteFill style={{alignItems: 'center', opacity: creditIn}}>
        <div
          style={{
            position: 'absolute',
            top: 1120,
            fontFamily: CONDENSED,
            fontSize: 28,
            color: COLORS.gray,
            letterSpacing: 1.5,
          }}
        >
          VIDEO: CANAL CARIBE · 15 NOV 2026
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{alignItems: 'center', opacity: pillsIn}}>
        <div style={{position: 'absolute', top: 1300, display: 'flex', gap: 18}}>
          <Pill text="42K" bg="#1C242B" size={30} />
          <Pill text="21K" bg="#1C242B" size={30} />
          <Pill text="10K" bg="#1C242B" size={30} />
          <Pill text="5K" bg="#1C242B" size={30} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ================================================================
// BEAT 6 — EL NÚMERO (14.97-19.90 s): count-up 3.000 + foto con estela.
// El count-up arranca con la palabra «tres» y resuelve mientras la VO
// dice «tres mil corredores tomaron las calles».
// ================================================================

const NumeroInner: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = useBeatFade(BEATS.numero.dur);
  const count = Math.round(interpolate(frame, [8, 68], [0, 3000], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  // Formato manual: toLocaleString('es-ES') no agrupa en este Chromium (daba "2850").
  const countText = count >= 1000 ? `${Math.floor(count / 1000)}.${String(count % 1000).padStart(3, '0')}` : String(count);
  return (
    <AbsoluteFill style={{opacity}}>
      <AbsoluteFill style={{alignItems: 'center'}}>
        <div style={{position: 'absolute', top: 270, fontFamily: CONDENSED, fontWeight: 700, fontSize: 40, color: COLORS.gray, letterSpacing: 6}}>
          CASI
        </div>
        <div
          style={{
            position: 'absolute',
            top: 315,
            fontFamily: ARCHIVO,
            fontSize: 150,
            color: COLORS.red,
            textShadow: outline(3),
            lineHeight: 1,
          }}
        >
          {countText}
        </div>
        <div style={{position: 'absolute', top: 480, fontFamily: ARCHIVO, fontSize: 62, color: '#fff', textShadow: outline(3)}}>
          CORREDORES
        </div>
      </AbsoluteFill>
      <EvidenceCard top={620} width={920} height={739} rotate={1} label="FOTO: INDER / CUBADEBATE" delay={4}>
        <KenBurnsImg src="img/photo-4-trail.jpg" dur={BEATS.numero.dur} fromScale={1.06} toScale={1.12} panX={[24, -24]} origin="50% 45%" />
      </EvidenceCard>
    </AbsoluteFill>
  );
};

// ================================================================
// BEAT 7 — LA 5K (19.90-23.80 s): nombre oficial como rótulo.
// ================================================================

const CincoKInner: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const opacity = useBeatFade(BEATS.cincoK.dur);
  const fiveK = spring({frame, fps, config: {damping: 200, stiffness: 280, mass: 0.6}});
  return (
    <AbsoluteFill style={{opacity}}>
      <AbsoluteFill style={{alignItems: 'center'}}>
        <div
          style={{
            position: 'absolute',
            top: 230,
            fontFamily: ARCHIVO,
            fontSize: 130,
            color: COLORS.red,
            textShadow: outline(3),
            lineHeight: 1,
            opacity: Math.min(1, Math.max(0, fiveK)),
            transform: `scale(${interpolate(Math.min(1, Math.max(0, fiveK)), [0, 1], [0.7, 1])})`,
          }}
        >
          5K
        </div>
      </AbsoluteFill>
      <Headline
        top={385}
        size={56}
        delay={12}
        step={12}
        lines={[
          [{t: 'CARRERA CONTRA EL'}],
          [{t: 'BLOQUEO', red: true}, {t: 'Y POR LA PAZ'}],
        ]}
      />
      <EvidenceCard top={640} width={920} height={541} rotate={-1} label="FOTO: INDER / CUBADEBATE" delay={8}>
        <KenBurnsImg src="img/photo-2.jpg" dur={BEATS.cincoK.dur} fromScale={1} toScale={1.1} origin="50% 30%" />
      </EvidenceCard>
    </AbsoluteFill>
  );
};

// ================================================================
// BEAT 8 — LA VOZ (23.80-27.97 s): cita de Yuraldi Cava (AP).
// La cita en pantalla es el overlay de evidencia; la VO la introduce.
// ================================================================

const VozInner: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = useBeatFade(BEATS.voz.dur);
  const attrIn = interpolate(frame, [45, 55], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{opacity}}>
      <Headline
        top={250}
        size={58}
        delay={6}
        step={12}
        lines={[
          [{t: '«EL'}, {t: 'BLOQUEO', red: true}],
          [{t: 'ASFIXIA AL PUEBLO'}],
          [{t: 'CUBANO»'}],
        ]}
      />
      <EvidenceCard top={620} width={920} height={661} rotate={1.5} label="FOTO: INDER / CUBADEBATE" delay={8}>
        <KenBurnsImg src="img/photo-3.jpg" dur={BEATS.voz.dur} fromScale={1} toScale={1.09} origin="50% 35%" />
      </EvidenceCard>
      <AbsoluteFill style={{alignItems: 'center', opacity: attrIn}}>
        <div style={{position: 'absolute', top: 1410, fontFamily: CONDENSED, fontWeight: 600, fontSize: 30, color: COLORS.gray, letterSpacing: 1}}>
          — YURALDI CAVA, CORREDOR · AGENCIA AP
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ================================================================
// BEAT 9 — LOS GANADORES (27.97-32.90 s): tarjeta de datos.
// La VO solo dice apellidos; la tarjeta aporta los tiempos (dato nuevo).
// V1.1 (auditoría): las filas de 21K y la foto entran a los ~0,5 s del
// beat (antes a los 2,6 s, dejando el cuadro medio vacío del 27,4 al
// 30 s). Se pierde un poco la sincronía con la frase «Y en la media…»,
// pero la tarjeta se ve sustancial desde el primer medio segundo.
// ================================================================

const GanadoresInner: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const opacity = useBeatFade(BEATS.ganadores.dur);
  const cardIn = spring({frame: frame - 6, fps, config: {damping: 200, stiffness: 260, mass: 0.7}});
  const row2 = interpolate(frame, [15, 23], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  // La sección 21K CRECE desde altura 0 (no solo aparece).
  const row2H = interpolate(frame, [15, 29], [0, 275], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const tagIn = interpolate(frame, [30, 38], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const noteIn = interpolate(frame, [40, 48], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{opacity}}>
      <Headline top={210} size={56} delay={0} lines={[[{t: 'LOS GANADORES'}]]} />
      <AbsoluteFill style={{alignItems: 'center'}}>
        <div
          style={{
            position: 'absolute',
            top: 320,
            width: 940,
            opacity: Math.min(1, Math.max(0, cardIn)),
            transform: `scale(${interpolate(Math.min(1, Math.max(0, cardIn)), [0, 1], [0.93, 1])})`,
            background: COLORS.ivory,
            borderRadius: 18,
            padding: '30px 34px 34px',
            boxShadow: '0 14px 48px rgba(0,0,0,0.55)',
          }}
        >
          <div style={{fontFamily: CONDENSED, fontWeight: 700, fontSize: 30, color: COLORS.red, letterSpacing: 2}}>
            42K · MARATÓN
          </div>
          <div style={{fontFamily: ARCHIVO, fontSize: 46, color: COLORS.ink, marginTop: 8, lineHeight: 1.15}}>
            ESTÉVEZ 2:25:31
          </div>
          <div style={{fontFamily: ARCHIVO, fontSize: 46, color: COLORS.ink, lineHeight: 1.15}}>
            BACALLAO 2:45:41
          </div>
          <div style={{height: row2H, overflow: 'hidden', opacity: row2}}>
            <div style={{height: 2, background: 'rgba(0,0,0,0.12)', margin: '22px 0'}} />
            <div style={{fontFamily: CONDENSED, fontWeight: 700, fontSize: 30, color: COLORS.red, letterSpacing: 2}}>
              21K · MEDIA MARATÓN
            </div>
            <div style={{fontFamily: ARCHIVO, fontSize: 46, color: COLORS.ink, marginTop: 8, lineHeight: 1.15}}>
              TAMERÓN 1:06:53
            </div>
            <div style={{fontFamily: ARCHIVO, fontSize: 46, color: COLORS.ink, lineHeight: 1.15}}>
              LÓPEZ GUISAO 1:17:24
            </div>
            <div style={{marginTop: 22, opacity: tagIn}}>
              <Pill text="DOBLETE TUNERO EN 21K" size={28} />
            </div>
          </div>
        </div>
      </AbsoluteFill>
      <EvidenceCard top={960} width={680} height={383} label="TAMERÓN Y LÓPEZ · LAS TUNAS · FOTO: TIEMPO21" delay={15}>
        <KenBurnsImg src="img/tunas.jpg" dur={BEATS.ganadores.dur} fromScale={1} toScale={1.07} origin="50% 30%" />
      </EvidenceCard>
      <AbsoluteFill style={{alignItems: 'center', opacity: noteIn}}>
        <div style={{position: 'absolute', top: 1460, fontFamily: CONDENSED, fontSize: 29, color: COLORS.gray, textAlign: 'center', marginLeft: 70, marginRight: 70}}>
          2:25:31, MEJOR MARCA MASCULINA EN MARABANA DESDE 2012
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ================================================================
// BEAT 10 — ERNESTO (32.90-38.03 s): el pico emocional.
// V1.1: sin el titular «COMPLETÓ LOS 10K» — el karaoke ya dice
// «completó los diez kilómetros»; quedan el nombre, la foto, el remate
// «CON UN BASTÓN» (con la pausa dramática, abs 1094 = local 107) y el
// dorsal 5766.
// ================================================================

const ErnestoInner: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = useBeatFade(BEATS.ernesto.dur);
  const BASTON_LOCAL = BASTON_FRAME - BEATS.ernesto.from; // 107
  const pillIn = interpolate(frame, [120, 128], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{opacity}}>
      <Headline
        top={250}
        size={58}
        delay={0}
        step={9}
        lines={[
          [{t: 'ERNESTO JAVIER'}],
          [{t: 'CONSUEGRA'}],
        ]}
      />
      <EvidenceCard top={430} width={960} height={640} label="FOTO: JIT / CUBADEBATE" delay={5}>
        <KenBurnsImg src="img/photo-6.jpg" dur={BEATS.ernesto.dur} fromScale={1} toScale={1.12} origin="68% 28%" />
      </EvidenceCard>
      <Headline
        top={1180}
        size={54}
        delay={BASTON_LOCAL}
        step={1}
        lines={[
          [{t: 'CON UN'}, {t: 'BASTÓN', red: true}],
        ]}
      />
      <AbsoluteFill style={{alignItems: 'center', opacity: pillIn}}>
        <div style={{position: 'absolute', top: 1420}}>
          <Pill text="DORSAL 5766" size={30} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ================================================================
// BEAT 11 — EL CIERRE (38.03-41.90 s): «HOY LA HABANA CORRIÓ.» en grande
// + foto de la meta. La segunda frase («Y cada paso fue una denuncia»)
// la lleva el karaoke: no se duplica en titular.
// ================================================================

const CierreInner: React.FC = () => {
  const opacity = useBeatFade(BEATS.cierre.dur);
  return (
    <AbsoluteFill style={{opacity}}>
      <Headline
        top={250}
        size={62}
        delay={0}
        step={10}
        lines={[
          [{t: 'HOY LA HABANA'}],
          [{t: 'CORRIÓ.'}],
        ]}
      />
      <EvidenceCard top={560} width={840} height={791} rotate={-1} label="FOTO: INDER / CUBADEBATE" delay={8}>
        <KenBurnsImg src="img/photo-5.jpg" dur={BEATS.cierre.dur} fromScale={1} toScale={1.08} origin="50% 30%" />
      </EvidenceCard>
    </AbsoluteFill>
  );
};

// ================================================================
// STING (41.90-44.90 s): cierre animado oficial «la del disparo» A 2x
// (V1.1, auditoría: el sting de 6 s lastraba la finalización y mataba
// el loop). Decisión de director: acelerar 2x en vez de congelar el
// fotograma final — se conserva la animación oficial, el disparo
// (~0,65 s) y el logotipo completo, que resuelve a ~1,75 s y aguanta
// ~1,25 s en pantalla. Activos pre-procesados: video/sting-2x.mp4 +
// audio/sting-2x.wav (ffmpeg setpts/atempo, ver EDIT_NOTES.md).
// ================================================================

const StingInner: React.FC = () => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 4], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: '#000', opacity: fadeIn}}>
      <OffthreadVideo src={staticFile('video/sting-2x.mp4')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    </AbsoluteFill>
  );
};

// ================================================================
// COMPOSICIÓN PRINCIPAL
// ================================================================

export const MainReel: React.FC = () => {
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {/* fondo tinta durante todo el contenido */}
      <Sequence from={0} durationInFrames={CONTENT_END} name="background">
        <Background />
      </Sequence>

      <Sequence from={BEATS.hook.from} durationInFrames={BEATS.hook.dur + 8} name="beat01-hook">
        <HookInner />
      </Sequence>
      <Sequence from={BEATS.dato2012.from} durationInFrames={BEATS.dato2012.dur + 8} name="beat02-2012">
        <Dato2012Inner />
      </Sequence>
      <Sequence from={BEATS.contraste.from} durationInFrames={BEATS.contraste.dur + 8} name="beat03-contraste">
        <ContrasteInner />
      </Sequence>
      <Sequence from={BEATS.giro.from} durationInFrames={BEATS.giro.dur + 8} name="beat04-giro">
        <GiroInner />
      </Sequence>
      <Sequence from={BEATS.salida.from} durationInFrames={BEATS.salida.dur + 8} premountFor={30} name="beat05-salida">
        <SalidaInner />
      </Sequence>
      <Sequence from={BEATS.numero.from} durationInFrames={BEATS.numero.dur + 8} name="beat06-numero">
        <NumeroInner />
      </Sequence>
      <Sequence from={BEATS.cincoK.from} durationInFrames={BEATS.cincoK.dur + 8} name="beat07-5k">
        <CincoKInner />
      </Sequence>
      <Sequence from={BEATS.voz.from} durationInFrames={BEATS.voz.dur + 8} name="beat08-voz">
        <VozInner />
      </Sequence>
      <Sequence from={BEATS.ganadores.from} durationInFrames={BEATS.ganadores.dur + 8} name="beat09-ganadores">
        <GanadoresInner />
      </Sequence>
      <Sequence from={BEATS.ernesto.from} durationInFrames={BEATS.ernesto.dur + 8} name="beat10-ernesto">
        <ErnestoInner />
      </Sequence>
      <Sequence from={BEATS.cierre.from} durationInFrames={BEATS.cierre.dur + 8} name="beat11-cierre">
        <CierreInner />
      </Sequence>

      {/* karaoke: subtítulos de la VO durante todo el contenido */}
      <Karaoke />

      {/* marca de agua: del fotograma 30 al final del contenido */}
      <Sequence from={LOGO_FROM} durationInFrames={LOGO_TO - LOGO_FROM} name="logo">
        <LogoInner dur={LOGO_TO - LOGO_FROM} />
      </Sequence>

      {/* voz en off (0-41.5 s) + música con ducking + audio del sting */}
      <Sequence from={0} durationInFrames={CONTENT_END} name="voiceover">
        <VoiceOverInner />
      </Sequence>
      <Sequence from={0} durationInFrames={CONTENT_END} name="music">
        <MusicInner />
      </Sequence>
      {/* sting-audio: adelanto de 9 fotogramas (0,30 s) para compensar
          la deriva de audio del pipeline por tramos (medida en el máster
          V1.1: el disparo caía en sting +0,99 s en vez de +0,68 s; V1
          tenía la misma deriva, +0,33 s). El audio del sting empieza con
          ~0,65 s de silencio, así que el adelanto no mete sonido audible
          en la cola del contenido. */}
      <Sequence from={CONTENT_END - 9} durationInFrames={STING_DUR + 9} name="sting-audio">
        <StingAudioInner />
      </Sequence>

      {/* sting oficial a pantalla completa */}
      <Sequence from={BEATS.sting.from} durationInFrames={BEATS.sting.dur} premountFor={30} name="sting">
        <StingInner />
      </Sequence>
    </AbsoluteFill>
  );
};
