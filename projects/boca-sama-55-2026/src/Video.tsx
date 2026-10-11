import React from 'react';
import {witnessWaveforms} from './VoiceWaveforms';
import {testimonyCaptionDraftV28} from './TestimonyCaptionsV28';
import {AbsoluteFill,Audio,Img,OffthreadVideo,Sequence,staticFile,useCurrentFrame} from 'remotion';
import {Stage,InkLabel,Heading,Context,Entrance,ArchiveVideo,ArchivalStill,Vignette,
 RedRule,FilmWipe,CaptionTrack,Proof,C,curve,assets,LivingBackdrop,GeographicIndex,PaperDocument,ResearchNote,SceneTransition,InterviewEnvironment} from './Editorial';
// V29 BORRADOR · NO PUBLICAR. Gemini candidate wording requires audio-by-ear confirmation; 2026 Hacemos Cuba clips are NOT 1971 archive.
const Opening=()=>{
 const frame=useCurrentFrame();
 // Fade out editorial typography before the satellite takes over.
 // The authentic coastal landscape persists until the transition ends.
 const letteringOpacity=curve(frame,[103,122],[1,0]);
 return <Stage>
 <LivingBackdrop opacity={.62}/>
 <ArchiveVideo src={assets.coast} start={2.8} top={345}/>
 <div style={{position:'absolute',inset:0,opacity:letteringOpacity,pointerEvents:'none'}}>
 <InkLabel top={213}>12 OCTUBRE 1971</InkLabel>
 <RedRule top={1018} width={145}/>
 <div style={{position:'absolute',left:71,right:39,top:1078}}>
 <Entrance delay={4} distance={20}><Heading size={99}>BOCA DE SAMÁ</Heading>
 <div style={{marginTop:25}}><Context size={32}>Un lugar. Una historia que permanece.</Context></div></Entrance></div>
 <GeographicIndex/>
 </div><Proof/>
 </Stage>;
};
const Place=()=> <Stage><FilmWipe direction="right" frames={19}><ArchivalStill src={assets.satellite} top={255} w={1080} h={1090} scaleTo={1.09}/>
 <Vignette top={980}/><InkLabel top={235}>COSTA NORTE DE CUBA</InkLabel>
 <div style={{position:'absolute',left:70,right:55,top:1290}}><Entrance delay={2}><Heading>HOLGUÍN</Heading>
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
 <div style={{position:'absolute',left:72,right:65,top:1425,fontSize:23,lineHeight:1.2,color:'#d5d5d5',fontFamily:'Arial,sans-serif'}}>
 Fuente: nota oficial de 1971 reproducida en Mar y Pesca (1978).
 </div>
 </FilmWipe><Proof/></Stage>;
/**
 * Authentic testimony face for 6–6.5s, then source-native B-roll.
 * Audio remains muted until exact witness words and permission are verified.
 */
const Survivor=({name,seek,duration,portraitFrames,bRollStart,earlyFile,earlySeek,voiceFile,environment,waveform,voiceFrames,voiceStart}:{name:string;seek:number;duration:number;portraitFrames:number;bRollStart:number;earlyFile:string;earlySeek:number;voiceFile:string;environment:string;waveform:'nancy'|'carlos';voiceFrames:number;voiceStart:number})=>{
 const frame=useCurrentFrame();
 // Identity is established on the human face and then yields to the location,
 // rather than freezing the same large name over all the B-roll.
 const identity=curve(frame,[0,12,portraitFrames-22,portraitFrames+2],[0,1,1,0]);
 const place=curve(frame,[portraitFrames,portraitFrames+15],[0,1]);
 return <Stage>
 <InterviewEnvironment src={environment}/>
 <InkLabel top={245}>TESTIMONIO DE ARCHIVO</InkLabel>
 <Sequence from={0} durationInFrames={portraitFrames}>
  <ArchiveVideo src={earlyFile} start={earlySeek} top={363}/>
 </Sequence>
 <Sequence from={0} durationInFrames={voiceFrames}>
  <Audio src={staticFile(voiceFile)} volume={0.85}/>
 </Sequence>
 <Sequence from={portraitFrames} durationInFrames={duration-portraitFrames}>
  <ArchiveVideo src={assets.witnesses} start={bRollStart} top={363}/>
 </Sequence>
 <div style={{position:'absolute',top:1120,left:72,right:62,opacity:identity}}>
  <RedRule top={-28} left={0} width={94}/>
  <Heading size={name.length>15?73:82}>{name}</Heading>
  <div style={{marginTop:22}}><Context size={29}>Sobreviviente del ataque de 1971</Context></div>
 </div>
 <div style={{position:'absolute',top:1230,left:72,right:62,opacity:place}}>
  <Context size={30}>BOCA DE SAMÁ · IMÁGENES DEL LUGAR</Context>
 </div>
 {/* The waveform is measured from the ORIGINAL voice. It must not persist into silent B-roll.
     Reserve y=1500–1645 for verified two-line captions without backgrounds. */}
 <div style={{position:'absolute',left:73,right:73,top:1310,height:90,display:'flex',alignItems:'center',gap:7,
 opacity:curve(frame,[0,12,Math.max(15,voiceFrames-18),voiceFrames],[0,1,1,0]),pointerEvents:'none'}}>
 {witnessWaveforms[waveform].map((strength,i)=><div key={i} style={{flex:1,height:(10+strength*.7)+'px',borderRadius:5,
 background:i<=Math.floor(frame/voiceFrames*witnessWaveforms[waveform].length)?C.red:'#d1d0cf92'}}/>)}
 </div>
 <div style={{position:'absolute',left:75,top:1425,fontSize:23,color:'#e4e2df',letterSpacing:1.8,
 fontFamily:'Arial,sans-serif',opacity:curve(frame,[0,12,Math.max(15,voiceFrames-18),voiceFrames],[0,1,1,0]),pointerEvents:'none'}}>
 VOZ ORIGINAL · ARCHIVO TESTIMONIAL
 </div>
 <Proof/>
 </Stage>;
};

