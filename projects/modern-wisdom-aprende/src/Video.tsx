import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {BottomKaraoke} from '../../../shared/captions/BottomKaraoke';
import timelineRaw from './timeline.json';
import {buildPlaceholderKaraokeLines} from './karaoke';
import {COLORS} from './theme';
import type {DataItem, Timeline, TimelineScene} from './types';
import {BigStatement} from './components/BigStatement';
import {ChaptersMap} from './components/ChaptersMap';
import {DataStrip} from './components/DataStrip';
import {Diagram} from './components/Diagram';
import {Illustration} from './components/Illustration';
import {List} from './components/List';
import {ProgressBar} from './components/ProgressBar';
import {Question} from './components/Question';
import {Quote} from './components/Quote';
import {SceneShell} from './components/SceneShell';
import {SummaryCard} from './components/SummaryCard';
import {Table} from './components/Table';
import {TitleCard} from './components/TitleCard';
import {TwoCol} from './components/TwoCol';
import {WarningCard} from './components/WarningCard';
import {EndScreen} from './EndScreen';

const TIMELINE = timelineRaw as unknown as Timeline;

/**
 * Modern Wisdom: aprender — video didáctico HORIZONTAL 1920×1080, 30 fps,
 * PERSONAL (no publicable, no del Memorial).
 *
 * Montaje: las 134 escenas de scenes.json como <Sequence> seguidas, con
 * fundidos simples de 10 fotogramas entre escenas (el fondo es plano
 * #12100E, así que fundir a fondo = fundido cruzado limpio) y cortes
 * directos en los cambios de capítulo (las title-cards). Sin
 * TransitionSeries, sin WebGL, sin motion-blur: el render es de ~39 min
 * y debe ser ligero.
 *
 * Tiempos: src/timeline.json (scripts/build-timeline.mjs). Al completarse
 * la VO, re-ejecutar el script: mismo formato, tiempos reales.
 */

// TODO (karaoke real): cuando exista la transcripción de la VO
// (scripts/audio/transcribe-vo.py → faster-whisper word_timestamps),
// sustituir buildPlaceholderKaraokeLines() por el flujo canónico del
// hub: whisperWordsToCaptions(words, {chunkEndIndices, keywordWords}) +
// captionsToLines() (ver shared/captions/README.md y src/karaoke.ts).
// El karaoke placeholder reparte las palabras uniformemente por línea:
// sirve para verificar layout y ritmo, NO para el máster final.
const KARAOKE_LINES = buildPlaceholderKaraokeLines(
  TIMELINE.lines,
  TIMELINE.fps,
);

const SceneContent: React.FC<{
  scene: TimelineScene;
}> = ({scene}) => {
  const d = scene.durationFrames;
  switch (scene.type) {
    case 'title-card':
      return (
        <TitleCard
          kicker={scene.kicker}
          title={scene.title ?? ''}
          subtitle={scene.subtitle}
        />
      );
    case 'big-statement':
      return <BigStatement text={scene.text ?? ''} source={scene.source} />;
    case 'data-strip':
      return <DataStrip items={(scene.items ?? []) as DataItem[]} />;
    case 'two-col':
      return (
        <TwoCol
          leftTitle={scene.leftTitle ?? ''}
          leftItems={scene.leftItems ?? []}
          rightTitle={scene.rightTitle ?? ''}
          rightItems={scene.rightItems ?? []}
        />
      );
    case 'list':
      return (
        <List
          title={scene.title}
          items={(scene.items ?? []) as string[]}
          durationInFrames={d}
        />
      );
    case 'quote':
      return (
        <Quote text={scene.text ?? ''} author={scene.author} episode={scene.episode} />
      );
    case 'illustration':
      return <Illustration img={scene.img ?? ''} caption={scene.caption} />;
    case 'question':
      return <Question text={scene.text ?? ''} />;
    case 'summary-card':
      return <SummaryCard text={scene.text ?? ''} />;
    case 'warning-card':
      return <WarningCard title={scene.title} text={scene.text ?? ''} />;
    case 'table':
      return <Table title={scene.title} rows={scene.rows ?? []} />;
    case 'chapters-map':
      return (
        <ChaptersMap
          chapter={scene.chapter}
          highlight={scene.highlight}
          durationInFrames={d}
        />
      );
    case 'diagram':
      return (
        <Diagram
          diagram={scene.diagram ?? ''}
          title={scene.title}
          notes={scene.notes}
          durationInFrames={d}
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
    <AbsoluteFill style={{background: COLORS.bg}}>
      {TIMELINE.scenes.map((scene, i) => {
        const next = TIMELINE.scenes[i + 1];
        const isChapterStart = scene.type === 'title-card';
        const nextIsChapterStart = next?.type === 'title-card';
        return (
          <Sequence
            key={`${scene.chapter}-${scene.fromLine}`}
            from={scene.startFrame}
            durationInFrames={scene.durationFrames}
            name={`ch${scene.chapter}-l${scene.fromLine}-${scene.type}`}
          >
            <SceneShell
              durationInFrames={scene.durationFrames}
              hardIn={isChapterStart}
              hardOut={nextIsChapterStart || i === TIMELINE.scenes.length - 1}
            >
              <SceneContent scene={scene} />
            </SceneShell>
          </Sequence>
        );
      })}

      {/* Pantalla final: «Éxito es haber actuado.» (cola de 90 f, sin karaoke) */}
      <Sequence
        from={tailStart}
        durationInFrames={TIMELINE.tailFrames}
        name="end-screen"
      >
        <EndScreen />
      </Sequence>

      {/* Karaoke inferior durante toda la VO (se corta al final del habla,
          para no quedar visible sobre la pantalla final). */}
      <Sequence from={0} durationInFrames={lastSpeechEnd} name="karaoke">
        <BottomKaraoke
          lines={KARAOKE_LINES}
          bottom={90}
          size={44}
          longSize={38}
          longThreshold={60}
          fontFamily="'Poppins', sans-serif"
          keywordColor={COLORS.amber}
          color={COLORS.bone}
          outlinePx={2}
          sideMargin={140}
        />
      </Sequence>

      {/* Barra de progreso con capítulos (borde superior, siempre visible). */}
      <ProgressBar chapters={TIMELINE.chapters} totalFrames={TIMELINE.totalFrames} />
    </AbsoluteFill>
  );
};
