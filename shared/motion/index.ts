/**
 * Módulo motion — gramática del explainer animado para reels del Memorial.
 *
 * Replica las TÉCNICAS del estilo de referencia analizado en
 * ~/workspace/marabana/research/motion-ref-fb/ANALISIS.md (Maxi Rubio,
 * bloqueo de SIM, 5,8M vistas): karaoke superior, resplandor emocional,
 * marco de teléfono, mano que toca, lupa, pasos numerados, alertas,
 * diagramas animados y barridos. NO copia contenido ni marca del creador:
 * los assets (fotos, personajes, textos) los pone cada proyecto.
 */
export {GlowStage, GlowCrossfade} from './GlowStage';
export type {GlowStageProps} from './GlowStage';
export {TopKaraoke} from './TopKaraoke';
export type {KaraokeLine, KaraokeWord, TopKaraokeProps} from './TopKaraoke';
export {KineticHeadline} from './KineticHeadline';
export type {HeadlineWord, KineticHeadlineProps} from './KineticHeadline';
export {PhoneFrame} from './PhoneFrame';
export type {PhoneFrameProps} from './PhoneFrame';
export {TapHand} from './TapHand';
export type {TapHandProps, TapPoint} from './TapHand';
export {Magnifier} from './Magnifier';
export type {MagnifierProps} from './Magnifier';
export {StepCard} from './StepCard';
export type {StepCardProps} from './StepCard';
export {AlertBanner} from './AlertBanner';
export type {AlertBannerProps} from './AlertBanner';
export {DiagramFlow} from './DiagramFlow';
export type {DiagramFlowProps} from './DiagramFlow';
export {SweepTransition} from './SweepTransition';
export type {SweepTransitionProps} from './SweepTransition';
export {CountUp} from './CountUp';
export type {CountUpProps} from './CountUp';
export {QuoteCard} from './QuoteCard';
export type {QuoteCardProps} from './QuoteCard';
export {ParallaxStill, cameraMove} from './CameraMove';
export type {CameraMove, CameraMoveKind, ParallaxStillProps} from './CameraMove';
export {Sfx, dbGain} from './sfx/Sfx';
export type {SfxProps} from './sfx/Sfx';
export {SFX_CATEGORIES, SFX_INDEX, sfxByCategory, sfxSearch} from './sfx/index';
export type {SfxId, SfxMeta} from './sfx/index';
export {GLOW_PRESETS, MOTION_COLORS, POPPINS, seeded} from './theme';
export type {GlowPreset} from './theme';
