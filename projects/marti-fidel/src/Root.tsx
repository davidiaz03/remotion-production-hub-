import React from 'react';
import {Composition} from 'remotion';
import project from '../project.json';
import {MainReelV6} from './VideoV6';
export const Root=()=> <Composition id={project.compositionId} component={MainReelV6} width={project.width} height={project.height} fps={project.fps} durationInFrames={project.durationInFrames}/>;
