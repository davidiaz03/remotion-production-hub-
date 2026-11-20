import React from 'react';
import {Composition} from 'remotion';
import project from '../project.json';
import {MainReelV41} from './VideoV41';
export const Root=()=> <Composition id={project.compositionId} component={MainReelV41} width={project.width} height={project.height} fps={project.fps} durationInFrames={project.durationInFrames}/>;
