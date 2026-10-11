import React from 'react';
import {Audio,Sequence,staticFile,useCurrentFrame,interpolate} from 'remotion';

/**
 * Sound editorial lane. Disabled until the generated audio exists on Drive,
 * its sha256 is added to the asset manifest and its cost/usage are approved.
 * The source must never be a survivor voice clone.
 * BORRADOR · NO PUBLICAR
 */
export const PREVIEW_NARRATION = {
  enabled: false,
  file: null as string | null,
  voice: 'es-CU-BelkysNeural',
  fromFrame: 120,     // 00:04, after opening card
  untilFrame: 720,    // 00:24, before Nancy's testimony
  approvedAsFinal: false,
} as const;

export const hasPreviewNarration = () =>
  PREVIEW_NARRATION.enabled && Boolean(PREVIEW_NARRATION.file);

const NarrationAudio: React.FC<{source: string}> = ({source}) => {
  const f = useCurrentFrame();
  const max = PREVIEW_NARRATION.untilFrame-PREVIEW_NARRATION.fromFrame;
  const fade = interpolate(f,[0,12,max-18,max],[0,1,1,0],{
    extrapolateLeft:'clamp',extrapolateRight:'clamp',
  });
  return <Audio src={staticFile(source)} volume={fade * 0.90}/>;
};

export const ProvisionalNarration:React.FC=()=>{
  const source = PREVIEW_NARRATION.file;
  if (!PREVIEW_NARRATION.enabled || !source) return null;
  return <Sequence from={PREVIEW_NARRATION.fromFrame}
    durationInFrames={PREVIEW_NARRATION.untilFrame-PREVIEW_NARRATION.fromFrame}>
    <NarrationAudio source={source}/>
  </Sequence>;
};
