import React from 'react';
import {AbsoluteFill,Img,OffthreadVideo,Sequence,interpolate,staticFile,useCurrentFrame} from 'remotion';

/**
 * Boca de Samá: edición de investigación v0.3.
 * 55s, 30fps, 1080x1920. PROHIBIDO PUBLICAR.
 * Fuentes de vídeo de terceros: solo revisión editorial privada mientras se aclaran derechos.
 * Medios públicos de producción en public/assets/*, sincronizados tras verificar SHA256.
 * El logo institucional NO se simula: espacio reservado para el archivo oficial original.
 */
const C={black:'#08090B',red:'#ED1C24',grey:'#77787B',white:'#F7F4EF'};
type Shot={from:number;len:number;name:string;caption:string;media?:string;startAt?:number;kind?:'video'|'image'};
const shots:Shot[]=[
 {from:0,len:120,name:'BOCA DE SAMÁ',caption:'HOLGUÍN · CUBA',media:'boca-monumento.mp4',startAt:102,kind:'video'},
 {from:120,len:180,name:'LA COSTA NORTE',caption:'BANES · HOLGUÍN',media:'nasa-costa.jpg',kind:'image'},
 {from:300,len:180,name:'12 OCTUBRE 1971',caption:'UN ATAQUE ARMADO',media:'muerte-en-boca.mp4',startAt:86,kind:'video'},
 {from:480,len:225,name:'LA MEMORIA EN IMÁGENES',caption:'REPRODUCCIÓN DOCUMENTAL · FUENTE POR ACREDITAR',media:'muerte-en-boca.mp4',startAt:128,kind:'video'},
 {from:705,len:180,name:'DOS PERSONAS FALLECIDAS',caption:'CUATRO PERSONAS HERIDAS',media:'boca-monumento.mp4',startAt:145,kind:'video'},
 {from:885,len:210,name:'NANCY PAVÓN',caption:'SOBREVIVIENTE · TESTIMONIO ORIGINAL',media:'boca-monumento.mp4',startAt:243,kind:'video'},
 {from:1095,len:210,name:'CARLOS ESCALANTE',caption:'SOBREVIVIENTE · TESTIMONIO ORIGINAL',media:'boca-monumento.mp4',startAt:78,kind:'video'},
 {from:1305,len:165,name:'55 AÑOS DESPUÉS',caption:'RECORDAR ES DOCUMENTAR',media:'monumento-2025.jpg',kind:'image'},
];
const clamp={extrapolateLeft:'clamp' as const,extrapolateRight:'clamp' as const};
function Archive({shot}:{shot:Shot}){
 const f=useCurrentFrame();
 const asset=shot.media?staticFile('assets/'+shot.media):undefined;
 const move=interpolate(f,[0,shot.len],[1.015,1.07],clamp);
 return <AbsoluteFill style={{background:C.black,overflow:'hidden'}}>
  {asset&&shot.kind==='video'&&<OffthreadVideo src={asset} startFrom={Math.round((shot.startAt||0)*30)} muted style={{width:'100%',height:'100%',objectFit:'cover',filter:'blur(26px) brightness(.27) saturate(.65)',transform:'scale(1.6)'}}/>}
  {asset&&shot.kind==='image'&&<Img src={asset} style={{width:'100%',height:'100%',objectFit:'cover',filter:'blur(23px) brightness(.32)',transform:'scale(1.22)'}}/>}
  <AbsoluteFill style={{background:'linear-gradient(180deg,rgba(0,0,0,.15),rgba(0,0,0,.14) 42%,rgba(0,0,0,.86))'}}/>
  <div style={{position:'absolute',top:252,left:48,right:48,height:590,overflow:'hidden',border:'1px solid #5e6063',background:'#1b1d1f',boxShadow:'0 18px 80px #000a'}}>
   {asset&&shot.kind==='video'&&<OffthreadVideo src={asset} startFrom={Math.round((shot.startAt||0)*30)} muted style={{width:'100%',height:'100%',objectFit:'contain',transform:'scale(1)'}}/>}
   {asset&&shot.kind==='image'&&<Img src={asset} style={{width:'100%',height:'100%',objectFit:'contain',transform:`scale(${move})`}}/>}
   {!asset&&<div style={{color:'#fff',fontSize:30,padding:35}}>ARCHIVO PENDIENTE DE SINCRONIZACIÓN</div>}
  </div>
  <div style={{position:'absolute',top:208,left:48,width:124,height:7,background:C.red}}/>
  <div style={{position:'absolute',top:875,left:55,right:55,color:C.white}}>
   <div style={{fontFamily:'Arial,sans-serif',fontWeight:800,fontSize:shot.name.length>20?56:74,lineHeight:1.09,letterSpacing:-1.1,textShadow:'0 3px 15px #000',maxWidth:970}}>{shot.name}</div>
   <div style={{fontSize:28,fontFamily:'Arial,sans-serif',fontWeight:700,marginTop:27,letterSpacing:3,color:'#fff'}}>{shot.caption}</div>
  </div>
  <div style={{position:'absolute',left:50,bottom:172,color:'#bcbcbc',fontSize:23,letterSpacing:1.8}}>ARCHIVO · FECHA / AUTORÍA A COTEJAR</div>
 </AbsoluteFill>;
}
const Scene:React.FC<{shot:Shot}>=({shot})=>{
 const f=useCurrentFrame();
 const fade=interpolate(f,[0,10,shot.len-14,shot.len],[0,1,1,0],clamp);
 return <AbsoluteFill style={{opacity:fade}}><Archive shot={shot}/></AbsoluteFill>;
};
const Closure=()=>{
 const f=useCurrentFrame();
 const reveal=interpolate(f,[6,35],[0,1],clamp);
 return <AbsoluteFill style={{background:C.black,justifyContent:'center',alignItems:'center',color:C.white,fontFamily:'Arial,sans-serif'}}>
  <div style={{width:110,height:7,background:C.red,opacity:reveal,marginBottom:36}}/>
  <div style={{opacity:reveal,fontSize:55,fontWeight:800,letterSpacing:1.5,textAlign:'center'}}>55 AÑOS DE MEMORIA</div>
  <div style={{opacity:reveal,fontSize:28,color:'#ddd',marginTop:26}}>12 OCTUBRE · 1971—2026</div>
  <div style={{position:'absolute',bottom:280,border:'2px dashed #666',padding:24,fontSize:25,color:'#c6c6c6',textAlign:'center'}}>LOGO ANIMADO OFICIAL PENDIENTE</div>
 </AbsoluteFill>;
};
export const MainReel:React.FC=()=> <AbsoluteFill style={{background:C.black}}>
 {shots.map((s,i)=><Sequence key={i} from={s.from} durationInFrames={s.len}><Scene shot={s}/></Sequence>)}
 <Sequence from={1470} durationInFrames={180}><Closure/></Sequence>
 <div style={{position:'absolute',bottom:55,left:40,right:40,textAlign:'center',background:'#ac0d17',color:'#fff',fontSize:25,fontFamily:'Arial,sans-serif',fontWeight:800,letterSpacing:2,padding:12}}>PREVIEW DE INVESTIGACIÓN · NO PUBLICAR</div>
 </AbsoluteFill>;
