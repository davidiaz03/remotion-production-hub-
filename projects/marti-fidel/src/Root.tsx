import React from 'react';
import {Composition} from 'remotion';
import project from '../project.json';
import {MainReelV4} from './VideoV4';
export const Root=()=> <Composition id={project.compositionId} component={MainReelV4} width={project.width} height={project.height} fps={project.fps} durationInFrames={project.durationInFrames}/>;
