import React from 'react';
import {
  AbsoluteFill,
  Audio,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {
  AlertBanner,
  CountUp,
  DiagramFlow,
  GlowCrossfade,
  GlowStage,
  KineticHeadline,
  Magnifier,
  MOTION_COLORS,
  PhoneFrame,
  POPPINS,
  Sfx,
  StepCard,
  TapHand,
  TopKaraoke,
} from '../../../shared/motion';
import {
  emberBurn,
  fade,
  slide,
  waveWipe,
} from '../../../shared/motion/transitions';
import {CAPTIONS} from './captions';

// DEMO v2 del módulo motion — 450 fotogramas (15 s), contenido de PRUEBA
// (VO_SCRIPT.md). Cambios respecto a la v1:
//   · Escenas en <TransitionSeries> (12 f por transición): waveWipe
//     (Remocn) A→B, slide B→C, fade C→D, emberBurn (Remocn) D→E.
//     Total = Σ secuencias (498) − Σ transiciones (48) = 450.
//     Los cortes nominales se conservan (96/159/239/317) y el contenido
//     de cada escena entrante lleva delay +12 para aterrizar en el
//     corte sincronizado con la VO (ver TransitionsTest.tsx).
//   · PhoneFrame con top={580}: el karaoke superior ya no tapa el
//     teléfono (defecto de la v1). Lupa y toque recalculados.
//   · CountUp adaptado (remotion-video-templates + facecammaxxing) en
//     la escena B: el «3» cuenta hasta 3.
//   · 3 SFX del kit (wyzowl/sfx-kit, CC0) colocados por sync point:
//     whoosh en el corte al cierre, pop en el toque, sting cálido
//     al completarse el titular final.
//   · Los barridos SweepTransition de la v1 se sustituyen por las
//     transiciones de TransitionSeries (SweepTransition sigue en el
//     módulo para usos puntuales).

const TOTAL_FRAMES = 450;
const T12 = linearTiming({durationInFrames: 12});

// Estrella de 5 puntas (marca del Memorial, dibujo propio en SVG).
const STAR_POINTS =
  '100,0 122.4,69.3 195.1,69.1 136.1,130.9 158.8,180.9 100,138 41.2,180.9 63.9,130.9 4.9,69.1 77.6,69.3';
const Star: React.FC<{size: number; color?: string; glow?: boolean}> = ({
  size,
  color = MOTION_COLORS.red,
  glow = true,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 200 200"
    style={glow ? {filter: `drop-shadow(0 0 34px ${color}AA)`} : undefined}
  >
    <polygon points={STAR_POINTS} fill={color} />
  </svg>
);

const Shield: React.FC<{size: number}> = ({size}) => (
  <svg width={size} height={size} viewBox="0 0 200 210">
    <path
      d="M100 8 L172 38 V102 C172 152 136 184 100 200 C64 184 28 152 28 102 V38 Z"
      fill="rgba(46,224,111,0.10)"
      stroke={MOTION_COLORS.green}
      strokeWidth="7"
    />
    <polygon points="100,52 111,86 147,86 118,108 129,144 100,122 71,144 82,108 53,86 89,86" fill={MOTION_COLORS.green} />
  </svg>
);

// ---------- Escena A: gancho ----------

const HookStar: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = spring({frame: frame - 4, fps, config: {damping: 11, stiffness: 200}});
  const bob = Math.sin((frame / fps) * 1.2) * 12;
  const rot = interpolate(frame, [0, 95], [0, 14]);
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: 1020,
        marginLeft: -230,
        opacity: p,
        transform: `translateY(${bob + interpolate(p, [0, 1], [60, 0])}px) rotate(${rot}deg) scale(${interpolate(p, [0, 1], [0.55, 1])})`,
      }}
    >
      <Star size={460} />
    </div>
  );
};

// ---------- Escena C: mapa simulado ----------

