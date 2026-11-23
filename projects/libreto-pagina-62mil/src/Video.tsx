import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {BottomKaraoke} from '../../../shared/captions/BottomKaraoke';
import {captionsToLines, type HubCaption} from '../../../shared/captions';
import timelineRaw from './timeline.json';
import captionsRaw from './captions.json';
import {COLORS, CONTENT} from './theme';
import type {DataItem, Timeline, TimelineScene} from './types';
import {expandAssets, FLAG_CIRCLE, GEMINI_MARK, resolveAsset} from './assetMap';
import {BigStatement} from './components/BigStatement';
import {DocumentChecklist} from './components/DocumentChecklist';
import {DocumentComparison} from './components/DocumentComparison';
import {DocumentCounter} from './components/DocumentCounter';
import {DocumentPhotoVideo} from './components/DocumentPhotoVideo';
import {DocumentQuote} from './components/DocumentQuote';
import {DocumentTrio} from './components/DocumentTrio';
import {DocumentZoom} from './components/DocumentZoom';
import {FormulaDiagram} from './components/FormulaDiagram';
import {GrowthChart} from './components/GrowthChart';
import {List} from './components/List';
import {ProgressBar} from './components/ProgressBar';
import {Question} from './components/Question';
import {SceneShell} from './components/SceneShell';
import {SummaryCard} from './components/SummaryCard';
import {TimelinePattern} from './components/TimelinePattern';
import {TitleCard} from './components/TitleCard';
import {Watermark} from './components/Watermark';
import {EndScreen} from './EndScreen';

const TIMELINE = timelineRaw as unknown as Timeline;

/**
 * El Libreto — «La página que engañó a 62.000 personas».
 * Video largo HORIZONTAL 1920×1080, 30 fps, ~548 s (VO real grabada).
 * Estructura copiada de longform-smoke (escenas data-driven:
 * timeline.json + captions.json, generados por el pipeline).
 *
 * Montaje: las escenas de scenes.json como <Sequence> seguidas, con
 * fundidos simples de 10 fotogramas entre escenas y fundido a NEGRO
 * en los cambios de capítulo (plan-edicion.md: fundido a negro ENTRE
 * actos, corte seco dentro de un acto). Sin TransitionSeries, sin
 * WebGL, sin motion-blur: el render debe ser ligero.
 *
 * Decisiones de cableado (plan-edicion.md §2–§3 + scenes.json):
 * - data-strip → GrowthChart: la única escena de este tipo ES el
 *   gráfico G3 (600K → 748K → 770K). DataStrip queda adaptado en el
 *   árbol por si una escena futura necesita tarjetas de cifras.
 * - list + título con «fórmula» → FormulaDiagram (G4, con el rótulo
 *   «SIN ACLARACIÓN» en el último paso); el resto de listas → List.
 * - document-zoom + F11 en el capítulo 3 (cierre honesto, 3.7) →
 *   overlay con la línea de tiempo completa (G2). Cualquier escena
 *   con scene.timelineMilestones también muestra el overlay.
 * - document-zoom con messi-foto (3.6) → lupa sobre la marca de agua
 *   de Gemini (GEMINI_MARK, medido en el JPG) + rótulo «GEMINI».
 * - document-zoom con post-bukele-1 (1.5) → mini-captura 1/3 del ancho.
 * - document-zoom con F11 → barra de navegador FALSA con la URL
 *   (el PDF no tiene barra de direcciones; NOTAS-RECURSOS.md).
 * - big-statement con «deseable» → resaltado en Resaltador (plan 2.5).
 */

// Karaoke REAL: faster-whisper word_timestamps sobre la VO grabada,
// alineados con scripts/audio/transcribe-vo.py (src/captions.json =
// HubCaption[], kw + pageBreakAfter según vo-captions.json). El flujo
// canónico del hub agrupa las páginas con captionsToLines().
const KARAOKE_LINES = captionsToLines(captionsRaw as unknown as HubCaption[]);

const hasAsset = (scene: TimelineScene, file: string): boolean =>
  (scene.assets ?? []).some((a) => resolveAsset(a) === file);

/**
 * Rangos (fotogramas globales) en los que la barra de progreso se OCULTA:
 * los slices F11, donde DocumentZoom muestra la barra de navegador FALSA
 * con la URL. La barra de progreso chocaba con ella (píldoras de capítulo
 * sobre la barra del navegador) y el z-index no basta: el fundido de
 * SceneShell (opacity < 1) crea un contexto de apilado que atrapa el
 * z-index dentro de la escena. Misma matemática de slices que
 * DocumentZoom (expandAssets + tercios iguales): una sola fuente de
 * verdad para la expansión.
 */
