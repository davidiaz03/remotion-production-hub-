import React from 'react';
import {interpolate,spring,useCurrentFrame,useVideoConfig} from 'remotion';
export const AnimatedTitle:React.FC<{text:string;delay?:number;size?:number;accent?:string}>=({text,delay=0,size=90,accent='#F9D87A'})=>{
 const frame=useCurrentFrame();const {fps}=useVideoConfig();const p=spring({fps,frame:Math.max(0,frame-delay),config:{damping:200}});
 const y=interpolate(p,[0,1],[40,0]);return <div style={{fontFamily:'Arial, sans-serif',fontWeight:900,fontSize:size,lineHeight:1.02,letterSpacing:-2,whiteSpace:'pre-line',color:accent,opacity:p,transform:`translateY(${y}px)`}}>{text}</div>;
};
