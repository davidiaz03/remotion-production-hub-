import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cpSync,existsSync,mkdtempSync,mkdirSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {ROOT} from '../scripts/lib.mjs';
function command(dir,bin,...args){const r=spawnSync(bin,args,{cwd:dir,encoding:'utf8',maxBuffer:8*1024*1024});if(r.error)throw r.error;return r;}
function must(r){assert.equal(r.status,0,r.stderr||r.stdout);return r.stdout.trim();}
function git(dir,...args){return must(command(dir,'git',...args));}
const node=(dir,...args)=>command(dir,process.execPath,...args);

test('editable project survives commit -> snapshot -> approval -> later edit -> separate recovery worktree; no rendering',()=>{
 const temp=mkdtempSync(path.join(os.tmpdir(),'remotion-persistence-test-'));
 const dir=path.join(temp,'hub');
 try{
  cpSync(ROOT,dir,{recursive:true,filter:(src)=>!src.includes('/node_modules/')&&!src.includes('/.git/')&&!src.includes('/.worktrees/')&&!src.includes('/out/')&&!src.includes('/reports/')&&!src.endsWith('package-lock.json')});
  const pkg=JSON.parse(readFileSync(path.join(dir,'package.json'),'utf8'));
  const lock={name:pkg.name,version:pkg.version,lockfileVersion:3,packages:{'':{name:pkg.name,version:pkg.version,dependencies:pkg.dependencies,devDependencies:pkg.devDependencies}}};
  writeFileSync(path.join(dir,'package-lock.json'),JSON.stringify(lock,null,2)+'\n');
  git(dir,'init','-q');git(dir,'config','user.name','Test Operator');git(dir,'config','user.email','test@example.invalid');
  git(dir,'add','-A');git(dir,'commit','-qm','fixture: editable source');
  const sourceSha=git(dir,'rev-parse','HEAD');
  const savedSource=readFileSync(path.join(dir,'projects/demo/src/Video.tsx'),'utf8');
  const id='demo-persisted-v1';
  must(node(dir,'scripts/revisions.mjs','snapshot','--project','demo','--revision',id));
  const snapshot=JSON.parse(readFileSync(path.join(dir,`projects/demo/revisions/${id}.json`),'utf8'));
  assert.equal(snapshot.sourceCommit,sourceSha);
  assert.ok(snapshot.files.some(f=>f.path==='projects/demo/src/Video.tsx'));
  assert.equal(JSON.parse(readFileSync(path.join(dir,'PROJECTS.json'),'utf8')).projects.find(x=>x.id==='demo').latestSnapshot,id);
  git(dir,'add','-A');git(dir,'commit','-qm','checkpoint saved');
  assert.notEqual(node(dir,'scripts/revisions.mjs','approve','--project','demo','--revision',id).status,0);
  must(node(dir,'scripts/revisions.mjs','approve','--project','demo','--revision',id,'--confirm','APROBAR-REVISION'));
  git(dir,'add','-A');git(dir,'commit','-qm','human confirmed revision');
  const verified=JSON.parse(must(node(dir,'scripts/revisions.mjs','verify','--project','demo','--revision',id)));
  assert.equal(verified.sourceCommit,sourceSha);
  // New work must not silently mutate the already approved source.
  writeFileSync(path.join(dir,'projects/demo/src/Video.tsx'),savedSource+'\n// new work, deliberately later than approval\n');
  git(dir,'add','-A');git(dir,'commit','-qm','later draft');
  assert.equal(JSON.parse(must(node(dir,'scripts/revisions.mjs','verify','--project','demo','--revision',id))).sourceCommit,sourceSha);
  const plan=JSON.parse(must(node(dir,'scripts/revisions.mjs','resume','--project','demo','--revision',id)));
  assert.equal(plan.dryRun,true);assert.equal(existsSync(plan.workspace),false);
  const resumed=JSON.parse(must(node(dir,'scripts/revisions.mjs','resume','--project','demo','--revision',id,'--execute')));
  assert.equal(git(resumed.workspace,'rev-parse','HEAD'),sourceSha);
  assert.equal(readFileSync(path.join(resumed.workspace,'projects/demo/src/Video.tsx'),'utf8'),savedSource);
  assert.equal(git(dir,'rev-parse','HEAD')===sourceSha,false,'Main remains on a newer commit');
  // Tampering must be detected, not silently accepted.
  const approvalFile=path.join(dir,`projects/demo/approvals/${id}.json`);
  const raw=readFileSync(approvalFile,'utf8');const altered=JSON.parse(raw);altered.snapshotSha256='0'.repeat(64);writeFileSync(approvalFile,JSON.stringify(altered));
  assert.notEqual(node(dir,'scripts/revisions.mjs','verify','--project','demo','--revision',id).status,0);
 }finally{rmSync(temp,{recursive:true,force:true});}
});
