import React from 'react';
import {Composition} from 'remotion';
import project from '../project.json';
import {MainReelV22} from './VideoV22';
export const Root=()=> <Composition id={project.compositionId} component={MainReelV22} width={project.width} height={project.height} fps={project.fps} durationInFrames={project.durationInFrames}/>;
