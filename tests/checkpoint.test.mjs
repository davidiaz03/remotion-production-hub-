import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cpSync,mkdtempSync,mkdirSync,readFileSync,writeFileSync,existsSync,readdirSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {ROOT} from '../scripts/lib.mjs';

const official='https://github.com/davidiaz03/remotion-production-hub-.git';
function command(cwd,bin,args,env=process.env){
 const r=spawnSync(bin,args,{cwd,encoding:'utf8',env,maxBuffer:16*1024*1024});
 if(r.error)throw r.error;
 return r;
}
function must(r){assert.equal(r.status,0,r.stderr||r.stdout);return r.stdout.trim();}
const git=(cwd,...args)=>must(command(cwd,'git',args));
function fixture(){
 const top=mkdtempSync(path.join(os.tmpdir(),'hub-resumable-save-'));
 const dir=path.join(top,'repo'),bare=path.join(top,'remote.git'),bin=path.join(top,'bin');
 cpSync(ROOT,dir,{recursive:true,filter:p=>!/\/(node_modules|\.git|\.worktrees|out|reports)(\/|$)/.test(p)});
 git(dir,'init','-q');
 git(dir,'config','user.name','Checkpoint Test');
 git(dir,'config','user.email','checkpoint@example.invalid');
 git(dir,'checkout','-qb','work/checkpoint-test');
 git(dir,'add','-A');git(dir,'commit','-qm','fixture baseline');
 git(top,'init','--bare','-q',bare);
 git(dir,'remote','add','origin',official);
 git(dir,'push',bare,'HEAD:refs/heads/work/checkpoint-test');
 mkdirSync(bin);
 // Fake only the remote operations with a local bare repo, never real network.
 const wrapper=path.join(bin,'git');
 const lines=[
  '#!/bin/sh',
  'if [ "$1" = "remote" ] && [ "$2" = "get-url" ] && [ "$3" = "origin" ]; then echo "https://github.com/davidiaz03/remotion-production-hub-.git"; exit 0; fi',
  'if [ "$1" = "ls-remote" ] && [ "$2" = "--heads" ] && [ "$3" = "origin" ]; then shift 3; exec /usr/bin/git ls-remote --heads "$REMOTION_TEST_REMOTE" "$@"; fi',
  'if [ "$1" = "push" ] && [ "$2" = "origin" ]; then',
  '  if [ "$REMOTION_TEST_FAIL_PUSH" = "1" ]; then echo "Simulated network failure" >&2; exit 91; fi',
  '  shift 2; exec /usr/bin/git push "$REMOTION_TEST_REMOTE" "$@";',
  'fi',
  'if [ "$1" = "commit" ] && [ "$REMOTION_TEST_FAIL_META" = "1" ]; then',
  '  case "$*" in *"checkpoint(demo):"*) echo "Simulated interrupted metadata commit" >&2; exit 92;; esac',
  'fi',
  'exec /usr/bin/git "$@"'
 ];
 writeFileSync(wrapper,lines.join('\n')+'\n',{mode:0o755});
 const env={...process.env,PATH:bin+':'+process.env.PATH,REMOTION_TEST_REMOTE:bare};
 return {top,dir,bare,env};
}
function run(f,action,extra={},note='ensayo'){
 return command(f.dir,process.execPath,['scripts/operate.mjs',action,'demo',...(action==='save'?['--note',note]:[])],{...f.env,...extra});
}
function mutate(f){
 const p=path.join(f.dir,'projects/demo/src/Video.tsx');
 writeFileSync(p,readFileSync(p,'utf8')+'\n// checkpoint test (editable TSX)\n');
}
function verify(f){
 const local=git(f.dir,'rev-parse','HEAD');
 assert.equal(git(f.dir,'ls-remote',f.bare,'refs/heads/work/checkpoint-test').split(/\s+/)[0],local);
 assert.equal(git(f.dir,'status','--porcelain'),'');
 const state=JSON.parse(readFileSync(path.join(f.dir,'projects/demo/STATE.json'),'utf8'));
 assert.equal(state.phase,'review');
 assert.equal(state.approvedRevision,null);
 const rev=state.latestSnapshot;
 assert.ok(rev&&rev.startsWith('demo-'));
 const snap=JSON.parse(readFileSync(path.join(f.dir,'projects/demo/revisions',rev+'.json'),'utf8'));
 assert.equal(snap.sourceCommit,git(f.dir,'rev-parse','HEAD^'));
 assert.ok(readFileSync(path.join(f.dir,'projects/demo/HANDOFF.md'),'utf8').includes('<!-- checkpoint:'+rev+' -->'));
 assert.equal(readdirSync(path.join(f.dir,'projects/demo/revisions')).filter(x=>x===rev+'.json').length,1);
 const journal=git(f.dir,'rev-parse','--path-format=absolute','--git-path','remotion-hub-save-demo.json');
 assert.equal(existsSync(journal),false);
}
test('checkpoint resumes a failed push without duplicate snapshot or render',()=>{
 const f=fixture();
 try{
  mutate(f);
  const fail=run(f,'save',{REMOTION_TEST_FAIL_PUSH:'1'});
  assert.notEqual(fail.status,0,'First push must fail');
  must(run(f,'publish'));
  verify(f);
  const again=JSON.parse(must(run(f,'save')));
  assert.equal(again.status,'unchanged');
 }finally{rmSync(f.top,{recursive:true,force:true});}
});
test('checkpoint resumes interrupted metadata commit and preserves HANDOFF',()=>{
 const f=fixture();
 try{
  mutate(f);
  const old=readFileSync(path.join(f.dir,'projects/demo/HANDOFF.md'),'utf8');
  const fail=run(f,'save',{REMOTION_TEST_FAIL_META:'1'},'comentario de prueba');
  assert.notEqual(fail.status,0);
  must(run(f,'publish'));
  verify(f);
  const handoff=readFileSync(path.join(f.dir,'projects/demo/HANDOFF.md'),'utf8');
  assert.ok(handoff.includes(old.trim()));
  assert.ok(handoff.includes('comentario de prueba'));
 }finally{rmSync(f.top,{recursive:true,force:true});}
});
