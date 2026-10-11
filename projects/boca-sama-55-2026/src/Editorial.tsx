import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';

// V08: single hierarchy, archive at its native aspect ratio, restrained motion.
export const F=30;
export const C={ink:'#090B0D',paper:'#F0EEE9',red:'#ED1C24',silver:'#ABA9A6',mist:'#313438'};
export const folder='00_MATERIALES_PARA_EDICION/';
export const asset={
 coast:folder+'Aniversario_52_del_criminal_atentado_al_poblado_Boca_de_Samá(360p).mp4',
 interviews:folder+'Boca_de_Samá,_monumento_contra_el_terrorismo_en_Cuba(360p).mp4',
 records:folder+'Muerte_en_Boca(360p).mp4',
 satellite:folder+'ISS036-E-3928_-_View_of_Cuba--Holguin_prov.-_Gibara,_Rafael_Freyre,_Guardalavaca_(Banes).jpg',
 monument:folder+'Ataque_boca_de_sama_002.jpg'
};
export const clamp={extrapolateLeft:'clamp' as const,extrapolateRight:'clamp' as const};
export const lerp=(f:number,range:number[],out:number[])=>interpolate(f,range,out,clamp);
export const text={fontFamily:'Arial,Helvetica,sans-serif',color:C.paper} as const;

export const Matte:React.FC<{children:React.ReactNode}> = ({children}) => {
 const f=useCurrentFrame();
 return <AbsoluteFill style={{background:'radial-gradient(ellipse at 70% 34%,#303437 0%,#14171a 38%,#090b0d 74%)',
 color:C.paper,overflow:'hidden'}}>
 <div style={{position:'absolute',inset:0,background:'linear-gradient(160deg,#0000 45%,#050607a5 98%)',opacity:.95}}/>
 <div style={{position:'absolute',left:42,top:206,width:4,height:lerp(f,[0,35],[0,82]),background:C.red}}/>
 {children}</AbsoluteFill>;
};
export const MoveIn:React.FC<{children:React.ReactNode;delay?:number;offset?:number}>=({children,delay=3,offset=28})=>{
 const f=useCurrentFrame(),k=spring({fps:F,frame:Math.max(0,f-delay),config:{damping:200,stiffness:105,mass:1}});
 return <div style={{opacity:k,transform:'translateY('+((1-k)*offset)+'px)'}}>{children}</div>;
};
export const Eyebrow:React.FC<{children:React.ReactNode;top?:number;left?:number}>=({children,top=190,left=68})=>
 <div style={{position:'absolute',top,left,fontFamily:'Arial,Helvetica,sans-serif',
 fontSize:24,fontWeight:800,letterSpacing:3.4,color:C.red}}>{children}</div>;
export const Display:React.FC<{children:React.ReactNode;size?:number;lineHeight?:number}>=({children,size=83,lineHeight=1.03})=>
 <div style={{...text,fontSize:size,fontWeight:900,lineHeight,letterSpacing:-2.2,
 textShadow:'0 4px 20px #000a'}}>{children}</div>;
export const Small:React.FC<{children:React.ReactNode;size?:number}>=({children,size=27})=>
 <div style={{...text,fontSize:size,lineHeight:1.35,letterSpacing:.25,color:'#DDDAD3'}}>{children}</div>;
export const Frame:React.FC<{file:string;seek?:number;top?:number;w?:number;h?:number;position?:string}> =
 ({file,seek=0,top=395,w=1000,h=562,position='center'})=>{
 const f=useCurrentFrame(),scale=lerp(f,[0,275],[1,1.032]);
 return <div style={{position:'absolute',left:(1080-w)/2,top,width:w,height:h,overflow:'hidden',
 border:'1px solid rgba(255,255,255,.31)',boxShadow:'0 22px 85px #0009',transform:'scale('+scale+')',
 backgroundColor:'#111417'}}>
 <OffthreadVideo src={staticFile(file)} trimBefore={Math.round(seek*F)} muted
 style={{width:'100%',height:'100%',objectFit:'contain',objectPosition:position}}/>
 </div>;
};
export const ImageWindow:React.FC<{file:string;top:number;h:number;wide?:boolean;position?:string}> =
 ({file,top,h,wide=false,position='center'})=>{
 const f=useCurrentFrame(),scale=lerp(f,[0,250],[1.015,1.08]);
 return <div style={{position:'absolute',left:wide?0:50,right:wide?0:50,top,height:h,overflow:'hidden',
 border:wide?'none':'1px solid #ffffff32',background:'#0c1014',
 boxShadow:wide?'none':'0 20px 60px #0008'}}>
 <Img src={staticFile(file)} style={{width:'100%',height:'100%',objectFit:'cover',
 objectPosition:position,transform:'scale('+scale+')',filter:'saturate(.75) contrast(1.08)'}}/>
 </div>;
};
export const GlassShade:React.FC<{top?:number}>=({top=1040})=>
 <div style={{position:'absolute',left:0,right:0,top,bottom:0,
 background:'linear-gradient(180deg,#090b0d00,#090b0de8 30%,#090b0d 83%)'}}/>;
export const ProofMark=()=> <div style={{position:'absolute',top:70,right:55,
 fontFamily:'Arial,sans-serif',fontWeight:700,color:'#ffffff88',fontSize:17,letterSpacing:2.2}}>V08 · CORTE INTERNO</div>;
export const Entrance:React.FC<{children:React.ReactNode;style?:'direct'|'reveal'|'dissolve'}>=({children,style='direct'})=>{
 const f=useCurrentFrame();
 const p=lerp(f,[0,13],[0,1]);
 return <AbsoluteFill style={style==='reveal'?{clipPath:'inset(0 '+((1-p)*100)+'% 0 0)'}:
 style==='dissolve'?{opacity:p}:{}}>{children}</AbsoluteFill>;
};
