import {existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
const config=process.env.RCLONE_CONFIG||path.join(os.homedir(),'.config','rclone','rclone.conf');
if(!existsSync(config)){console.error('Drive credentials missing. See docs/DRIVE.md.');process.exit(2);}
const p=spawnSync('rclone',['lsf','media:Remotion Production/projects','--dirs-only','--max-depth','1'],{encoding:'utf8',timeout:45000,maxBuffer:262144});
if(p.status!==0||p.error){console.error('Drive read check failed; check authorization and remote media. No data changed.');process.exit(3);}
console.log(JSON.stringify({status:'read_verified',upload:false,writeVerified:false,render:false}));
