import React from 'react';
import {AbsoluteFill,Img,OffthreadVideo,interpolate,spring,staticFile,useCurrentFrame} from 'remotion';

/** V09 design grammar. Institutional logo is NEVER reconstructed. */
export const FPS=30;
export const C={red:'#ED1C24',black:'#07090B',gray:'#77787B',paper:'#F5F3EF',mist:'#BEC1C4'};
export const assets={
 coast:'00_MATERIALES_PARA_EDICION/Aniversario_52_del_criminal_atentado_al_poblado_Boca_de_Samá(360p).mp4',
 witnesses:'00_MATERIALES_PARA_EDICION/Boca_de_Samá,_monumento_contra_el_terrorismo_en_Cuba(360p).mp4',
 current:'00_MATERIALES_PARA_EDICION/Ataque_boca_de_sama_002.jpg',
 satellite:'00_MATERIALES_PARA_EDICION/ISS036-E-3928_-_View_of_Cuba--Holguin_prov.-_Gibara,_Rafael_Freyre,_Guardalavaca_(Banes).jpg',
 village:'boca-sama-v09_archive-village-source.png',
 portraits:'boca-sama-v09_victim-portraits-source.png',
 historicMonument:'boca-sama-v09_monument-coverage-source.png',
 score:'boca-sama-55-2026_weight-of-memory_TEMP_MUSIC.mp3',
};
const CL={extrapolateLeft:'clamp' as const,extrapolateRight:'clamp' as const};
export const curve=(frame:number,input:number[],output:number[])=>interpolate(frame,input,output,CL);
const font='Amplitude Condensed,Arial Narrow,Arial,Helvetica,sans-serif';
export const type={fontFamily:font,color:C.paper} as const;
export const Stage:React.FC<{children:React.ReactNode;light?:boolean}>=({children,light=false})=><AbsoluteFill
 style={{background:light?'#1F2123':'radial-gradient(ellipse at 68% 35%,#242729 0%,#111315 48%,#07090B 100%)',
 color:C.paper,overflow:'hidden'}}>{children}</AbsoluteFill>;

export const InkLabel:React.FC<{children:React.ReactNode;top?:number;left?:number}>=({children,top=215,left=76})=>
 <div style={{position:'absolute',top,left,fontFamily:font,fontWeight:800,fontSize:27,letterSpacing:3.2,
 color:C.red,textShadow:'0 2px 10px #0008'}}>{children}</div>;

export const Entrance:React.FC<{children:React.ReactNode;delay?:number;distance?:number}>=({children,delay=0,distance=45})=>{
 const f=useCurrentFrame();const p=spring({frame:Math.max(0,f-delay),fps:FPS,config:{stiffness:95,damping:200,mass:1}});
 return <div style={{opacity:p,transform:'translateY('+((1-p)*distance)+'px)'}}>{children}</div>;
};
export const Heading:React.FC<{children:React.ReactNode;size?:number;line?:number}>=({children,size=96,line=1.02})=><div
 style={{...type,fontWeight:900,fontSize:size,lineHeight:line,letterSpacing:-2.5,textShadow:'0 4px 18px #000a'}}>{children}</div>;
export const Context:React.FC<{children:React.ReactNode;size?:number}>=({children,size=33})=><div
 style={{...type,fontWeight:450,color:'#EEEAE3',lineHeight:1.34,fontSize:size,textShadow:'0 3px 10px #000a'}}>{children}</div>;

/** Source presented at proper 16:9 within portrait frame. Never stretch to 9:16. */
export const ArchiveVideo:React.FC<{src:string;start:number;top?:number;width?:number;onWhite?:boolean}> =
 ({src,start,top=405,width=1010,onWhite=false})=>{
 const frame=useCurrentFrame(),ratio=width/16*9;
 const motion=curve(frame,[0,290],[1,1.022]);
 return <div style={{position:'absolute',top,left:(1080-width)/2,width,height:ratio,background:'#141617',
 overflow:'hidden',border:'1px solid rgba(255,255,255,.24)',boxShadow:'0 26px 68px rgba(0,0,0,.55)',
 transform:'scale('+motion+')'}}>
 <OffthreadVideo muted src={staticFile(src)} trimBefore={Math.round(start*FPS)}
 style={{width:'100%',height:'100%',objectFit:'contain',filter:onWhite?'contrast(1.02)':'contrast(1.04) saturate(.91)'}}/>
 </div>;
};
export const ArchivalStill:React.FC<{src:string;top?:number;w?:number;h?:number;scaleTo?:number;fit?:'cover'|'contain';position?:string}>=
 ({src,top=340,w=980,h=660,scaleTo=1.075,fit='cover',position='center'})=>{
 const f=useCurrentFrame(),zoom=curve(f,[0,245],[1,scaleTo]);
 return <div style={{position:'absolute',top,left:(1080-w)/2,width:w,height:h,overflow:'hidden',background:'#121518',
 border:'1px solid rgba(255,255,255,.16)',boxShadow:'0 20px 75px #0009'}}>
 <Img src={staticFile(src)} style={{height:'100%',width:'100%',objectFit:fit,objectPosition:position,
 filter:'saturate(.78) contrast(1.11)',transform:'scale('+zoom+')'}}/>
 </div>;
};
export const Vignette:React.FC<{top?:number}>=({top=870})=><div style={{position:'absolute',top,left:0,right:0,bottom:0,
 background:'linear-gradient(180deg,#08090b00 0%,#08090bc0 26%,#08090b 72%)'}}/>;
export const RedRule:React.FC<{top?:number;left?:number;width?:number}>=({top=1127,left=77,width=110})=>{
 const f=useCurrentFrame();return <div style={{position:'absolute',top,left,width:width*curve(f,[0,20],[0,1]),height:6,
 background:C.red}}/>;
};
export const FilmWipe:React.FC<{children:React.ReactNode;direction?:'left'|'right'|'fade';frames?:number}>=({children,direction='fade',frames=12})=>{
 const f=useCurrentFrame(),p=curve(f,[0,frames],[0,1]);
 return <AbsoluteFill style={{opacity:direction==='fade'?p:1,
 clipPath:direction==='left'?'inset(0 '+((1-p)*100)+'% 0 0)':
 direction==='right'?'inset(0 0 0 '+((1-p)*100)+'%)':undefined}}>{children}</AbsoluteFill>;
};

/** Unverified narration never produces fictitious subtitles. No rectangular backgrounds. */
export type Caption={from:number;to:number;words:string;verified:boolean};
export const CaptionTrack:React.FC<{captions:Caption[]}>=({captions})=>{
 const f=useCurrentFrame();const line=captions.find(c=>c.verified&&f>=c.from&&f<c.to);
 if(!line)return null;
 const a=curve(f,[line.from,line.from+4],[0,1]);
 return <div style={{position:'absolute',top:1505,left:99,right:99,textAlign:'center',fontFamily:font,
 fontWeight:750,fontSize:50,lineHeight:1.15,color:C.paper,opacity:a,
 textShadow:'0 2px 4px #000, 0 4px 12px #000, -1px -1px 2px #000',
 WebkitTextStroke:'.5px rgba(0,0,0,.6)',pointerEvents:'none'}}>
 {line.words}</div>;
};
export const Proof=()=> <div style={{position:'absolute',top:80,right:62,color:'#C0C0C0',fontSize:17,
 fontFamily:font,letterSpacing:2,fontWeight:700,opacity:.65}}>BORRADOR · NO PUBLICAR</div>;
