import React from 'react';
import {AbsoluteFill, Sequence, interpolate, useCurrentFrame} from 'remotion';
type Shot={start:number;duration:number;label:string;title:string;body:string;asset:string};
const shots:Shot[]=[
{start:0,duration:180,label:'12 OCTUBRE · 1971–2026',title:'Boca de Samá',body:'Una comunidad. Una noche. Una memoria.',asset:'Fotografía actual auténtica del poblado'},
{start:180,duration:240,label:'BANES · HOLGUÍN',title:'El lugar',body:'La costa norte de Cuba.',asset:'Mapa geográfico verificado y fotografía real'},
{start:420,duration:300,label:'12 OCTUBRE 1971',title:'La noche del ataque',body:'Un grupo armado atacó esta comunidad.',asset:'Fotografías históricas y documentos acreditados'},
{start:720,duration:270,label:'DOS PERSONAS FALLECIDAS',title:'Recordar sus nombres',body:'Lidio Rivaflecha Galán\nRamón Siam Portelles',asset:'Retratos auténticos y grafías oficiales pendientes'},
{start:990,duration:240,label:'CUATRO PERSONAS HERIDAS',title:'Vidas marcadas',body:'Entre ellas, dos hermanas adolescentes.',asset:'Documentos/testimonios genuinos, con permisos'},
{start:1230,duration:240,label:'EL TESTIMONIO',title:'Nancy Pavón',body:'Las consecuencias fueron mucho más allá de las cifras.',asset:'Testimonio original autenticado; NO voz recreada'},
{start:1470,duration:180,label:'55 AÑOS DESPUÉS',title:'Recordar es documentar',body:'Boca de Samá · 12 de octubre de 2026',asset:'Monumento real + identidad institucional autorizada'}];
const Scene:React.FC<{shot:Shot}> = ({shot})=>{
 const f=useCurrentFrame();
 const a=interpolate(f,[0,18,shot.duration-19,shot.duration-1],[0,1,1,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
 const y=interpolate(f,[0,40],[40,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
 return <AbsoluteFill style={{backgroundColor:'#0B1720',color:'#F1EBE2',padding:90,fontFamily:'Arial, sans-serif',boxSizing:'border-box'}}>
  <AbsoluteFill style={{background:'radial-gradient(circle at 80% 20%, #324C55 0%, transparent 55%)'}}/>
  <div style={{position:'relative',opacity:a,transform:`translateY(${y}px)`,marginTop:200}}>
   <div style={{width:110,height:5,background:'#C8AC82',marginBottom:44}}/>
   <div style={{fontSize:32,color:'#C8AC82',letterSpacing:4,fontWeight:700}}>{shot.label}</div>
   <h1 style={{fontSize:shot.title.length>20?69:91,lineHeight:1.07,margin:'45px 0'}}>{shot.title}</h1>
   <p style={{fontSize:45,lineHeight:1.4,whiteSpace:'pre-line'}}>{shot.body}</p>
   <div style={{border:'3px dashed #8395A0',borderRadius:20,marginTop:85,padding:35,fontSize:31,lineHeight:1.35,color:'#BFC8CC',textAlign:'center'}}>
    <strong>ARCHIVO REAL PENDIENTE</strong><p>{shot.asset}</p>
   </div>
  </div>
  <div style={{position:'absolute',bottom:80,left:45,right:45,fontSize:23,textAlign:'center',letterSpacing:2,color:'#E9BC9F',fontWeight:700}}>MAQUETA DE INVESTIGACIÓN · NO PUBLICAR</div>
 </AbsoluteFill>;
};
export const MainReel:React.FC=()=> <AbsoluteFill style={{background:'#0B1720'}}>{shots.map((shot,i)=><Sequence key={i} from={shot.start} durationInFrames={shot.duration}><Scene shot={shot}/></Sequence>)}</AbsoluteFill>;
