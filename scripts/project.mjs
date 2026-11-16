import {cpSync,existsSync,mkdirSync,readFileSync,readdirSync,writeFileSync,rmSync} from 'node:fs';
import path from 'node:path';
import {ROOT,projectPath,loadProject,requireFile,run,parseArgs} from './lib.mjs';
import {defaultPipeline} from './state.mjs';
const [action,...rest]=process.argv.slice(2);
const {pos,opts}=parseArgs(rest);
if(!action)throw Error('Use: create|studio|render|compositions PROJECT');
const projectId=opts.project||pos[0];
if(action==='create'){
 const target=projectPath(projectId);if(existsSync(target))throw Error('Project already exists; refusing overwrite');
 const indexFile=path.join(ROOT,'PROJECTS.json');
 const index=JSON.parse(readFileSync(indexFile,'utf8'));
 if(!Array.isArray(index.projects)||index.projects.some(x=>x.id===projectId))throw Error('Invalid index or duplicate project; refusing modification');
 const title=pos.slice(1).join(' ')||projectId.replaceAll('-',' ').toUpperCase();
 const template=String(opts.template||'reel');
 const templateDir=path.join(ROOT,'templates',template);
 if(!existsSync(templateDir))throw Error(`Unknown template: ${template} (available: ${readdirSync(path.join(ROOT,'templates')).filter((d)=>existsSync(path.join(ROOT,'templates',d,'project.json'))).join(', ')})`);
 cpSync(templateDir,target,{recursive:true});
 for(const f of ['project.json','src/Video.tsx','CREATIVE_BRIEF.md']){
  const p=path.join(target,f);
  writeFileSync(p,readFileSync(p,'utf8').replaceAll('__SLUG__',projectId).replaceAll('__TITLE__',title));
 }
 // --mute: proyecto deliberadamente sin audio (el default de
 // motion-reel es audioRequired=true y el QA fallaría en seco).
 const mute=opts.mute===true||opts.mute==='true';
 if(mute){
  const pj=path.join(target,'project.json');
  const d=JSON.parse(readFileSync(pj,'utf8'));
  d.audioRequired=false;
  writeFileSync(pj,JSON.stringify(d,null,2)+'\n');
 }
 mkdirSync(path.join(target,'public'),{recursive:true});writeFileSync(path.join(target,'public','.gitkeep'),'');
 const state={schema:'remotion-hub.state/v1',id:projectId,title,objective:title,phase:'editing',compositionId:'MainReel',latestSnapshot:null,approvedRevision:null,completed:[],pending:[],nextTask:'Investigar referentes, escribir estrategia y prompts propios en CREATIVE_BRIEF.md; luego editar y guardar',updatedAt:new Date().toISOString(),pipeline:defaultPipeline()};
 writeFileSync(path.join(target,'STATE.json'),JSON.stringify(state,null,2)+'\n');
 writeFileSync(path.join(target,'HANDOFF.md'),`# ${title}\n\nIdentificador: \`${projectId}\`\n\nObjetivo: ${title}\n\nLeer CREATIVE_BRIEF.md y docs/CREATIVE_DIRECTION_PROTOCOL.md: ChatGPT debe investigar, proponer sus prompts y estrategia, ejecutar y auditar con iniciativa propia.\nVer STATE.json y PROJECTS.json.\nNo hay revisiones aprobadas.\n`);
 index.projects.push({id:projectId,title,latestSnapshot:null,approvedRevision:null,nextTask:state.nextTask,updatedAt:state.updatedAt});
 writeFileSync(indexFile,JSON.stringify(index,null,2)+'\n');
 console.log(`Created projects/${projectId} with persistent state${mute?' (proyecto mudo: audioRequired=false)':''}. Edit src/Video.tsx, then npm run studio -- ${projectId}`);
 process.exit(0);
}
const {home,data}=loadProject(projectId);
const entry=requireFile(path.join(home,'src/index.ts'));
const publicDir=path.join(home,'public');
const cli=requireFile(path.join(ROOT,'node_modules/@remotion/cli/remotion-cli.js'));
const common=[cli];
if(action==='studio'){
 run(process.execPath,[...common,'studio',entry,'--public-dir',publicDir,'--port',String(opts.port||3000)]);
}else if(action==='compositions'){
 run(process.execPath,[...common,'compositions',entry,'--public-dir',publicDir]);
}else if(action==='render'){
 const mode=opts.mode||'quick';if(!['quick','full'].includes(mode))throw Error('mode must be quick or full');
 if(mode==='full'&&opts.approve!=='EXPORTAR-MASTER')throw Error('Master render requires --approve EXPORTAR-MASTER');
 const range=String(opts.frames??`0-${Math.min(data.durationInFrames,58)-1}`);
 if(mode==='quick'){
  if(!/^\d+-\d+$/.test(range))throw Error('Quick frames must be FROM-TO');
  const [start,end]=range.split('-').map(Number);
  if(start<0||end<start||end>=data.durationInFrames||end-start+1>90)throw Error('Quick render limited to 1-90 frames inside the composition');
 }
 const outDir=path.join(home,'out');mkdirSync(outDir,{recursive:true});
 const out=path.resolve(opts.output||path.join(outDir,`${projectId}-${mode}.mp4`));
 if(!out.startsWith(outDir+path.sep))throw Error('Output must be inside the project out/ directory');
 const args=[...common,'render',entry,data.compositionId,out,'--public-dir',publicDir,
  '--codec','h264','--pixel-format','yuv420p','--crf',String(data.crf??19),
  '--concurrency',String(opts.concurrency??'2'),'--log','info'];
 if(opts.timeout)args.push('--timeout',String(opts.timeout));
 if(mode==='quick')args.push('--frames',range);
 console.log(JSON.stringify({engine:'remotion',project:projectId,mode,composition:data.compositionId,frames:mode==='quick'?range:`0-${data.durationInFrames-1}`,output:out}));
 run(process.execPath,args);
 console.log(`RENDER_OUTPUT=${out}`);
}else throw Error(`Unknown action ${action}`);
