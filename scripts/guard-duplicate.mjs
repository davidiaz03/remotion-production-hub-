import {spawnSync} from 'node:child_process';
import {loadProject,parseArgs,assertDrivePath} from './lib.mjs';
const {opts}=parseArgs(process.argv.slice(2));const {data}=loadProject(opts.project);
if(!/^[a-zA-Z0-9_.-]+\.mp4$/.test(opts.file??''))throw Error('Unsafe name');
const remote=`media:${assertDrivePath(data.drivePath)}/masters/${opts.file}`;
const r=spawnSync('rclone',['lsjson',remote],{encoding:'utf8'});
if(r.status===0){try{const info=JSON.parse(r.stdout);if(Array.isArray(info)&&info.length>0||!Array.isArray(info)&&info.Name)throw Error('Duplicate master already present in Drive: '+opts.file)}catch(e){if(e instanceof SyntaxError)throw Error('Could not parse remote duplicate check');throw e}}
else if(!/not found|directory not found|object not found|doesn't exist/i.test((r.stderr||'')+(r.stdout||'')))throw Error('Drive duplicate check failed (fail closed): '+String(r.stderr).slice(0,400));
console.log('Drive has no existing master with this project+commit filename.');
