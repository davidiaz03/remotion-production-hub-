import {readFileSync,statSync,createReadStream,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {loadProject,resolvePublicFile,parseArgs} from './lib.mjs';
export async function sha256(file){return new Promise((ok,err)=>{const hash=createHash('sha256');const rs=createReadStream(file);rs.on('data',b=>hash.update(b));rs.on('error',err);rs.on('end',()=>ok(hash.digest('hex')));});}
export async function verifyAssetFiles(id){
 const {home,data}=loadProject(id),m=JSON.parse(readFileSync(path.join(home,data.assets.manifest),'utf8'));
 const bad=[];for(const e of m.files){
  const f=resolvePublicFile(home,e.path);
  if(!existsSync(f)){bad.push({file:e.path,error:'MISSING'});continue;}
  if(statSync(f).size!==e.bytes){bad.push({file:e.path,error:'SIZE'});continue;}
  if(await sha256(f)!==e.sha256){bad.push({file:e.path,error:'SHA256'});continue;}
 }
 if(bad.length)throw Error(`Asset verification failed for ${id}: ${JSON.stringify(bad)}`);
 return {project:id,files:m.files.length,verified:true};
}
if(process.argv[1]?.endsWith('verify-assets.mjs')){
 const {opts,pos}=parseArgs(process.argv.slice(2));console.log(JSON.stringify(await verifyAssetFiles(opts.project||pos[0])));
}
