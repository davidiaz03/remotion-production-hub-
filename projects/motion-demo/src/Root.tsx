import React from 'react';
import {Composition} from 'remotion';
import project from '../project.json';
import {MainReel} from './Video';
import {TransitionsTest} from './TransitionsTest';
import {TransitionsShowcase} from './TransitionsShowcase';
import {ComponentsTest} from './ComponentsTest';
export const Root = () => (
  <>
    <Composition
      id={project.compositionId}
      component={MainReel}
      width={project.width}
      height={project.height}
      fps={project.fps}
      durationInFrames={project.durationInFrames}
    />
    <Composition
      id="TransitionsTest"
      component={TransitionsTest}
      width={540}
      height={960}
      fps={30}
      durationInFrames={105}
    />
    <Composition
      id="TransitionsShowcase"
      component={TransitionsShowcase}
      width={540}
      height={960}
      fps={30}
      durationInFrames={210}
    />
    <Composition
      id="ComponentsTest"
      component={ComponentsTest}
      width={1080}
      height={1920}
      fps={30}
      durationInFrames={75}
    />
  </>
);
