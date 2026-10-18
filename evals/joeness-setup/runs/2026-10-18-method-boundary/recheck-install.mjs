import {spawnSync} from 'node:child_process';
import {writeFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const out=fileURLToPath(new URL('install-recheck.json',import.meta.url));if(existsSync(out))throw Error('Preserve evidence');
const command='powershell.exe',args=['-NoProfile','-ExecutionPolicy','Bypass','-File','tests/joeness-install.tests.ps1'];
const r=spawnSync(command,args,{encoding:'utf8',maxBuffer:8e6,env:{...process.env,PYTHONUTF8:'1'}});
writeFileSync(out,JSON.stringify({reason:'Original PS5 suite failed resolving Get-FileHash. Fresh read-only PS5 Get-Command resolved it. Exact original suite once, no source/test changes; original failure retained.',command,args,exit:r.status,output:r.stdout+r.stderr},null,2)+'\n');console.log('exit',r.status,(r.stdout+r.stderr).slice(-1300));
