import React from 'react';
import {Composition} from 'remotion';
import project from '../project.json';
import {BottomKaraokeTest, TopKaraokeCaptionsTest} from './Video';

export const Root = () => (
  <>
    <Composition
      id={project.compositionId}
      component={BottomKaraokeTest}
      width={project.width}
      height={project.height}
      fps={project.fps}
      durationInFrames={project.durationInFrames}
    />
    <Composition
      id="TopKaraokeCaptionsTest"
      component={TopKaraokeCaptionsTest}
      width={project.width}
      height={project.height}
      fps={project.fps}
      durationInFrames={project.durationInFrames}
    />
  </>
);
