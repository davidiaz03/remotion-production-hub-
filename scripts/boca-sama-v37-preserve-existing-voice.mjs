/**
 * V37. Preserve exactly the previously generated temporary HeyGen WAV.
 * Does NOT synthesize speech, use paid APIs or touch witnesses' audio.
 * Never overwrite Drive. Requires configured rclone remote "media".
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawnSync,spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
const video=fs.readFileSync('projects/boca-sama-55-2026/src/Video.tsx','utf8');
const match=video.match(/const interimNarrationUrl='([^']+\.wav)'/);
if(!match)throw Error('No original preview URL found');
const u=new URL(match[1]);
if(u.protocol!=='https:'||u.hostname!=='resource2.heygen.ai'||!u.pathname.startsWith('/text_to_speech/'))throw Error('Unexpected speech host');
if(!process.env.RCLONE_CONFIG_B64)throw Error('Drive authorization unavailable, will not download without persistence');
const destination='media:Remotion Production/projects/boca-sama-55-2026/assets/boca-sama-v34-existing-heygen-serena-UNVERIFIED.wav';
const tempDir=fs.mkdtempSync(path.join(process.env.RUNNER_TEMP||os.tmpdir(),'boca-sama-v37-'));
const wav=path.join(tempDir,'existing-voice.wav');
const run=(bin,args,env)=>{const r=spawnSync(bin,args,{encoding:'utf8',maxBuffer:2e6,env:env||process.env});if(r.status!==0||r.error)throw Error(bin+' failed: '+String(r.stderr||r.error||r.status).slice(-450));return r.stdout.trim();};
const checksum=buf=>createHash('sha256').update(buf).digest('hex');
const hashRemote=remote=>new Promise((resolve,reject)=>{
 const proc=spawn('rclone',['cat',remote,'--log-level','ERROR'],{stdio:['ignore','pipe','pipe']});
 const hash=createHash('sha256');let stderr='';
 proc.stdout.on('data',d=>hash.update(d));
 proc.stderr.on('data',d=>stderr+=String(d).slice(0,300));
 proc.on('error',reject);
 proc.on('close',code=>code===0?resolve(hash.digest('hex')):reject(Error('Cannot verify Drive SHA: '+stderr)));
});
try {
 const existing=spawnSync('rclone',['lsjson',destination,'--log-level','ERROR'],{encoding:'utf8'});
 if(existing.status===0)throw Error('Drive target already exists; refusing to overwrite or replace');
 run('curl',['--fail','--location','--silent','--show-error','--retry','2','--connect-timeout','15','--max-time','90',u.href,'--output',wav]);
 const buf=fs.readFileSync(wav);
 if(buf.length<20000||buf.length>15e6)throw Error('Suspicious WAV file length '+buf.length);
 const probe=JSON.parse(run('ffprobe',['-v','error','-show_format','-show_streams','-of','json',wav]));
 const stream=probe.streams?.find(x=>x.codec_type==='audio');
 const seconds=Number(probe.format?.duration);
 if(!stream||!stream.codec_name.startsWith('pcm_')||!(seconds>12&&seconds<20))throw Error('Generated audio is not expected 15s WAV');
 const sha=checksum(buf);
 run('rclone',['copyto',wav,destination,'--retries','2','--transfers','1','--log-level','ERROR']);
 const remoteSha=await hashRemote(destination);
 if(remoteSha!==sha)throw Error('Remote file hash mismatch. Do NOT use for editing.');
 console.log(JSON.stringify({status:'DRIVE_WAV_BACKED_UP_VERIFIED',path:destination,bytes:buf.length,sha256:sha,seconds,audioCodec:stream.codec_name}));
}finally{
 fs.rmSync(tempDir,{recursive:true,force:true});
}
