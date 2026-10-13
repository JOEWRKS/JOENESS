// Approved T040 personal transition. Never edit ownership state by hand.
import {readFileSync,writeFileSync,readdirSync,existsSync,mkdirSync,mkdtempSync,copyFileSync,realpathSync} from 'node:fs';
import {join,resolve,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
assert.equal(process.argv[2],'--approved-t040');
const here=fileURLToPath(new URL('.',import.meta.url)),repo=resolve(here,'../../../..');
const home='C:/Users/tjdwo/.codex',skill=join(home,'skills/joeness-setup');
const oldCommit='c4902f72b728e36d558225157a10f740ed6abdc0',newCommit='0989e0c2610b1c137938251aea6dc55aae28ef54';
const sha=b=>createHash('sha256').update(b).digest('hex'),hash=p=>sha(readFileSync(p));
const call=(cmd,args,opts={})=>{const r=spawnSync(cmd,args,{cwd:repo,timeout:60000,maxBuffer:4*1024*1024,...opts});assert.ifError(r.error);return r;};
const git=args=>{const r=call('git',args);assert.equal(r.status,0);return r.stdout;};
assert.equal(git(['rev-parse','HEAD']).toString().trim(),newCommit);
const oldBytes=git(['show',oldCommit+':vendor/source-manifest.json']),newBytes=git(['show',newCommit+':vendor/source-manifest.json']);
assert.equal(hash(join(repo,'vendor/source-manifest.json')),sha(newBytes));
const oldManifest=JSON.parse(oldBytes),newManifest=JSON.parse(newBytes);
assert.equal(oldManifest.release.version,'0.3.4');assert.equal(newManifest.release.version,'1.0.0');
assert.deepEqual(oldManifest.publicSkills,newManifest.publicSkills);
const inventory=()=>readdirSync(skill,{recursive:true,withFileTypes:true}).filter(f=>f.isFile()).map(f=>join(f.parentPath,f.name).slice(skill.length+1).replaceAll('\\','/')).sort();
const ownPaths=[...oldManifest.publicSkills[0].files.map(f=>'skills/joeness-setup/'+f.path),'joeness-skills-state.json'];
const watched=[...ownPaths,'AGENTS.md','config.toml'];
const snapshot=()=>Object.fromEntries(watched.map(p=>[p,existsSync(join(home,p))?hash(join(home,p)):'absent']));
assert.deepEqual(inventory(),oldManifest.publicSkills[0].files.map(f=>f.path).sort());
const oldState=JSON.parse(readFileSync(join(home,'joeness-skills-state.json')));
assert.deepEqual(oldState,{schemaVersion:1,releaseVersion:'0.3.4',manifestSha256:sha(oldBytes),files:oldManifest.publicSkills[0].files});
for(const f of newManifest.publicSkills[0].files){
 const p='skills/joeness-setup/'+f.path;assert.equal(hash(join(home,p)),f.sha256);
 assert.equal(hash(join(repo,p)),f.sha256);assert.equal(sha(git(['show',newCommit+':'+p])),f.sha256);
}
for(const p of ['JOENESS.ps1','scripts/sync-harness.ps1'])assert.equal(hash(join(repo,p)),sha(git(['show',newCommit+':'+p])));
const before=snapshot(),backup=resolve('C:/Users/tjdwo/.codex-install-backups/joeness-v100-20261013-529a22ace091');
assert.equal(dirname(backup),resolve('C:/Users/tjdwo/.codex-install-backups'));
assert.ok(!existsSync(backup),'Existing backup: inspect previous attempt, no blind retry');
assert.ok(!existsSync(join(here,'personal-install.json')),'Do not overwrite prior evidence');
const temp=mkdtempSync(join(tmpdir(),'joeness-v100-old-package-')),old=join(temp,'source');mkdirSync(old);
assert.equal(call('tar',['-xf','-','-C',old],{input:git(['archive','--format=tar',oldCommit,'JOENESS.ps1','scripts','skills','vendor'])}).status,0);
assert.equal(hash(join(old,'vendor/source-manifest.json')),sha(oldBytes));
const record={status:'preflight',old_source_commit:oldCommit,new_source_commit:newCommit,old_manifest:oldManifest,new_manifest:newManifest,old_manifest_sha256:sha(oldBytes),new_manifest_sha256:sha(newBytes),old_state:oldState,before,backup,old_source:old,commands:[],backed_up:[]};
const save=()=>{writeFileSync(join(here,'personal-install.json'),JSON.stringify(record,null,2)+'\n');if(existsSync(backup))writeFileSync(join(backup,'operation.json'),JSON.stringify(record,null,2)+'\n');};
function invoke(source,mode){
 const env={...process.env};for(const k of Object.keys(env))if(k.toLowerCase()==='psmodulepath')delete env[k];
 const command=['powershell.exe','-NoProfile','-ExecutionPolicy','Bypass','-File',join(source,'JOENESS.ps1'),'-'+mode,'-CodexHome',home];
 const r=call(command[0],command.slice(1),{encoding:'utf8',env});
 const output=JSON.parse(r.stdout);record.commands.push({command,exit:r.status,output,stderr_sha256:sha(r.stderr)});save();
 assert.equal(r.status,0);return output;
}
let removed=false;
try {
 assert.equal(invoke(old,'Check').status,'current');
 assert.deepEqual(snapshot(),before);
 mkdirSync(dirname(backup),{recursive:true});assert.equal(realpathSync(dirname(backup)).toLowerCase(),dirname(backup).toLowerCase());mkdirSync(backup);
 for(const p of ownPaths){const dest=join(backup,p);mkdirSync(dirname(dest),{recursive:true});copyFileSync(join(home,p),dest);assert.equal(hash(dest),before[p]);record.backed_up.push({path:p,sha256:hash(dest)});}
 record.status='backup-verified';save();assert.deepEqual(snapshot(),before);
 assert.equal(invoke(old,'Remove').status,'removed');removed=true;record.status='old-removed';save();
 assert.equal(inventory().length,0);assert.ok(!existsSync(join(home,'joeness-skills-state.json')));
 assert.equal(invoke(repo,'Check').status,'ready');assert.equal(invoke(repo,'Apply').status,'current');assert.equal(invoke(repo,'Check').status,'current');
 assert.deepEqual(inventory(),newManifest.publicSkills[0].files.map(f=>f.path).sort());
 record.after=snapshot();record.new_state=JSON.parse(readFileSync(join(home,'joeness-skills-state.json')));
 assert.deepEqual(record.new_state,{...oldState,releaseVersion:'1.0.0',manifestSha256:sha(newBytes)});
 for(const p of watched.filter(p=>p!=='joeness-skills-state.json'))assert.equal(record.after[p],before[p],p+' unchanged');
 record.delta={changed:['joeness-skills-state.json'],new:[],deleted:[],skill_bytes_changed:[],state_fields_changed:['releaseVersion','manifestSha256']};
 record.status='installed-byte-verified';save();
 const command=[process.execPath,'--test','--test-name-pattern=current full specialist coverage|missing check blocks|approval remains separate','tests/joeness-review-gate.tests.mjs'];
 const r=call(command[0],command.slice(1),{encoding:'utf8',env:{...process.env,JOENESS_TEST_GATE_CLI:join(skill,'scripts/review-gate.mjs')}});
 record.representative_check={command,exit:r.status,stdout:r.stdout,stderr:r.stderr};save();assert.equal(r.status,0);
 assert.deepEqual(snapshot(),record.after);record.status='installed-and-verified';save();
} catch(e) {
 record.status='failed';record.failure=e.message;save();
 if(removed&&inventory().length===0&&!existsSync(join(home,'joeness-skills-state.json'))){record.rollback=invoke(old,'Apply');record.status=record.rollback.status==='current'?'rolled-back':'manual-recovery-required';save();}
 else if(removed){record.status='manual-recovery-required';save();}
 throw e;
}
console.log(JSON.stringify({status:record.status,version:record.new_state.releaseVersion,files:record.new_state.files.length,delta:record.delta,backup,protected_unchanged:true}));
