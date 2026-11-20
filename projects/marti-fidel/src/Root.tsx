import React from 'react';
import {Composition} from 'remotion';
import project from '../project.json';
import {MainReelV3} from './VideoV3';
export const Root=()=> <Composition id={project.compositionId} component={MainReelV3} width={project.width} height={project.height} fps={project.fps} durationInFrames={project.durationInFrames}/>;
