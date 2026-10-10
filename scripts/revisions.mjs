/**
 * Remotion Production Hub: persistent, non-destructive project checkpoints.
 * Snapshots reference an existing clean Git commit; approvals are separate
 * records committed later. No command triggers a render or uploads media.
 */
import {createHash} from 'node:crypto';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {ROOT,loadProject,parseArgs,projectPath} from './lib.mjs';

const REV_RE=/^[a-z0-9][a-z0-9-]{0,62}$/;
const SHA_RE=/^[a-f0-9]{40}$/;
const sha256=b=>createHash('sha256').update(b).digest('hex');
const readJSON=p=>JSON.parse(readFileSync(p,'utf8'));
const writeJSON=(p,v)=>{mkdirSync(path.dirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});};
const git=(args,{buffer=false}={})=>{
 const r=spawnSync('git',args,{cwd:ROOT,encoding:buffer?null:'utf8',maxBuffer:20*1024*1024});
 if(r.error||r.status!==0)throw Error(`git ${args[0]} failed: ${String(r.stderr||r.error).slice(0,450)}`);
 return buffer?r.stdout:r.stdout.trim();
};
function clean(){if(git(['status','--porcelain','--untracked-files=normal']))throw Error('Commit or stash all project changes before recording a snapshot/approval');}
function pathsFor(project,commit){
 const names=git(['ls-tree','-r','--name-only',commit]).split('\n').filter(Boolean);
 const prefix=`projects/${project}/`;
 return names.filter(p=>['package-lock.json','package.json','.npmrc','.devcontainer/devcontainer.json'].includes(p)||p.startsWith('shared/')||p.startsWith('scripts/')||(p.startsWith(prefix)&&!p.startsWith(prefix+'revisions/')&&!p.startsWith(prefix+'approvals/')&&!['STATE.json','HANDOFF.md'].includes(p.slice(prefix.length))));
}
function gitBytes(commit,p){return git(['show',`${commit}:${p}`],{buffer:true});}
function sourceInventory(project,commit){
 if(!SHA_RE.test(commit))throw Error('Expected 40-character source commit SHA');
 const tree=git(['rev-parse',`${commit}^{tree}`]);
 const paths=pathsFor(project,commit);
 for(const required of ['package-lock.json','package.json',`projects/${project}/project.json`,`projects/${project}/asset-manifest.json`,`projects/${project}/src/Root.tsx`,`projects/${project}/src/Video.tsx`])if(!paths.includes(required))throw Error(`Snapshot input absent: ${required}`);
 const files=paths.map(p=>({path:p,sha256:sha256(gitBytes(commit,p))}));
 const projectConfig=JSON.parse(gitBytes(commit,`projects/${project}/project.json`).toString());
 const manifest=JSON.parse(gitBytes(commit,`projects/${project}/asset-manifest.json`).toString());
 if(!Array.isArray(manifest.files))throw Error('Project asset manifest is invalid');
 const pkg=JSON.parse(gitBytes(commit,'package.json').toString());
 const lock=JSON.parse(gitBytes(commit,'package-lock.json').toString());
 for(const kind of ['dependencies','devDependencies'])for(const [n,v] of Object.entries(pkg[kind]||{}))if(lock.packages?.['']?.[kind]?.[n]!==v)throw Error(`Lockfile mismatch for ${n}`);
 if(projectConfig.id!==project)throw Error('Project id differs from directory');
 const fingerprint=sha256(JSON.stringify(files));
 return {sourceCommit:commit,sourceTree:tree,inputFingerprint:fingerprint,files,
  projectConfig:{id:project,compositionId:projectConfig.compositionId,fps:projectConfig.fps,width:projectConfig.width,height:projectConfig.height,durationInFrames:projectConfig.durationInFrames},
  toolchain:{node:'22.16.0',npm:'10.9.2',remotion:pkg.dependencies?.remotion,react:pkg.dependencies?.react,lockSha256:files.find(f=>f.path==='package-lock.json').sha256},
  assets:manifest.files.map(({path:p,sha256:h,bytes})=>({path:p,sha256:h,bytes}))};
}
const statePath=id=>path.join(projectPath(id),'STATE.json');
const snapshotPath=(id,revision)=>path.join(projectPath(id),'revisions',revision+'.json');
const approvedPath=(id,revision)=>path.join(projectPath(id),'approvals',revision+'.json');
function checkRevision(id){if(!REV_RE.test(id??''))throw Error('Revision must be lowercase alphanumeric/hyphens (1-63 chars)');return id;}
function updateState(id,mutator){
 const p=statePath(id);if(!existsSync(p))throw Error(`Missing STATE.json for ${id}; initialize state before taking a snapshot`);
 const prev=readJSON(p);if(prev.id!==id)throw Error('STATE id mismatch');
 const next=mutator({...prev});next.updatedAt=new Date().toISOString();
 writeFileSync(p,JSON.stringify(next,null,2)+'\n');
 const indexPath=path.join(ROOT,'PROJECTS.json');const index=readJSON(indexPath);
 if(!Array.isArray(index.projects)||!index.projects.some(x=>x.id===id))throw Error('Project absent from PROJECTS.json');
 index.projects=index.projects.map(x=>x.id===id?{...x,title:next.title,latestSnapshot:next.latestSnapshot,approvedRevision:next.approvedRevision,nextTask:next.nextTask,updatedAt:next.updatedAt}:x);
 writeFileSync(indexPath,JSON.stringify(index,null,2)+'\n');
}
function validateSnapshot(id,revision){
 const p=snapshotPath(id,revision);if(!existsSync(p))throw Error(`Unknown snapshot ${id}/${revision}`);
 const raw=readFileSync(p),saved=JSON.parse(raw);
 if(saved.schema!=='remotion-hub.snapshot/v1'||saved.project!==id||saved.revision!==revision)throw Error('Snapshot identity/schema mismatch');
 const calc=sourceInventory(id,saved.sourceCommit);
 for(const key of ['sourceTree','inputFingerprint'])if(calc[key]!==saved[key])throw Error(`Snapshot ${revision} failed ${key} verification`);
 if(JSON.stringify(calc.projectConfig)!==JSON.stringify(saved.projectConfig)||JSON.stringify(calc.assets)!==JSON.stringify(saved.assets)||JSON.stringify(calc.toolchain)!==JSON.stringify(saved.toolchain))throw Error('Snapshot configuration or asset hash mismatch');
 return {saved,bytes:raw,sha:sha256(raw)};
}
function verifyApproved(id,revision){
 const snapshot=validateSnapshot(id,revision),p=approvedPath(id,revision);
 if(!existsSync(p))throw Error(`Revision is NOT approved: ${id}/${revision}`);
 const approval=readJSON(p);
 if(approval.schema!=='remotion-hub.approval/v1'||approval.project!==id||approval.revision!==revision||approval.snapshotSha256!==snapshot.sha||approval.sourceCommit!==snapshot.saved.sourceCommit)throw Error('Approval record and source snapshot do not match');
 return {snapshot:snapshot.saved,approval};
}
function init(id){const {data}=loadProject(id);const p=statePath(id);if(existsSync(p))throw Error('STATE.json already exists');
 writeJSON(p,{schema:'remotion-hub.state/v1',id,title:data.title,objective:data.title,phase:'editing',compositionId:data.compositionId,latestSnapshot:null,approvedRevision:null,completed:[],pending:[],nextTask:'Previsualizar en Studio; guardar cambios de codigo y recursos; crear snapshot al terminar',updatedAt:new Date().toISOString()});
 console.log(`Initialized project state: ${id}`);
}
function snapshot(id,revision){clean();if(existsSync(snapshotPath(id,revision))||existsSync(approvedPath(id,revision)))throw Error('Revision ID already exists. Approved history is immutable.');
 const sourceCommit=git(['rev-parse','HEAD']);const inventory=sourceInventory(id,sourceCommit);
 writeJSON(snapshotPath(id,revision),{schema:'remotion-hub.snapshot/v1',project:id,revision,capturedAt:new Date().toISOString(),...inventory});
 updateState(id,s=>({...s,latestSnapshot:revision,phase:'review',nextTask:`Revisar ${revision}, confirmar y aprobar solo cuando corresponda` }));
 console.log(JSON.stringify({project:id,revision,sourceCommit,sourceTree:inventory.sourceTree,assetCount:inventory.assets.length,sourceFiles:inventory.files.length,requiresCommit:true}));
}
async function approve(id,revision,confirmation){if(confirmation!=='APROBAR-REVISION')throw Error('Approval requires --confirm APROBAR-REVISION and human review');clean();if(existsSync(approvedPath(id,revision)))throw Error('This revision is already approved and cannot be replaced');
 const {saved,sha}=validateSnapshot(id,revision);if(saved.assets.length){
  const {verifyAssetFiles}=await import('./verify-assets.mjs');await verifyAssetFiles(id);
 }
 writeJSON(approvedPath(id,revision),{schema:'remotion-hub.approval/v1',project:id,revision,sourceCommit:saved.sourceCommit,snapshotSha256:sha,approvedAt:new Date().toISOString(),approvalMethod:'explicit-user-confirmation',immutable:true});
 updateState(id,s=>({...s,approvedRevision:revision,phase:'approved',nextTask:'Solicitar exportacion manual por revision aprobada cuando corresponda'}));
 console.log(JSON.stringify({project:id,approvedRevision:revision,sourceCommit:saved.sourceCommit,requiresCommit:true}));
}
function resume(id,revision,execute){const {saved}=validateSnapshot(id,revision);const dest=path.join(ROOT,'.worktrees',`${id}-${revision}`);const branch=`work/${id}/${revision}-resume`;
 if(!execute){console.log(JSON.stringify({sourceCommit:saved.sourceCommit,workspace:dest,branch,dryRun:true}));return;}
 if(existsSync(dest))throw Error('Recovery worktree already exists; refusing overwrite');
 git(['worktree','add','-b',branch,dest,saved.sourceCommit]);
 console.log(JSON.stringify({recovered:true,sourceCommit:saved.sourceCommit,workspace:dest,branch,note:'This branch preserves the historical source; any edits require a new commit and snapshot.'}));
}
const [cmd,...args]=process.argv.slice(2);if(!cmd)throw Error('Usage: revisions.mjs snapshot|approve|verify|resume|status ...');
const {opts,pos}=parseArgs(args);const id=opts.project||pos[0];if(!id)throw Error('Specify --project SLUG');
loadProject(id);
const revision=opts.revision||pos[1];
if(cmd==='init')init(id);
else if(cmd==='status'){const s=readJSON(statePath(id));console.log(JSON.stringify(s,null,2));}
else {checkRevision(revision);
 if(cmd==='snapshot')snapshot(id,revision);
 else if(cmd==='approve')await approve(id,revision,opts.confirm);
 else if(cmd==='verify'){
  const a=verifyApproved(id,revision);
  if(opts['github-env']){
   const env=path.resolve(opts['github-env']);
   // Runner supplies GITHUB_ENV; only write to that exact path, never an arbitrary user path.
   if(!process.env.GITHUB_ENV||env!==path.resolve(process.env.GITHUB_ENV))throw Error('Only the runner-provided GITHUB_ENV is accepted');
   const {appendFileSync}=await import('node:fs');appendFileSync(env,`SOURCE_SHA=${a.snapshot.sourceCommit}\nRENDER_REVISION=${revision}\n`);
  }
  console.log(JSON.stringify({verified:true,project:id,revision,sourceCommit:a.snapshot.sourceCommit,assetCount:a.snapshot.assets.length,fingerprint:a.snapshot.inputFingerprint}));
 }else if(cmd==='resume')resume(id,revision,!!opts.execute);
 else throw Error('Unknown revision command');
}
