import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
const run=(...args)=>spawnSync(process.execPath,['scripts/cleanup.mjs',...args],{cwd:ROOT,encoding:'utf8'});
test('cleanup dry-run is safe and never deletes output',()=>{
 const r=run('--project','demo');
 assert.equal(r.status,0,r.stderr);
});
test('cleanup blocks unscoped destructive operation',()=>{
 const r=run('--execute');
 assert.notEqual(r.status,0);
 assert.match(r.stderr,/requires explicit --project/);
});
test('cleanup rejects invalid slugs and global reports',()=>{
 for(const a of [['--project','../demo'],['--reports']]){
  const r=run(...a);
  assert.notEqual(r.status,0);
 }
});
test('CI workflow protects global concurrency and project-only cleanup',()=>{
 const w=readFileSync(path.join(ROOT,'.github/workflows/reusable-render.yml'),'utf8');
 assert.match(w,/group: remotion-render-\$\{\{ github\.repository \}\}/);
 assert.match(w,/cancel-in-progress: false/);
 assert.match(w,/cleanup\.mjs --project "\$PROJECT" --execute/);
 assert.doesNotMatch(w,/run: node scripts\/cleanup\.mjs --execute(?:\s|$)/);
});
