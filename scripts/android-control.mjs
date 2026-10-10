import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {execFileSync,spawnSync} from 'node:child_process';
import path from 'node:path';

// A Git-private selection, never committed or published.
const root=path.resolve(process.cwd());
const [action,idArg]=process.argv.slice(2);
const available=new Set(['open','save','status','publish','recover']);
function activeFile(){
 const rel=execFileSync('git',['rev-parse','--git-path','remotion-hub-active-project'],{cwd:root,encoding:'utf8'}).trim();
 if(!rel)throw Error('Not a Git workspace');
 return path.isAbsolute(rel)?rel:path.resolve(root,rel);
}
function known(id){
 if(!/^[a-z0-9][a-z0-9-]*$/.test(id||''))throw Error('Invalid project identifier');
 const index=JSON.parse(readFileSync(path.join(root,'PROJECTS.json'),'utf8'));
 if(!index.projects?.some(p=>p.id===id) || !existsSync(path.join(root,'projects',id,'project.json')))
  throw Error('Project does not exist: '+id);
 return id;
}
if(action==='select'){
 const id=known(idArg);
 writeFileSync(activeFile(),id+'\n',{mode:0o600});
 console.log('Proyecto activo en este Codespace: '+id+'. Ahora puedes usar las tareas Android sin ventanas.');
}else if(action==='whoami'){
 const file=activeFile();
 if(!existsSync(file))console.log('No hay proyecto activo. Ejecuta: npm run use -- demo');
 else console.log('Proyecto activo: '+known(readFileSync(file,'utf8').trim()));
}else if(available.has(action)){
 const file=activeFile();
 if(!existsSync(file))throw Error('Selecciona el proyecto una sola vez: npm run use -- demo (o el ID de tu proyecto)');
 const id=known(readFileSync(file,'utf8').trim());
 const args=['scripts/operate.mjs',action,id];
 if(action==='save')args.push('--note','Guardado desde el menu Android');
 // Recovery is a read-only plan. Approval and rendering are not shortcuts.
 const result=spawnSync(process.execPath,args,{cwd:root,stdio:'inherit'});
 if(result.error)throw result.error;
 process.exitCode=result.status??1;
}else{
 throw Error('Opciones: select <proyecto> | whoami | open | save | status | publish | recover');
}
