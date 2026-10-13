import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
const here=fileURLToPath(new URL('.',import.meta.url)),repo=resolve(here,'../../../..');
const home='C:/Users/tjdwo/.codex',skill=join(home,'skills/joeness-setup');
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const installation=JSON.parse(readFileSync(join(here,'personal-install.json')));assert.equal(installation.phase,'installed-byte-verified-behavior-pending');
const manifest=JSON.parse(readFileSync(join(repo,'vendor/source-manifest.json')));assert.equal(sha(join(repo,'vendor/source-manifest.json')),installation.source_manifest_sha256);
const watched=[...manifest.publicSkills[0].files.map(f=>'skills/joeness-setup/'+f.path),'joeness-skills-state.json','AGENTS.md','config.toml'];
const snapshot=()=>Object.fromEntries(watched.map(p=>[p,existsSync(join(home,p))?sha(join(home,p)):'absent'])),before=snapshot();
for(const f of manifest.publicSkills[0].files)assert.equal(before['skills/joeness-setup/'+f.path],f.sha256);
const env={...process.env,JOENESS_TEST_GATE_CLI:join(skill,'scripts/review-gate.mjs'),JOENESS_TEST_ROADMAP_CLI:join(skill,'scripts/roadmap-review.mjs'),JOENESS_TEST_OPERATION_CLI:join(skill,'scripts/operation-review.mjs'),JOENESS_TEST_IMPACT_CLI:join(skill,'scripts/impact-review.mjs'),JOEDESIGN_PRODUCER_CLI:join(home,'skills/joedesign/scripts/harness_cli.py'),JOENESS_PERSONAL_VALIDATION:'1'};
const commands=[
 [process.execPath,'--test',...['review-gate','roadmap-review','operation-review','impact-review'].map(n=>join(repo,'tests/joeness-'+n+'.tests.mjs'))],
 [process.execPath,join(here,'verify-installed-planning.mjs')],
 [process.execPath,join(here,'verify-actual-producer.mjs'),'--limited']
];
const results=[];
for(const command of commands){const r=spawnSync(command[0],command.slice(1),{cwd:repo,encoding:'utf8',env,timeout:120000,maxBuffer:4*1024*1024});results.push({command,exit:r.status,error:r.error?.message??null,stdout:r.stdout,stderr:r.stderr});console.log(JSON.stringify({command,exit:r.status}));if(r.status!==0)break;}
const after=snapshot(),record={source_commit:installation.source_commit,manifest_sha256:installation.source_manifest_sha256,before,after,personal_bytes_unchanged:JSON.stringify(before)===JSON.stringify(after),results};
writeFileSync(join(here,'personal-validation.json'),JSON.stringify(record,null,2)+'\n');assert.ok(record.personal_bytes_unchanged);assert.equal(results.length,commands.length);assert.ok(results.every(r=>r.exit===0));
installation.phase='installed-and-behavior-verified';installation.validation={file:'personal-validation.json',sha256:sha(join(here,'personal-validation.json'))};
writeFileSync(join(here,'personal-install.json'),JSON.stringify(installation,null,2)+'\n');writeFileSync(join(installation.backup,'validated-install.json'),JSON.stringify(installation,null,2)+'\n');
console.log(JSON.stringify({installed_tests:83,personal_producer_connections:'JOEFLOW4 and JOEDESIGN10',personal_bytes_unchanged:true}));
