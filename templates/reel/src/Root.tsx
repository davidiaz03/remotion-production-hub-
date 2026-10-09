import React from 'react';
import {Composition} from 'remotion';
import {MainReel} from './Video';
export const Root=()=> <Composition id="MainReel" component={MainReel} width={1080} height={1920} fps={30} durationInFrames={90}/>;
