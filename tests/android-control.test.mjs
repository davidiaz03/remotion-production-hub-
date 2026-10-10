import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,existsSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const code=path.resolve(fileURLToPath(new URL('../scripts/android-control.mjs',import.meta.url)));
const root=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
function run(cwd,args){
 const r=spawnSync(process.execPath,[code,...args],{cwd,encoding:'utf8'});
 if(r.error)throw r.error;
 return r;
}
function fixture(){
 const dir=mkdtempSync(path.join(tmpdir(),'remotion-android-ui-'));
 assert.equal(spawnSync('git',['init','-q'],{cwd:dir}).status,0);
 mkdirSync(path.join(dir,'scripts'));mkdirSync(path.join(dir,'projects','demo'),{recursive:true});
 writeFileSync(path.join(dir,'projects','demo','project.json'),'{}');
 writeFileSync(path.join(dir,'PROJECTS.json'),JSON.stringify({projects:[{id:'demo'}]}));
 writeFileSync(path.join(dir,'scripts','operate.mjs'),"console.log(JSON.stringify(process.argv.slice(2)))\n");
 return dir;
}
test('Android controls require explicit project; selector stays in Git metadata',()=>{
 const f=fixture();
 try{
  assert.notEqual(run(f,['status']).status,0);
  const set=run(f,['select','demo']);assert.equal(set.status,0,set.stderr);
  const active=run(f,['whoami']);assert.match(active.stdout,/demo/);
  const status=run(f,['status']);assert.equal(status.status,0,status.stderr);
  assert.deepEqual(JSON.parse(status.stdout),['status','demo']);
  const saved=run(f,['save']);assert.equal(saved.status,0,saved.stderr);
  assert.deepEqual(JSON.parse(saved.stdout),['save','demo','--note','Guardado desde el menu Android']);
  const recover=run(f,['recover']);assert.equal(recover.status,0,recover.stderr);
  assert.deepEqual(JSON.parse(recover.stdout),['recover','demo']);
  const file=spawnSync('git',['rev-parse','--git-path','remotion-hub-active-project'],{cwd:f,encoding:'utf8'}).stdout.trim();
  assert.equal(readFileSync(path.resolve(f,file),'utf8').trim(),'demo');
  assert.equal(existsSync(path.join(f,'remotion-hub-active-project')),false);
  assert.notEqual(run(f,['select','../demo']).status,0);
  assert.notEqual(run(f,['approve']).status,0);
 }finally{rmSync(f,{recursive:true,force:true});}
});
test('VS Code tasks 00-05 are promptless; editorial approval still requires input',()=>{
 const json=JSON.parse(readFileSync(path.join(root,'.vscode','tasks.json'),'utf8'));
 for(const task of json.tasks.filter(x=>/^0[0-5] /.test(x.label))){
  assert.ok(!JSON.stringify(task).includes('$'+'{input:'),task.label);
  assert.equal(task.command,'node');
 }
 const approve=json.tasks.find(x=>x.label.startsWith('07 '));
 assert.ok(JSON.stringify(approve).includes('$'+'{input:confirm}'));
});
