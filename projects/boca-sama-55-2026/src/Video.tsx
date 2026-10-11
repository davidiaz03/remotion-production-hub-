import React from 'react';
import {AbsoluteFill,Audio,Sequence,staticFile,useCurrentFrame} from 'remotion';
import {Stage,InkLabel,Heading,Context,Entrance,ArchiveVideo,ArchivalStill,Vignette,
 RedRule,FilmWipe,CaptionTrack,Proof,C,curve,assets,LivingBackdrop,GeographicIndex,PaperDocument,ResearchNote,SceneTransition} from './Editorial';
// V14 55-second vertical research cut. NO PUBLICAR. Narration arrives later.
const Opening=()=> <Stage>
 <LivingBackdrop opacity={.62}/>
 <FilmWipe frames={5}>
 <InkLabel top={213}>12 OCTUBRE 1971</InkLabel>
 <ArchiveVideo src={assets.coast} start={2.8} top={345} />
 <RedRule top={1018} width={145}/>
 <div style={{position:'absolute',left:71,right:39,top:1078}}>
 <Entrance delay={4} distance={20}><Heading size={99}>BOCA DE SAMÁ</Heading>
 <div style={{marginTop:25}}><Context size={32}>Un lugar. Una historia que permanece.</Context></div></Entrance></div>
 <GeographicIndex/>
 </FilmWipe><Proof/>
 </Stage>;
const Place=()=> <Stage><FilmWipe direction="right" frames={19}><ArchivalStill src={assets.satellite} top={255} w={1080} h={1090} scaleTo={1.09}/>
 <Vignette top={980}/><InkLabel top={235}>COSTA NORTE DE CUBA</InkLabel>
 <div style={{position:'absolute',left:70,right:55,top:1290}}><Entrance delay={9}><Heading>HOLGUÍN</Heading>
 <Context>Boca de Samá · Municipio de Banes</Context></Entrance></div>
 <div style={{position:'absolute',top:1520,left:72,right:72,fontSize:22,color:'#CCC'}}>Imagen regional, no localización exacta.</div>
 </FilmWipe><Proof/></Stage>;
const History=()=> <Stage><FilmWipe frames={14}><PaperDocument src={assets.village} top={350} width={960} height={650}/>
 <InkLabel top={257}>EL POBLADO</InkLabel><RedRule top={1120}/><div style={{position:'absolute',left:71,right:53,top:1180}}>
 <Entrance delay={15}><Heading size={100}>EL ATAQUE</Heading><Context>La historia del poblado quedó marcada por un ataque armado.</Context></Entrance></div>
 </FilmWipe><Proof/></Stage>;
const Human=()=> <Stage light><FilmWipe direction="left" frames={17}><PaperDocument src={assets.portraits} top={300} width={980} height={650}/>
 <InkLabel top={230}>CONSECUENCIAS HUMANAS</InkLabel>
 <div style={{position:'absolute',top:1100,left:72,right:70,display:'flex',gap:45}}>
 {[['02','fallecidos'],['04','heridos']].map(([num,name])=>
 <div key={num} style={{width:'50%',borderTop:'5px solid '+C.red,paddingTop:18}}>
 <Heading size={126}>{num}</Heading><Context size={33}>{name}</Context></div>)}</div>
 </FilmWipe><Proof/></Stage>;
/**
 * Authentic testimony face for 6–6.5s, then source-native B-roll.
 * Audio remains muted until exact witness words and permission are verified.
 */
const Survivor=({name,seek,duration,portraitFrames,bRollStart}:{name:string;seek:number;duration:number;portraitFrames:number;bRollStart:number})=>
 <Stage>
 <InkLabel top={245}>TESTIMONIO · SOBREVIVIENTE</InkLabel>
 <Sequence from={0} durationInFrames={portraitFrames}>
  <ArchiveVideo src={assets.witnesses} start={seek} top={363}/>
 </Sequence>
 <Sequence from={portraitFrames} durationInFrames={duration-portraitFrames}>
  <ArchiveVideo src={assets.witnesses} start={bRollStart} top={363}/>
 </Sequence>
 <div style={{position:'absolute',top:1115,left:72,right:62}}><RedRule top={0} left={0} width={100}/>
 <Entrance delay={6}><Heading size={name.length>15?73:90}>{name}</Heading></Entrance></div>
 <div style={{position:'absolute',top:1315,left:73,right:73}}><Context size={26}>Sobreviviente · Entrevista de archivo.</Context></div>
 <Proof/></Stage>;

const Remembrance=()=> <Stage>
 <InkLabel top={230}>BOCA DE SAMÁ · HOY</InkLabel>
 <Sequence from={0} durationInFrames={63}>
  <ArchiveVideo src={assets.coast} start={109.4} top={355}/>
 </Sequence>
 <Sequence from={63} durationInFrames={117}>
  <ArchiveVideo src={assets.witnesses} start={362.3} top={355}/>
 </Sequence>
 <div style={{position:'absolute',top:1135,left:72,right:50}}>
  <Entrance delay={8}><Heading size={88}>LA MEMORIA<br/>PERMANECE</Heading></Entrance>
 </div>
 <Proof/></Stage>;

const Closure=()=> <Stage><div style={{position:'absolute',top:750,left:70,right:70,textAlign:'center'}}>
 <Entrance delay={7}><Heading size={91}>55 AÑOS</Heading><div style={{height:35}}/>
 <Context size={35}>BOCA DE SAMÁ · 1971—2026</Context></Entrance></div>
 <div style={{position:'absolute',bottom:300,left:115,right:115,textAlign:'center',fontFamily:'Arial,sans-serif',
 color:'#b3b3b3',fontSize:26}}>CIERRE OFICIAL PENDIENTE · LOGO ORIGINAL NO DISPONIBLE</div><Proof/></Stage>;
const Music=()=>{const frame=useCurrentFrame();const vol=curve(frame,[0,20,1540,1649],[0,.24,.24,0]);
 return <Audio src={staticFile(assets.score)} volume={vol}/>;};

// Sequence overlaps only at directed transitions; each active overlap is 12 frames. Endpoint remains exactly frame 1649.
// Interviews deliberately start on straight cuts to honor unaltered testimony.
const edit=[
 {start:0,len:132,mode:'cut' as const,element:<Opening/>},
 {start:120,len:192,mode:'left' as const,element:<Place/>},
 {start:300,len:222,mode:'fade' as const,element:<History/>},
 {start:510,len:222,mode:'right' as const,element:<Human/>},
 {start:720,len:300,mode:'cut' as const,element:<Survivor name="NANCY PAVÓN" seek={255} duration={300} portraitFrames={150} bRollStart={324.6}/>},
 {start:1020,len:270,mode:'cut' as const,element:<Survivor name="CARLOS ESCALANTE" seek={89} duration={270} portraitFrames={180} bRollStart={354.7}/>},
 {start:1290,len:192,mode:'fade' as const,element:<Remembrance/>},
 {start:1470,len:180,mode:'fade' as const,element:<Closure/>},
];
export const MainReel=()=> <AbsoluteFill style={{background:'#07090B'}}>
 <Music/>
 {edit.map((s,i)=><Sequence key={i} from={s.start} durationInFrames={s.len}>
  <SceneTransition mode={s.mode} frames={12}>{s.element}</SceneTransition>
 </Sequence>)}
 <CaptionTrack captions={[]}/>
 </AbsoluteFill>;
