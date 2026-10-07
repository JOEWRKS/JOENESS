// Stored evidence integrity and scoped invariants, not a new behavioral replay.
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {resolve,join} from 'node:path';
const here=fileURLToPath(new URL('.',import.meta.url));
const repo=resolve(here,'../../../../..');
const read=p=>readFileSync(p);
const json=p=>JSON.parse(read(p));
const hash=b=>createHash('sha256').update(b).digest('hex');
const base=json(join(here,'execution.json')).baseCommit;
const summary={fixtures:{},joeflowManifest:0,shippedHashes:0};
for(const arm of ['standalone','combined']){
 const o=json(join(here,arm+'-observed.json')),h=json(join(here,arm+'-helper.json'));
 assert.deepEqual(o.changedNames,['ROADMAP.md','TASK.md']);
 assert.deepEqual(o.untracked,[]);
 assert.equal(h.check.status,'ready'); assert.equal(h.apply.status,'current');
 assert.equal(h.post.status,'current'); assert.equal(h.post.blockState,'clean');
 assert.equal(h.outsideAgentsPreserved,true);
 assert.deepEqual(h.protectedBefore,h.protectedAfter);
 for(const [name,f] of Object.entries(o.files)){
   if('before' in f)assert.equal(hash(Buffer.from(f.before)),f.beforeSha256,name+' before');
   if('after' in f)assert.equal(hash(Buffer.from(f.after)),f.afterSha256,name+' after');
   if(!['ROADMAP.md','TASK.md'].includes(name)){
     assert.equal(f.unchanged,true,name);assert.equal(f.beforeSha256,f.afterSha256,name);
   }
 }
 assert.equal(o.connectionState.unchanged,true);
 assert.equal(o.connectionState.beforeSha256,o.connectionState.afterSha256);
 assert.equal(o.connectionState.afterSha256,h.post.stateHash);
 assert.equal(o.files['AGENTS.md'].afterSha256,h.post.targetHash);
 assert.ok(o.files['TASK.md'].after.startsWith(o.files['TASK.md'].before),'TASK history');
 summary.fixtures[arm]={helper:'ready/current/current-clean',changed:o.changedNames,protected:'unchanged'};
}
const combined=json(join(here,'combined-observed.json')).files['product-definition/state.json'];
const source=read(resolve(here,combined.sourceEvidence));
assert.equal(hash(source),combined.afterSha256);
assert.deepEqual(combined.beforeSummary,combined.afterSummary);
assert.equal(combined.afterSummary.approval.status,'UNAPPROVED');
assert.deepEqual(combined.afterSummary.approval_history,[]);
assert.deepEqual(combined.afterSummary.decisions,[{id:'DEC-1000',status:'CURRENT'}]);
assert.deepEqual(combined.afterSummary.unknowns,[{id:'UNK-1000',status:'RESOLVED'},{id:'UNK-1001',status:'OPEN'}]);
const jf=resolve(here,'../joeflow');
for(const [name,expected] of Object.entries(json(join(jf,'sha256-manifest.json')))){
 assert.equal(hash(read(join(jf,name))),expected,name);summary.joeflowManifest++;
}
const a=json(join(jf,'audit-results.json'));
assert.equal(a.joeflow_only,true);assert.deepEqual(a.joeness_inputs,[]);
assert.equal(a.new_user_approval_created,false);
for(const key of ['baseline','unconsumed_evidence_same_revision']){
 assert.equal(a[key].audit.status,'CONFORMANT');
 assert.equal(a[key].audit.authority_revision_relation,'SAME_APPROVED_REVISION');
}
assert.equal(a.unconsumed_evidence_newer_open_revision.audit.status,'CONFORMANT');
assert.equal(a.unconsumed_evidence_newer_open_revision.audit.authority_revision_relation,'OLDER_APPROVED_REVISION_UNAFFECTED');
assert.equal(a.consumed_seed_drift.audit.status,'REENTRY_REQUIRED');
assert.deepEqual(a.consumed_seed_drift.audit.affected_consumers.map(x=>x.consumer_id),['resolve_thread']);
assert.equal(a.consumed_seed_drift.unaffected_consumer_count,5);
assert.equal(a.consumed_seed_drift.stale_approval_probe.closed,false);
for(const k of ['stale_approval','missing_or_stale_approval_manifest','semantic_change_without_revision_increment'])
 assert.equal(a.consumed_seed_drift.stale_approval_probe.nonzero_metrics[k],1);
const manifest=json(join(repo,'vendor/source-manifest.json'));
for(const skill of manifest.publicSkills)for(const f of skill.files){
 const path='skills/'+skill.name+'/'+f.path;
 assert.equal(hash(read(join(repo,path))),f.sha256,path);
 assert.deepEqual(read(join(repo,path)),execFileSync('git',['-C',repo,'show',base+':'+path]));
 summary.shippedHashes++;
}
assert.equal(execFileSync('git',['-C',repo,'diff',base,'--','skills','vendor','tests','scripts','JOENESS.ps1','.github']).length,0);
assert.deepEqual(readdirSync(repo).filter(x=>!['.git','.superpowers','.worktrees'].includes(x)).sort(),
 ['.gitattributes','.github','.gitignore','AGENTS.md','JOENESS.ps1','README.md','docs','fixtures','skills','evals','scripts','tests','vendor'].sort());
summary.result='PASS: artifact integrity and scoped invariants; semantic review remains separate';
console.log(JSON.stringify(summary,null,2));
