import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtempSync,readFileSync,existsSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

// Real repository history; NO mock revisions and NO media rendering.
// Test runs in a GitHub-hosted runner, independent of Android Codespaces,
// then clones the actual checked-out Git history into a separate .git.
const SOURCE=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
const run=(dir,bin,...args)=>{
 const r=spawnSync(bin,args,{cwd:dir,encoding:'utf8',maxBuffer:20*1024*1024,timeout:45000});
 if(r.error)throw r.error;
 return r;
};
const ok=r=>{assert.equal(r.status,0,r.stderr||r.stdout||'command failed');return r.stdout.trim();};
const git=(dir,...args)=>ok(run(dir,'git',...args));
const verifyHash=(bytes,expected)=>assert.equal(createHash('sha256').update(bytes).digest('hex'),expected);

test('real demo revisions recover into independent Git worktrees; original source stays intact',()=>{
 const temp=mkdtempSync(path.join(tmpdir(),'hub-real-recovery-'));
 const fresh=path.join(temp,'fresh-checkout');
 try {
  git(temp,'init','-q',fresh);
  // Fetch the REAL commit graph into a new Git repository; no shared .git state.
  git(fresh,'fetch','-q','--no-tags',SOURCE,'HEAD');
  git(fresh,'checkout','-q','--detach','FETCH_HEAD');
  const originalHead=git(fresh,'rev-parse','HEAD');
  const state=JSON.parse(readFileSync(path.join(fresh,'projects/demo/STATE.json'),'utf8'));
  assert.equal(state.approvedRevision,null,'Recovery testing must not approve drafts');
  const revisions=['demo-cut-001','demo-cut-002',state.latestSnapshot];
  assert.equal(new Set(revisions).size,3,'Expected three distinct real revisions');
  let lastSource='';
  for(const revision of revisions){
   const saved=JSON.parse(readFileSync(path.join(fresh,'projects/demo/revisions',revision+'.json'),'utf8'));
   assert.equal(saved.revision,revision);
   assert.equal(saved.project,'demo');
   const args=['scripts/revisions.mjs','resume','--project','demo','--revision',revision];
   const preview=JSON.parse(ok(run(fresh,process.execPath,...args)));
   assert.equal(preview.dryRun,true);
   assert.equal(preview.sourceCommit,saved.sourceCommit);
   assert.equal(existsSync(preview.workspace),false);
   const recovered=JSON.parse(ok(run(fresh,process.execPath,...args,'--execute')));
   assert.equal(recovered.recovered,true);
   assert.equal(recovered.workspace,preview.workspace);
   assert.equal(git(recovered.workspace,'rev-parse','HEAD'),saved.sourceCommit);
   assert.equal(git(fresh,'rev-parse','HEAD'),originalHead);
   const relativeFile='projects/demo/src/Video.tsx';
   const inventoryEntry=saved.files.find(f=>f.path===relativeFile);
   assert.ok(inventoryEntry,'Editable source must appear in source manifest');
   const sourceBytes=readFileSync(path.join(recovered.workspace,relativeFile));
   verifyHash(sourceBytes,inventoryEntry.sha256);
   const gitBytes=ok(run(fresh,'git','show',saved.sourceCommit+':'+relativeFile));
   assert.equal(sourceBytes.toString('utf8').trim(),gitBytes.trim());
   const recoveredStatus=git(recovered.workspace,'status','--porcelain');
   assert.equal(recoveredStatus,'','Recovered checkout must be clean');
   lastSource=saved.sourceCommit;
  }
  assert.ok(lastSource);
  // A second attempt must never replace an existing recovery worktree.
  const duplicate=run(fresh,process.execPath,'scripts/revisions.mjs','resume',
   '--project','demo','--revision',revisions[0],'--execute');
  assert.notEqual(duplicate.status,0,'A duplicate recovery must fail safely');
  assert.equal(git(fresh,'rev-parse','HEAD'),originalHead);
  assert.equal(git(fresh,'status','--porcelain'),'','Current work must remain clean');
  assert.equal(JSON.parse(readFileSync(path.join(fresh,'projects/demo/STATE.json'),'utf8')).approvedRevision,null);
 }finally{
  rmSync(temp,{recursive:true,force:true,maxRetries:2});
 }
});
