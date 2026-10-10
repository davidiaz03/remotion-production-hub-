import {readFileSync,writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import path from 'node:path';
import {ROOT,loadProject,projectPath,parseArgs} from './lib.mjs';
const [action,...argv]=process.argv.slice(2);
const {pos,opts}=parseArgs(argv),id=opts.project||pos[0];
if(!id)throw Error('Project ID required');
if(action!=='create')loadProject(id);
const run=(bin,args,options={})=>{
 const p=spawnSync(bin,args,{cwd:ROOT,encoding:'utf8',maxBuffer:12*1024*1024,...options});
 if(p.error||p.status!==0)throw Error(bin+' '+args[0]+': '+String(p.stderr||p.stdout||p.error).slice(0,800));
 return p.stdout?.trim()||'';
};
const git=(...args)=>run('git',args);
const node=(...args)=>run(process.execPath,args);
const state=()=>JSON.parse(readFileSync(path.join(projectPath(id),'STATE.json'),'utf8'));
const revision=(name)=>path.join(projectPath(id),'revisions',name+'.json');
const head=()=>git('rev-parse','HEAD');
function branch(){
 const b=git('symbolic-ref','--quiet','--short','HEAD');
 if(!/^work\/[a-z0-9][a-z0-9/_-]*$/.test(b))throw Error('Use a work/* branch, not main or detached HEAD');
 return b;
}
function remote(b){
 const url=git('remote','get-url','origin').replace(/\/$/,'');
 if(!/^(https:\/\/github\.com\/|git@github\.com:)davidiaz03\/remotion-production-hub-(?:\.git)?$/.test(url))throw Error('Unknown origin: refusing publication');
 const out=git('ls-remote','--heads','origin','refs/heads/'+b);
 if(!out)throw Error('Create/push the work branch in GitHub before saving');
 const sha=out.split(/\s+/)[0];
 const check=spawnSync('git',['merge-base','--is-ancestor',sha,'HEAD'],{cwd:ROOT});
 if(check.status!==0)throw Error('Remote moved or diverged: fetch/reconcile first, never force-push');
 return sha;
}
function changes(){
 const names=new Set();
 for(const a of [['diff','--name-only','-z'],['diff','--cached','--name-only','-z'],['ls-files','--others','--exclude-standard','-z']]){
  const r=spawnSync('git',a,{cwd:ROOT});
  if(r.status!==0)throw Error('Git status inspection failed');
  for(const n of r.stdout.toString().split('\0').filter(Boolean))names.add(n);
 }
 return [...names].sort();
}
function safeChanges(files,allowIndex=false){
 for(const f of files){
  if(f==='PROJECTS.json'&&allowIndex)continue;
  if(!f.startsWith('projects/'+id+'/'))throw Error('Unrelated project change: '+f);
  if(f.startsWith('projects/'+id+'/approvals/')||f.startsWith('projects/'+id+'/revisions/'))
   throw Error('Uncommitted historical manifest: '+f+'. Inspect before saving.');
 }
}
function push(b){
 if(changes().length)throw Error('Local tree is dirty; commits remain safe');
 remote(b);
 git('push','origin','HEAD:refs/heads/'+b);
 const sha=git('ls-remote','--heads','origin','refs/heads/'+b).split(/\s+/)[0];
 if(sha!==head())throw Error('Remote SHA does not match saved commit');
 return {branch:b,verifiedRemoteSha:sha};
}
function save(created=false){
 const b=branch();remote(b);
 node('scripts/validate.mjs','--project',id);
 const note=typeof opts.note==='string'?opts.note:'';
 if(note.length>500||note.includes('\n'))throw Error('Note exceeds 500 chars or has line breaks');
 const files=changes();safeChanges(files,created);
 if(!files.length){console.log(JSON.stringify({status:'unchanged',project:id,...push(b)}));return;}
 git('add','-A','--','projects/'+id,...(created?['PROJECTS.json']:[]));
 safeChanges(git('diff','--cached','--name-only').split('\n').filter(Boolean),created);
 if(!git('diff','--cached','--name-only'))throw Error('No editable tracked files to save');
 git('commit','-m','edit('+id+'): persist editable sources');
 const source=head();
 const name=id+'-'+new Date().toISOString().replace(/[-:.]/g,'').toLowerCase()+'-'+randomBytes(3).toString('hex');
 node('scripts/revisions.mjs','snapshot','--project',id,'--revision',name);
 const s=state();
 const handoff='# '+s.title+' — siguiente sesión\n\nProyecto: '+id+'\nComposición: '+s.compositionId+
  '\nRevisión: '+name+' (**en revisión, NO aprobada**)\nCommit fuente: '+source+
  '\nÚltima aprobación: '+(s.approvedRevision||'ninguna')+
  '\nNota editorial: '+(note||'No registrada')+'\nPróxima tarea: '+s.nextTask+
  '\n\nConsultar PROJECTS.json, STATE.json y revisions/'+name+'.json antes de modificar.\n';
 writeFileSync(path.join(projectPath(id),'HANDOFF.md'),handoff);
 git('add','--','PROJECTS.json','projects/'+id+'/STATE.json','projects/'+id+'/HANDOFF.md','projects/'+id+'/revisions/'+name+'.json');
 git('commit','-m','checkpoint('+id+'): '+name+' (not approved)');
 // If push fails, BOTH local commits remain: use "publish" only.
 const result=push(b),snapshot=JSON.parse(readFileSync(revision(name),'utf8'));
 if(snapshot.sourceCommit!==source)throw Error('Snapshot/source mismatch');
 console.log(JSON.stringify({status:'saved',project:id,revision:name,sourceCommit:source,metadataCommit:head(),approved:false,declaredAssets:snapshot.assets.length,...result}));
}
if(action==='save')save();
else if(action==='publish'){console.log(JSON.stringify(push(branch())));}
else if(action==='status'){console.log(JSON.stringify({project:id,branch:git('branch','--show-current'),commit:head(),...state(),dirty:changes()},null,2));}
else if(action==='create'){
 const b=branch();remote(b);
 if(changes().length)throw Error('Worktree must be clean before creating a project');
 node('scripts/project.mjs','create',id,...pos.slice(1));save(true);
}else if(action==='open'){
 node('scripts/validate.mjs','--project',id);
 const m=JSON.parse(readFileSync(path.join(projectPath(id),'asset-manifest.json'),'utf8'));
 if(m.files?.length)node('scripts/verify-assets.mjs','--project',id);
 const p=spawnSync(process.execPath,['scripts/project.mjs','studio',id],{cwd:ROOT,stdio:'inherit'});
 if(p.status!==0)throw Error('Remotion Studio failed');
}else if(action==='recover'){
 const s=state(),rev=opts.revision||(opts.approved?s.approvedRevision:s.latestSnapshot);
 if(!rev)throw Error('No revision available; never reconstruct from MP4');
 const a=['scripts/revisions.mjs','resume','--project',id,'--revision',rev];
 if(opts.execute)a.push('--execute');
 console.log(node(...a));
}else if(action==='approve'){
 if(opts.confirm!=='APROBAR-REVISION')throw Error('Explicit human editorial approval required');
 if(!opts.revision)throw Error('Specify --revision');
 const b=branch();remote(b);
 if(changes().length)throw Error('Clean worktree required before approving');
 node('scripts/revisions.mjs','approve','--project',id,'--revision',opts.revision,'--confirm',opts.confirm);
 git('add','--','PROJECTS.json','projects/'+id+'/STATE.json','projects/'+id+'/approvals/'+opts.revision+'.json');
 git('commit','-m','approve('+id+'): '+opts.revision);
 console.log(JSON.stringify({approvedRevision:opts.revision,...push(b)}));
}else throw Error('Available: save|publish|status|create|open|recover|approve');