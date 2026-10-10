import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,cpSync,rmSync} from 'node:fs';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
test('creating a reel includes a project-specific self-directed creative plan',()=>{
 const tmp=mkdtempSync(path.join(tmpdir(),'hub-creative-test-'));
 try{
  mkdirSync(path.join(tmp,'scripts'));
  mkdirSync(path.join(tmp,'templates'));
  mkdirSync(path.join(tmp,'projects'));
  cpSync(path.join(ROOT,'scripts','lib.mjs'),path.join(tmp,'scripts','lib.mjs'));
  cpSync(path.join(ROOT,'scripts','project.mjs'),path.join(tmp,'scripts','project.mjs'));
  cpSync(path.join(ROOT,'templates','reel'),path.join(tmp,'templates','reel'),{recursive:true});
  writeFileSync(path.join(tmp,'PROJECTS.json'),JSON.stringify({projects:[]}));
  const r=spawnSync(process.execPath,['scripts/project.mjs','create','futuro-reel','Un nuevo documental'],{cwd:tmp,encoding:'utf8'});
  assert.equal(r.status,0,r.stderr);
  const f=path.join(tmp,'projects','futuro-reel');
  const brief=readFileSync(path.join(f,'CREATIVE_BRIEF.md'),'utf8');
  const handoff=readFileSync(path.join(f,'HANDOFF.md'),'utf8');
  const state=JSON.parse(readFileSync(path.join(f,'STATE.json'),'utf8'));
  const index=JSON.parse(readFileSync(path.join(tmp,'PROJECTS.json'),'utf8'));
  assert.match(brief,/Un nuevo documental/);
  assert.match(brief,/futuro-reel/);
  assert.match(brief,/Investigaci[oó]n/);
  assert.match(brief,/Prompt maestro/);
  assert.match(brief,/Preproducci[oó]n obligatoria/);
  assert.match(brief,/Material REAL ideal/);
  assert.match(brief,/Uso responsable de material real e IA/);
  assert.match(brief,/Auditor[ií]a/);
  assert.doesNotMatch(brief,/__SLUG__|__TITLE__/);
  assert.match(handoff,/CREATIVE_BRIEF.md/);
  assert.match(state.nextTask,/Investigar referentes/);
  assert.equal(index.projects[0].id,'futuro-reel');
 }finally{rmSync(tmp,{recursive:true,force:true});}
});
