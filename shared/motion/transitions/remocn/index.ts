/**
 * Transiciones Remocn — set curado para reels editoriales del Memorial.
 *
 * PROCEDENCIA: Remocn (github.com/Remocn/remocn), commit
 * 3d2288f55aa5b85c3af736f0aa09fd40139a056e (15-nov-2026), licencia MIT.
 * Extraídas de los artefactos de registro locales en
 * `_sources/remocn/registry-artifacts/` (equivalente a
 * `npx shadcn@latest add @remocn/<nombre>`). Cada archivo lleva su
 * cabecera de procedencia. De las 59 transiciones del catálogo se
 * adaptaron 5: las que sirven a cortes editoriales sin arrastrar
 * dependencias pesadas (se descartaron las que exigen `gsh`, 67
 * archivos / 340 KB, y las que duplican presentaciones oficiales).
 *
 * Uso: son TransitionPresentation de @remotion/transitions; se usan
 * dentro de <TransitionSeries.Transition presentation={waveWipe()}
 * timing={linearTiming({durationInFrames: 12})} />.
 */
export {waveWipe} from './WaveWipe';
export type {WaveWipeProps} from './WaveWipe';
export {emberBurn} from './EmberBurn';
export type {EmberBurnProps} from './EmberBurn';
export {irisWipe} from './IrisWipe';
export type {IrisWipeProps} from './IrisWipe';
export {whipPan} from './WhipPan';
export type {WhipPanProps} from './WhipPan';
export {rippleZoom} from './RippleZoom';
export type {RippleZoomProps} from './RippleZoom';

/** Catálogo curado: nombre → cuándo usarlo en un reel del Memorial. */
export const REMOCN_TRANSITIONS = [
  {
    id: 'wave-wipe',
    name: 'waveWipe',
    use: 'Cambio de acto con textura: el degradado de grano tapa el corte.',
  },
  {
    id: 'ember-burn',
    name: 'emberBurn',
    use: 'Cierre o revelación dramática: el fotograma se quema por parches.',
  },
  {
    id: 'iris-wipe',
    name: 'irisWipe',
    use: 'Foco en un detalle o cambio de escena clásico, sin ruido.',
  },
  {
    id: 'whip-pan',
    name: 'whipPan',
    use: 'Corte rápido y enérgico entre dos planos (ritmo alto).',
  },
  {
    id: 'ripple-zoom',
    name: 'rippleZoom',
    use: 'Entrada a una escena de detalle: zoom con onda de grano.',
  },
] as const;
