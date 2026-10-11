import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const slug='boca-sama-55-2026',home=path.join(root,'projects',slug);
const read=(name)=>readFileSync(path.join(home,name),'utf8');

test('Boca de Sama vertical independent documentary preserves master approval gate',()=>{
 const idx=JSON.parse(readFileSync(path.join(root,'PROJECTS.json'),'utf8'));
 assert.equal(idx.projects.filter(x=>x.id===slug).length,1);
 const p=JSON.parse(read('project.json')),state=JSON.parse(read('STATE.json'));
 assert.equal(p.compositionId,'MainReel');
 assert.equal(p.fps,30); assert.equal(p.width,1080);assert.equal(p.height,1920);
 assert.equal(p.durationInFrames,1650);
 assert.equal(state.approvedRevision,null);
 assert.equal(state.latestSnapshot,null);
 for(const n of ['src/Video.tsx','src/Editorial.tsx','src/index.ts','src/Root.tsx','HANDOFF.md','CREATIVE_BRIEF.md'])assert.ok(existsSync(path.join(home,n)),n);
 assert.match(read('src/Video.tsx'),/NO PUBLICAR|CORTE NO PUBLICABLE/);
 const shots=read('src/Video.tsx');
 assert.match(shots,/edit\.map\(/);
 assert.match(shots,/start:1470,len:180/);
 assert.match(shots,/SceneTransition/);
 const manifest=JSON.parse(read('asset-manifest.json'));
 assert.ok(manifest.files.length>=5);
 for(const entry of manifest.files){
  assert.match(entry.sha256,/^[a-f0-9]{64}$/);
  assert.ok(entry.bytes>0);
  assert.ok(entry.path&&!entry.path.includes('..'));
 }
});
test('music is replaceable and separate from survivor interviews',()=>{
 const s=read('src/Video.tsx');
 assert.match(read('src/Editorial.tsx'),/weight-of-memory_TEMP_MUSIC/);
 assert.match(s,/<Audio /);
 assert.match(read('src/Editorial.tsx'),/muted/);
 assert.match(s,/NANCY PAVÓN/);
 assert.match(s,/CARLOS ESCALANTE/);
});

test('Nancy full onset visual lip sync and measured envelope must match the V40 audio source',()=>{
 const v=read('src/Video.tsx');
 const wave=read('src/VoiceWaveforms.ts');
 const reg=read('src/Editorial.tsx');
 const manifest=JSON.parse(read('asset-manifest.json'));
 assert.match(v,/earlySeek=\{49\.08\} voiceFrames=\{184\} voiceStart=\{49\.08\} voiceFile=\{assets\.voiceNancyComplete\}/);
 assert.match(v,/720,904,922,1010/);
 assert.match(reg,/voiceNancyComplete:'boca-sama-v40-nancy-full-sufro-ORIGINAL-REVIEW.wav'/);
 const meta=manifest.files.find(x=>x.path==='boca-sama-v40-nancy-full-sufro-ORIGINAL-REVIEW.wav');
 assert.ok(meta,'restored word must use a SHA-verified original');
 assert.equal(meta.bytes,588878);
 assert.equal(meta.sha256,'20b5a45e85f6489ac82f0bb012b25f428ae686027e1bc23eadf962164a350f18');
 const arr=wave.match(/nancy:\[([^\]]+)\]/);
 assert.ok(arr);
 const bins=arr[1].split(',').map(Number);
 assert.equal(bins.length,62,'100ms bins must cover the restored 6.13 s Nancy voice');
 assert.ok(bins.every(x=>Number.isInteger(x)&&x>=1&&x<=100));
});