const MockMap: React.FC = () => (
  <div style={{position: 'absolute', inset: 0, background: '#EDE8D6'}}>
    {/* Calles */}
    <div style={{position: 'absolute', top: '28%', left: 0, right: 0, height: 26, background: '#FFF'}} />
    <div style={{position: 'absolute', top: 0, bottom: 0, left: '44%', width: 26, background: '#FFF'}} />
    <div style={{position: 'absolute', top: '58%', left: '-20%', right: '-20%', height: 20, background: '#F7F3E6', transform: 'rotate(-24deg)'}} />
    {/* Parque */}
    <div style={{position: 'absolute', top: '8%', right: '8%', width: 150, height: 110, borderRadius: 30, background: '#BFE3B0'}} />
    {/* Pin de Miramar: 62% x, 40% y de la pantalla */}
    <div style={{position: 'absolute', left: '62%', top: '40%', marginLeft: -22, marginTop: -56, textAlign: 'center'}}>
      <div style={{width: 44, height: 44, borderRadius: '50% 50% 50% 0', background: MOTION_COLORS.red, transform: 'rotate(-45deg)', margin: '0 auto', boxShadow: '0 8px 18px rgba(0,0,0,0.35)'}} />
      <div style={{fontFamily: POPPINS, fontSize: 26, fontWeight: 700, color: '#333', marginTop: 8, whiteSpace: 'nowrap'}}>
        Miramar
      </div>
    </div>
    {/* Tarjeta inferior */}
    <div style={{position: 'absolute', left: 24, right: 24, bottom: 30, background: '#FFF', borderRadius: 18, padding: '18px 22px', boxShadow: '0 10px 26px rgba(0,0,0,0.18)'}}>
      <div style={{fontFamily: POPPINS, fontSize: 28, fontWeight: 700, color: '#1A1A1A'}}>
        Memorial de la Denuncia
      </div>
      <div style={{fontFamily: POPPINS, fontSize: 22, color: '#666', marginTop: 4}}>
        Miramar, La Habana
      </div>
    </div>
  </div>
);

// ---------- Escena D: reserva simulada ----------

const MockReserve: React.FC<{tapFrame: number}> = ({tapFrame}) => {
  const frame = useCurrentFrame();
  const reserved = frame >= tapFrame;
  return (
    <div style={{position: 'absolute', inset: 0, background: '#101014', padding: '90px 34px 0'}}>
      <div style={{fontFamily: POPPINS, fontSize: 36, fontWeight: 700, color: '#FFF'}}>
        Visita guiada
      </div>
      <div style={{fontFamily: POPPINS, fontSize: 24, color: MOTION_COLORS.gray, marginTop: 6}}>
        Memorial de la Denuncia
      </div>
      <div style={{display: 'flex', gap: 14, marginTop: 34}}>
        {['HOY', 'MAÑANA', 'SÁBADO'].map((d, i) => (
          <div
            key={d}
            style={{
              flex: 1,
              textAlign: 'center',
              fontFamily: POPPINS,
              fontSize: 22,
              fontWeight: 700,
              color: i === 0 ? '#FFF' : MOTION_COLORS.gray,
              border: i === 0 ? `2px solid ${MOTION_COLORS.red}` : '2px solid #333',
              borderRadius: 14,
              padding: '14px 0',
              background: i === 0 ? 'rgba(237,28,36,0.16)' : 'transparent',
            }}
          >
            {d}
          </div>
        ))}
      </div>
      <div style={{fontFamily: POPPINS, fontSize: 24, color: MOTION_COLORS.gray, marginTop: 30, lineHeight: 1.4}}>
        Recorrido por las salas del Memorial con guía del equipo de
        comunicación.
      </div>
      {/* Botón: centro en (50%, 758+42 px de pantalla) = (540, 1389) absolutos con top=580 */}
      <div
        style={{
          position: 'absolute',
          left: '15%',
          right: '15%',
          top: 758,
          height: 84,
          borderRadius: 42,
          background: reserved ? MOTION_COLORS.green : MOTION_COLORS.red,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: POPPINS,
          fontSize: 32,
          fontWeight: 700,
          color: '#FFF',
          boxShadow: `0 12px 30px ${reserved ? 'rgba(46,224,111,0.4)' : 'rgba(237,28,36,0.4)'}`,
        }}
      >
        {reserved ? '✓ Reservado' : 'Reservar'}
      </div>
    </div>
  );
};

// ---------- Composición ----------

