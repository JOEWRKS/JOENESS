// Runs the repository's existing Windows workflow commands; no model evaluation.
import {spawnSync} from 'node:child_process';
import {writeFileSync,existsSync,readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const here=fileURLToPath(new URL('.',import.meta.url)),repo=resolve(here,'../../../..');
const output=process.argv[2];assert.match(output,/^[a-z0-9-]+\.json$/);
const destination=join(here,output);assert.ok(!existsSync(destination),'Keep prior evidence');
const hash=p=>createHash('sha256').update(readFileSync(join(repo,p))).digest('hex');
const env={...process.env};for(const k of Object.keys(env))if(k.toLowerCase()==='psmodulepath')delete env[k];
const run=(cmd,args)=>{const r=spawnSync(cmd,args,{cwd:repo,env,encoding:'utf8',timeout:600000,maxBuffer:8*1024*1024});return {command:[cmd,...args],exit:r.status,error:r.error?.message??null,stdout:r.stdout,stderr:r.stderr};};
const commands=[
 ['powershell.exe','-NoProfile','-ExecutionPolicy','Bypass','-File','tests/joeness-release.tests.ps1'],
 ['pwsh','-NoProfile','-File','tests/joeness-project-setup.tests.ps1'],
 ['powershell.exe','-NoProfile','-ExecutionPolicy','Bypass','-File','tests/joeness-project-setup.tests.ps1'],
 ['powershell.exe','-NoProfile','-ExecutionPolicy','Bypass','-File','tests/joeness-install.tests.ps1'],
 ['pwsh','-NoProfile','-File','tests/joeness-install.tests.ps1'],
 [process.execPath,'--test',...['setup-contract','setup-fixtures','review-gate','roadmap-review','operation-review','impact-review'].map(n=>`tests/joeness-${n}.tests.mjs`)],
 ['git','diff','--check']
];
const record={timestamp:new Date().toISOString(),head:run('git',['rev-parse','HEAD']).stdout.trim(),manifest_sha256:hash('vendor/source-manifest.json'),template_sha256:hash('skills/joeness-setup/assets/AGENTS.md'),commands:[]};
for(const [cmd,...args] of commands){const result=run(cmd,args);record.commands.push(result);writeFileSync(destination,JSON.stringify(record,null,2)+'\n');console.log(JSON.stringify({command:result.command,exit:result.exit}));if(result.exit!==0)process.exit(1);}
