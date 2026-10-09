import {readFileSync,existsSync,mkdirSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
export const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const SLUG_RE=/^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;
export function projectPath(slug){
 if(!SLUG_RE.test(slug??''))throw Error('Invalid project ID: lowercase letters, digits and hyphens only');
 return path.join(ROOT,'projects',slug);
}
export function loadProject(slug){
 const home=projectPath(slug),file=path.join(home,'project.json');
 if(!existsSync(file))throw Error(`Unknown project: ${slug}`);
 const data=JSON.parse(readFileSync(file,'utf8'));
 if(data.id!==slug)throw Error('project.json id does not match directory');
 return {home,data};
}
export function requireFile(p){if(!existsSync(p))throw Error(`Missing required file: ${p}`);return p;}
export function run(cmd,args,options={}){
 const r=spawnSync(cmd,args,{cwd:ROOT,stdio:'inherit',encoding:'utf8',...options});
 if(r.error)throw r.error;
 if(r.status!==0)throw Error(`${cmd} failed (exit code ${r.status ?? 'signal'})`);
 return r;
}
export function parseArgs(argv){
 const pos=[],opts={};for(let i=0;i<argv.length;i++){
  const t=argv[i];if(!t.startsWith('--')){pos.push(t);continue;}
  const [k,v]=t.slice(2).split('=',2);if(v!==undefined){opts[k]=v;continue;}
  if(i+1<argv.length&&!argv[i+1].startsWith('--')){opts[k]=argv[++i];}else opts[k]=true;
 }
 return {pos,opts};
}
export function resolvePublicFile(home,p){
 if(typeof p!=='string'||!p||p.startsWith('/')||p.includes('\\')||p.split('/').some(s=>s==='..'||s==='.'||!s))throw Error(`Unsafe asset path: ${p}`);
 const base=path.join(home,'public');const dst=path.resolve(base,p);
 if(!dst.startsWith(base+path.sep))throw Error('Asset escapes public directory');
 return dst;
}
export function initDirectory(file){mkdirSync(path.dirname(file),{recursive:true});return file;}
export function assertDrivePath(p){
 if(typeof p!=='string'||!p||p.startsWith('/')||p.includes('\\')||p.split('/').some(s=>s==='..'||s===''))throw Error('Invalid Drive folder path');
 return p;
}
