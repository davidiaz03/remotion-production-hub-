import React from 'react';
import {
  AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate,
  spring, staticFile, useCurrentFrame, useVideoConfig,
} from 'remotion';
import {CAPTIONS} from './captions';
import {COLORS, END_CARD_DUR, END_CARD_FROM, MUSIC_VOLUME_KEYFRAMES, OVERLAYS, SEGMENTS, SegmentDef} from './timeline';

const FPS = 30;

// ---------- generic helpers ----------

const outline = (px: number) =>
  `${px}px 0 0 #000, -${px}px 0 0 #000, 0 ${px}px 0 #000, 0 -${px}px 0 #000, ` +
  `${px * 0.7}px ${px * 0.7}px 0 #000, -${px * 0.7}px -${px * 0.7}px 0 #000, ` +
  `${px * 0.7}px -${px * 0.7}px 0 #000, -${px * 0.7}px ${px * 0.7}px 0 #000, 0 8px 22px rgba(0,0,0,0.65)`;

// ---------- presenter / testimony video segments ----------

const SegmentInner: React.FC<{seg: SegmentDef}> = ({seg}) => {
  const frame = useCurrentFrame();
  const base = interpolate(frame, [0, seg.dur], [1, seg.pushEnd], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  let punch = 0;
  for (const p of seg.punches) {
    punch += interpolate(frame, [p - 2, p + 2, p + 14], [0, 0.07, 0], {
      extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    });
  }
  const scale = base + punch;
  const fadeIn = seg.fadeIn > 0
    ? interpolate(frame, [0, seg.fadeIn], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
    : 1;
  const fadeOut = interpolate(frame, [seg.dur, seg.dur + seg.fadeOut], [1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill style={{opacity: Math.min(fadeIn, fadeOut)}}>
      <div style={{width: '100%', height: '100%', transform: `scale(${scale})`, transformOrigin: '50% 42%'}}>
        <OffthreadVideo
          src={staticFile(`video/${seg.file}`)}
          style={{width: '100%', height: '100%', objectFit: 'cover'}}
        />
      </div>
    </AbsoluteFill>
  );
};

const SegmentVideo: React.FC<{seg: SegmentDef}> = ({seg}) => (
  <Sequence from={seg.from} durationInFrames={seg.dur + seg.fadeOut} name={`seg${seg.id}`}>
    <SegmentInner seg={seg} />
  </Sequence>
);

// ---------- karaoke captions ----------

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
          fontFamily: "'Archivo Black', sans-serif",
          fontSize: size,
          lineHeight: 1.18,
        }}
      >
        {active.words.map((w, i) => {
          const revealed = w.s <= t;
          const isCurrent = revealed && (i === active.words.length - 1 || active.words[i + 1].s > t);
          // Pop grows from the word's LEFT edge so it never swallows the gap
          // to the previous word (the next word is still hidden while it pops).
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
  <Sequence from={0} durationInFrames={END_CARD_FROM} name="karaoke">
    <KaraokeInner />
  </Sequence>
);

// ---------- evidence cards / labels ----------

const CardInner: React.FC<{top: number; dur: number; bg: string; children: React.ReactNode; width?: number}> =
({top, dur, bg, children, width}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame, fps, config: {damping: 200, stiffness: 320, mass: 0.6}});
  const exit = interpolate(frame, [dur - 6, dur], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const opacity = Math.min(1, enter, exit);
  const scale = interpolate(Math.min(1, enter), [0, 1], [0.9, 1]);
  return (
    <AbsoluteFill style={{alignItems: 'center'}}>
      <div
        style={{
          position: 'absolute',
          top,
          width,
          opacity,
          transform: `scale(${scale})`,
          background: bg,
          borderRadius: 18,
          padding: '20px 26px',
          boxShadow: '0 12px 44px rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: 22,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};

const Card: React.FC<{from: number; dur: number; top: number; bg?: string; width?: number; children: React.ReactNode}> =
({from, dur, top, bg = COLORS.ivory, width, children}) => (
  <Sequence from={from} durationInFrames={dur} name="card">
    <CardInner top={top} dur={dur} bg={bg} width={width}>{children}</CardInner>
  </Sequence>
);

const Tag: React.FC<{text: string}> = ({text}) => (
  <span
    style={{
      display: 'inline-block',
      background: COLORS.yellow,
      color: '#000',
      fontFamily: "'Roboto Condensed', sans-serif",
      fontWeight: 700,
      fontSize: 26,
      padding: '4px 12px',
      borderRadius: 6,
      letterSpacing: 1,
    }}
  >
    {text}
  </span>
);

const PillInner: React.FC<{top: number; left?: number; right?: number; dur: number; bg: string; color: string; text: string; size?: number}> =
({top, left, right, dur, bg, color, text, size = 30}) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const fadeOut = interpolate(frame, [dur - 8, dur], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          top,
          left,
          right,
          opacity: Math.min(fadeIn, fadeOut),
          background: bg,
          borderRadius: 999,
          padding: '10px 22px',
          fontFamily: "'Roboto Condensed', sans-serif",
          fontWeight: 700,
          fontSize: size,
          letterSpacing: 1.5,
          color,
          boxShadow: '0 6px 24px rgba(0,0,0,0.45)',
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

const Pill: React.FC<{from: number; dur: number; top: number; left?: number; right?: number; bg: string; color: string; text: string; size?: number}> =
(props) => (
  <Sequence from={props.from} durationInFrames={props.dur} name="pill">
    <PillInner {...props} />
  </Sequence>
);

// Kinetic text line (no card, outlined type)
const KineticInner: React.FC<{top: number; dur: number; text: string; color?: string}> = ({top, dur, text, color = '#FFFFFF'}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame, fps, config: {damping: 200, stiffness: 300, mass: 0.6}});
  const exit = interpolate(frame, [dur - 5, dur], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{alignItems: 'center'}}>
      <div
        style={{
          position: 'absolute',
          top,
          opacity: Math.min(1, enter, exit),
          transform: `scale(${interpolate(Math.min(1, enter), [0, 1], [0.88, 1])})`,
          fontFamily: "'Archivo Black', sans-serif",
          fontSize: 58,
          color,
          textShadow: outline(3),
          whiteSpace: 'nowrap',
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

const Kinetic: React.FC<{from: number; dur: number; top: number; text: string; color?: string}> = (props) => (
  <Sequence from={props.from} durationInFrames={props.dur} name="kinetic">
    <KineticInner {...props} />
  </Sequence>
);

// ---------- muted B-roll window ----------

const BrollInner: React.FC<{top: number; width: number; height: number; file: string; dur: number; label?: string}> =
({top, width, height, file, dur, label}) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const fadeOut = interpolate(frame, [dur - 8, dur], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{alignItems: 'center'}}>
      <div
        style={{
          position: 'absolute',
          top,
          opacity: Math.min(fadeIn, fadeOut),
          border: '6px solid #FFFFFF',
          borderRadius: 14,
          overflow: 'hidden',
          boxShadow: '0 12px 44px rgba(0,0,0,0.5)',
          background: '#000',
        }}
      >
        <OffthreadVideo src={staticFile(`video/${file}`)} style={{width, height, objectFit: 'cover', display: 'block'}} />
        {label ? (
          <div
            style={{
              background: COLORS.ink,
              color: '#fff',
              fontFamily: "'Roboto Condensed', sans-serif",
              fontWeight: 700,
              fontSize: 30,
              letterSpacing: 2,
              textAlign: 'center',
              padding: '8px 0',
            }}
          >
            {label}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

const BrollWindow: React.FC<{from: number; dur: number; top: number; width: number; height: number; file: string; label?: string}> =
(props) => (
  <Sequence from={props.from} durationInFrames={props.dur} premountFor={30} name="broll">
    <BrollInner {...props} />
  </Sequence>
);

// ---------- red pulse on "ESTALLA" ----------

const RedPulseInner: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 3, 12], [0, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill
      style={{
        opacity: opacity * 0.5,
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(237,28,36,0.55) 100%)',
      }}
    />
  );
};

// ---------- logo watermark ----------

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

// ---------- music bed ----------

const MusicInner: React.FC = () => {
  const frame = useCurrentFrame();
  const volume = interpolate(
    frame,
    MUSIC_VOLUME_KEYFRAMES.map(([f]) => f),
    MUSIC_VOLUME_KEYFRAMES.map(([, v]) => v),
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  return <Audio src={staticFile('audio/music.wav')} volume={volume} />;
};

// ---------- end card ----------

const EndCardInner: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const fade = interpolate(frame, [0, 8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const logoScale = spring({frame: frame - 4, fps, config: {damping: 200, stiffness: 180, mass: 0.8}});
  const textIn = interpolate(frame, [12, 20], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: '#000', opacity: fade, alignItems: 'center', justifyContent: 'center', flexDirection: 'column'}}>
      <Img
        src={staticFile('img/logo.png')}
        style={{width: 400, transform: `scale(${Math.max(0.01, logoScale)})`}}
      />
      <div style={{opacity: textIn, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <div style={{fontFamily: "'Roboto Condensed', sans-serif", fontWeight: 700, fontSize: 44, color: COLORS.red, marginTop: 44, letterSpacing: 1}}>
          @memorialdenuncia
        </div>
        <div style={{fontFamily: "'Roboto Condensed', sans-serif", fontSize: 34, color: '#9aa0a6', marginTop: 12}}>
          facebook.com/memorialdenuncia
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- main composition ----------

export const MainReel: React.FC = () => {
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {SEGMENTS.map((seg) => <SegmentVideo key={seg.id} seg={seg} />)}

      {/* scrims (video only; overlays render above) */}
      <Sequence from={0} durationInFrames={END_CARD_FROM} name="scrims">
        <AbsoluteFill
          style={{background: 'linear-gradient(to bottom, rgba(0,0,0,0.32) 0%, transparent 13%, transparent 60%, rgba(0,0,0,0.28) 78%, rgba(0,0,0,0.62) 100%)'}}
        />
      </Sequence>

      {/* seg03: map -> date -> portrait -> embassy */}
      <Card from={OVERLAYS.mapCard.from} dur={OVERLAYS.mapCard.dur} top={130} width={720}>
        <Img src={staticFile('img/mapa-peru.png')} style={{width: 190, height: 216, objectFit: 'contain'}} />
        <div>
          <div style={{fontFamily: "'Archivo Black', sans-serif", fontSize: 62, color: COLORS.ink, lineHeight: 1}}>LIMA, PERÚ</div>
          <div style={{fontFamily: "'Roboto Condensed', sans-serif", fontWeight: 600, fontSize: 32, color: '#444', marginTop: 10}}>
            Embajada de Cuba
          </div>
        </div>
      </Card>
      <Card from={OVERLAYS.dateCard.from} dur={OVERLAYS.dateCard.dur} top={150} bg={COLORS.red} width={940}>
        <div style={{width: '100%', textAlign: 'center', fontFamily: "'Archivo Black', sans-serif", fontSize: 60, color: '#fff', lineHeight: 1.1}}>
          5 DE FEBRERO DE 1974
        </div>
      </Card>
      <Card from={OVERLAYS.portraitCard.from} dur={OVERLAYS.portraitCard.dur} top={120} width={960}>
        <Img src={staticFile('img/pilar-cuadrado.jpg')} style={{width: 290, height: 290, objectFit: 'cover', borderRadius: 12}} />
        <div>
          <div style={{fontFamily: "'Archivo Black', sans-serif", fontSize: 48, color: COLORS.ink, lineHeight: 1.05}}>
            PILAR RAMÍREZ VEGA
          </div>
          <div style={{fontFamily: "'Roboto Condensed', sans-serif", fontWeight: 700, fontSize: 32, color: COLORS.red, marginTop: 12, letterSpacing: 1}}>
            FUNCIONARIA DEL MINREX
          </div>
          <div style={{fontFamily: "'Roboto Condensed', sans-serif", fontSize: 29, color: '#444', marginTop: 6}}>
            Secretaria del Embajador cubano
          </div>
        </div>
      </Card>
      <Card from={OVERLAYS.embassyCard.from} dur={OVERLAYS.embassyCard.dur} top={120} width={960}>
        <Img src={staticFile('img/embajada-lima.jpg')} style={{width: 400, height: 267, objectFit: 'cover', borderRadius: 12}} />
        <div>
          <div style={{fontFamily: "'Archivo Black', sans-serif", fontSize: 40, color: COLORS.ink, lineHeight: 1.1}}>
            EMBAJADA DE CUBA EN LIMA
          </div>
          <div style={{marginTop: 14}}><Tag text="ILUSTRATIVA · EDIFICIO ACTUAL" /></div>
        </div>
      </Card>

      {/* seg04: letter-bomb mockup + red pulse on ESTALLA */}
      <Card from={OVERLAYS.letterCard.from} dur={OVERLAYS.letterCard.dur} top={120} width={880}>
        <Img src={staticFile('img/carta-bomba.jpg')} style={{width: 270, height: 270, objectFit: 'cover', borderRadius: 12}} />
        <div>
          <div style={{fontFamily: "'Archivo Black', sans-serif", fontSize: 52, color: COLORS.ink, lineHeight: 1.05}}>
            UNA BOMBA
            <br />
            EN UN LIBRO
          </div>
          <div style={{marginTop: 14}}><Tag text="ILUSTRATIVA · MAQUETA" /></div>
        </div>
      </Card>
      <Sequence from={OVERLAYS.redPulse.from} durationInFrames={OVERLAYS.redPulse.dur} name="red-pulse">
        <RedPulseInner />
      </Sequence>

      {/* seg05: testimony labels */}
      <Pill from={OVERLAYS.testimonyLabels.from} dur={OVERLAYS.testimonyLabels.dur} top={64} left={44}
        bg="rgba(10,14,17,0.82)" color="#fff" text="TESTIMONIO · MARÍA DEL PILAR RAMÍREZ VEGA" size={29} />
      <Pill from={OVERLAYS.testimonyLabels.from} dur={OVERLAYS.testimonyLabels.dur} top={124} left={44}
        bg={COLORS.red} color="#fff" text="FRAGMENTOS EDITADOS" size={26} />
      {/* seg06: ES TERRORISMO */}
      <Card from={OVERLAYS.terrorCard.from} dur={OVERLAYS.terrorCard.dur} top={150} bg={COLORS.red} width={860}>
        <div style={{width: '100%', textAlign: 'center', fontFamily: "'Archivo Black', sans-serif", fontSize: 66, color: '#fff'}}>
          ES TERRORISMO
        </div>
      </Card>

      {/* seg07: NO ERA MILITAR -> SEDE DIPLOMÁTICA */}
      <Card from={OVERLAYS.noMilitarCard.from} dur={OVERLAYS.noMilitarCard.dur} top={150} width={860}>
        <div style={{width: '100%', textAlign: 'center', fontFamily: "'Archivo Black', sans-serif", fontSize: 54, color: COLORS.ink}}>
          ELLA NO ERA <span style={{color: COLORS.red, textDecoration: 'line-through'}}>MILITAR</span>
        </div>
      </Card>
      <Card from={OVERLAYS.sedeCard.from} dur={OVERLAYS.sedeCard.dur} top={150} bg={COLORS.ink} width={860}>
        <div style={{width: '100%', textAlign: 'center', fontFamily: "'Archivo Black', sans-serif", fontSize: 54, color: '#fff'}}>
          SEDE DIPLOMÁTICA
        </div>
      </Card>

      {/* seg08: kinetic lines */}
      <Kinetic from={OVERLAYS.cubanoLine.from} dur={OVERLAYS.cubanoLine.dur} top={170} text="CUALQUIER CUBANO" />
      <Kinetic from={OVERLAYS.embajadaLine.from} dur={OVERLAYS.embajadaLine.dur} top={170} text="CUALQUIER EMBAJADA" />

      {/* seg09: Bosch portrait -> B-roll */}
      <Card from={OVERLAYS.boschCard.from} dur={OVERLAYS.boschCard.dur} top={130} width={920}>
        <Img src={staticFile('img/bosch-retrato.jpg')} style={{width: 400, height: 190, objectFit: 'cover', borderRadius: 12}} />
        <div style={{fontFamily: "'Archivo Black', sans-serif", fontSize: 46, color: COLORS.ink, lineHeight: 1.1}}>
          ORLANDO
          <br />
          BOSCH
        </div>
      </Card>
      <BrollWindow from={OVERLAYS.boschBroll.from} dur={OVERLAYS.boschBroll.dur} top={120} width={640} height={480}
        file="bosch_broll.mp4" label="ORLANDO BOSCH · ARCHIVO" />

      {/* seg10: PILAR SOBREVIVIÓ */}
      <Card from={OVERLAYS.sobrevivioCard.from} dur={OVERLAYS.sobrevivioCard.dur} top={120} width={940}>
        <Img src={staticFile('img/pilar-cuadrado.jpg')} style={{width: 270, height: 270, objectFit: 'cover', borderRadius: 12}} />
        <div style={{fontFamily: "'Archivo Black', sans-serif", fontSize: 52, color: COLORS.ink, lineHeight: 1.1}}>
          PILAR
          <br />
          SOBREVIVIÓ
        </div>
      </Card>

      {/* seg11: question card */}
      <Card from={OVERLAYS.questionCard.from} dur={OVERLAYS.questionCard.dur} top={130} width={920}>
        <div style={{width: '100%', textAlign: 'center', fontFamily: "'Archivo Black', sans-serif", fontSize: 50, color: COLORS.ink, lineHeight: 1.15}}>
          ¿CREES QUE ES
          <br />
          JUSTIFICABLE…?
        </div>
      </Card>

      {/* seg12: Memorial sala B-roll */}
      <BrollWindow from={OVERLAYS.salaBroll.from} dur={OVERLAYS.salaBroll.dur} top={120} width={640} height={360}
        file="sala_broll.mp4" label="MEMORIAL DE LA DENUNCIA · LA HABANA" />

      {/* karaoke captions */}
      <Karaoke />

      {/* logo watermark */}
      <Sequence from={OVERLAYS.logoFrom} durationInFrames={OVERLAYS.logoTo - OVERLAYS.logoFrom} name="logo">
        <LogoInner dur={OVERLAYS.logoTo - OVERLAYS.logoFrom} />
      </Sequence>

      {/* music bed */}
      <Sequence from={0} durationInFrames={END_CARD_FROM + END_CARD_DUR} name="music">
        <MusicInner />
      </Sequence>

      {/* end card */}
      <Sequence from={END_CARD_FROM} durationInFrames={END_CARD_DUR} name="endcard">
        <EndCardInner />
      </Sequence>
    </AbsoluteFill>
  );
};
