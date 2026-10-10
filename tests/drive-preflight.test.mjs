import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const root=process.cwd();
function check(withConfig,fail){
 const temp=mkdtempSync(path.join(tmpdir(),'drive-preflight-test-'));
 try{
 const home=path.join(temp,'home'),bin=path.join(temp,'bin');
 mkdirSync(bin);mkdirSync(home);
 const cfg=path.join(temp,'rclone.conf');
 if(withConfig)writeFileSync(cfg,'[media]\ntype = drive\n');
 writeFileSync(path.join(bin,'rclone'),'#!/bin/sh\necho sensitive-data >&2\nexit '+(fail?'1':'0')+'\n',{mode:0o755});
 return spawnSync(process.execPath,['scripts/drive-preflight.mjs'],{cwd:root,encoding:'utf8',env:{...process.env,HOME:home,RCLONE_CONFIG:cfg,PATH:bin+':'+process.env.PATH}});
 }finally{rmSync(temp,{recursive:true,force:true});}
}
test('Drive connectivity preflight works without exposing provider output',()=>{const r=check(true,false);assert.equal(r.status,0,r.stderr);assert.equal(JSON.parse(r.stdout).status,'read_verified');assert.doesNotMatch(r.stdout+r.stderr,/sensitive-data/);});
test('Drive preflight fails without credentials',()=>{assert.equal(check(false,false).status,2);});
test('Drive preflight masks errors and fails closed',()=>{const r=check(true,true);assert.equal(r.status,3);assert.doesNotMatch(r.stdout+r.stderr,/sensitive-data/);});
