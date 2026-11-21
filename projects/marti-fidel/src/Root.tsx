import React from 'react';
import {Composition} from 'remotion';
import project from '../project.json';
import {MainReelV5} from './VideoV5';
export const Root=()=> <Composition id={project.compositionId} component={MainReelV5} width={project.width} height={project.height} fps={project.fps} durationInFrames={project.durationInFrames}/>;
