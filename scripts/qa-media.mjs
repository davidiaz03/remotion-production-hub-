import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {loadProject,parseArgs} from './lib.mjs';
import {sha256} from './verify-assets.mjs';
const {opts,pos}=parseArgs(process.argv.slice(2));const project=opts.project||pos[0];const {home,data}=loadProject(project);
const file=path.resolve(opts.file||'');if(!file.startsWith(path.join(home,'out')+path.sep)||!existsSync(file))throw Error('QA requires an MP4 inside project out/');
const mode=opts.mode||'quick';
const exec=(bin,args)=>{const r=spawnSync(bin,args,{encoding:'utf8',maxBuffer:12*1024*1024});if(r.error)throw r.error;return r};
const probe=exec('ffprobe',['-v','error','-count_frames','-show_entries','stream=codec_type,codec_name,width,height,avg_frame_rate,nb_read_frames,nb_frames','-show_entries','format=duration','-of','json',file]);
if(probe.status!==0)throw Error('FFprobe failed: '+probe.stderr);
const obj=JSON.parse(probe.stdout),vid=obj.streams?.find(s=>s.codec_type==='video'),aud=obj.streams?.find(s=>s.codec_type==='audio');
if(!vid)throw Error('Missing video stream');
const [n,d]=String(vid.avg_frame_rate||'0/1').split('/').map(Number),fps=n/d;
const expectedFrames=mode==='quick'?(()=>{
 if(!/^\d+-\d+$/.test(String(opts.frames)))throw Error('Quick QA requires --frames A-B');
 const [a,b]=opts.frames.split('-').map(Number);return b-a+1;})():data.durationInFrames;
const expectedWidth=data.width,expectedHeight=data.height;
const actualFrames=Number(vid.nb_read_frames||vid.nb_frames||0);
const failures=[];
if(vid.width!==expectedWidth||vid.height!==expectedHeight)failures.push(`Resolution ${vid.width}x${vid.height} != ${expectedWidth}x${expectedHeight}`);
if(Math.abs(fps-data.fps)>.015)failures.push(`fps ${fps} != ${data.fps}`);
if(actualFrames!==expectedFrames)failures.push(`Decoded frames ${actualFrames} != ${expectedFrames}`);
if(mode==='full'&&data.audioRequired&&!aud)failures.push('Expected audio is missing');
const decode=exec('ffmpeg',['-hide_banner','-v','error','-xerror','-i',file,'-f','null','-']);
if(decode.status!==0)failures.push(`Decode error ${decode.stderr.slice(0,500)}`);
const black=exec('ffmpeg',['-hide_banner','-i',file,'-vf','blackdetect=d=0.10:pix_th=0.10:pic_th=0.98','-an','-f','null','-']);
const blackIntervals=[...black.stderr.matchAll(/black_start:([\d.]+) black_end:([\d.]+) black_duration:([\d.]+)/g)].map(m=>({start:+m[1],end:+m[2],duration:+m[3]}));
const duration=Number(obj.format?.duration||0);
const expectedDurationSeconds=expectedFrames/data.fps;
const durationDriftSeconds=Math.abs(duration-expectedDurationSeconds);
if(!Number.isFinite(duration)||duration<=0||durationDriftSeconds>2/data.fps)
 failures.push(`Duration ${duration}s differs from expected ${expectedDurationSeconds}s by more than 2 frames`);
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
const report={engine:'remotion-required-at-render',project,mode,file:path.basename(file),sha256:await sha256(file),gitSha:process.env.SOURCE_SHA||process.env.GITHUB_SHA||'local',revision:process.env.RENDER_REVISION||'unversioned',packageLockSha256:createHash('sha256').update(readFileSync(path.resolve(home,'../../package-lock.json'))).digest('hex'),assetManifestSha256:createHash('sha256').update(readFileSync(path.join(home,data.assets.manifest))).digest('hex'),fps,width:vid.width,height:vid.height,actualFrames,expectedFrames,durationSeconds:duration,expectedDurationSeconds,durationDriftSeconds,hasAudio:!!aud,integratedLufs,truePeakDbtp,leadingSilenceSeconds,trailingSilenceSeconds,silenceIntervals,decodeOkay:decode.status===0,blackIntervals,technicalStatus:failures.length?'failed':'passed',visualStatus:'PENDING_HUMAN_REVIEW',warnings:blackIntervals.length?[`${blackIntervals.length} dark intervals: inspect contact sheet and actual playback`]:[],failures,contactSheet:existsSync(montage)?'contact-sheet.jpg':null};
writeFileSync(path.join(reports,'technical-qa.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
if(failures.length)process.exitCode=1;
