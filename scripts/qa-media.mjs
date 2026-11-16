import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {ROOT,loadProject,parseArgs} from './lib.mjs';
import {recordMilestone,statePath} from './state.mjs';
import {sha256} from './verify-assets.mjs';
const {opts,pos}=parseArgs(process.argv.slice(2));const project=opts.project||pos[0];const {home,data}=loadProject(project);
const file=path.resolve(opts.file||'');if(!file.startsWith(path.join(home,'out')+path.sep)||!existsSync(file))throw Error('QA requires an MP4 inside project out/');
const mode=opts.mode||'quick';
const exec=(bin,args)=>{const r=spawnSync(bin,args,{encoding:'utf8',maxBuffer:12*1024*1024});if(r.error)throw r.error;return r};
const probe=exec('ffprobe',['-v','error','-count_frames','-show_entries','stream=codec_type,codec_name,width,height,avg_frame_rate,nb_read_frames,nb_frames,duration','-show_entries','format=duration','-of','json',file]);
if(probe.status!==0)throw Error('FFprobe failed: '+probe.stderr);
const obj=JSON.parse(probe.stdout),vid=obj.streams?.find(s=>s.codec_type==='video'),aud=obj.streams?.find(s=>s.codec_type==='audio');
if(!vid)throw Error('Missing video stream');
const expectedFrames=mode==='quick'?(()=>{
 if(!/^\d+-\d+$/.test(String(opts.frames)))throw Error('Quick QA requires --frames A-B');
 const [a,b]=opts.frames.split('-').map(Number);return b-a+1;})():data.durationInFrames;
const expectedWidth=data.width,expectedHeight=data.height;
const actualFrames=Number(vid.nb_read_frames||vid.nb_frames||0);
// fps por fotogramas/duración del stream de video, NO por avg_frame_rate:
// en MP4 concatenados por tramos avg_frame_rate deriva (V1.3: 71950/2409
// = 29,867 aunque r_frame_rate es 30/1) y nb_frames/duración da lo mismo
// (1439/48,18 = 29,867), así que la tolerancia también se ensancha a
// ±0,5 fps: la deriva de timestamps del contenedor es real y el recuento
// exacto de fotogramas ya detecta renders truncados o a otra velocidad
// (24/25 fps quedan a 5-6 fps de distancia y siguen fallando).
const videoDurationSeconds=Number(vid.duration||0);
const fps=videoDurationSeconds>0?actualFrames/videoDurationSeconds:NaN;
const failures=[];
if(vid.width!==expectedWidth||vid.height!==expectedHeight)failures.push(`Resolution ${vid.width}x${vid.height} != ${expectedWidth}x${expectedHeight}`);
if(!Number.isFinite(fps)||Math.abs(fps-data.fps)>.5)failures.push(`fps ${fps} != ${data.fps} (nb_frames/duración del stream de video)`);
if(actualFrames!==expectedFrames)failures.push(`Decoded frames ${actualFrames} != ${expectedFrames}`);
if(mode==='full'&&data.audioRequired&&!aud)failures.push('Expected audio is missing: project.json says audioRequired=true but the file has no audio stream. If the project is deliberately mute, set "audioRequired": false in project.json (or create with --mute) and re-run QA; otherwise the render lost its audio');
const decode=exec('ffmpeg',['-hide_banner','-v','error','-xerror','-i',file,'-f','null','-']);
if(decode.status!==0)failures.push(`Decode error ${decode.stderr.slice(0,500)}`);
const black=exec('ffmpeg',['-hide_banner','-i',file,'-vf','blackdetect=d=0.10:pix_th=0.10:pic_th=0.98','-an','-f','null','-']);
const blackIntervals=[...black.stderr.matchAll(/black_start:([\d.]+) black_end:([\d.]+) black_duration:([\d.]+)/g)].map(m=>({start:+m[1],end:+m[2],duration:+m[3]}));
const duration=Number(obj.format?.duration||0);
const expectedDurationSeconds=expectedFrames/data.fps;
const durationDriftSeconds=Math.abs(duration-expectedDurationSeconds);
// Tolerancia 0,5 s (no 2 fotogramas): la duración del contenedor deriva
// en másteres reales — V1.3: +0,227 s, descompuesto en estiramiento de
// timestamps del video por concatenación por tramos (+0,213 s: último pts
// 48,147 en vez de 47,933) + priming AAC (~0,014 s: el audio se extiende
// 48,194 frente a 48,18 del video). El recuento exacto de fotogramas ya
// detecta renders truncados; esta comprobación es solo cordura.
if(!Number.isFinite(duration)||duration<=0||durationDriftSeconds>0.5)
 failures.push(`Duration ${duration}s differs from expected ${expectedDurationSeconds}s by more than 0.5s`);
