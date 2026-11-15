import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {ParallaxStill, QuoteCard} from '../../../shared/motion';

// PRUEBA de los componentes adaptados ParallaxStill y QuoteCard —
// 75 fotogramas (2,5 s): 0–29 push-in sobre la imagen de prueba,
// 30–74 tarjeta de cita. Stills de QA en f15 y f70.
// (La cita es contenido de PRUEBA, no una cita real del Memorial.)

export const ComponentsTest: React.FC = () => {
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Sequence from={0} durationInFrames={30} name="parallax">
        <ParallaxStill
          bg="img/test-still.jpg"
          move="push-in"
          durationInFrames={30}
          sourceWidth={1080}
          seed={7}
        />
      </Sequence>
      <Sequence from={30} durationInFrames={45} name="quote">
        <QuoteCard
          quote="La historia que no te contaron."
          attribution="Guion de demostración"
          role="Cita de prueba — no publicable"
          top={700}
          delay={2}
          size={56}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
