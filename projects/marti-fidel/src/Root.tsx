import React from 'react';
import {Composition} from 'remotion';
import project from '../project.json';
import {MainReelV61} from './VideoV61';
export const Root=()=> <Composition id={project.compositionId} component={MainReelV61} width={project.width} height={project.height} fps={project.fps} durationInFrames={project.durationInFrames}/>;
