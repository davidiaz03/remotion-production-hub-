import {existsSync,mkdirSync,writeFileSync,chmodSync} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
const input=process.env.RCLONE_CONFIG_B64;
if(!input){console.log('RCLONE_CONFIG_B64 not supplied; relying on already configured local rclone.');process.exit(0)}
if(!/^[A-Za-z0-9+/\s]+={0,2}$/.test(input))throw Error('Invalid encoded Rclone config');
const dir=process.env.RUNNER_TEMP||path.join(os.homedir(),'.config','rclone');
mkdirSync(dir,{recursive:true});const file=path.join(dir,'remotion-rclone.conf');
writeFileSync(file,Buffer.from(input,'base64'),{mode:0o600});chmodSync(file,0o600);
const gh=process.env.GITHUB_ENV;
if(gh){const {appendFileSync}=await import('node:fs');appendFileSync(gh,`RCLONE_CONFIG=${file}\n`)}
console.log('Rclone credential written outside the repository. Never commit this file.');
