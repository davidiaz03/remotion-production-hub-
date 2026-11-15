import React from 'react';
import {
  AbsoluteFill, Audio, Easing, Img, OffthreadVideo, Sequence, interpolate,
  spring, staticFile, useCurrentFrame, useVideoConfig,
} from 'remotion';
import {BEATS, COLORS, CONTENT_END, LOGO_FROM, LOGO_TO} from './timeline';

// REEL MARABANA V1 — «La carrera que el bloqueo no pudo parar»
// Explainer visual sin presentadora: foto + texto cinético + motion graphics.
// Estrategia: STRATEGY.md. 1080x1920, 30 fps, 1380 fotogramas (46 s).

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

// ---------- texto cinético palabra por palabra (con pop) ----------

type Word = {t: string; red?: boolean};

const KineticWords: React.FC<{
  words: Word[];
  startFrame: number;
  interval: number;
  size?: number;
  top: number;
  lineHeight?: number;
}> = ({words, startFrame, interval, size = 64, top, lineHeight = 1.18}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{alignItems: 'center'}}>
      <div
        style={{
          position: 'absolute',
          top,
          marginLeft: 56,
          marginRight: 56,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          fontFamily: ARCHIVO,
          fontSize: size,
          lineHeight,
        }}
      >
        {words.map((w, i) => {
          const at = startFrame + i * interval;
          const revealed = frame >= at;
          const pop = revealed
            ? interpolate(frame - at, [0, 3], [1.25, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
            : 1;
          return (
            <span
              key={i}
              style={{
                visibility: revealed ? 'visible' : 'hidden',
                color: w.red ? COLORS.red : '#FFFFFF',
                display: 'inline-block',
                transform: `scale(${pop})`,
                transformOrigin: '0% 50%',
                margin: '0 11px',
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

// ---------- línea de titular con entrada por spring ----------

const Headline: React.FC<{
  lines: Word[][];
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

// ---------- marca de agua (estrella oficial) ----------

const LogoInner: React.FC<{dur: number}> = ({dur}) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const fadeOut = interpolate(frame, [dur - 10, dur], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill>
      <Img
        src={staticFile('img/logo-star.png')}
        style={{
          position: 'absolute',
          top: 54,
          right: 40,
          width: 118,
          opacity: Math.min(fadeIn, fadeOut) * 0.95,
        }}
      />
    </AbsoluteFill>
  );
};

// ---------- música ----------

const MusicInner: React.FC = () => <Audio src={staticFile('audio/music.wav')} volume={1} />;
const StingAudioInner: React.FC = () => <Audio src={staticFile('audio/sting.wav')} volume={1} />;

// ================================================================
// BEAT 1 — GANCHO (0-3.5 s): foto héroe a pantalla completa + pregunta
// ================================================================

const HookInner: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = useBeatFade(BEATS.hook.dur);
  const pillIn = interpolate(frame, [70, 80], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{opacity}}>
      <KenBurnsImg src="img/hero-vertical.jpg" dur={BEATS.hook.dur} fromScale={1} toScale={1.09} origin="50% 62%" />
      {/* scrims: arriba para el texto, abajo para la píldora */}
      <AbsoluteFill style={{background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.12) 30%, transparent 45%, transparent 82%, rgba(0,0,0,0.45) 100%)'}} />
      <KineticWords
        top={150}
        size={62}
        startFrame={6}
        interval={11}
        words={[
          {t: '¿SABÍAS'}, {t: 'QUE'}, {t: 'EL'}, {t: 'BLOQUEO', red: true},
          {t: 'LLEGÓ'}, {t: 'HASTA'}, {t: 'EL'}, {t: 'MARATÓN?', red: true},
        ]}
      />
      <AbsoluteFill style={{alignItems: 'center', opacity: pillIn}}>
        <div style={{position: 'absolute', top: 1700}}>
          <Pill text="40ª MARABANA · LA HABANA · 15 NOV 2026" bg="rgba(10,14,17,0.85)" size={28} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ================================================================
// BEATS 2-3 — EL DATO 2012 + SELLO CANCELADO (3.5-9.5 s)
// Fondo continuo; el sello golpea en el fotograma local 105 (abs 210).
// ================================================================

const Dato2012Inner: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const opacity = useBeatFade(BEATS.dato2012.dur);
  // Sacudida del contenido cuando golpea el sello (local 105-117)
  const shakeAmp = interpolate(frame, [105, 117], [9, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const shakeX = frame >= 105 && frame <= 117 ? Math.sin((frame - 105) * 1.9) * shakeAmp : 0;
  const year = spring({frame, fps, config: {damping: 200, stiffness: 240, mass: 0.7}});
  const smallIn = interpolate(frame, [75, 85], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{opacity, transform: `translateX(${shakeX}px)`}}>
      <AbsoluteFill style={{alignItems: 'center'}}>
        <div
          style={{
            position: 'absolute',
            top: 170,
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
            top: 382,
            width: 340,
            height: 10,
            background: COLORS.red,
            borderRadius: 5,
            opacity: Math.min(1, Math.max(0, year)),
          }}
        />
      </AbsoluteFill>
      <EvidenceCard top={440} width={880} height={587} delay={12}>
        <KenBurnsImg src="img/vector-2012.png" dur={BEATS.dato2012.dur} fromScale={1} toScale={1.04} />
      </EvidenceCard>
      <Headline
        top={1140}
        size={56}
        delay={25}
        step={15}
        lines={[
          [{t: 'LA OFAC'}, {t: 'CANCELÓ', red: true}],
          [{t: 'EL PROGRAMA DE'}],
          [{t: 'INSIGHTCUBA'}],
        ]}
      />
      <AbsoluteFill style={{alignItems: 'center', opacity: smallIn}}>
        <div
          style={{
            position: 'absolute',
            top: 1470,
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
    </AbsoluteFill>
  );
};

const StampInner: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const opacity = useBeatFade(BEATS.stamp.dur);
  const slam = spring({frame, fps, config: {damping: 11, stiffness: 280, mass: 0.9}});
  const flash = interpolate(frame, [0, 2, 14], [0, 0.55, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  // slam 0->1 (con sobreimpulso ~1.1) mapea a escala 2.4->1 (rebote a ~0.86).
  const slamScale = interpolate(slam, [0, 1], [2.4, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'extend'});
  return (
    <AbsoluteFill style={{opacity}}>
      <AbsoluteFill
        style={{
          opacity: flash,
          background: 'radial-gradient(ellipse at center, rgba(237,28,36,0.5) 0%, rgba(237,28,36,0.18) 55%, transparent 75%)',
        }}
      />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        <div
          style={{
            transform: `rotate(-12deg) scale(${slamScale})`,
            opacity: frame < 1 ? 0 : 1,
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
// BEAT 4 — CONTRASTE (9.5-12 s): línea de tiempo 2011 -> 2012
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
            top: 490,
            fontFamily: ARCHIVO,
            fontSize: 260,
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
      <Headline
        top={800}
        size={66}
        delay={18}
        step={10}
        lines={[
          [{t: 'ESTADOUNIDENSES'}],
          [{t: 'HABÍAN CORRIDO'}],
          [{t: 'EN LA HABANA'}],
        ]}
      />
      {/* línea de tiempo */}
      <AbsoluteFill style={{alignItems: 'center'}}>
        <div style={{position: 'absolute', top: 1180, width: 800, height: 6, background: 'rgba(255,255,255,0.25)', borderRadius: 3}}>
          <div style={{width: `${lineDraw * 100}%`, height: 6, background: '#fff', borderRadius: 3}} />
        </div>
        {/* nodo 2011 */}
        <div
          style={{
            position: 'absolute', top: 1152, left: 190,
            width: 62, height: 62, borderRadius: 31, background: '#fff',
            transform: `scale(${Math.min(1, Math.max(0, node2011))})`,
            boxShadow: '0 0 0 8px rgba(255,255,255,0.18)',
          }}
        />
        <div style={{position: 'absolute', top: 1240, left: 140, fontFamily: CONDENSED, fontWeight: 700, fontSize: 30, color: '#fff', opacity: Math.min(1, Math.max(0, node2011))}}>
          2011 · CORRIERON
        </div>
        {/* nodo 2012 */}
        <div
          style={{
            position: 'absolute', top: 1152, left: 828,
            width: 62, height: 62, borderRadius: 31, background: COLORS.red,
            transform: `scale(${Math.min(1, Math.max(0, node2012))})`,
            boxShadow: '0 0 0 8px rgba(237,28,36,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: ARCHIVO, fontSize: 34, color: '#fff',
          }}
        >
          ✕
        </div>
        <div style={{position: 'absolute', top: 1240, left: 770, fontFamily: CONDENSED, fontWeight: 700, fontSize: 30, color: COLORS.red, opacity: Math.min(1, Math.max(0, node2012))}}>
          2012 · CANCELADO
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ================================================================
// BEAT 5 — EL GIRO (12-15 s): whip + multitud + PERO A PESAR DE ELLO
// ================================================================

const GiroInner: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = useBeatFade(BEATS.giro.dur);
  const whip = interpolate(frame, [0, 12], [1.18, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const subIn = interpolate(frame, [35, 45], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{opacity, transform: `scale(${whip})`}}>
      <Headline
        top={280}
        size={74}
        delay={8}
        step={10}
        lines={[
          [{t: 'PERO A PESAR'}],
          [{t: 'DE ELLO…', red: true}],
        ]}
      />
      <EvidenceCard top={520} width={920} height={778} rotate={-1.5} label="FOTO: INDER / CUBADEBATE" delay={4}>
        <KenBurnsImg src="img/photo-1.jpg" dur={BEATS.giro.dur} fromScale={1} toScale={1.08} origin="50% 40%" />
      </EvidenceCard>
      <AbsoluteFill style={{alignItems: 'center', opacity: subIn}}>
        <div
          style={{
            position: 'absolute',
            top: 1470,
            fontFamily: CONDENSED,
            fontWeight: 600,
            fontSize: 33,
            color: COLORS.ivory,
            letterSpacing: 0.5,
          }}
        >
          HOY, 14 AÑOS DESPUÉS, LA HABANA VOLVIÓ A CORRER
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ================================================================
// BEAT 6 — LA SALIDA (15-18.5 s): ventana de video real
// ================================================================

const SalidaInner: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = useBeatFade(BEATS.salida.dur);
  const creditIn = interpolate(frame, [30, 40], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
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
      <EvidenceCard top={480} width={920} height={518} label="ARRANCADA · SALA POLIVALENTE RAMÓN FONST" delay={6}>
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
      <AbsoluteFill style={{alignItems: 'center', opacity: creditIn}}>
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
// BEAT 7 — EL NÚMERO (18.5-21.5 s): count-up 3.000 + foto con estela
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
// BEAT 8 — LA 5K (21.5-24.5 s)
// ================================================================

const CincoKInner: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const opacity = useBeatFade(BEATS.cincoK.dur);
  const fiveK = spring({frame, fps, config: {damping: 200, stiffness: 280, mass: 0.6}});
  const subIn = interpolate(frame, [40, 50], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
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
      <AbsoluteFill style={{alignItems: 'center', opacity: subIn}}>
        <div style={{position: 'absolute', top: 1350, fontFamily: CONDENSED, fontSize: 30, color: COLORS.gray, letterSpacing: 0.5}}>
          ASÍ SE LLAMÓ OFICIALMENTE LA CARRERA DE 5 KM
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ================================================================
// BEAT 9 — LA VOZ (24.5-27.5 s): cita de Yuraldi Cava (AP)
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
// BEAT 10 — LOS GANADORES (27.5-30.5 s)
// ================================================================

const GanadoresInner: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const opacity = useBeatFade(BEATS.ganadores.dur);
  const cardIn = spring({frame: frame - 6, fps, config: {damping: 200, stiffness: 260, mass: 0.7}});
  const row2 = interpolate(frame, [28, 36], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const tagIn = interpolate(frame, [44, 52], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const noteIn = interpolate(frame, [58, 66], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
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
          <div style={{height: 2, background: 'rgba(0,0,0,0.12)', margin: '22px 0'}} />
          <div style={{opacity: row2}}>
            <div style={{fontFamily: CONDENSED, fontWeight: 700, fontSize: 30, color: COLORS.red, letterSpacing: 2}}>
              21K · MEDIA MARATÓN
            </div>
            <div style={{fontFamily: ARCHIVO, fontSize: 46, color: COLORS.ink, marginTop: 8, lineHeight: 1.15}}>
              TAMERÓN 1:06:53
            </div>
            <div style={{fontFamily: ARCHIVO, fontSize: 46, color: COLORS.ink, lineHeight: 1.15}}>
              LÓPEZ GUISAO 1:17:24
            </div>
          </div>
          <div style={{marginTop: 22, opacity: tagIn}}>
            <Pill text="DOBLETE TUNERO EN 21K" size={28} />
          </div>
        </div>
      </AbsoluteFill>
      <EvidenceCard top={960} width={680} height={383} label="TAMERÓN Y LÓPEZ · LAS TUNAS · FOTO: TIEMPO21" delay={44}>
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
// BEAT 11 — ERNESTO (30.5-36 s): el pico emocional, 5.5 s
// ================================================================

const ErnestoInner: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = useBeatFade(BEATS.ernesto.dur);
  const pillIn = interpolate(frame, [100, 110], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
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
        delay={35}
        step={35}
        lines={[
          [{t: 'COMPLETÓ LOS'}, {t: '10K', red: true}],
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
// BEAT 12 — EL CIERRE (36-40 s)
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
      <Headline
        top={440}
        size={60}
        delay={55}
        step={10}
        lines={[
          [{t: 'Y CADA PASO FUE'}],
          [{t: 'UNA'}, {t: 'DENUNCIA.', red: true}],
        ]}
      />
      <EvidenceCard top={700} width={840} height={791} rotate={-1} label="FOTO: INDER / CUBADEBATE" delay={8}>
        <KenBurnsImg src="img/photo-5.jpg" dur={BEATS.cierre.dur} fromScale={1} toScale={1.08} origin="50% 30%" />
      </EvidenceCard>
    </AbsoluteFill>
  );
};

// ================================================================
// STING (40-46 s): cierre animado oficial «la del disparo»
// ================================================================

const StingInner: React.FC = () => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 4], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: '#000', opacity: fadeIn}}>
      <OffthreadVideo src={staticFile('video/sting.mp4')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
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
      <Sequence from={BEATS.stamp.from} durationInFrames={BEATS.stamp.dur + 8} name="beat03-stamp">
        <StampInner />
      </Sequence>
      <Sequence from={BEATS.contraste.from} durationInFrames={BEATS.contraste.dur + 8} name="beat04-contraste">
        <ContrasteInner />
      </Sequence>
      <Sequence from={BEATS.giro.from} durationInFrames={BEATS.giro.dur + 8} name="beat05-giro">
        <GiroInner />
      </Sequence>
      <Sequence from={BEATS.salida.from} durationInFrames={BEATS.salida.dur + 8} premountFor={30} name="beat06-salida">
        <SalidaInner />
      </Sequence>
      <Sequence from={BEATS.numero.from} durationInFrames={BEATS.numero.dur + 8} name="beat07-numero">
        <NumeroInner />
      </Sequence>
      <Sequence from={BEATS.cincoK.from} durationInFrames={BEATS.cincoK.dur + 8} name="beat08-5k">
        <CincoKInner />
      </Sequence>
      <Sequence from={BEATS.voz.from} durationInFrames={BEATS.voz.dur + 8} name="beat09-voz">
        <VozInner />
      </Sequence>
      <Sequence from={BEATS.ganadores.from} durationInFrames={BEATS.ganadores.dur + 8} name="beat10-ganadores">
        <GanadoresInner />
      </Sequence>
      <Sequence from={BEATS.ernesto.from} durationInFrames={BEATS.ernesto.dur + 8} name="beat11-ernesto">
        <ErnestoInner />
      </Sequence>
      <Sequence from={BEATS.cierre.from} durationInFrames={BEATS.cierre.dur + 8} name="beat12-cierre">
        <CierreInner />
      </Sequence>

      {/* marca de agua: del fotograma 30 al final del contenido */}
      <Sequence from={LOGO_FROM} durationInFrames={LOGO_TO - LOGO_FROM} name="logo">
        <LogoInner dur={LOGO_TO - LOGO_FROM} />
      </Sequence>

      {/* música (0-40 s) + audio del sting (40-46 s) */}
      <Sequence from={0} durationInFrames={CONTENT_END} name="music">
        <MusicInner />
      </Sequence>
      <Sequence from={CONTENT_END} durationInFrames={180} name="sting-audio">
        <StingAudioInner />
      </Sequence>

      {/* sting oficial a pantalla completa */}
      <Sequence from={BEATS.sting.from} durationInFrames={BEATS.sting.dur} premountFor={30} name="sting">
        <StingInner />
      </Sequence>
    </AbsoluteFill>
  );
};
