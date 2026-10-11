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

test('memory transition keeps outgoing image underneath incoming fade',()=>{
 const v=read('src/Video.tsx');
 const sceneRegex=/\{start:(\d+),len:(\d+),mode:'(cut|fade|left|right)' as const,element:/g;
 const segments=[...v.matchAll(sceneRegex)].map(m=>({start:Number(m[1]),len:Number(m[2]),mode:m[3]}));
 assert.equal(segments.length,8);
 const overlap=12;
 for(let i=1;i<segments.length;i++){
  const current=segments[i],previous=segments[i-1];
  if(current.mode!=='cut')assert.ok(previous.start+previous.len>=current.start+overlap,
   'Transition to scene '+i+' starts over uncovered black frames');
  else assert.ok(previous.start+previous.len>=current.start,
   'Cut to scene '+i+' contains a temporal gap');
 }
 assert.equal(segments[segments.length-1].start+segments[segments.length-1].len,1650);
 assert.equal(segments[5].len,282,'Carlos footage must remain under memory fade for 12 frames');
});

test('full draft render workflows use a supported H264 pixel format',()=>{
 const workflow=readFileSync(path.join(root,'.github/workflows/boca-sama-v44-full-transition-review.yml'),'utf8');
 assert.match(workflow,/--codec h264 --pixel-format yuv420p/);
 assert.doesNotMatch(workflow,/--pixel-format yuv440p/);
});

test('unverified witness subtitle drafts remain disabled and nonoverlapping',()=>{
 const c=read('src/TestimonyCaptionsV28.ts');
 const entries=[...c.matchAll(/\{from:(\d+),to:(\d+),words:'[^']+',verified:(true|false)\}/g)]
   .map(x=>({from:Number(x[1]),to:Number(x[2]),verified:x[3]==='true'}));
 assert.equal(entries.length,6,'Require six provisional subtitle groups');
 assert.ok(entries.every(e=>!e.verified),'Unverified testimony may never be published by tests');
 for(let i=0;i<entries.length;i++){
  assert.ok(entries[i].to>entries[i].from);
  if(i>0)assert.ok(entries[i].from>=entries[i-1].to);
 }
 assert.ok(entries[0].from>=720&&entries[1].to<=904);
 assert.ok(entries[2].from>=1020&&entries[5].to<=1272);
 const editorial=read('src/Editorial.tsx');
 const video=read('src/Video.tsx');
 const root=read('src/Root.tsx');
 assert.match(editorial,/reviewOnly=false/,'production captions must default to verified-only');
 assert.match(editorial,/\(c\.verified\|\|reviewOnly\)&&f>=c\.from&&f<c\.to/);
 assert.match(video,/CaptionTrack captions=\{testimonyCaptionDraftV28\} reviewOnly=\{false\}/);
 assert.match(root,/id="CaptionReviewReel"/,'unverified captions belong in a separate composition');
});
