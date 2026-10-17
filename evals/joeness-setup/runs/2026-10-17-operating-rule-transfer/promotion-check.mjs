import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=fileURLToPath(new URL('../../../../',import.meta.url));
const sha=b=>createHash('sha256').update(b).digest('hex');
const baseline='5e5af5197130e0fc11c9b6333b4cfa602aa1439e';
const oldBytes=execFileSync('git',['show',baseline+':vendor/source-manifest.json'],{cwd:root});
const oldManifest=JSON.parse(oldBytes);
const manifestBytes=readFileSync(join(root,'vendor/source-manifest.json'));
const manifest=JSON.parse(manifestBytes);
assert.equal(manifest.release.version,oldManifest.release.version);
const changed=[];
for(const f of manifest.publicSkills[0].files){
  const actual=readFileSync(join(root,'skills/joeness-setup',f.path));
  assert.equal(sha(actual),f.sha256,f.path+' manifest');
  const old=oldManifest.publicSkills[0].files.find(x=>x.path===f.path);
  assert.ok(old,f.path+' existing entry');
  if(old.sha256!==f.sha256)changed.push(f.path);
}
assert.deepEqual(changed,['assets/AGENTS.md']);
const adjusted=structuredClone(oldManifest);
adjusted.publicSkills[0].files.find(f=>f.path==='assets/AGENTS.md').sha256=manifest.publicSkills[0].files.find(f=>f.path==='assets/AGENTS.md').sha256;
assert.deepEqual(manifest,adjusted,'no other manifest contract changes');
const template=readFileSync(join(root,'skills/joeness-setup/assets/AGENTS.md'),'utf8');
const applied=template.replace('Adapt paths and agreed scope before applying this body.','Project paths and scope are fixed below.')
 .replace('<exact source or undecided>','PRODUCT.md')
 .replace('<agreed scope>','update factual work/review records in ROADMAP.md, TASK.md and ISSUES.md only')
 .replace('<applicable scoped gate command, baseline pin and\n  result path, or none>','none; no specialist receipt is configured');
const replay=JSON.parse(readFileSync(new URL('candidate-evidence.json',import.meta.url),'utf8'))[0];
assert.equal(applied,replay.connection,'product template reproduces exactly tested connection bytes');
const checks={sourceChangedFiles:changed,unchangedSkillFiles:16,manifestSha256:sha(manifestBytes),templateSha256:sha(Buffer.from(template)),replayConnectionSha256:sha(Buffer.from(applied)),exactBehaviorReplayMatch:true};
// Explicit read-only personal preservation check, never invokes Apply/Remove.
const personal=process.argv[2];
if(personal){
 const stateBytes=readFileSync(join(personal,'joeness-skills-state.json'));
 const state=JSON.parse(stateBytes);
 assert.equal(state.manifestSha256,sha(oldBytes));
 for(const f of oldManifest.publicSkills[0].files)assert.equal(sha(readFileSync(join(personal,'skills/joeness-setup',f.path))),f.sha256,'personal '+f.path);
 checks.personal={releaseVersion:state.releaseVersion,manifestSha256:state.manifestSha256,stateSha256:sha(stateBytes),filesPreserved:oldManifest.publicSkills[0].files.length};
}
console.log(JSON.stringify(checks,null,2));
