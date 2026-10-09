import {parseArgs,loadProject} from './lib.mjs';
const {opts,pos}=parseArgs(process.argv.slice(2));const project=opts.project||pos[0];loadProject(project);
const mode=opts.mode||'quick';if(!['quick','full'].includes(mode))throw Error('Invalid mode');
if(mode==='full'&&opts.approve!=='EXPORTAR-MASTER')throw Error('Master not approved');
if(process.env.GITHUB_ACTIONS==='true'){
 if(process.env.GITHUB_REPOSITORY_PRIVATE!=='false')throw Error('FAIL CLOSED: Actions renders disabled on private repos, where minutes may be billable');
 if(process.env.RUNNER_OS!=='Linux')throw Error('Only standard hosted Linux runners permitted');
 if(process.env.RUNNER_NAME?.includes('larger'))throw Error('No larger runners allowed');
 if(!process.env.GITHUB_SHA)throw Error('Missing commit SHA');
}
console.log(JSON.stringify({project,mode,freePolicy:'public-repository-standard-ubuntu-only',billablePrivateRendersAllowed:false,masterAuthorized:mode==='full',note:'Github billing balance not accessible here; fail closed for private repositories.'}));
