import {spawnSync,execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve,join} from 'node:path';
const here=fileURLToPath(new URL('.',import.meta.url)),repo=resolve(here,'../../../..');
const out=join(here,'checks.json'); if(existsSync(out))throw Error('Preserve existing evidence');
const commands=[
 ['git',['rev-parse','--is-shallow-repository']],
 ['powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File','tests/joeness-release.tests.ps1']],
 ...['pwsh','powershell.exe'].flatMap(shell=>['joeness-project-setup','joeness-install'].map(name=>[shell,['-NoProfile','-ExecutionPolicy','Bypass','-File',`tests/${name}.tests.ps1`]])),
 [process.execPath,['--test',...['joeness-setup-contract','joeness-setup-fixtures','joeness-review-gate','joeness-roadmap-review','joeness-operation-review','joeness-impact-review'].map(n=>`tests/${n}.tests.mjs`)]],
 ['python',['C:/Users/tjdwo/.codex/skills/.system/skill-creator/scripts/quick_validate.py','skills/joeness-setup']],
 ['git',['diff','--check']]
];
const results=[];
for(const [command,args]of commands){const start=Date.now(),r=spawnSync(command,args,{cwd:repo,encoding:'utf8',maxBuffer:8e6,env:{...process.env,PYTHONUTF8:'1'}});results.push({command,args,exit:r.status,error:r.error?.message,elapsedMs:Date.now()-start,output:r.stdout+r.stderr});writeFileSync(out,JSON.stringify({results},null,2)+'\n');console.log(command,args.join(' '),'EXIT',r.status);}
const old=execFileSync('git',['show','HEAD:skills/joeness-setup/assets/AGENTS.md'],{cwd:repo});const current=readFileSync(join(repo,'skills/joeness-setup/assets/AGENTS.md'));
const metrics=b=>({bytes:b.length,words:b.toString().trim().split(/\s+/u).length,lines:b.toString().split('\n').length,sha256:createHash('sha256').update(b).digest('hex')});
const manifest=JSON.parse(execFileSync('git',['show','HEAD:vendor/source-manifest.json'],{cwd:repo,encoding:'utf8'}));
const payload=manifest.publicSkills[0].files.map(({path})=>({path,unchanged:execFileSync('git',['show',`HEAD:skills/joeness-setup/${path}`],{cwd:repo}).equals(readFileSync(join(repo,'skills/joeness-setup',path)))}));
writeFileSync(out,JSON.stringify({results,template:{before:metrics(old),after:metrics(current)},payload},null,2)+'\n');
