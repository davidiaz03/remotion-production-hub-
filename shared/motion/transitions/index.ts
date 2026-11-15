/**
 * Catálogo curado de transiciones del hub.
 *
 * Tres fuentes, un solo import:
 *   1. Oficiales de @remotion/transitions (4.0.530): HTML (fade, slide,
 *      wipe, flip, clockWipe, iris) y WebGL (dissolve, crosswarp,
 *      filmBurn, ripple, zoomBlur).
 *   2. Remocn (MIT, ver ./remocn/): 5 adaptadas del catálogo de 59.
 *
 * @remotion/light-leaks se EVALUÓ y se DESCARTÓ (15-nov-2026): el
 * paquete está deprecado en 4.0.530, el efecto migró a
 * @remotion/effects y NO es una presentación de TransitionSeries sino
 * un overlay (EffectDescriptor) con otra API; emberBurn/filmBurn ya
 * cubren «enmascarar un corte con luz». No instalarlo.
 *
 * REGLAS DE TRANSITION SERIES (verificadas por stills, 15-nov-2026,
 * en projects/motion-demo/src/TransitionsTest.tsx):
 *   · La transición SOLAPA: total = Σ secuencias − Σ transiciones.
 *   · El reloj local de la escena entrante empieza AL INICIO de la
 *     transición. Para reels con VO, el contenido de cada escena
 *     entrante lleva `delay = duración de la transición` para que
 *     aterrice en el corte nominal, sincronizado con la voz.
 *   · El `offset` de Sequence NO compensa el solape: con offset la
 *     escena entrante sale NEGRA durante la transición. No usarlo.
 *   · Duración recomendada: 10–15 fotogramas (0,3–0,5 s). Más largo
 *     se siente lento; más corto no se percibe.
 *   · Una transición por corte; no encadenar dos seguidas.
 *   · Las WebGL (filmBurn, zoomBlur, emberBurn, waveWipe, rippleZoom)
 *     renderizan en Chromium headless con SwiftShader: verificar con
 *     stills antes de darlas por buenas en un máster.
 */

// --- Oficiales HTML ---
export {fade} from '@remotion/transitions/fade';
export {slide} from '@remotion/transitions/slide';
export {wipe} from '@remotion/transitions/wipe';
export {flip} from '@remotion/transitions/flip';
export {clockWipe} from '@remotion/transitions/clock-wipe';
export {iris} from '@remotion/transitions/iris';
export {blurSlide} from '@remotion/transitions';
export {linearBlur} from '@remotion/transitions';

// --- Oficiales WebGL (cada una exporta además su *Shader crudo; aquí
// se reexporta la factoría de presentación) ---
export {dissolve} from '@remotion/transitions/dissolve';
export {crosswarp} from '@remotion/transitions/crosswarp';
export {filmBurn} from '@remotion/transitions/film-burn';
export {ripple} from '@remotion/transitions/ripple';
export {zoomBlur} from '@remotion/transitions/zoom-blur';

// --- Remocn (set curado, MIT) ---
export {
  REMOCN_TRANSITIONS,
  emberBurn,
  irisWipe,
  rippleZoom,
  waveWipe,
  whipPan,
} from './remocn';
export type {
  EmberBurnProps,
  IrisWipeProps,
  RippleZoomProps,
  WaveWipeProps,
  WhipPanProps,
} from './remocn';

/** Guía rápida: qué transición para cada corte del Memorial. */
export const TRANSITION_GUIDE = [
  {when: 'Cambio de acto / tema', use: 'waveWipe o slide', avoid: 'fade (demasiado blando)'},
  {when: 'Revelación o cierre dramático', use: 'emberBurn o filmBurn', avoid: 'whipPan (rompe el tono)'},
  {when: 'Entre dos planos del mismo tema', use: 'fade o dissolve', avoid: 'emberBurn (sobreactúa)'},
  {when: 'Ritmo alto / montaje rápido', use: 'whipPan o slide', avoid: 'irisWipe (frena)'},
  {when: 'Foco en un detalle', use: 'irisWipe o rippleZoom', avoid: 'flip (distrae)'},
  {when: 'Enmascarar un corte feo', use: 'emberBurn o filmBurn', avoid: 'nada (el corte se nota)'},
] as const;
