import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {
  emberBurn,
  fade,
  filmBurn,
  irisWipe,
  rippleZoom,
  slide,
  waveWipe,
  whipPan,
  wipe,
  zoomBlur,
} from '../../../shared/motion/transitions';

// ESCAPARATE de transiciones — 11 escenas de 30 f con 10 transiciones
// de 12 f entre ellas (total 210 f = 11×30 − 10×12). Cada escena muestra
// el nombre de la transición que lleva hasta ella. Sirve para verificar
// de un vistazo que todas renderizan limpias (en especial las WebGL:
// waveWipe, emberBurn, rippleZoom, filmBurn, zoomBlur) y como catálogo
// visual para elegir la del próximo reel.
//
// Medios de transición (para stills de QA): 23, 41, 59, 77, 95, 113,
// 131, 149, 167, 185.

const T = linearTiming({durationInFrames: 12});

const Scene: React.FC<{bg: string; title: string; via: string}> = ({bg, title, via}) => (
  <AbsoluteFill style={{background: bg, justifyContent: 'center', alignItems: 'center'}}>
    <div style={{fontFamily: 'sans-serif', textAlign: 'center', color: '#FFF'}}>
      <div style={{fontSize: 96, fontWeight: 800}}>{title}</div>
      <div style={{fontSize: 40, fontWeight: 600, opacity: 0.85, marginTop: 16}}>{via}</div>
    </div>
  </AbsoluteFill>
);

const AbsCounter: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        position: 'absolute',
        top: 24,
        left: 0,
        right: 0,
        textAlign: 'center',
        fontFamily: 'sans-serif',
        fontSize: 36,
        fontWeight: 700,
        color: '#FFE600',
        textShadow: '0 2px 8px rgba(0,0,0,0.9)',
      }}
    >
      f{frame}
    </div>
  );
};

export const TransitionsShowcase: React.FC = () => {
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={30}>
          <Scene bg="#B3202C" title="START" via="sin transición" />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={waveWipe()} timing={T} />
        <TransitionSeries.Sequence durationInFrames={30}>
          <Scene bg="#C2410C" title="WAVE" via="waveWipe · Remocn" />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={emberBurn()} timing={T} />
        <TransitionSeries.Sequence durationInFrames={30}>
          <Scene bg="#1F2937" title="EMBER" via="emberBurn · Remocn" />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={irisWipe()} timing={T} />
        <TransitionSeries.Sequence durationInFrames={30}>
          <Scene bg="#15803D" title="IRIS" via="irisWipe · Remocn" />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={whipPan()} timing={T} />
        <TransitionSeries.Sequence durationInFrames={30}>
          <Scene bg="#6D28D9" title="WHIP" via="whipPan · Remocn" />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={rippleZoom()} timing={T} />
        <TransitionSeries.Sequence durationInFrames={30}>
          <Scene bg="#0F766E" title="RIPPLE" via="rippleZoom · Remocn" />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={T} />
        <TransitionSeries.Sequence durationInFrames={30}>
          <Scene bg="#1D4ED8" title="FADE" via="fade · oficial" />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({direction: 'from-right'})} timing={T} />
        <TransitionSeries.Sequence durationInFrames={30}>
          <Scene bg="#BE185D" title="SLIDE" via="slide · oficial" />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={filmBurn()} timing={T} />
        <TransitionSeries.Sequence durationInFrames={30}>
          <Scene bg="#CA8A04" title="BURN" via="filmBurn · oficial WebGL" />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={zoomBlur()} timing={T} />
        <TransitionSeries.Sequence durationInFrames={30}>
          <Scene bg="#57534E" title="ZOOM" via="zoomBlur · oficial WebGL" />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe()} timing={T} />
        <TransitionSeries.Sequence durationInFrames={30}>
          <Scene bg="#0E7490" title="WIPE" via="wipe · oficial" />
        </TransitionSeries.Sequence>
      </TransitionSeries>
      <AbsCounter />
    </AbsoluteFill>
  );
};
