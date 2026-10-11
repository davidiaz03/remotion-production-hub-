import React from 'react';
import {AbsoluteFill,Audio,Sequence,staticFile,useCurrentFrame} from 'remotion';
import {Matte,Frame,ImageWindow,GlassShade,Eyebrow,Display,Small,MoveIn,ProofMark,Entrance,asset,C,lerp} from './Editorial';
// V08 / 55s / 1080x1920 / 30fps. The narration remains replaceable.
// No hallucinated testimonies. No artificially recreated official logo.
const SceneOne=()=> <Matte><Entrance style="dissolve">
 <Frame file={asset.coast} seek={4} top={370} w={1010} h={568}/>
 <Eyebrow top={278}>12 OCTUBRE 1971</Eyebrow>
 <div style={{position:'absolute',top:1030,left:68,right:50}}><MoveIn>
 <Display size={97}>BOCA DE SAMÁ</Display>
 <div style={{height:17}}/><Small size={31}>Costa norte de Holguín. Un lugar que recuerda.</Small>
 </MoveIn></div></Entrance><ProofMark/></Matte>;
const SceneTwo=()=> <Matte><Entrance style="reveal"><ImageWindow file={asset.satellite} top={320} h={980} wide/>
 <GlassShade top={950}/><Eyebrow top={280}>UN LUGAR EN LA COSTA CUBANA</Eyebrow>
 <div style={{position:'absolute',left:67,top:1280,right:55}}><MoveIn>
 <Display size={101}>BANES</Display><Small size={33}>Municipio de Holguín, al nordeste de Cuba.</Small></MoveIn></div>
 <div style={{position:'absolute',left:67,top:1447,right:72,color:'#c8c6c3',fontSize:23}}>Imagen satelital regional · No localiza el ataque.</div>
 </Entrance><ProofMark/></Matte>;
const SceneThree=()=> <Matte><Entrance style="dissolve"><Frame file={asset.records} seek={130} top={465} w={1000} h={562}/>
 <Eyebrow top={285}>EL ATAQUE</Eyebrow>
 <div style={{position:'absolute',top:1090,left:65,right:55}}><MoveIn>
 <Display size={108}>1971</Display><div style={{height:18}}/><Small size={35}>El 12 de octubre, un ataque armado cambió la historia del poblado.</Small>
 </MoveIn></div></Entrance><ProofMark/></Matte>;
const SceneFour=()=> <Matte><Entrance style="dissolve"><ImageWindow file={asset.monument} top={265} h={920} wide/>
 <GlassShade top={1010}/><Eyebrow top={230}>EL COSTO HUMANO</Eyebrow>
 <div style={{position:'absolute',top:1190,left:65,right:65,display:'flex',gap:32}}>
 {[['02','FALLECIDOS'],['04','HERIDOS']].map(([n,label])=><div key={n} style={{flex:1,borderTop:'5px solid '+C.red,paddingTop:24}}>
 <Display size={133}>{n}</Display><Small size={29}>{label}</Small></div>)}</div>
 </Entrance><ProofMark/></Matte>;
const Testimony=({name,seek,description}:{name:string;seek:number;description:string})=><Matte><Entrance style="dissolve">
 <Eyebrow top={278}>UNA VOZ QUE SOBREVIVIÓ</Eyebrow>
 <Frame file={asset.interviews} seek={seek} top={420} w={1000} h={562}/>
 <div style={{position:'absolute',top:1095,left:68,right:55}}><MoveIn>
 <Display size={name.length>14?73:85}>{name}</Display>
 <div style={{height:21}}/><Small size={28}>{description}</Small>
 </MoveIn></div></Entrance><ProofMark/></Matte>;
const SceneSeven=()=> <Matte><Entrance style="reveal"><ImageWindow file={asset.monument} top={200} h={1120} wide/>
 <GlassShade top={960}/><Eyebrow top={300}>55 AÑOS DESPUÉS</Eyebrow>
 <div style={{position:'absolute',left:68,right:55,top:1230}}><MoveIn>
 <Display size={87}>LA MEMORIA<br/>PERMANECE</Display></MoveIn></div></Entrance><ProofMark/></Matte>;
const Last=()=> <Matte><div style={{position:'absolute',top:720,left:68,right:68,textAlign:'center'}}>
 <MoveIn><Display size={91}>55 AÑOS</Display><div style={{height:27}}/><Small size={35}>BOCA DE SAMÁ · 1971–2026</Small></MoveIn></div>
 <div style={{position:'absolute',bottom:365,left:160,right:160,textAlign:'center',fontSize:27,color:'#aaa',fontFamily:'Arial,sans-serif'}}>
 ANIMACIÓN INSTITUCIONAL ORIGINAL PENDIENTE</div><ProofMark/></Matte>;
const Bed=()=>{const frame=useCurrentFrame();const volume=lerp(frame,[0,21,690,730,1230,1280,1580,1650],[0,.22,.22,.105,.105,.22,.22,0]);return <Audio src={staticFile('boca-sama-55-2026_weight-of-memory_TEMP_MUSIC.mp3')} volume={volume}/>;};
export const MainReel=()=> <AbsoluteFill style={{background:C.ink}}>
 <Bed/>
 <Sequence from={0} durationInFrames={120}><SceneOne/></Sequence>
 <Sequence from={120} durationInFrames={180}><SceneTwo/></Sequence>
 <Sequence from={300} durationInFrames={210}><SceneThree/></Sequence>
 <Sequence from={510} durationInFrames={210}><SceneFour/></Sequence>
 <Sequence from={720} durationInFrames={300}><Testimony name="NANCY PAVÓN" seek={252} description="Sobreviviente · Testimonio conservado en archivo."/></Sequence>
 <Sequence from={1020} durationInFrames={270}><Testimony name="CARLOS ESCALANTE" seek={82} description="Sobreviviente · Entrevista en Boca de Samá."/></Sequence>
 <Sequence from={1290} durationInFrames={180}><SceneSeven/></Sequence>
 <Sequence from={1470} durationInFrames={180}><Last/></Sequence>
 </AbsoluteFill>;
