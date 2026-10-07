// Integrity checks for the bounded candidate pilot; not an automatic-loading test.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const here=new URL('.',import.meta.url),repo=new URL('../../../../',here);
const json=n=>JSON.parse(readFileSync(new URL(n,here)));
const sha=b=>createHash('sha256').update(b).digest('hex');
const before=json('before.json'),applied=json('after-apply.json'),final=json('after-verification.json');
const source=JSON.parse(readFileSync(new URL('vendor/source-manifest.json',repo)));
for(const s of [applied,final]){
 assert.equal(s.personal.globalAgentsSha256,before.personal.globalAgentsSha256);
 assert.deepEqual(s.personal.otherSkills,before.personal.otherSkills);
 assert.equal(s.geo.head,before.geo.head);assert.deepEqual(s.geo.tracked,before.geo.tracked);
 assert.deepEqual(s.geo.product,before.geo.product);
 for(const f of source.publicSkills[0].files)assert.equal(s.personal.managed[f.path],f.sha256);
}
for(const n of Object.keys(before.geo.files))if(!['AGENTS.md','.joeness/setup-state.json'].includes(n))
 assert.equal(applied.geo.files[n],before.geo.files[n],n+' changed during setup');
for(const n of Object.keys(applied.geo.files))if(!['TASK.md','ROADMAP.md','ISSUES.md'].includes(n))
 assert.equal(final.geo.files[n],applied.geo.files[n],n+' changed during operational verification');
const outcome=json('outcome.json');
assert.equal(outcome.connectionOutsidePreserved,true);assert.equal(outcome.existingConnectionParagraphsPreserved,12);
assert.equal(outcome.priorTaskBytesPreserved,true);
for(const f of source.publicSkills[0].files){
 const p='skills/joeness-setup/'+f.path;
 assert.equal(sha(readFileSync(new URL(p,repo))),f.sha256);
 assert.equal(sha(execFileSync('git',['show','a6411e5266ae748bd140b3db2a88b4c07381e351:'+p])),f.sha256);
}
const tests=json('preflight-tests.json');
for(const r of Object.values(tests.tests))assert.equal(r.exit_code,0);
assert.equal(tests.remote.head_sha,'a6411e5266ae748bd140b3db2a88b4c07381e351');
assert.equal(tests.remote.conclusion,'success');
const personal=json('personal-application.json');
assert.deepEqual(personal.results.map(x=>x.status),['removed','current','current']);
const connection=json('project-application.json');
assert.equal(connection.after.status,'current');assert.equal(connection.after.blockState,'clean');
assert.equal(final.geo.files['AGENTS.md'],connection.after.targetHash);
assert.equal(final.geo.files['.joeness/setup-state.json'],connection.after.stateHash);
console.log(JSON.stringify({result:'PASS',personalManagedFiles:9,otherSkillFiles:final.personal.otherSkills.count,
 protectedTrackedFiles:final.geo.tracked.count,productRevision:final.geo.product.revision,
 candidateSourceUnchanged:true,changesAfterSetup:outcome.changedRecordFiles,
 boundary:'Existing chat explicit reload; no new product approval, automatic delivery or release claim'},null,2));
