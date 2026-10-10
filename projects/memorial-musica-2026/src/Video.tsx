import React from 'react';
import {AbsoluteFill, Audio, Freeze, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';

/**
 * Finishing no destructivo. El MP4 original y la musica residen en Drive;
 * al sincronizarlos mediante el manifiesto, Studio y Actions usarán
 * EXACTAMENTE los mismos materiales, sin reconstruir el video plano.
 *
 * Curva musical de referencia muestreada cada 0,5 segundos a partir de
 * una mezcla piloto con ducking guiado por el nivel del audio original.
 * El archivo de muestra final FFmpeg y el render nativo Remotion se
 * auditan por separado; no se afirma que sean identicos al nivel de audio.
 */
export const MUSIC_GAIN_HALF_SECOND: readonly number[] = [
  0.1419, 0.1485, 0.1567, 0.163, 0.171, 0.1797, 0.19, 0.2002, 0.2085, 0.2245, 0.2507, 0.2627, 0.2509, 0.2367,
  0.2297, 0.2254, 0.2204, 0.2194, 0.2228, 0.2217, 0.221, 0.2263, 0.2319, 0.236, 0.2392, 0.2361, 0.2253, 0.2137,
  0.2055, 0.2065, 0.2162, 0.2216, 0.2153, 0.2068, 0.2132, 0.233, 0.2408, 0.2264, 0.2173, 0.2232, 0.223, 0.2145,
  0.2171, 0.2238, 0.216, 0.2168, 0.2571, 0.3133, 0.3294, 0.2893, 0.2369, 0.2122, 0.2111, 0.2208, 0.2304, 0.2269,
  0.2181, 0.22, 0.232, 0.2449, 0.2435, 0.228, 0.2188, 0.223, 0.2325, 0.2335, 0.2234, 0.2108, 0.2057, 0.2086,
  0.2118, 0.2134, 0.2207, 0.2384, 0.2485, 0.2311, 0.2064, 0.192, 0.1834, 0.1791, 0.1804, 0.1849, 0.188, 0.1821,
  0.1683, 0.1622, 0.1664, 0.1684, 0.1641, 0.1603, 0.1601, 0.1631, 0.1676, 0.1738, 0.1802, 0.1798, 0.175, 0.1764,
  0.1835, 0.1835, 0.1745, 0.1691, 0.1701, 0.1727, 0.1751, 0.1759, 0.1744, 0.1758, 0.1872, 0.2018, 0.2001, 0.1853,
  0.1787, 0.1819, 0.1843, 0.1852, 0.1923, 0.2074, 0.2195, 0.2162, 0.2021, 0.1927, 0.1945, 0.2046, 0.2171, 0.23,
  0.2387, 0.2328, 0.2212, 0.2262, 0.2508, 0.2696, 0.2639, 0.2523, 0.2486, 0.2464, 0.246, 0.2527, 0.261, 0.2605,
  0.2489, 0.2419, 0.2441, 0.2433, 0.2613, 0.299, 0.2959, 0.2541, 0.2324, 0.2275, 0.2182, 0.2154, 0.2276, 0.2684,
  0.3374, 0.3933, 0.4128, 0.4153, 0.4148, 0.4048, 0.3855, 0.2846, 0.193, 0.1104, 0.0363, 0, 0,
];

const musicGain=(frame:number)=>{
  const index=Math.max(0,frame)/15;
  const lo=Math.min(Math.floor(index),MUSIC_GAIN_HALF_SECOND.length-1);
  const hi=Math.min(lo+1,MUSIC_GAIN_HALF_SECOND.length-1);
  const t=index-lo;
  return MUSIC_GAIN_HALF_SECOND[lo]*(1-t)+MUSIC_GAIN_HALF_SECOND[hi]*t;
};

type Patch={from:number;duration:number;still:number;inFrames:number;outFrames:number;reason:string};
export const VISUAL_PATCHES:readonly Patch[]=[
  {from:1116,duration:20,still:1114,inFrames:3,outFrames:9,reason:'destello blanco ~37.3 s'},
  {from:1515,duration:18,still:1514,inFrames:3,outFrames:9,reason:'destello blanco ~50.6 s'},
  {from:1890,duration:21,still:1889,inFrames:3,outFrames:11,reason:'destello blanco ~63.1 s'},
  {from:1910,duration:40,still:1960,inFrames:7,outFrames:10,reason:'letras rojas gigantes tapan texto ~64 s'},
  {from:2160,duration:20,still:2159,inFrames:3,outFrames:10,reason:'destello blanco ~72.1 s'},
];
const media=staticFile('memorial.mp4');
const MusicOnlyVideo:React.FC=()=> <OffthreadVideo src={media} muted style={{width:'100%',height:'100%',objectFit:'contain'}}/>;
const PatchOverlay:React.FC<{patch:Patch}>=({patch})=>{
 const local=useCurrentFrame();
 const fadeIn=Math.min(1,local/patch.inFrames);
 const fadeOut=Math.min(1,(patch.duration-1-local)/patch.outFrames);
 const opacity=Math.max(0,Math.min(fadeIn,fadeOut));
 return <AbsoluteFill style={{opacity,pointerEvents:'none'}}>
  <Freeze frame={patch.still}><MusicOnlyVideo/></Freeze>
 </AbsoluteFill>;
};
export const MainReel:React.FC=()=>{
 return <AbsoluteFill style={{backgroundColor:'#000'}}>
  <MusicOnlyVideo/>
  {VISUAL_PATCHES.map((patch)=>(
    <Sequence key={patch.from} from={patch.from} durationInFrames={patch.duration}>
      <PatchOverlay patch={patch}/>
    </Sequence>
  ))}
  {/* Se conserva el audio del MP4 original (voz y efectos). */}
  <Audio src={media} volume={0.80}/>
  {/* Banda sonora original creada para la obra, sin voz adicional. */}
  <Audio src={staticFile('music.mp3')} volume={musicGain}/>
 </AbsoluteFill>;
};
