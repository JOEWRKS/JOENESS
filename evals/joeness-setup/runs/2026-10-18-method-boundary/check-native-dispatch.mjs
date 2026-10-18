import {spawnSync} from 'node:child_process';
import {writeFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const out=fileURLToPath(new URL('install-native-dispatch.json',import.meta.url));if(existsSync(out))throw Error('Preserve evidence');
const command='pwsh',args=['-NoProfile','-Command','& powershell.exe -NoProfile -ExecutionPolicy Bypass -File tests/joeness-install.tests.ps1; exit $LASTEXITCODE'];
const r=spawnSync(command,args,{encoding:'utf8',maxBuffer:8e6});
writeFileSync(out,JSON.stringify({reason:'Match Windows workflow PowerShell-to-PS5 dispatch. Paired shell diagnosis reproduces Node-inherited PS7 module path failure and normal PS5 module resolution. No product/test changes.',command,args,exit:r.status,output:r.stdout+r.stderr},null,2)+'\n');console.log('exit',r.status,(r.stdout+r.stderr).slice(-1200));
