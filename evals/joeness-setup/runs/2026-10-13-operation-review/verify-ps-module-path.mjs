// Minimal reproduction of the failed runner, not a product or user-env change.
import {spawnSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const command='Import-Module Microsoft.PowerShell.Utility; $m = Get-Module Microsoft.PowerShell.Utility; $c = Get-Command Get-FileHash -ErrorAction SilentlyContinue; [pscustomobject]@{version=$PSVersionTable.PSVersion.ToString();module=$m.Path;hashAvailable=($null -ne $c)} | ConvertTo-Json -Compress';
const results=[];
for(const mode of ['inherited-PS7-path','PS5-default-path']){
 const env={...process.env};if(mode==='PS5-default-path')for(const k of Object.keys(env))if(k.toLowerCase()==='psmodulepath')delete env[k];
 const r=spawnSync('powershell.exe',['-NoProfile','-Command',command],{encoding:'utf8',env});
 if(r.error)throw r.error;
 results.push({mode,exit:r.status,output:JSON.parse(r.stdout),stderr:r.stderr});
}
writeFileSync(fileURLToPath(new URL('environment-diagnosis.json',import.meta.url)),JSON.stringify({command,results,personal_environment_changed:false},null,2)+'\n');
console.log(JSON.stringify(results));
if(results[0].output.hashAvailable!==false||results[1].output.hashAvailable!==true)throw Error('Expected environment difference not reproduced');
