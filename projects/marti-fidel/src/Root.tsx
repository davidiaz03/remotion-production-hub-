import React from 'react';
import {Composition} from 'remotion';
import project from '../project.json';
import {MainReelV25} from './VideoV25';
export const Root=()=> <Composition id={project.compositionId} component={MainReelV25} width={project.width} height={project.height} fps={project.fps} durationInFrames={project.durationInFrames}/>;
