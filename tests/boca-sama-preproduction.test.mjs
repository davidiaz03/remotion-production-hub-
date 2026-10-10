import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const slug = 'boca-sama-55-2026';
const home = path.join(root, 'projects', slug);
const read = name => readFileSync(path.join(home,name),'utf8');

test('independent Boca de Sama documentary is registered and constrained to preproduction', () => {
 const idx = JSON.parse(readFileSync(path.join(root,'PROJECTS.json'),'utf8'));
 assert.equal(idx.projects.filter(x => x.id === slug).length, 1);
 const config = JSON.parse(read('project.json'));
 const state = JSON.parse(read('STATE.json'));
 assert.equal(config.compositionId,'MainReel');
 assert.equal(config.fps,30);
 assert.equal(config.width,1080);
 assert.equal(config.height,1920);
 assert.equal(config.durationInFrames,1650);
 assert.equal(config.audioRequired,false);
 assert.equal(state.phase,'preproduction');
 assert.equal(state.approvedRevision,null);
 assert.equal(state.latestSnapshot,null);
 assert.deepEqual(JSON.parse(read('asset-manifest.json')).files,[]);
 for(const file of ['src/Video.tsx','src/index.ts','src/Root.tsx','HANDOFF.md','CREATIVE_BRIEF.md']) assert.ok(existsSync(path.join(home,file)),file);
 const tsx = read('src/Video.tsx');
 assert.match(tsx,/NO PUBLICAR/);
 assert.match(tsx,/ARCHIVO REAL PENDIENTE/);
 assert.equal((tsx.match(/start:\\d+,duration:/g)||[]).length,0);
 assert.match(read('CREATIVE_BRIEF.md'),/Fuentes y referencias/);
});
