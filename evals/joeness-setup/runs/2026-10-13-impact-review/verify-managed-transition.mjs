// Simulate the proposed upgrade and rollback in a disposable home, never personal.
import {readFileSync,writeFileSync,mkdtempSync,mkdirSync,readdirSync,cpSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
const here=fileURLToPath(new URL('.',import.meta.url)),repo=resolve(here,'../../../..');
const temp=mkdtempSync(join(tmpdir(),'joeness-managed-transition-')),old=join(temp,'previous-source'),home=join(temp,'isolated-home'),backup=join(temp,'backup');mkdirSync(old);mkdirSync(home);
const run=(cmd,args,opts={})=>{const r=spawnSync(cmd,args,{cwd:repo,maxBuffer:4*1024*1024,...opts});assert.ifError(r.error);return r;};
const archive=run('git',['archive','--format=tar','5f16ea00c5c1f46c8c87999a3247739576dd537e','JOENESS.ps1','scripts','skills','vendor']);assert.equal(archive.status,0);
assert.equal(run('tar',['-xf','-','-C',old],{input:archive.stdout}).status,0);
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const snapshot=()=>Object.fromEntries(readdirSync(home,{recursive:true,withFileTypes:true}).filter(f=>f.isFile()).map(f=>{const p=join(f.parentPath,f.name);return [p.slice(home.length+1),sha(p)];}).sort());
writeFileSync(join(home,'AGENTS.md'),'USER OWNED 안내');writeFileSync(join(home,'config.toml'),'# user-owned fixture\n');
const protectedBefore=['AGENTS.md','config.toml'].map(p=>sha(join(home,p))),steps=[];
const invoke=(source,mode,expected)=>{const env={...process.env};for(const k of Object.keys(env))if(k.toLowerCase()==='psmodulepath')delete env[k];const command=['powershell.exe','-NoProfile','-ExecutionPolicy','Bypass','-File',join(source,'JOENESS.ps1'),'-'+mode,'-CodexHome',home];const r=run(command[0],command.slice(1),{encoding:'utf8',env});const output=JSON.parse(r.stdout);steps.push({command,exit:r.status,output,stderr:r.stderr});assert.equal(output.status,expected);return output;};
invoke(old,'Apply','current');const original=snapshot();cpSync(home,backup,{recursive:true});
invoke(repo,'Check','blocked');assert.deepEqual(snapshot(),original);
invoke(old,'Check','current');invoke(old,'Remove','removed');invoke(repo,'Apply','current');invoke(repo,'Check','current');
const installed=snapshot(),manifest=JSON.parse(readFileSync(join(repo,'vendor/source-manifest.json')));for(const f of manifest.publicSkills[0].files)assert.equal(sha(join(home,'skills/joeness-setup',f.path)),f.sha256);
// Verify clean/owned rollback using the exact installers, not force-copy overwrite.
invoke(repo,'Remove','removed');invoke(old,'Apply','current');assert.deepEqual(snapshot(),original);
assert.deepEqual(['AGENTS.md','config.toml'].map(p=>sha(join(home,p))),protectedBefore);
const record={kind:'isolated-upgrade-and-rollback-rehearsal',root:temp,previous_release:'5f16ea00c5c1f46c8c87999a3247739576dd537e',manifest_sha256:sha(join(repo,'vendor/source-manifest.json')),original,installed,rollback:snapshot(),steps,rollback_exact:true,protected_files_unchanged:true,personal_install_touched:false};
writeFileSync(join(here,process.argv[2]||'managed-transition.json'),JSON.stringify(record,null,2)+'\n');console.log(JSON.stringify({steps:steps.length,rollback_exact:true,installed_files:manifest.publicSkills[0].files.length,temp}));
