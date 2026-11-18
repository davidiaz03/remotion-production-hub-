import React from 'react';
import {Composition} from 'remotion';
import project from '../project.json';
import {MainReelV2} from './VideoV2';
export const Root=()=> <Composition id={project.compositionId} component={MainReelV2} width={project.width} height={project.height} fps={project.fps} durationInFrames={project.durationInFrames}/>;
