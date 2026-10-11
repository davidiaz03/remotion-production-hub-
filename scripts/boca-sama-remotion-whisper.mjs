/**
 * Offline Whisper.cpp -> Remotion captions, only for the two SHA-pinned survivor interviews.
 * No publication, no editing of originals or auto-enabling of video subtitles.
 * Run from the manual GitHub workflow on a fixed, authorized source manifest.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {installWhisperCpp,downloadWhisperModel,transcribe,toCaptions} from '@remotion/install-whisper-cpp';

const root=process.cwd();
const sourceProject=path.join(root,'projects','boca-sama-55-2026');
const manifest=JSON.parse(fs.readFileSync(path.join(sourceProject,'asset-manifest.json'),'utf8'));
const sources={
  nancy:{
    file:'00_MATERIALES_PARA_EDICION/Entrevista-_Nancy_Pavón,_superviviente_de_atentado_terrorista_en_Boca_de_Samá__Cuba_(360p).mp4',
    sourceIn:50, seconds:25, reelStartMs:24000, selectedStart:49.833333, selectedEnd:55.133333,
    speaker:'Nancy Pavón',
  },
  carlos:{
    file:'00_MATERIALES_PARA_EDICION/Entrevista__Carlos_Escalante,_superviviente_de_ataque_terrorista_en_Boca_de_Samá(360p).mp4',
    sourceIn:200, seconds:25, reelStartMs:34000, selectedStart:203.633333, selectedEnd:212.033333,
    speaker:'Carlos Escalante',
  },
};
const selected=process.env.WITNESS??'both';
if(!['both','nancy','carlos'].includes(selected))throw Error('Unsafe witness choice');
const model=process.env.WHISPER_MODEL??'base';
if(!['base','small'].includes(model))throw Error('Unsupported multilingual model');
const output=process.env.OUTPUT_DIR??path.join(root,'.tmp','boca-sama-asr-results');
const work=process.env.RUNNER_TEMP??fs.mkdtempSync(path.join(os.tmpdir(),'boca-sama-asr-'));
fs.mkdirSync(output,{recursive:true});
const run=(command,args)=>{
  const r=spawnSync(command,args,{stdio:'inherit',encoding:'utf8',timeout:240000});
  if(r.error||r.status!==0)throw Error(command+' failed, exit code '+r.status);
};
const sha256=p=>{
  const h=crypto.createHash('sha256');h.update(fs.readFileSync(p));return h.digest('hex');
};
const entries=selected==='both'?Object.entries(sources):[[selected,sources[selected]]];
const whisperPath=path.join(work,'whisper.cpp');
await installWhisperCpp({to:whisperPath,version:'1.5.5'});
await downloadWhisperModel({model,folder:whisperPath,printOutput:false});
for(const [key,s] of entries){
  const entry=manifest.files.find(x=>x.path===s.file);
  if(!entry)throw Error('Source missing from approved manifest: '+key);
  const original=path.join(work,key+'-original.mp4');
  const audio=path.join(work,key+'-clip.wav');
  // Only copy this known exact path. Do not sync every media file or expose OAuth token in logs.
  const remote='media:Remotion Production/projects/boca-sama-55-2026/assets/'+s.file;
  run('rclone',['copyto',remote,original,'--retries','2','--transfers','1','--log-level','ERROR']);
  if(fs.statSync(original).size!==entry.bytes||sha256(original)!==entry.sha256)
    throw Error('SHA256/size mismatch for '+key+'; refusing transcription');
  run('ffmpeg',['-nostdin','-hide_banner','-loglevel','error','-y','-i',original,
    '-ss',String(s.sourceIn),'-t',String(s.seconds),'-map','0:a:0','-vn',
    '-ac','1','-ar','16000','-c:a','pcm_s16le',audio]);
  const whisperCppOutput=await transcribe({
    inputPath:audio,whisperPath,whisperCppVersion:'1.5.5',model,
    language:'es',tokenLevelTimestamps:true,printOutput:false,
  });
  const {captions}=toCaptions({whisperCppOutput});
  const result={
    status:'AUTOMATIC_UNVERIFIED_NOT_FOR_PUBLICATION',speaker:s.speaker,model,
    sourceFile:s.file,sourceSha256:entry.sha256,
    sourceOffsetMs:s.sourceIn*1000,
    selectedAudioSourceStartMs:Math.round(s.selectedStart*1000),
    selectedAudioSourceEndMs:Math.round(s.selectedEnd*1000),
    reelSceneStartMs:s.reelStartMs,
    captions:captions.map(c=>{
      const sourceStartMs=c.startMs+s.sourceIn*1000;
      const sourceEndMs=c.endMs+s.sourceIn*1000;
      const insideSelected=sourceStartMs>=s.selectedStart*1000&&sourceEndMs<=s.selectedEnd*1000;
      return {...c,verified:false,
        sourceStartMs,sourceEndMs,
        reelStartMs:insideSelected?Math.round(s.reelStartMs+(sourceStartMs-s.selectedStart*1000)):null,
        reelEndMs:insideSelected?Math.round(s.reelStartMs+(sourceEndMs-s.selectedStart*1000)):null};
    }),
    warning:'Word boundaries and transcription may be wrong. Listen and check against original; never auto-publish.'
  };
  fs.writeFileSync(path.join(output,key+'-UNVERIFIED-remotion-caption.json'),JSON.stringify(result,null,2)+'\n');
  // Original clip and extracted sound must not be retained in the GitHub artifact.
  fs.rmSync(original,{force:true});
  fs.rmSync(audio,{force:true});
  console.log(key+': '+captions.length+' unverified caption tokens (text intentionally hidden)');
}
fs.writeFileSync(path.join(output,'README.txt'),
 'Automatic draft from original-source Whisper.cpp Spanish. NOT VERIFIED. NOT FOR PUBLICATION.\n'+
 'Check each speaker word and time against full interview and user Gemini transcript.\n'+
 'All exported caption items carry verified:false; never enable automatically.\n');
