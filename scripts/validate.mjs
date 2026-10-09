import {readFileSync,readdirSync,existsSync} from 'node:fs';
import path from 'node:path';
import {ROOT,projectPath,loadProject,parseArgs,assertDrivePath,resolvePublicFile} from './lib.mjs';
export function validateProject(id){
 const {home,data}=loadProject(id);const errors=[];
 const positiveInt=x=>Number.isSafeInteger(x)&&x>0;
 if(!/^[A-Za-z][A-Za-z0-9_]*$/.test(data.compositionId??''))errors.push('Invalid compositionId');
 for(const k of ['fps','width','height','durationInFrames'])if(!positiveInt(data[k]))errors.push(`Invalid ${k}`);
 if(data.width%2||data.height%2)errors.push('H264 requires even width and height');
 if(typeof data.audioRequired!=='boolean')errors.push('audioRequired must be boolean');
 try{assertDrivePath(data.drivePath)}catch(e){errors.push(e.message)}
 for(const f of ['src/index.ts','src/Root.tsx','src/Video.tsx'])if(!existsSync(path.join(home,f)))errors.push(`Missing ${f}`);
 if(data.assets?.mode!=='archives'&&data.assets?.mode!=='manifest')errors.push('Unsupported asset mode');
 if(data.assets?.mode==='archives'&&(!Array.isArray(data.assets.archives)||!data.assets.archives.length))errors.push('archives mode must list ZIPs');
 if(data.assets?.mode==='archives'&&data.assets.patchRequired&&!data.assets.patchArchive)errors.push('Missing patchArchive');
 const mf=path.join(home,data.assets?.manifest||'asset-manifest.json');
 if(!existsSync(mf))errors.push('Missing asset manifest');
 else{
  try{
   const m=JSON.parse(readFileSync(mf,'utf8'));
   if(!Array.isArray(m.files))errors.push('asset manifest must contain files[]');
   else{const seen=new Set();for(const file of m.files){
    try{resolvePublicFile(home,file.path)}catch(e){errors.push(e.message)}
    if(seen.has(file.path))errors.push('Duplicate asset '+file.path);seen.add(file.path);
    if(!/^[a-f0-9]{64}$/.test(file.sha256??''))errors.push('Missing valid sha256 for '+file.path);
    if(!Number.isSafeInteger(file.bytes)||file.bytes<0)errors.push('Invalid bytes '+file.path);
   }}
  }catch(e){errors.push(`Bad asset manifest: ${e.message}`)}
 }
 if(errors.length)throw Error(`Project ${id}: ${errors.join('; ')}`);
 return {id,frames:data.durationInFrames,fps:data.fps,durationSeconds:data.durationInFrames/data.fps,assets:JSON.parse(readFileSync(mf,'utf8')).files.length};
}
if(process.argv[1]?.endsWith('validate.mjs')){
 const {pos,opts}=parseArgs(process.argv.slice(2));
 const ids=opts.all?readdirSync(path.join(ROOT,'projects')).filter(s=>existsSync(path.join(ROOT,'projects',s,'project.json'))):[opts.project||pos[0]];
 if(!ids[0])throw Error('Supply --all or --project SLUG');
 for(const id of ids)console.log(JSON.stringify(validateProject(id)));
}
