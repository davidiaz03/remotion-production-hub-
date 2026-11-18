import React from 'react';
import {Composition} from 'remotion';
import project from '../project.json';
import {QuietReel} from './Video';
export const Root=()=> <Composition id={project.compositionId} component={QuietReel} width={project.width} height={project.height} fps={project.fps} durationInFrames={project.durationInFrames}/>;
