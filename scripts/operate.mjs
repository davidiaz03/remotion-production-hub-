import {existsSync,readFileSync,writeFileSync,renameSync,unlinkSync} from 'node:fs';
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
// Interrupted saves leave a local Git-private journal so we can finish the
// SAME checkpoint safely. Journals are never committed to public GitHub.
const journalPath=()=>git('rev-parse','--path-format=absolute','--git-path','remotion-hub-save-'+id+'.json');
const pending=()=>existsSync(journalPath())?JSON.parse(readFileSync(journalPath(),'utf8')):null;
function writePending(j){
 const p=journalPath();
 writeFileSync(p+'.tmp',JSON.stringify(j,null,2)+'\n');
 renameSync(p+'.tmp',p);
}
const checkpointTitle=j=>'checkpoint('+id+'): '+j.revision+' (not approved)';
const sourceTitle=()=>'edit('+id+'): persist editable sources';
function finishCheckpoint(j){
 const b=branch();
 if(j.schema!==1||j.project!==id||j.branch!==b||!j.revision||!j.baseHead)throw Error('Pending checkpoint does not match this project/branch');
 remote(b);
 const h=head();
 if(!j.sourceCommit){
  if(h===j.baseHead){
   const dirty=changes();safeChanges(dirty,j.created);
   if(!dirty.length)throw Error('Pending save has no source changes; inspect the journal');
   git('add','-A','--','projects/'+id,...(j.created?['PROJECTS.json']:[]));
   safeChanges(git('diff','--cached','--name-only').split('\n').filter(Boolean),j.created);
   git('commit','-m',sourceTitle());
  }else if(git('rev-parse','HEAD^')!==j.baseHead||git('log','-1','--format=%s')!==sourceTitle()){
   throw Error('Unexpected commits since interrupted source save; reconcile manually');
  }
  j.sourceCommit=head();writePending(j);
 }
 const now=head();
 if(now!==j.sourceCommit){
  if(git('rev-parse','HEAD^')!==j.sourceCommit||git('log','-1','--format=%s')!==checkpointTitle(j))
   throw Error('Unexpected commit since interrupted checkpoint; refusing push');
 }else{
  const snapshotFile=revision(j.revision);
  if(!existsSync(snapshotFile)){
   if(changes().length)throw Error('Unexpected changes after source commit; inspect before resuming');
   node('scripts/revisions.mjs','snapshot','--project',id,'--revision',j.revision);
  }
  const snapshot=JSON.parse(readFileSync(snapshotFile,'utf8'));
  if(snapshot.project!==id||snapshot.revision!==j.revision||snapshot.sourceCommit!==j.sourceCommit)throw Error('Snapshot/source mismatch');
  // Recover if interrupted between creating the snapshot and updating state.
  const stateFile=path.join(projectPath(id),'STATE.json'),indexFile=path.join(ROOT,'PROJECTS.json');
  const s=JSON.parse(readFileSync(stateFile,'utf8')),idx=JSON.parse(readFileSync(indexFile,'utf8'));
  const row=idx.projects.find(x=>x.id===id);
  if(!row)throw Error('Project absent from index');
  for(const v of [s.latestSnapshot,row.latestSnapshot])
   if(v!==j.revision&&v!==j.previousSnapshot)throw Error('State changed during checkpoint; inspect before resuming');
  if(s.latestSnapshot!==j.revision||row.latestSnapshot!==j.revision){
   const timestamp=new Date().toISOString(),nextTask='Revisar '+j.revision+', confirmar y aprobar solo cuando corresponda';
   Object.assign(s,{latestSnapshot:j.revision,phase:'review',nextTask,updatedAt:timestamp});
   Object.assign(row,{latestSnapshot:j.revision,nextTask,updatedAt:timestamp});
   writeFileSync(stateFile,JSON.stringify(s,null,2)+'\n');
   writeFileSync(indexFile,JSON.stringify(idx,null,2)+'\n');
  }
  node('scripts/revisions.mjs','resume','--project',id,'--revision',j.revision);
  const handoffFile=path.join(projectPath(id),'HANDOFF.md');
  const old=existsSync(handoffFile)?readFileSync(handoffFile,'utf8'):'# '+s.title+'\n';
  const marker='<!-- checkpoint:'+j.revision+' -->';
  if(!old.includes(marker)){
   const entry='\n'+marker+'\n## Sesión '+new Date().toISOString()+'\n'+
    '- Revisión: '+j.revision+' (en revisión; NO aprobada)\n'+
    '- Commit fuente: '+j.sourceCommit+'\n'+
    '- Última aprobación: '+(s.approvedRevision||'ninguna')+'\n'+
    '- Nota: '+(j.note||'Sin nota editorial')+'\n'+
    '- Próximo paso: '+s.nextTask+'\n';
   writeFileSync(handoffFile,old.trimEnd()+'\n'+entry);
  }
  const allow=['PROJECTS.json','projects/'+id+'/STATE.json','projects/'+id+'/HANDOFF.md','projects/'+id+'/revisions/'+j.revision+'.json'];
  for(const file of changes())if(!allow.includes(file))throw Error('Concurrent change during checkpoint: '+file);
  git('add','--',...allow);
  git('commit','-m',checkpointTitle(j));
 }
 j.metadataCommit=head();writePending(j);
 const result=push(b);
 if(result.verifiedRemoteSha!==j.metadataCommit)throw Error('Published unexpected commit');
 unlinkSync(journalPath());
 console.log(JSON.stringify({status:'saved',project:id,revision:j.revision,sourceCommit:j.sourceCommit,metadataCommit:j.metadataCommit,approved:false,...result}));
}
function save(created=false){
 const unfinished=pending();
 if(unfinished){if(created)throw Error('Finish existing checkpoint first');return finishCheckpoint(unfinished);}
 const b=branch();remote(b);
 node('scripts/validate.mjs','--project',id);
 const note=typeof opts.note==='string'?opts.note:'';
 if(note.length>500||note.includes('\n'))throw Error('Note exceeds 500 chars or has line breaks');
 const files=changes();safeChanges(files,created);
 if(!files.length){console.log(JSON.stringify({status:'unchanged',project:id,...push(b)}));return;}
 const j={schema:1,project:id,branch:b,baseHead:head(),
  revision:id.slice(0,26)+'-'+new Date().toISOString().replace(/[-:.]/g,'').toLowerCase()+'-'+randomBytes(3).toString('hex'),
  created,note,previousSnapshot:state().latestSnapshot};
 writePending(j);
 finishCheckpoint(j);
}
function publish(){
 const unfinished=pending();
 if(unfinished)return finishCheckpoint(unfinished);
 console.log(JSON.stringify(push(branch())));
}
if(action==='save')save();
else if(action==='publish')publish();
else if(action==='status'){console.log(JSON.stringify({project:id,branch:git('branch','--show-current'),commit:head(),...state(),dirty:changes(),pendingCheckpoint:pending()?.revision||null},null,2));}
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