// Gate de sonoridad (solo modo full: en un rango de fotogramas la sonoridad
// no significa nada). Calibrado con másteres REALES, no con el -16 teórico:
// V1.3 -14,28 LUFS / -1,99 dBTP; V1.2 -14,02 / -1,76; referente Maxi Rubio
// -14,33 LUFS. Un gate en -16 rechazaría nuestro mejor máster (auditoría R4).
let integratedLufs=null,truePeakDbtp=null,leadingSilenceSeconds=0,trailingSilenceSeconds=0;const silenceIntervals=[];
if(mode==='full'&&aud){
 const loud=exec('ffmpeg',['-hide_banner','-nostats','-i',file,'-af','ebur128=peak=true','-f','null','-']);
 const summ=loud.stderr.slice(loud.stderr.lastIndexOf('Summary:'));
 const num=(k)=>{const m=summ.match(new RegExp(k+'\\s*:\\s*([-+\\d.]+)'));return m?+m[1]:null};
 integratedLufs=num('I');truePeakDbtp=num('Peak');
 if(integratedLufs===null||truePeakDbtp===null)failures.push('Loudness measurement failed (ebur128)');
 else{
  if(integratedLufs<-16.5||integratedLufs>-12)failures.push(`Integrated loudness ${integratedLufs} LUFS outside [-16.5, -12] (masters reales: -14,28 V1.3, -14,02 V1.2)`);
  if(truePeakDbtp>-1)failures.push(`True peak ${truePeakDbtp} dBTP above -1 dBTP`);
 }
 const sil=exec('ffmpeg',['-hide_banner','-nostats','-i',file,'-af','silencedetect=noise=-50dB:d=0.5','-f','null','-']);
 for(const m of sil.stderr.matchAll(/silence_start: ([\d.]+)[\s\S]*?silence_end: ([\d.]+) \| silence_duration: ([\d.]+)/g))silenceIntervals.push({start:+m[1],end:+m[2],duration:+m[3]});
 const lead=silenceIntervals.find(s=>s.start<0.1);if(lead)leadingSilenceSeconds=lead.duration;
 const trail=[...silenceIntervals].reverse().find(s=>Math.abs(s.end-duration)<0.1);if(trail)trailingSilenceSeconds=trail.duration;
 if(leadingSilenceSeconds>0.5)failures.push(`Leading silence ${leadingSilenceSeconds}s > 0.5s (el gancho debe arrancar a pleno nivel)`);
 if(trailingSilenceSeconds>1)failures.push(`Trailing silence ${trailingSilenceSeconds}s > 1s`);
}
const reports=path.join(home,'reports');mkdirSync(reports,{recursive:true});
const montage=path.join(reports,'contact-sheet.jpg');
const fpsSampling=(9/Math.max(.5,duration)).toFixed(4);
const contact=exec('ffmpeg',['-y','-hide_banner','-loglevel','error','-i',file,'-vf',`fps=${fpsSampling},scale=200:-2,tile=3x3`,'-frames:v','1',montage]);
if(contact.status!==0)failures.push('Contact sheet generation failed: '+contact.stderr.slice(0,200));
// El manifiesto de assets puede no existir (motion-demo no lo tiene):
// sin esta guarda el QA se caía con ENOENT después de hacer todas las
// comprobaciones. Falta de manifiesto = aviso, no fallo: es un hash de
// procedencia, no una comprobación del medio.
const manifestPath=path.join(home,data.assets?.manifest||'asset-manifest.json');
const assetManifestSha256=existsSync(manifestPath)?createHash('sha256').update(readFileSync(manifestPath)).digest('hex'):null;
const warnings=[...(blackIntervals.length?[`${blackIntervals.length} dark intervals: inspect contact sheet and actual playback`]:[]),...(!assetManifestSha256?[`Asset manifest missing: ${data.assets?.manifest||'asset-manifest.json'} (provenance hash unavailable)`]:[])];
// Registro en STATE.json (solo modo full: un QA quick sobre un rango
// de fotogramas no marca la fase qa). Si no hay STATE.json (proyectos
// viejos/demo), el informe lo declara y se imprime el comando manual
// en stderr; stdout sigue siendo solo el JSON del informe.
const qaStatus=failures.length?'failed':'passed';
let stateRecorded={recorded:false,reason:''};
if(mode!=='full'){
 stateRecorded={recorded:false,reason:'modo quick: solo full marca la fase qa'};
}else if(!existsSync(statePath(ROOT,project))){
 stateRecorded={recorded:false,reason:'sin STATE.json en el proyecto'};
 console.error(`STATE: sin STATE.json — marca manual: node scripts/state.mjs ${project} phase qa ${qaStatus==='passed'?'done':'failed'} --artifact reports/technical-qa.json --artifact out/${path.basename(file)}`);
}else{
 try{
  const note=integratedLufs!==null?`${integratedLufs} LUFS, TP ${truePeakDbtp} dBTP`:(aud?'con audio (sin medición)':'sin audio (proyecto mudo)');
  recordMilestone(ROOT,project,'qa',`QA técnico ${qaStatus} — ${path.basename(file)}`,{artifacts:['reports/technical-qa.json',`out/${path.basename(file)}`],status:qaStatus==='passed'?'done':'failed',note});
  stateRecorded={recorded:true,status:qaStatus==='passed'?'done':'failed'};
 }catch(e){
  stateRecorded={recorded:false,reason:`no se pudo registrar: ${e.message}`};
  console.error(`STATE: registro fallido (${e.message}) — marca manual: node scripts/state.mjs ${project} phase qa ${qaStatus==='passed'?'done':'failed'} --artifact reports/technical-qa.json --artifact out/${path.basename(file)}`);
 }
}
const report={engine:'remotion-required-at-render',project,mode,file:path.basename(file),sha256:await sha256(file),gitSha:process.env.SOURCE_SHA||process.env.GITHUB_SHA||'local',revision:process.env.RENDER_REVISION||'unversioned',packageLockSha256:createHash('sha256').update(readFileSync(path.resolve(home,'../../package-lock.json'))).digest('hex'),assetManifestSha256,fps,width:vid.width,height:vid.height,actualFrames,expectedFrames,durationSeconds:duration,expectedDurationSeconds,durationDriftSeconds,hasAudio:!!aud,integratedLufs,truePeakDbtp,leadingSilenceSeconds,trailingSilenceSeconds,silenceIntervals,decodeOkay:decode.status===0,blackIntervals,technicalStatus:failures.length?'failed':'passed',visualStatus:'PENDING_HUMAN_REVIEW',warnings,failures,contactSheet:existsSync(montage)?'contact-sheet.jpg':null,stateRecorded};
writeFileSync(path.join(reports,'technical-qa.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
if(failures.length)process.exitCode=1;
