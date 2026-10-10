import {createHash} from 'node:crypto';
import {existsSync,mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir,homedir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

// Only manually triggered Actions in canonical main may WRITE.
// Creates one small file in a dedicated, non-project diagnostics folder.
// It never deletes remote files, renders media, or changes project content.
function context(env){
 if(env.GITHUB_ACTIONS!=='true'||env.GITHUB_EVENT_NAME!=='workflow_dispatch'||
    env.GITHUB_REF!=='refs/heads/main'||env.GITHUB_REPOSITORY!=='davidiaz03/remotion-production-hub-')
  throw Error('Write probe refused: only manual dispatch on canonical main is allowed.');
 for(const k of ['GITHUB_RUN_ID','GITHUB_RUN_ATTEMPT'])
  if(!/^[1-9][0-9]{0,17}$/.test(env[k]||''))throw Error('Invalid Actions run identity.');
 const cfg=env.RCLONE_CONFIG||path.join(homedir(),'.config','rclone','rclone.conf');
 if(!existsSync(cfg))throw Error('No rclone configuration; upload blocked.');
 return {run:env.GITHUB_RUN_ID,attempt:env.GITHUB_RUN_ATTEMPT};
}
function rclone(...args){
 const p=spawnSync('rclone',args,{encoding:'utf8',timeout:90000,maxBuffer:262144});
 if(p.error||p.status!==0)throw Error('Drive operation failed; inspect authorization privately. No remote deletion attempted.');
}
const sha=b=>createHash('sha256').update(b).digest('hex');
try{
 const {run,attempt}=context(process.env);
 const folder='media:Remotion Production/projects/_system-tests/scratch';
 const name='write-probe-'+run+'-'+attempt+'.txt';
 const target=folder+'/'+name;
 const payload=Buffer.from('Remotion Production Hub - Drive write diagnostic\nRun='+run+'\nAttempt='+attempt+'\nNo private media or secrets.\n','utf8');
 const temp=mkdtempSync(path.join(tmpdir(),'hub-drive-write-'));
 try{
  const local=path.join(temp,'source.txt'),download=path.join(temp,'readback.txt');
  writeFileSync(local,payload,{mode:0o600});
  rclone('mkdir',folder);
  rclone('copyto',local,target,'--immutable','--transfers','1','--checkers','1');
  rclone('copyto',target,download,'--transfers','1','--checkers','1');
  const got=readFileSync(download);
  if(got.length!==payload.length||sha(got)!==sha(payload))
   throw Error('SHA-256 mismatch on downloaded diagnostic; no remote deletion performed.');
  console.log(JSON.stringify({status:'write_and_readback_verified',remotePath:'Remotion Production/projects/_system-tests/scratch/'+name,bytes:payload.length,sha256:sha(payload),deletedFiles:false,rendered:false}));
 }finally{rmSync(temp,{recursive:true,force:true,maxRetries:2});}
}catch(e){console.error(e instanceof Error?e.message:'Write verification failed.');process.exitCode=1;}
