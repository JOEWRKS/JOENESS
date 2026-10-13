// Explicit approved transition only. No blind retries or personal-state migration.
import {readFileSync,writeFileSync,readdirSync,existsSync,mkdirSync,mkdtempSync,copyFileSync,realpathSync} from 'node:fs';
import {join,resolve,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
const here=fileURLToPath(new URL('.',import.meta.url)),repo=resolve(here,'../../../..');
assert.equal(process.argv[2],'--execute-approved-plan');
const planPath=join(here,'managed-install-plan-committed.json'),plan=JSON.parse(readFileSync(planPath));
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const call=(cmd,args,opts={})=>{const r=spawnSync(cmd,args,{cwd:repo,maxBuffer:4*1024*1024,...opts});assert.ifError(r.error);return r;};
const git=args=>{const r=call('git',args);assert.equal(r.status,0);return r.stdout;};
const home=plan.personal,skill=join(home,'skills/joeness-setup');
assert.equal(home,'C:/Users/tjdwo/.codex');assert.match(plan.source_commit,/^[a-f0-9]{40}$/);
assert.equal(git(['rev-parse','HEAD']).toString().trim(),plan.source_commit);
assert.equal(sha(join(repo,'vendor/source-manifest.json')),plan.source_manifest_sha256);
for(const f of plan.source_files){const p='skills/joeness-setup/'+f.path;assert.equal(sha(join(repo,p)),f.sha256);assert.equal(createHash('sha256').update(git(['show',plan.source_commit+':'+p])).digest('hex'),f.sha256);}
const files=()=>existsSync(skill)?readdirSync(skill,{recursive:true,withFileTypes:true}).filter(x=>x.isFile()).map(x=>join(x.parentPath,x.name).slice(skill.length+1).replaceAll('\\','/')).sort():[];
const checkBefore=()=>{assert.deepEqual(files(),plan.before.map(f=>f.path.replace('skills/joeness-setup/','')).sort());for(const f of plan.before)assert.equal(sha(join(home,f.path)),f.actual);for(const [p,h] of Object.entries(plan.protected_before))assert.equal(existsSync(join(home,p))?sha(join(home,p)):'absent',h);};
checkBefore();
const backup=resolve(plan.backup_root),backupParent=resolve('C:/Users/tjdwo/.codex-install-backups');assert.equal(dirname(backup),backupParent);assert.ok(!existsSync(backup),'Backup exists: inspect previous attempt instead of retrying');
mkdirSync(backupParent,{recursive:true});assert.equal(realpathSync(backupParent).toLowerCase(),backupParent.toLowerCase());mkdirSync(backup);
const backed=[];
for(const p of [...plan.before.map(f=>f.path),'joeness-skills-state.json']){const destination=join(backup,p);mkdirSync(dirname(destination),{recursive:true});copyFileSync(join(home,p),destination);assert.equal(sha(destination),sha(join(home,p)));backed.push({path:p,sha256:sha(destination)});}
writeFileSync(join(backup,'backup-manifest.json'),JSON.stringify({previous_release:plan.previous_release_commit,source_commit:plan.source_commit,files:backed,protected_before:plan.protected_before},null,2)+'\n');
const temp=mkdtempSync(join(tmpdir(),'joeness-approved-upgrade-')),old=join(temp,'old-source');mkdirSync(old);
const archive=git(['archive','--format=tar',plan.previous_release_commit,'JOENESS.ps1','scripts','skills','vendor']);assert.equal(call('tar',['-xf','-','-C',old],{input:archive}).status,0);
assert.equal(sha(join(old,'vendor/source-manifest.json')),plan.previous_manifest_sha256);
const record={phase:'backed-up-not-removed',source_commit:plan.source_commit,source_manifest_sha256:plan.source_manifest_sha256,plan_sha256:sha(planPath),backup,backup_manifest_sha256:sha(join(backup,'backup-manifest.json')),old_source:old,steps:[],installed:[],protected_before:plan.protected_before};
const save=()=>{writeFileSync(join(backup,'operation.json'),JSON.stringify(record,null,2)+'\n');writeFileSync(join(here,'personal-install.json'),JSON.stringify(record,null,2)+'\n');};save();
function invoke(source,mode){const env={...process.env};for(const k of Object.keys(env))if(k.toLowerCase()==='psmodulepath')delete env[k];const command=['powershell.exe','-NoProfile','-ExecutionPolicy','Bypass','-File',join(source,'JOENESS.ps1'),'-'+mode,'-CodexHome',home];const r=call(command[0],command.slice(1),{encoding:'utf8',env});const output=JSON.parse(r.stdout);record.steps.push({command,exit:r.status,output,stderr_sha256:createHash('sha256').update(r.stderr).digest('hex')});save();return output;}
let removed=false;
try{
 checkBefore();assert.equal(invoke(old,'Check').status,'current');
 assert.equal(invoke(old,'Remove').status,'removed');removed=true;record.phase='old-managed-files-removed';save();
 assert.equal(files().length,0);assert.equal(existsSync(join(home,'joeness-skills-state.json')),false);
 assert.equal(invoke(repo,'Apply').status,'current');assert.equal(invoke(repo,'Check').status,'current');
 assert.deepEqual(files(),plan.source_files.map(f=>f.path).sort());
 record.installed=plan.source_files.map(f=>({path:f.path,expected:f.sha256,actual:sha(join(skill,f.path))}));assert.ok(record.installed.every(f=>f.expected===f.actual));
 const state=JSON.parse(readFileSync(join(home,'joeness-skills-state.json')));assert.equal(state.manifestSha256,plan.source_manifest_sha256);assert.deepEqual(state.files,plan.source_files);record.state_sha256=sha(join(home,'joeness-skills-state.json'));
 record.protected_after=Object.fromEntries(['AGENTS.md','config.toml'].map(p=>[p,existsSync(join(home,p))?sha(join(home,p)):'absent']));
 for(const [p,h] of Object.entries(record.protected_after))assert.equal(h,plan.protected_before[p]);
 record.phase='installed-byte-verified-behavior-pending';save();
}catch(e){
 record.phase='failed';record.failure=e.message;save();
 // Never force-remove a partial/unknown target. Only clean failed Apply may recover.
 if(removed&&files().length===0&&!existsSync(join(home,'joeness-skills-state.json'))){record.rollback=invoke(old,'Apply');record.phase=record.rollback.status==='current'?'rolled-back':'manual-recovery-required';save();}
 else if(removed){record.phase='manual-recovery-required';save();}
 throw e;
}
console.log(JSON.stringify({phase:record.phase,source_commit:record.source_commit,files:record.installed.length,backup,protected_unchanged:true}));
