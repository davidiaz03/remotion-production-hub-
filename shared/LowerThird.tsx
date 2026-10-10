import React from 'react';
import {interpolate,useCurrentFrame} from 'remotion';
/** Accessible text layer without a solid backdrop. */
export const LowerThird:React.FC<{
 title:string;subtitle?:string;accent?:string;color?:string;startFrame?:number;
 x?:number;bottom?:number;maxWidth?:number;
}>=({title,subtitle,accent='#E8B95A',color='#F6F2EA',startFrame=0,x=52,bottom=190,maxWidth=910})=>{
 const frame=useCurrentFrame()-startFrame;
 const opacity=interpolate(frame,[0,12],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
 const y=interpolate(frame,[0,12],[16,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
 return <div style={{position:'absolute',left:x,bottom,maxWidth,opacity,transform:`translateY(${y}px)`,
 pointerEvents:'none',borderLeft:`5px solid ${accent}`,paddingLeft:18,color,
 textShadow:'0 2px 8px rgba(0,0,0,.8)',fontFamily:'Arial, sans-serif'}}>
 <div style={{fontSize:52,fontWeight:800,lineHeight:1.05}}>{title}</div>
 {subtitle?<div style={{fontSize:28,marginTop:10,lineHeight:1.15}}>{subtitle}</div>:null}
 </div>;
};
