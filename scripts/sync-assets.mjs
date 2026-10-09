import {readFileSync,existsSync,mkdirSync,mkdtempSync,rmSync,readdirSync,cpSync} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {loadProject,parseArgs,run,assertDrivePath,resolvePublicFile,initDirectory} from './lib.mjs';
import {sha256,verifyAssetFiles} from './verify-assets.mjs';
const {opts,pos}=parseArgs(process.argv.slice(2));const id=opts.project||pos[0];
const {home,data}=loadProject(id),cfg=data.assets;
const manifest=JSON.parse(readFileSync(path.join(home,cfg.manifest),'utf8'));
const equal=async e=>{const f=resolvePublicFile(home,e.path);return existsSync(f)&&(await sha256(f))===e.sha256};
const missing=[];for(const e of manifest.files)if(!await equal(e))missing.push(e);
if(missing.length===0){console.log(JSON.stringify({project:id,alreadyVerified:manifest.files.length}));process.exit(0)}
if(!process.env.RCLONE_CONFIG&&!process.env.RCLONE_CONFIG_B64&&!existsSync(path.join(os.homedir(),'.config/rclone/rclone.conf')))
 throw Error('Assets absent and no Rclone configuration. See docs/DRIVE.md');
const source=assertDrivePath(cfg.sourceDrivePath||data.drivePath);
const remote=p=>`media:${source}/${p}`;
if(cfg.mode==='manifest'){
 for(const e of missing){
  const dest=initDirectory(resolvePublicFile(home,e.path));
  run('rclone',['copyto',remote(`assets/${e.path}`),dest,'--transfers','2','--checkers','2','--retries','2']);
  if(!await equal(e))throw Error('SHA256 mismatch after sync: '+e.path);
 }
}else if(cfg.mode==='archives'){
 const temp=mkdtempSync(path.join(os.tmpdir(),`remotion-${id}-`));
 try{
  for(const zip of [...cfg.archives,...(cfg.patchArchive?[cfg.patchArchive]:[])]){
   if(!/^[A-Za-z0-9_.-]+\.zip$/.test(zip))throw Error('Unsafe ZIP name');
   const archive=path.join(temp,zip);
   run('rclone',['copyto',remote(zip),archive,'--retries','2']);
   // Explicit path validation prevents zip-slip and overwrites outside the project.
   const {spawnSync}=await import('node:child_process');
   const listing=spawnSync('unzip',['-Z1',archive],{encoding:'utf8'});
   if(listing.status!==0)throw Error(`Corrupt ZIP: ${zip}`);
   for(const entry of listing.stdout.trim().split('\n')){
    if(!entry.startsWith('public/')||entry.includes('\\')||entry.split('/').some(p=>p==='..'||p==='.')||entry.startsWith('/'))
     throw Error(`Unsafe ZIP entry in ${zip}: ${entry}`);
   }
   run('unzip',['-oq',archive,'-d',home]);
  }
 }finally{rmSync(temp,{recursive:true,force:true})}
}else throw Error(`Unsupported asset mode: ${cfg.mode}`);
console.log(JSON.stringify(await verifyAssetFiles(id)));
