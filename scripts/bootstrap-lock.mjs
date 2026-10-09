import {writeFileSync, existsSync, readFileSync} from 'node:fs';
const url='https://raw.githubusercontent.com/izquierdodavid528-code/Chat-gpt-work-/599a58a1cef9e4f4d29afa27f229b11bd345272c/projects/che-october-1967-reel-2026/package-lock.json';
if(existsSync('package-lock.json')) throw Error('Lockfile already exists; aborting');
const r=await fetch(url);if(!r.ok)throw Error(`Pinned historical dependency lock unavailable: HTTP ${r.status}`);
const lock=await r.json();const p=JSON.parse(readFileSync('package.json','utf8'));
if(!lock.packages?.['']||!lock.packages['node_modules/remotion'])throw Error('Historical lock is incomplete');
for(const k of ['dependencies','devDependencies'])for(const [name,version] of Object.entries(p[k])){
 if(!lock.packages['']?.[k] || lock.packages[''][k][name]!==version)throw Error(`Dependency ${name}@${version} does not match pinned history`);
}
lock.name=p.name;lock.version=p.version;lock.packages[''].name=p.name;lock.packages[''].version=p.version;
writeFileSync('package-lock.json',JSON.stringify(lock,null,2)+'\n',{flag:'wx'});
console.log('Created exact lock from Git commit 599a58a1...; audit & commit it.');
