import {spawnSync} from 'node:child_process';
import {writeFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const out=fileURLToPath(new URL('shell-diagnosis.json',import.meta.url));if(existsSync(out))throw Error('Preserve evidence');
const diagnostic='Get-Command Get-FileHash -ErrorAction Continue | Select-Object Name,Source; $env:PSModulePath; Get-Module -ListAvailable Microsoft.PowerShell.Utility | Select-Object Name,Version,Path';
const entries=[];
for(const mode of ['node-inherited','powershell-dispatch']){
 const command=mode==='node-inherited'?'powershell.exe':'pwsh';
 const script=mode==='node-inherited'?diagnostic:`& powershell.exe -NoProfile -Command '${diagnostic}'`;
 const args=['-NoProfile','-Command',script],r=spawnSync(command,args,{encoding:'utf8'});
 entries.push({mode,command,args,exit:r.status,output:r.stdout+r.stderr});
}
writeFileSync(out,JSON.stringify({entries},null,2)+'\n');console.log(JSON.stringify(entries,null,2));
