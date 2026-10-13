// Read-only inventory. Does not create backups or change the personal install.
import {readFileSync,writeFileSync,readdirSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
const here=fileURLToPath(new URL('.',import.meta.url)),repo=resolve(here,'../../../..');
const sha=b=>createHash('sha256').update(b).digest('hex'),fileSha=p=>sha(readFileSync(p));
const personal='C:/Users/tjdwo/.codex',skill=join(personal,'skills/joeness-setup');
const source=JSON.parse(readFileSync(join(repo,'vendor/source-manifest.json')));
const oldCommit='5f16ea00c5c1f46c8c87999a3247739576dd537e';
const git=args=>{const r=spawnSync('git',args,{cwd:repo,maxBuffer:4*1024*1024});assert.ifError(r.error);assert.equal(r.status,0);return r.stdout;};
const oldManifest=git(['show',oldCommit+':vendor/source-manifest.json']);
const state=JSON.parse(readFileSync(join(personal,'joeness-skills-state.json')));
assert.equal(state.manifestSha256,sha(oldManifest));
assert.deepEqual(state.files,JSON.parse(oldManifest).publicSkills[0].files);
const personalFiles=readdirSync(skill,{recursive:true,withFileTypes:true}).filter(x=>x.isFile()).map(x=>join(x.parentPath,x.name).slice(skill.length+1).replaceAll('\\','/')).sort();
assert.deepEqual(personalFiles,state.files.map(f=>f.path).sort());
const before=state.files.map(f=>({path:'skills/joeness-setup/'+f.path,expected:f.sha256,actual:fileSha(join(skill,f.path))}));assert.ok(before.every(f=>f.expected===f.actual));
const protectedFiles=Object.fromEntries(['joeness-skills-state.json','AGENTS.md','config.toml'].map(p=>[p,existsSync(join(personal,p))?fileSha(join(personal,p)):'absent']));
const manifestSha=fileSha(join(repo,'vendor/source-manifest.json')),head=git(['rev-parse','HEAD']).toString().trim();
const sourceCommit=sha(git(['show',head+':vendor/source-manifest.json']))===manifestSha?head:null;
const plan={status:'PLAN_ONLY_WAIT_FOR_MANAGER',personal,previous_release_commit:oldCommit,previous_manifest_sha256:state.manifestSha256,source_commit:sourceCommit,source_manifest_sha256:manifestSha,source_files:source.publicSkills[0].files,before,protected_before:protectedFiles,backup_root:'C:/Users/tjdwo/.codex-install-backups/joeness-20261013-'+manifestSha.slice(0,12),steps:[
 'Recheck every before hash and exact inventory immediately before mutation. Block on drift/unknown files.',
 'Back up only the 11 owned skill files and joeness-skills-state.json outside skill discovery; verify backup hashes. Never copy login/config into repository evidence.',
 'Export previous exact release to a fresh temp source. Old JOENESS.ps1 -Check must report current with the personal target.',
 'Old exact release JOENESS.ps1 -Remove removes only owned skill bytes/state. New candidate Apply directly over old ownership is intentionally blocked; do not bypass that check.',
 'New exact committed source JOENESS.ps1 -Apply -CodexHome personal, then -Check current; compare all17 files and new state manifest.',
 'Run actual producer-consumer scenarios against installed CLI plus all82 installed behavioral tests; global AGENTS/config and other tools remain unchanged.',
 'If new Apply fails, preserve its failure/rollback record. Restore previous version with its exact installer only after proving target is clean/owned. On drift or partial unknown content stop; never force overwrite. Keep verified backup for recovery.'
 ],limits:['No installation authorized by this plan itself','Candidate 0.3.4 source, not a new version tag or hosted release','GEO and existing project docs untouched','Source commit must be fixed and final regressions complete before installation']};
const name=process.argv[2]||'managed-install-plan.json';assert.match(name,/^managed-install-plan(?:-[a-z0-9]+)?\.json$/);assert.ok(!existsSync(join(here,name)),'Preserve prior plans');
writeFileSync(join(here,name),JSON.stringify(plan,null,2)+'\n');
console.log(JSON.stringify({source_commit:sourceCommit,source_manifest_sha256:manifestSha,personal_files:before.length,personal_state:protectedFiles['joeness-skills-state.json'],plan:join(here,name)}));