const URLBAR_HIDE_RANGES: Array<{start: number; end: number}> =
  TIMELINE.scenes.flatMap((scene) => {
    const imgs = expandAssets(scene.assets ?? []).filter(
      (a) => !/\.mp4$/i.test(resolveAsset(a)),
    );
    const f11Idx = imgs.findIndex(
      (a) => resolveAsset(a) === 'pagina-no-disponible-url.jpg',
    );
    if (f11Idx < 0 || imgs.length === 0) {
      return [];
    }
    const slice = scene.durationFrames / imgs.length;
    return [
      {
        start: scene.startFrame + Math.floor(f11Idx * slice),
        end: scene.startFrame + Math.ceil((f11Idx + 1) * slice),
      },
    ];
  });

/** ¿Esta escena lleva el overlay de la línea de tiempo (G2)? */
const showTimeline = (scene: TimelineScene): boolean => {
  if (scene.timelineMilestones && scene.timelineMilestones.length > 0) {
    return true;
  }
  // Cierre honesto (3.7): la URL caída vuelve + línea de tiempo completa.
  return (
    scene.type === 'document-zoom' &&
    scene.chapter === 3 &&
    hasAsset(scene, 'pagina-no-disponible-url.jpg')
  );
};

const SceneContent: React.FC<{
  scene: TimelineScene;
}> = ({scene}) => {
  const d = scene.durationFrames;
  switch (scene.type) {
    case 'document-zoom': {
      const isGeminiLoupe = hasAsset(scene, 'messi-foto-98c58e7b73.jpg');
      const isMini = hasAsset(scene, 'post-bukele-1.jpg');
      const isF11 = hasAsset(scene, 'pagina-no-disponible-url.jpg');
      return (
        <DocumentZoom
          assets={scene.assets ?? []}
          urlBar={
            isF11 ? scene.urlBar ?? 'facebook.com/foreverjose.taiger' : undefined
          }
          zoomTo={
            scene.zoomTo ?? (isGeminiLoupe ? 2.6 : 1.08)
          }
          focus={scene.focus ?? (isGeminiLoupe ? GEMINI_MARK : undefined)}
          caption={isGeminiLoupe ? 'GEMINI' : undefined}
          mini={isMini}
          durationInFrames={d}
        />
      );
    }
    case 'document-counter':
      return (
        <DocumentCounter
          assets={scene.assets ?? []}
          countTo={scene.countTo}
          countLandAt={scene.countLandAt}
          metricAt={scene.metricAt}
          metrics={scene.metrics}
          durationInFrames={d}
        />
      );
    case 'document-comparison':
      return (
        <DocumentComparison
          assets={scene.assets ?? []}
          stamp={scene.stamp}
          circle={scene.circle ?? FLAG_CIRCLE}
          plate={
            scene.plate ?? '4-DIC-2022 · INSTAGRAM DE ANTONELA ROCCUZZO'
          }
          durationInFrames={d}
        />
      );
    case 'document-quote':
      return (
        <DocumentQuote
          assets={scene.assets ?? []}
          quote={scene.quote}
          outlet={scene.outlet}
          date={scene.date}
          overlay={scene.overlay}
          text={scene.text}
          durationInFrames={d}
        />
      );
    case 'document-photo-video':
      return (
        <DocumentPhotoVideo
          assets={scene.assets ?? []}
          videoStartFrom={scene.videoStartFrom}
          videoAt={scene.videoAt}
          videoFrames={scene.videoFrames}
          plate={scene.plate ?? '5 DE MARZO DE 2026 · CASA BLANCA'}
          durationInFrames={d}
        />
      );
    case 'title-card':
      return (
        <TitleCard
          kicker={scene.kicker}
          title={scene.title ?? ''}
          subtitle={scene.subtitle}
        />
      );
    case 'question':
      return <Question text={scene.text ?? ''} durationInFrames={d} />;
    case 'data-strip':
      // La única escena data-strip es el gráfico de crecimiento G3.
      return (
        <GrowthChart
          items={(scene.items ?? []) as DataItem[]}
          itemAt={scene.itemAt}
          durationInFrames={d}
        />
      );
    case 'list': {
      const isFormula = (scene.title ?? '')
        .toLowerCase()
        .includes('fórmula');
      if (isFormula) {
        return (
          <FormulaDiagram
            items={(scene.items ?? []) as string[]}
            title={scene.title}
            itemAt={scene.itemAt}
            viralAt={scene.viralAt}
            lastStepTag="SIN ACLARACIÓN"
            durationInFrames={d}
          />
        );
      }
      return (
        <List
          title={scene.title}
          items={(scene.items ?? []) as string[]}
          itemAt={scene.itemAt}
          durationInFrames={d}
        />
      );
    }
    case 'document-trio':
      return (
        <DocumentTrio
          assets={scene.assets ?? []}
          items={(scene.items ?? []) as string[]}
          durationInFrames={d}
        />
      );
    case 'big-statement':
      return (
        <BigStatement
          text={scene.text ?? ''}
          onVideo={!!scene.videoBg}
          source={scene.source}
          highlight={
            scene.highlightWord ??
            ((scene.text ?? '').includes('deseable') ? 'deseable' : undefined)
          }
        />
      );
    case 'document-checklist':
      return (
        <DocumentChecklist
          assets={scene.assets ?? []}
          checklist={scene.checklist}
          itemAt={scene.itemAt}
          markAt={scene.markAt}
          durationInFrames={d}
        />
      );
    case 'summary-card':
      return (
        <SummaryCard
          text={scene.text ?? ''}
          label={scene.label ?? 'EL LIBRETO'}
        />
      );
    default:
      return null;
  }
};

