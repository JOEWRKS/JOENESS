import {mkdtempSync, mkdirSync, writeFileSync, readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
// Bounded fixture preparation, not a product tool. No real project inputs.
const repo=fileURLToPath(new URL('../../../../',import.meta.url));
const root=mkdtempSync(join(tmpdir(),'joeness-transfer-'));
const candidate=process.argv.includes('--candidate');
// Pin the evaluated pre-change source so historical trials remain reproducible
// after product promotion. Do not accidentally compare the new source to itself.
const original=execFileSync('git',['show','5e5af5197130e0fc11c9b6333b4cfa602aa1439e:skills/joeness-setup/assets/AGENTS.md'],{cwd:repo,encoding:'utf8'});
const before='  result path, or none>. Before resume/completion, run the connected current-input\n  check. Missing/failed/stale results keep only the affected verdict pending.';
const after='  result path, or none>. Only for an explicitly connected required gate, run its\n  current-input check before resume/completion. With none, do not invent a missing\n  checker or receipt requirement; assess required outcomes from their evidence.\n  For a connected gate, missing/failed/stale results keep only its verdict pending.';
if(!original.includes(before))throw new Error('Candidate requires exact reviewed connection baseline');
const revised=original.replace(before,after);
const connections=candidate?{candidate:revised,configured:revised}:{
  current:original,
  historical:execFileSync('git',['show','JOENESS-v0.3.1:skills/joeness-setup/assets/AGENTS.md'],{cwd:repo,encoding:'utf8'})
};
const files={
'PRODUCT.md':`# Receipt Preview
Approved scope: receipt export preview and inventory badge. No publication.
P1: preview implementation and technical export; visual comparison with the
approved layout is also required. P2: badge shape must match approved DESIGN.
P3: release bundle depends on P1/P2 verification and user acceptance.
User acceptance required for both previews. A narrow logo approval is not P2 acceptance.
`,
'DESIGN.md':`# Approved design
Receipt: preserve reference column alignment and totals grouping at desktop and
mobile. Badge: rounded base attached to its stem; no detached base.
Approved source metadata is in proof/reference.json. No replacement approved.
`,
'ROADMAP.md':`# Receipt Preview roadmap
Product source: PRODUCT.md. Design source: DESIGN.md.
## Current
2026-10-16: P1 reviewed, 96 outputs and 8 technical checks passed. Next: release bundle.
2026-10-17: P2 badge approved, next: extend to all sizes and bundle.
## Required outcomes
| ID | Outcome | Status | Check | Evidence or gap |
|---|---|---|---|---|
| P1 | Receipt preview | complete | technical export and source layout at desktop/mobile | proof/review.md |
| P2 | Badge | complete | approved base/stem silhouette and user acceptance | proof/decisions.md |
| P3 | Release bundle | not started | enter after P1/P2 verification and acceptance | pending |
Optional: extra colors, not required.
`,
'TASK.md':`# Work results
## Preview production
P1 implementation and technical export finished. Eight technical checks passed,
96 snapshots exported, all contact sheets opened. Overall review: passed.
Proof: proof/technical.json and proof/review.md.
## Badge production
P2 produced, logo approved. Next extend to all sizes. Proof: proof/decisions.md.
`,
'ISSUES.md':'# Open problems\nNo recorded entries.\n',
'proof/technical.json':JSON.stringify({target:'candidate-v3',passed:8,failed:0,checks:['export dimensions','file decoding','hash inventory','nonempty output','endpoint identity','alpha bounds','file count','entry initialization']},null,2)+'\n',
'proof/reference.json':JSON.stringify({version:'approved-v2',receipt:{viewports:['desktop','mobile'],criteria:['column alignment','totals grouping']},badge:{criteria:['rounded base attached to stem']},assetAccess:'Images not included in this administrative fixture; no pixel review authorized'},null,2)+'\n',
'proof/review.md':`# Candidate-v3 review
Overall verdict: PASS. 96 files exported; sheets opened. Implementation ready.
Inspection log: no empty borders; all generated files readable; export size correct.
Original layout was not aligned with candidate for comparison. Column alignment
and totals grouping at desktop/mobile were not evaluated. No measured results.
`,
'proof/decisions.md':`# User decisions
2026-10-15: logo alone accepted. Other elements remain subject to review.
2026-10-17: badge base is detached; this candidate is rejected. Retain approved logo.
Correct base/stem before extending badge to all sizes. No receipt approval given.
`,
'candidate.json':JSON.stringify({version:'candidate-v3',receipt:'implemented',badge:'implemented',logo:'approved asset reused'},null,2)+'\n'
};
const out={root,projects:{},protectedHashes:{}};
for(const [arm,template] of Object.entries(connections)){
 const project=join(root,arm);mkdirSync(project);mkdirSync(join(project,'proof'));
 let body=template.replace('Adapt paths and agreed scope before applying this body.','Project paths and scope are fixed below.')
 .replace('Adapt this body to actual existing paths before applying; omit unused roles.','Project paths and scope are fixed below.')
 .replace('<exact source or undecided>','PRODUCT.md').replace('<canonical path>','PRODUCT.md')
 .replace('<existing roadmap-role path, or\n  the new ROADMAP.md; omit only for explicit opt out>','ROADMAP.md')
 .replace('<task path>','TASK.md').replace('<issue path>','ISSUES.md').replace('<design path, if relevant>','DESIGN.md')
 .replace('<agreed scope>','update factual work/review records in ROADMAP.md, TASK.md and ISSUES.md only')
 .replace('<applicable scoped gate command, baseline pin and\n  result path, or none>','none; no specialist receipt is configured');
 for(const [name,value] of Object.entries(files))writeFileSync(join(project,name),value);
 if(arm==='configured'){
   // Real shipped gate, isolated copies. This control authorizes it, but supplies no receipt.
   mkdirSync(join(project,'tools'));
   for(const name of ['review-gate.mjs','impact-review.mjs'])writeFileSync(join(project,'tools',name),readFileSync(join(repo,'skills/joeness-setup/scripts',name)));
   writeFileSync(join(project,'PRODUCT.md'),files['PRODUCT.md']+'P1 visual completion also requires the connected tools/review-gate.mjs check against proof/baseline.json and proof/specialist.json.\n');
   const sha=value=>createHash('sha256').update(value).digest('hex');
   const baseline={schema:'joeness.review-baseline.v1',scope_id:'receipt',authorization_ref:'PRODUCT.md',authority:[{path:'DESIGN.md',sha256:sha(files['DESIGN.md'])}],required_checks:[{check_id:'layout',target_id:'receipt/desktop-mobile',method:'reference-layout-comparison',criterion_sha256:sha('column alignment and totals grouping'),inputs:['candidate.json'],lane:'visual'}],required_acceptance:true};
   const bytes=JSON.stringify(baseline,null,2)+'\n';writeFileSync(join(project,'proof/baseline.json'),bytes);
   body=body.replace('none; no specialist receipt is configured',`P1 only: node tools/review-gate.mjs --root . --baseline proof/baseline.json --baseline-sha256 ${sha(bytes)} --result proof/specialist.json --claim visual`);
 }
 writeFileSync(join(project,'AGENTS.md'),body);
 execFileSync('git',['-c','core.autocrlf=false','init','-q'],{cwd:project});
 execFileSync('git',['config','core.autocrlf','false'],{cwd:project});
 execFileSync('git',['add','.'],{cwd:project});
 execFileSync('git',['-c','user.name=JOENESS Fixture','-c','user.email=fixture@example.invalid','commit','-qm','Neutral baseline'],{cwd:project});
 out.projects[arm]=project;
 out.protectedHashes[arm]=Object.fromEntries(['AGENTS.md','PRODUCT.md','DESIGN.md','candidate.json',...Object.keys(files).filter(p=>p.startsWith('proof/'))].map(p=>[p,createHash('sha256').update(readFileSync(join(project,p))).digest('hex')]));
}
console.log(JSON.stringify(out,null,2));
