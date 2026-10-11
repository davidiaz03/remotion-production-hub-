import React from 'react';
import {AbsoluteFill,Img,OffthreadVideo,interpolate,spring,staticFile,useCurrentFrame} from 'remotion';

export const FPS=30;
export const P={red:'#ED1C24',ink:'#080A0C',ivory:'#F4F1EA',muted:'#A3A5A6',warm:'#CFAB92'};
export const A='00_MATERIALES_PARA_EDICION/';
export const media={
 aerial:A+'Aniversario_52_del_criminal_atentado_al_poblado_Boca_de_Samá(360p).mp4',
 coast:A+'Boca_de_Samá,_monumento_contra_el_terrorismo_en_Cuba(360p).mp4',
 archive:A+'Muerte_en_Boca(360p).mp4',
 nasa:A+'ISS036-E-3928_-_View_of_Cuba--Holguin_prov.-_Gibara,_Rafael_Freyre,_Guardalavaca_(Banes).jpg',
 monument:A+'Ataque_boca_de_sama_002.jpg',
};
const limit={extrapolateLeft:'clamp' as const,extrapolateRight:'clamp' as const};
export const fade=(f:number,a:number,b:number)=>interpolate(f,[a,b],[0,1],limit);
export const body={fontFamily:'Arial,Helvetica,sans-serif'};
export const letter={fontFamily:'Arial,Helvetica,sans-serif',fontWeight:800 as const,letterSpacing:2};
export function Base({children}:{children:React.ReactNode}){
 return <AbsoluteFill style={{background:'radial-gradient(ellipse at 70% 19%,#282C2F,#080A0C 65%)',color:P.ivory,overflow:'hidden'}}>{children}</AbsoluteFill>;
}
export function Edge({section='BOCA DE SAMÁ · 1971–2026'}:{section?:string}){
 return <><div style={{position:'absolute',top:75,left:62,color:P.ivory,fontSize:21,letterSpacing:3,...letter}}>{section}</div>
 <div style={{position:'absolute',top:126,left:62,width:83,height:5,background:P.red}}/>
 <div style={{position:'absolute',bottom:81,left:60,color:'#b5b5b5',fontSize:19,letterSpacing:1.5,...body}}>CORTE DE INVESTIGACIÓN · NO PUBLICAR</div></>;
}
export function Enter({children,delay=0}:{children:React.ReactNode;delay?:number}){
 const f=useCurrentFrame(),v=spring({fps:FPS,frame:Math.max(0,f-delay),config:{mass:1,damping:19,stiffness:100}});
 return <div style={{opacity:v,transform:`translateY(${(1-v)*42}px)`}}>{children}</div>;
}
export function Film({file,seek=0,top=300,height=680}:{file:string;seek?:number;top?:number;height?:number}){
 const f=useCurrentFrame(),z=interpolate(f,[0,300],[1,1.045],limit);
 return <div style={{position:'absolute',top,left:48,right:48,height,overflow:'hidden',background:'#111518',
 borderTop:'1px solid #ffffff40',borderBottom:'1px solid #ffffff30',transform:`scale(${z})`}}>
 <OffthreadVideo muted src={staticFile(file)} trimBefore={Math.round(seek*FPS)} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
 </div>;
}
export function Photo({file,top=230,height=910}:{file:string;top?:number;height?:number}){
 const f=useCurrentFrame(),z=interpolate(f,[0,260],[1.015,1.115],limit);
 return <div style={{position:'absolute',left:0,right:0,top,height,overflow:'hidden'}}>
 <Img src={staticFile(file)} style={{width:'100%',height:'100%',objectFit:'cover',transform:`scale(${z})`,filter:'contrast(1.07) saturate(.78)'}}/>
 </div>;
}
export function Head({big,sub,size=83}:{big:string;sub:string;size?:number}){
 return <Enter delay={7}><div style={{fontSize:size,fontWeight:900,lineHeight:1.06,letterSpacing:-2,textShadow:'0 5px 25px #0009',...body}}>{big}</div>
 <div style={{marginTop:20,fontSize:30,letterSpacing:2.6,...letter}}>{sub}</div></Enter>;
}
