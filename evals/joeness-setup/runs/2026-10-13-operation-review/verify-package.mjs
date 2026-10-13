import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const here=fileURLToPath(new URL('.',import.meta.url)),repo=resolve(here,'../../../..');
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const ps7='C:/Users/tjdwo/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/powershell/pwsh.exe';
const commands=[
 [process.execPath,'--test',...['setup-contract','setup-fixtures','review-gate','roadmap-review','operation-review'].map(n=>'tests/joeness-'+n+'.tests.mjs')],
 ['powershell.exe','-NoProfile','-ExecutionPolicy','Bypass','-File','tests/joeness-release.tests.ps1'],
 ...['powershell.exe',ps7].flatMap(shell=>['project-setup','install'].map(n=>[shell,'-NoProfile','-ExecutionPolicy','Bypass','-File','tests/joeness-'+n+'.tests.ps1'])),
 ['python','-X','utf8','C:/Users/tjdwo/.codex/skills/.system/skill-creator/scripts/quick_validate.py','skills/joeness-setup'],
 ['git','diff','--check']
];
const before=sha(join(repo,'vendor/source-manifest.json')),results=[];
const from=Number(process.argv[2]??0),name=process.argv[3]??'package-regression.json';
if(!Number.isInteger(from)||from<0||from>=commands.length||!/^package-regression(?:-[a-z0-9]+)?\.json$/.test(name)||existsSync(join(here,name)))throw Error('Use a new bounded output name; never overwrite prior results');
for(const command of commands.slice(from)){
 // A Node parent inherits PS7's PSModulePath; unlike a direct pwsh -> PS5
 // invocation, it does not remove incompatible PS7 module roots for PS5.
 const env={...process.env};
 if(command[0]==='powershell.exe')for(const k of Object.keys(env))if(k.toLowerCase()==='psmodulepath')delete env[k];
 const r=spawnSync(command[0],command.slice(1),{cwd:repo,encoding:'utf8',env,timeout:240000,maxBuffer:4*1024*1024});
 results.push({command,module_path:command[0]==='powershell.exe'?'PS5 default discovery, inherited PS7 path omitted':'inherited',exit:r.status,signal:r.signal,error:r.error?.message??null,stdout:r.stdout,stderr:r.stderr});
 console.log(JSON.stringify({command,exit:r.status}));
 writeFileSync(join(here,name),JSON.stringify({stage:'local-source-candidate-not-hosted-release',manifest_sha256:before,results},null,2)+'\n');
 if(r.status!==0||r.error){process.exitCode=1;break;}
}
if(before!==sha(join(repo,'vendor/source-manifest.json')))throw Error('Source manifest changed during run');