const Remembrance=()=>{
 const f=useCurrentFrame();
 // Fade documentary picture AND title down before the unmodified official logo.
 // This preserves its full six-second animation without a double-exposed title.
 const exitToBlack=curve(f,[163,179],[0,1]);
 return <Stage>
 <InkLabel top={230}>BOCA DE SAMÁ · HOY</InkLabel>
 <Sequence from={0} durationInFrames={63}>
  <ArchiveVideo src={assets.coast} start={109.4} top={355}/>
 </Sequence>
 <Sequence from={63} durationInFrames={117}>
  {/* Avoid original documentary ACN outro appearing after ~365s. */}
  <ArchiveVideo src={assets.witnesses} start={356.0} top={355} playbackRate={0.72}/>
 </Sequence>
 <div style={{position:'absolute',top:1135,left:72,right:50}}>
  <Entrance delay={8}><Heading size={88}>LA MEMORIA<br/>PERMANECE</Heading></Entrance>
 </div>
 <AbsoluteFill style={{background:'#000',opacity:exitToBlack,pointerEvents:'none'}}/>
 <Proof/></Stage>;
};

/** V19 source is the actual original 720x1280 / 24fps six-second logo animation.
 * Show it in full without manufacturing additional frames or scaling the artwork separately.
 * The watermark uses a transparent crop of the EXACT same animation's last frame.
 */
const Closure=()=> <Stage>
 <OffthreadVideo src={staticFile(assets.brandOutro)} muted style={{width:'100%',height:'100%',objectFit:'cover'}}/>
 <Proof/>
 </Stage>;
const Watermark=()=>{
 const frame=useCurrentFrame();
 if(frame>=1470)return null;
 return <Img src={staticFile(assets.brandAlpha)} style={{
 position:'absolute',top:182,right:40,width:112,height:'auto',opacity:.42,objectFit:'contain',
 filter:'drop-shadow(0 1px 4px rgba(0,0,0,.52))',pointerEvents:'none'}}/>;
};
const Music=()=>{const frame=useCurrentFrame();const vol=curve(frame,[0,20,710,720,879,895,1010,1020,1272,1288,1540,1649],[0,.24,.24,.055,.055,.24,.24,.055,.055,.24,.24,0]);
 return <Audio src={staticFile(assets.score)} volume={vol}/>;};

// Sequence overlaps only at directed transitions; each active overlap is 12 frames. Endpoint remains exactly frame 1649.
// Interviews deliberately start on straight cuts to honor unaltered testimony.
const edit=[
 {start:0,len:132,mode:'cut' as const,element:<Opening/>},
 {start:120,len:192,mode:'fade' as const,element:<Place/>},
 {start:300,len:222,mode:'fade' as const,element:<History/>},
 {start:510,len:222,mode:'right' as const,element:<Human/>},
 {start:720,len:300,mode:'cut' as const,element:<Survivor name="NANCY PAVÓN" seek={255} duration={300} portraitFrames={155} bRollStart={324.6} earlyFile={assets.nancy2011} earlySeek={49.833333} voiceFrames={159} voiceStart={49.833333} voiceFile={assets.voiceNancyReview} environment={assets.atmosphereNancy} waveform="nancy"/>},
 {start:1020,len:270,mode:'cut' as const,element:<Survivor name="CARLOS ESCALANTE" seek={89} duration={270} portraitFrames={185} bRollStart={354.7} earlyFile={assets.carlos2011} earlySeek={203.633333} voiceFrames={252} voiceStart={203.633333} voiceFile={assets.voiceCarlosReview} environment={assets.atmosphereCarlos} waveform="carlos"/>},
 {start:1290,len:180,mode:'fade' as const,element:<Remembrance/>},
 {start:1470,len:180,mode:'cut' as const,element:<Closure/>},
];
export const MainReel=()=> <AbsoluteFill style={{background:'#07090B'}}>
 <Music/>
 {edit.map((s,i)=><Sequence key={i} from={s.start} durationInFrames={s.len}>
  <SceneTransition mode={s.mode} frames={12}>{s.element}</SceneTransition>
 </Sequence>)}
 <CaptionTrack captions={testimonyCaptionDraftV28}/>
 <Watermark/>
 </AbsoluteFill>;
