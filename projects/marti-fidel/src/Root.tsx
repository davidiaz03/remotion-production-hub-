import React from 'react';
import {Composition} from 'remotion';
import project from '../project.json';
import {MainReelV23} from './VideoV23';
export const Root=()=> <Composition id={project.compositionId} component={MainReelV23} width={project.width} height={project.height} fps={project.fps} durationInFrames={project.durationInFrames}/>;