export const MainReel: React.FC = () => {
  const lastSpeechEnd = TIMELINE.chapters[TIMELINE.chapters.length - 1].endFrame;
  const tailStart = TIMELINE.totalFrames - TIMELINE.tailFrames;
  return (
    <AbsoluteFill style={{background: COLORS.paper}}>
      {TIMELINE.scenes.map((scene, i) => {
        const prev = TIMELINE.scenes[i - 1];
        const next = TIMELINE.scenes[i + 1];
        const chapterStart = !prev || prev.chapter !== scene.chapter;
        const chapterEnd = !next || next.chapter !== scene.chapter;
        return (
          <Sequence
            key={i}
            from={scene.startFrame}
            durationInFrames={scene.durationFrames}
            name={`ch${scene.chapter}-s${i}-${scene.type}`}
          >
            <SceneShell
              durationInFrames={scene.durationFrames}
              blackIn={chapterStart && i > 0}
              blackOut={chapterEnd}
              bg={scene.type === 'question' ? COLORS.ink : COLORS.paper}
              fullBleed={scene.type === 'document-zoom'}
              videoBg={scene.videoBg}
            >
              <SceneContent scene={scene} />
            </SceneShell>

            {/* Línea de tiempo del patrón (G2) al pie de la escena,
                por encima del karaoke. */}
            {showTimeline(scene) ? (
              <AbsoluteFill style={{pointerEvents: 'none'}}>
                <div
                  style={{
                    position: 'absolute',
                    left: CONTENT.side,
                    right: CONTENT.side,
                    // La banda mide ~250 px: con bottom 260 queda por
                    // encima del karaoke (2 líneas + banda ≈ 230 px) y
                    // deja visible el titular del mensaje de F11.
                    bottom: 260,
                  }}
                >
                  <TimelinePattern
                    milestones={scene.timelineMilestones}
                    activeIndex={scene.timelineActive}
                    durationInFrames={scene.durationFrames}
                  />
                </div>
              </AbsoluteFill>
            ) : null}
          </Sequence>
        );
      })}

      {/* Pantalla final: cierre de marca (cola de 90 f, sin karaoke). */}
      <Sequence
        from={tailStart}
        durationInFrames={TIMELINE.tailFrames}
        name="end-screen"
      >
        <EndScreen />
      </Sequence>

      {/* Karaoke inferior durante toda la VO (se corta al final del habla,
          para no quedar visible sobre la pantalla final). Estilo El
          Libreto: texto Papel sobre banda Tinta semitransparente,
          palabra clave con fondo Resaltador y texto Tinta. */}
      <Sequence from={0} durationInFrames={lastSpeechEnd} name="karaoke">
        <BottomKaraoke
          lines={KARAOKE_LINES}
          bottom={90}
          size={44}
          longSize={38}
          longThreshold={60}
          fontFamily="'Noto Sans', sans-serif"
          keywordColor={COLORS.ink}
          keywordBackground={COLORS.highlighter}
          bandBackground={COLORS.karaokeBand}
          color={COLORS.paper}
          outlinePx={2}
          sideMargin={140}
        />
      </Sequence>

      {/* Barra de progreso con capítulos (borde superior, siempre visible
          salvo en los slices F11, donde la barra de navegador falsa con
          la URL ocupa esa zona). */}
      <ProgressBar
        chapters={TIMELINE.chapters}
        totalFrames={TIMELINE.totalFrames}
        hideRanges={URLBAR_HIDE_RANGES}
      />

      {/* Marca de agua lockup, abajo-izquierda, desde el fotograma 0. */}
      <Watermark />
    </AbsoluteFill>
  );
};

// Nota: DataStrip queda adaptado a la marca en components/ aunque la
// única escena data-strip actual se renderice como GrowthChart (G3):
// si una escena futura necesita tarjetas de cifras, está listo.
