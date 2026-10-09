import React from 'react';
import {AbsoluteFill} from 'remotion';
export type CaptionProps={text:string;bottom?:number;size?:number;color?:string};
/** Text-only captions: no backing rectangles and no forced institutional palette. */
export const Caption:React.FC<CaptionProps>=({text,bottom=150,size=60,color='#F1EEE6'})=><AbsoluteFill style={{pointerEvents:'none'}}>
  <div style={{position:'absolute',left:56,right:56,bottom,textAlign:'center',whiteSpace:'pre-line',fontFamily:'Arial, sans-serif',fontSize:size,fontWeight:800,lineHeight:1.12,color,textShadow:'0 2px 8px rgba(0,0,0,.75)'}}>{text}</div>
</AbsoluteFill>;
