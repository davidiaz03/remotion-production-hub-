import React from 'react';
import {Img,interpolate,useCurrentFrame} from 'remotion';
/** Deterministic motion computed exclusively from composition frames. */
export const KenBurnsStill:React.FC<{
 src:string; durationInFrames:number; fromScale?:number; toScale?:number;
 fromX?:number; toX?:number; fromY?:number; toY?:number; position?:string;
}>=({src,durationInFrames,fromScale=1.04,toScale=1.12,fromX=0,toX=0,fromY=0,toY=0,position='center'})=>{
 const frame=useCurrentFrame(); const last=Math.max(1,durationInFrames-1);
 const motion=(a:number,b:number)=>interpolate(frame,[0,last],[a,b],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
 return <Img src={src} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:position,
 transform:`translate(${motion(fromX,toX)}px, ${motion(fromY,toY)}px) scale(${motion(fromScale,toScale)})`}}/>;
};
