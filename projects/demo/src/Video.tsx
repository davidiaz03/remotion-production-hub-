import React from 'react';
import {AbsoluteFill,interpolate,useCurrentFrame} from 'remotion';
import {AnimatedTitle} from '../../../shared/AnimatedTitle';
import {Caption} from '../../../shared/Caption';
export const MainReel:React.FC=()=>{
  const f=useCurrentFrame();const fade=interpolate(f,[0,10,78,89],[0,1,1,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  return <AbsoluteFill style={{background:'linear-gradient(160deg,#132238,#325479)',justifyContent:'center',padding:74,boxSizing:'border-box',opacity:fade}}>
    <AnimatedTitle text="DEMO · EDICIÓN PERSISTENTE" delay={6}/>
    <Caption text="Tu nuevo proyecto, con el mismo motor de Remotion." size={43}/>
  </AbsoluteFill>;
};

// Prueba de guardado automatico desde Android.
