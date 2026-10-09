import React from 'react';
import {AbsoluteFill,Img,staticFile} from 'remotion';
export type BrandFrameProps={logo?:string;opacity?:number;top?:number;right?:number;width?:number};
/** Optional institutional watermark. No default logo is assumed. */
export const BrandFrame:React.FC<BrandFrameProps>=({logo,opacity=.24,top=68,right=48,width=125})=>
  logo?<Img src={staticFile(logo)} style={{position:'absolute',top,right,width,height:'auto',opacity,pointerEvents:'none'}}/>:null;
export const VerticalSafeArea:React.FC<{children:React.ReactNode;bottom?:number;top?:number}>=({children,bottom=140,top=90})=><AbsoluteFill style={{padding:`${top}px 64px ${bottom}px`,boxSizing:'border-box'}}>{children}</AbsoluteFill>;
