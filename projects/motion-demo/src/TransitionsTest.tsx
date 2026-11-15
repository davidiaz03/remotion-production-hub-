import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {slide} from '@remotion/transitions/slide';

// SONDA DE SEMÁNTICA de TransitionSeries (se conserva como ejemplo mínimo):
// dos escenas de 60 f con un slide de 15 f entre ellas. Verificado por
// stills 15-nov-2026:
//   · La transición SOLAPA: total = 60 + 60 − 15 = 105 f.
//   · El reloj local de la escena entrante empieza AL INICIO de la
//     transición (en el f59 absoluto, B va por su local 14).
//   · El `offset` de Sequence NO compensa el solape: con offset=15 la
//     escena entrante sale NEGRA durante la transición.
// Regla para reels con VO: el contenido de cada escena entrante lleva
// `delay = duración de la transición` para que aterrice en el corte
// nominal, sincronizado con la voz. Ver shared/motion/README.md.

const Label: React.FC<{tag: string; bg: string}> = ({tag, bg}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{background: bg, justifyContent: 'center', alignItems: 'center'}}
    >
      <div
        style={{
          fontFamily: 'sans-serif',
          fontSize: 120,
          fontWeight: 800,
          color: '#FFF',
          textAlign: 'center',
        }}
      >
        {tag}
        <br />
        <span style={{fontSize: 64}}>local {frame}</span>
      </div>
    </AbsoluteFill>
  );
};

const AbsCounter: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <div
      style={{
        position: 'absolute',
        top: 30,
        left: 0,
        right: 0,
        textAlign: 'center',
        fontFamily: 'sans-serif',
        fontSize: 44,
        fontWeight: 700,
        color: '#FFE600',
        textShadow: '0 2px 8px rgba(0,0,0,0.9)',
      }}
    >
      ABS {frame} · {fps} fps
    </div>
  );
};

export const TransitionsTest: React.FC = () => {
  return (
    <AbsoluteFill>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={60}>
          <Label tag="ESCENA A" bg="#B3202C" />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({direction: 'from-right'})}
          timing={linearTiming({durationInFrames: 15})}
        />
        <TransitionSeries.Sequence durationInFrames={60}>
          <Label tag="ESCENA B" bg="#1D4ED8" />
        </TransitionSeries.Sequence>
      </TransitionSeries>
      <AbsCounter />
    </AbsoluteFill>
  );
};
