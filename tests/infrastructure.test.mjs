import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,existsSync,mkdirSync,rmSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {ROOT,projectPath,resolvePublicFile,loadProject,assertDrivePath} from '../scripts/lib.mjs';
import {validateProject} from '../scripts/validate.mjs';
import {spawnSync} from 'node:child_process';
function run(...args){return spawnSync(process.execPath,args,{cwd:ROOT,encoding:'utf8'});}
test('two independently registered projects are valid',()=>{
 assert.equal(validateProject('demo').frames,90);
 assert.equal(validateProject('che-v42').frames,2418);
});
test('path traversal is rejected',()=>{
 assert.throws(()=>projectPath('../secret'));
 assert.throws(()=>resolvePublicFile(projectPath('demo'),'../outside.mp4'));
 assert.throws(()=>assertDrivePath('folder/../private'));
});
test('new project scaffolding creates a neutral project and never overwrites',()=>{
 const id='test-infrastructure-temporary';const dir=projectPath(id);
 const indexFile=path.join(ROOT,'PROJECTS.json');const originalIndex=readFileSync(indexFile,'utf8');
 rmSync(dir,{recursive:true,force:true});
 try{
  const a=run('scripts/project.mjs','create',id,'Reel de prueba');
  assert.equal(a.status,0,a.stderr);
  assert.equal(validateProject(id).durationSeconds,3);
  assert.match(readFileSync(path.join(dir,'src/Video.tsx'),'utf8'),/Reel de prueba/);
  assert.notEqual(run('scripts/project.mjs','create',id).status,0);
 }finally{rmSync(dir,{recursive:true,force:true});writeFileSync(indexFile,originalIndex);}
});
test('render cannot proceed without installed official CLI',()=>{
 const r=run('scripts/project.mjs','render','demo','--mode','quick','--frames','0-57');
 if(!existsSync(path.join(ROOT,'node_modules/@remotion/cli/remotion-cli.js')))assert.notEqual(r.status,0);
});
test('master always requires explicit approval',()=>{
 const r=run('scripts/free-guard.mjs','--project','demo','--mode','full');
 assert.notEqual(r.status,0);
});
test('private GitHub Action is rejected without invoking anything expensive',()=>{
 const r=spawnSync(process.execPath,['scripts/free-guard.mjs','--project','demo','--mode','quick'],{cwd:ROOT,encoding:'utf8',env:{...process.env,GITHUB_ACTIONS:'true',GITHUB_REPOSITORY_PRIVATE:'true',RUNNER_OS:'Linux',GITHUB_SHA:'0123456789abcdef'}});
 assert.notEqual(r.status,0);
});
test('V42 covers exact 2418 frames with the 58-frame segment',()=>{
 const r=run('scripts/compat-v42.mjs');assert.equal(r.status,0,r.stderr);
 const j=JSON.parse(r.stdout);assert.equal(j.internationalismFrames,58);assert.equal(j.timelineSegments,28);
});
test('no large binaries tracked in source package',()=>{
 const ignores=readFileSync(path.join(ROOT,'.gitignore'),'utf8');
 for(const ext of ['mp4','wav','zip','png'])assert.match(ignores,new RegExp('\\*\\.'+ext));
 const media=readdirSync(path.join(ROOT,'projects/che-v42/public'));assert.deepEqual(media,['.gitkeep']);
});
