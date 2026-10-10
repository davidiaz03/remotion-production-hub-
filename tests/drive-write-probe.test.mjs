import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
const check=overrides=>spawnSync(process.execPath,['scripts/drive-write-probe.mjs'],{
 cwd:root,encoding:'utf8',timeout:10000,
 env:{...process.env,GITHUB_ACTIONS:'true',GITHUB_EVENT_NAME:'workflow_dispatch',
 GITHUB_REF:'refs/heads/main',GITHUB_REPOSITORY:'davidiaz03/remotion-production-hub-',
 GITHUB_RUN_ID:'935710',GITHUB_RUN_ATTEMPT:'1',RCLONE_CONFIG:'/does/not/exist',
 ...overrides}
});
test('write probe refuses a work branch before connecting',()=>{
 const r=check({GITHUB_REF:'refs/heads/work/test'});
 assert.notEqual(r.status,0);assert.match(r.stderr,/Write probe refused/);
});
test('write probe refuses a different repository before connecting',()=>{
 const r=check({GITHUB_REPOSITORY:'other/repo'});
 assert.notEqual(r.status,0);assert.match(r.stderr,/Write probe refused/);
});
test('write probe refuses non-manual events before connecting',()=>{
 const r=check({GITHUB_EVENT_NAME:'push'});
 assert.notEqual(r.status,0);assert.match(r.stderr,/Write probe refused/);
});
test('write probe refuses an unconfigured rclone remote',()=>{
 const r=check({});
 assert.notEqual(r.status,0);assert.match(r.stderr,/No rclone configuration/);
});
