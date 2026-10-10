import {readdirSync,existsSync,rmSync,statSync,lstatSync} from 'node:fs';
import path from 'node:path';
import {ROOT,parseArgs,SLUG_RE} from './lib.mjs';
const {opts}=parseArgs(process.argv.slice(2));
const execute=opts.execute===true;
const slug=opts.project;
if(slug!==undefined&&(typeof slug!=='string'||!SLUG_RE.test(slug)))throw Error('Invalid --project slug');
if(execute&&!slug)throw Error('Execution requires explicit --project ID; global deletion forbidden.');
if(opts.reports===true&&!slug)throw Error('--reports requires explicit --project');
const root=path.join(ROOT,'projects');
const projects=slug?[slug]:readdirSync(root).filter(s=>SLUG_RE.test(s));
const targets=[];
for(const id of projects){
 const home=path.join(root,id);
 if(!existsSync(home))throw Error('Unknown project: '+id);
 if(!lstatSync(home).isDirectory())throw Error('Project directory is not a real directory: '+id);
 targets.push(path.join(home,'out'));
 if(opts.reports===true)targets.push(path.join(home,'reports'));
}
// Only project-local disposable outputs. Never touch public/, Git, worktrees,
// snapshots, approvals, any Drive remote, shared caches or original media.
for(const target of targets){
 const relative=path.relative(ROOT,target).replaceAll(path.sep,'/');
 if(!/^projects\/[a-z0-9-]+\/(?:out|reports)$/.test(relative))throw Error('Unsafe cleanup target');
 if(!existsSync(target))continue;
 if(lstatSync(target).isSymbolicLink())throw Error('Refusing symlink cleanup target');
 console.log((execute?'DELETE ':'DRY-RUN ')+relative);
 if(execute)rmSync(target,{recursive:true,force:true});
}
