import {readdirSync,existsSync,rmSync,statSync} from 'node:fs';
import path from 'node:path';
import {ROOT,parseArgs} from './lib.mjs';
const {opts}=parseArgs(process.argv.slice(2));const execute=!!opts.execute;
const targets=[path.join(ROOT,'.cache')];
for(const slug of readdirSync(path.join(ROOT,'projects'))){
 const dir=path.join(ROOT,'projects',slug);
 if(!statSync(dir).isDirectory())continue;
 targets.push(path.join(dir,'out'));
 if(opts.reports)targets.push(path.join(dir,'reports'));
}
// This script never touches public/, project sources, manifests, Drive, git, or protected original files.
for(const target of targets){
 if(!existsSync(target))continue;
 const relative=path.relative(ROOT,target);
 if(!/^\.cache(?:\/|$)|^projects\/[a-z0-9-]+\/(?:out|reports)$/.test(relative.replaceAll(path.sep,'/')))throw Error('Unsafe cleanup target');
 console.log(`${execute?'DELETE':'DRY-RUN'} ${relative}`);
 if(execute)rmSync(target,{recursive:true,force:true});
}
