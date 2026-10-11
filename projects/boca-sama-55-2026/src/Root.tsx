import React from 'react';
import {Composition} from 'remotion';
import project from '../project.json';
import {MainReel,CaptionReviewReel} from './Video';
export const Root=()=> <><Composition id={project.compositionId} component={MainReel} width={project.width} height={project.height} fps={project.fps} durationInFrames={project.durationInFrames}/><Composition id="CaptionReviewReel" component={CaptionReviewReel} width={project.width} height={project.height} fps={project.fps} durationInFrames={project.durationInFrames}/></>;
