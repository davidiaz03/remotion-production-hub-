import {test} from 'node:test';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import {ROOT} from '../scripts/lib.mjs';
const run=(...args)=>spawnSync(process.execPath,['scripts/operate.mjs',...args],{cwd:ROOT,encoding:'utf8'});
test('saving on main or detached ref fails closed',()=>{const x=run('save','demo');if(x.status===0)assert.match(x.stdout,/"status":"unchanged"/);else assert.match(x.stderr,/branch|origin|remote|work\//i)});
test('approval needs explicit user confirmation',()=>{const x=run('approve','demo','--revision','demo-cut-002');assert.notEqual(x.status,0);assert.match(x.stderr,/human editorial approval/i)});
test('safe recovery without a snapshot refuses guessing from MP4',()=>{const x=run('recover','demo','--revision','does-not-exist');assert.notEqual(x.status,0)});
