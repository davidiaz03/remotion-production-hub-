import React from 'react';
import {Composition} from 'remotion';
import project from '../project.json';
import {MainReelV21} from './VideoV21';
export const Root=()=> <Composition id={project.compositionId} component={MainReelV21} width={project.width} height={project.height} fps={project.fps} durationInFrames={project.durationInFrames}/>;