export const MainReel: React.FC = () => {
  return (
    <AbsoluteFill>
      <Audio src={staticFile('audio/vo-demo.wav')} />
      {/* Fondo base + cambios de acto (absolutos, sin tocar) */}
      <GlowStage glow="danger" />
      <GlowCrossfade to="neutral" atFrame={88} durationInFrames={30} />
      <GlowCrossfade to="safe" atFrame={310} durationInFrames={30} />

      <TransitionSeries>
        {/* A · Gancho (0-95): estrella + karaoke */}
        <TransitionSeries.Sequence durationInFrames={96} name="hook">
          <HookStar />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={waveWipe()} timing={T12} />

        {/* B · Pasos (96-158): contador + 3 tarjetas */}
        <TransitionSeries.Sequence durationInFrames={75} name="steps">
          <div style={{position: 'absolute', top: 520, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
            <CountUp to={3} label="pasos para visitarlo" size={170} labelSize={34} delay={14} durationInFrames={15} />
          </div>
          <StepCard n={1} title="Abre el mapa" subtitle="Busca Miramar en La Habana" top={820} delay={18} />
          <StepCard n={2} title="Toca reservar" subtitle="Elige el día de tu visita" top={1030} delay={36} />
          <StepCard n={3} title="Recorre la denuncia" subtitle="La historia, sala por sala" top={1240} delay={54} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({direction: 'from-right'})} timing={T12} />

        {/* C · Mapa (159-238): teléfono + lupa */}
        <TransitionSeries.Sequence durationInFrames={92} name="map">
          <PhoneFrame width={560} height={1130} top={580} float={false} delay={14}>
            <MockMap />
          </PhoneFrame>
          <Magnifier x={605} y={1034} size={360} zoom={2.2} delay={33}>
            <div style={{textAlign: 'center'}}>
              <div style={{width: 46, height: 46, borderRadius: '50% 50% 50% 0', background: MOTION_COLORS.red, transform: 'rotate(-45deg)', margin: '0 auto'}} />
              <div style={{fontFamily: POPPINS, fontSize: 26, fontWeight: 800, color: '#FFF', marginTop: 10}}>
                MIRAMAR
              </div>
            </div>
          </Magnifier>
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={T12} />

        {/* D · Reserva (239-316): teléfono + mano que toca */}
        <TransitionSeries.Sequence durationInFrames={90} name="reserve">
          <PhoneFrame width={560} height={1130} top={580} float={false} delay={14}>
            <MockReserve tapFrame={48} />
          </PhoneFrame>
          <TapHand taps={[{x: 540, y: 1389, at: 48}]} size={170} enterFrom="bottom" />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={emberBurn()} timing={T12} />

        {/* E · Cierre (317-450): diagrama + titular + banner */}
        <TransitionSeries.Sequence durationInFrames={145} name="payoff">
          {/* Nodos del diagrama */}
          <div style={{position: 'absolute', left: 200, top: 950, marginLeft: -75, marginTop: -95, width: 150, height: 190, background: '#FFF', borderRadius: 18, padding: 18, boxShadow: '0 16px 40px rgba(0,0,0,0.5)'}}>
            <div style={{height: 10, background: MOTION_COLORS.red, borderRadius: 5, marginBottom: 16}} />
            <div style={{height: 8, background: '#DDD', borderRadius: 4, marginBottom: 12}} />
            <div style={{height: 8, background: '#DDD', borderRadius: 4, marginBottom: 12}} />
            <div style={{height: 8, background: '#DDD', borderRadius: 4, width: '60%'}} />
          </div>
          <div style={{position: 'absolute', left: 880, top: 950, marginLeft: -95, marginTop: -100}}>
            <Shield size={190} />
          </div>
          <DiagramFlow
            from={{x: 200, y: 950}}
            to={{x: 880, y: 950}}
            startFrame={17}
            durationInFrames={55}
            traveler={<Star size={90} />}
            travelerSize={90}
            trailColor={MOTION_COLORS.green}
          />
          <KineticHeadline
            lines={[[{t: 'EL'}, {t: 'MEMORIAL', accent: true}], [{t: 'TE'}, {t: 'ESPERA'}]]}
            top={590}
            size={92}
            delay={80}
            step={6}
          />
          <AlertBanner text="Llega con tiempo" top={1480} delay={40} />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {/* SFX del kit (sync points absolutos) */}
      <Sfx id="whoosh-medium-medium" atFrame={317} underVO />
      <Sfx id="pop-medium-in" atFrame={275} underVO />
      <Sfx id="sting-warm-short" atFrame={403} underVO />

      {/* Karaoke superior durante todo el reel */}
      <TopKaraoke lines={CAPTIONS} top={340} size={72} />
    </AbsoluteFill>
  );
};

export {TOTAL_FRAMES};
