import {existsSync,statSync,writeFileSync,mkdirSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {loadProject,parseArgs,run,assertDrivePath} from './lib.mjs';
import {sha256} from './verify-assets.mjs';
const {pos,opts}=parseArgs(process.argv.slice(2));const project=opts.project||pos[0];
const {home,data}=loadProject(project);
const local=path.resolve(opts.file||'');
if(!local.startsWith(path.join(home,'out')+path.sep)||!existsSync(local))throw Error('Delivery must be an existing project out/ file');
if(!/^[A-Za-z0-9_.-]+\.mp4$/.test(path.basename(local)))throw Error('Unsafe output file name');
if(!process.env.RCLONE_CONFIG&&!existsSync(path.join(process.env.HOME||'','.config/rclone/rclone.conf')))throw Error('Drive credentials unavailable');
const base=assertDrivePath(data.drivePath),file=path.basename(local);
const remoteDir=`media:${base}/masters`,dest=`${remoteDir}/${file}`;
const report={project,file,bytes:statSync(local).size,sha256:await sha256(local),gitSha:process.env.SOURCE_SHA||process.env.GITHUB_SHA||'local',revision:process.env.RENDER_REVISION||'unversioned',runId:process.env.GITHUB_RUN_ID||'local',status:'transfer_pending'};
// A duplicate master with the same basename cannot be silently overwritten.
const ls=spawnSync('rclone',['lsf',dest],{encoding:'utf8'});
if(ls.status===0&&ls.stdout.trim())throw Error('Remote file already exists; version the filename and review the previous delivery');
run('rclone',['copyto',local,dest,'--retries','2']);
// Verify remote content using provider checksums; --download forces content verification.
run('rclone',['check',path.dirname(local),remoteDir,'--include',file,'--one-way','--download','--retries','2']);
const lk=spawnSync('rclone',['link',dest],{encoding:'utf8'});
report.status='uploaded_checksum_verified';
if(lk.status===0)report.driveUrl=lk.stdout.trim();
const dir=path.join(home,'reports');mkdirSync(dir,{recursive:true});
writeFileSync(path.join(dir,'drive-delivery.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
