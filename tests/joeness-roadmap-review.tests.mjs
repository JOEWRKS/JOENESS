import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,rmSync,readdirSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const cli=process.env.JOENESS_TEST_ROADMAP_CLI||fileURLToPath(new URL('../skills/joeness-setup/scripts/roadmap-review.mjs',import.meta.url));
const sha=b=>createHash('sha256').update(b).digest('hex');
const canonical=v=>Array.isArray(v)?'['+v.map(canonical).join(',')+']':v&&typeof v==='object'?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}':JSON.stringify(v);

function fixture(t){
  const root=mkdtempSync(join(tmpdir(),'joeness-roadmap-'));
  t.after(()=>rmSync(root,{recursive:true,force:true}));
  const put=(p,v)=>writeFileSync(join(root,p),typeof v==='string'?v:JSON.stringify(v));
  const hash=p=>sha(readFileSync(join(root,p)));
  const ref=(p,quote)=>({path:p,sha256:hash(p),quote});
  put('ROADMAP.md','## Current\nStage: closed\nNext: none\n## History\nStage: building\nNext: finish demo\n');
  put('scope.json',{scope:'demo',required:'demo only',excluded:'live search',acceptance:'not required',approval:'UNAPPROVED'});
  put('decision.txt','User authorizes non-launch demo delivery; live search excluded; visual acceptance not required for this delivery.');
  put('target.html','demo output');
  put('TASK.md','Implementation and technical check passed for demo output.');
  const ptr=(p,pointer,value)=>({path:p,sha256:hash(p),pointer,value});
  const targets=[{path:'target.html',sha256:hash('target.html')}];
  const input={schema:'joeness.roadmap-review.v1',scope_id:'demo',
    scope_source:ptr('scope.json','/scope','demo'),scope_authorization:ref('decision.txt','User authorizes non-launch demo delivery; live search excluded; visual acceptance not required for this delivery.'),
    mapping_review:null,
    views:[{id:'now',kind:'current',source:ref('ROADMAP.md','## Current\nStage: closed\nNext: none'),claims:[{key:'stage',value:'closed',source:ref('ROADMAP.md','Stage: closed')},{key:'next',value:'none',source:ref('ROADMAP.md','Next: none')}]},
      {id:'past',kind:'history',source:ref('ROADMAP.md','## History\nStage: building\nNext: finish demo'),claims:[{key:'stage',value:'building',source:ref('ROADMAP.md','Stage: building')}]}],
    required_outcomes:[{id:'demo',label:'데모 제작',required_lanes:['implementation','technical'],acceptance_required:false,source:ptr('scope.json','/required','demo only'),targets}],
    excluded_outcomes:[{id:'search',label:'실제 검색 성과',source:ptr('scope.json','/excluded','live search'),authorization:ref('decision.txt','live search excluded')}],
    observations:['implementation','technical'].map(lane=>({outcome_id:'demo',lane,status:'PASS',source:ref('TASK.md','Implementation and technical check passed for demo output.'),targets})),
    limitations:[{text:'전체 기획 승인은 별도',source:ptr('scope.json','/approval','UNAPPROVED')}]};
  function seal(){
    const {mapping_review,...mapping}=input;
    const review={scope_id:input.scope_id,status:'CONFIRMED',mapping_sha256:sha(canonical(mapping))};
    put('review.json',review);input.mapping_review=ptr('review.json','',review);put('input.json',input);
  }
  function run(args=[]){
    const r=spawnSync(process.execPath,[cli,'--root',root,'--input','input.json','--input-sha256',hash('input.json'),...args],{encoding:'utf8'});
    assert.ifError(r.error);assert.ok(r.stdout.trim(),r.stderr);return {exit:r.status,...JSON.parse(r.stdout)};
  }
  seal();return {root,input,put,hash,ref,ptr,seal,run,targets};
}
const kinds=r=>r.findings.map(f=>f.kind);
test('historical next work is ignored; authorized demo completion is scoped, not product approval',t=>{
  const f=fixture(t),r=f.run();assert.equal(r.exit,0);assert.equal(r.delivery,'complete');assert.equal(r.project_complete,false);
  assert.equal(r.excluded[0].id,'search');assert.equal(r.limitations[0].text,'전체 기획 승인은 별도');assert.deepEqual(r.findings,[]);
});
test('conflicting current views are not resolved by newest date',t=>{
  const f=fixture(t);f.input.views[1].kind='current';f.seal();const r=f.run();assert.equal(r.exit,2);assert.ok(kinds(r).includes('conflict'));assert.equal(r.delivery,'undetermined');
});
test('authorized reopening keeps old closure historical and required work incomplete',t=>{
  const f=fixture(t);f.input.views[0].kind='history';f.input.views[1].kind='current';f.input.observations[1].status='UNVERIFIED';f.seal();const r=f.run();assert.ok(!kinds(r).includes('conflict'));assert.equal(r.delivery,'undetermined');assert.ok(kinds(r).includes('unknown'));assert.equal(r.outcomes[0].lanes.implementation,'PASS');
});
test('missing evidence is unknown, not a fabricated failure or erased implementation',t=>{
  const f=fixture(t);f.input.observations[1].source={path:'missing.txt',sha256:'a'.repeat(64),quote:'checked'};f.seal();const r=f.run();assert.equal(r.delivery,'undetermined');assert.ok(kinds(r).includes('unknown'));assert.equal(r.outcomes[0].lanes.implementation,'PASS');
});
test('source quote and JSON pointer must match exact current bytes',t=>{
  const f=fixture(t);f.input.scope_source.value='production';f.seal();assert.ok(kinds(f.run()).includes('invalid'));
  f.input.scope_source.value='demo';f.input.observations[0].source.quote='fabricated PASS';f.seal();assert.ok(kinds(f.run()).includes('invalid'));
});
test('reviewer name or boolean is not semantic confirmation; changed mapping invalidates old review',t=>{
  const f=fixture(t);f.input.mapping_review={reviewer:'someone',confirmed:true};f.put('input.json',f.input);assert.notEqual(f.run().delivery,'complete');
  f.seal();f.input.observations[1].status='FAIL';f.put('input.json',f.input);const r=f.run();assert.ok(r.findings.some(x=>x.code==='MAPPING_STALE'));assert.notEqual(r.delivery,'complete');
});
test('pending mapping review or absent current view needs manual review',t=>{
  const f=fixture(t);f.input.mapping_review=null;f.put('input.json',f.input);assert.ok(kinds(f.run()).includes('unknown'));
  f.input.views.forEach(v=>v.kind='history');f.seal();assert.notEqual(f.run().delivery,'complete');
});
test('visual rejection, partial acceptance and missing required acceptance cannot complete',t=>{
  const f=fixture(t);f.input.required_outcomes[0].acceptance_required=true;
  for(const status of ['REJECTED','PARTIAL','NOT_GRANTED']){
    f.input.observations=f.input.observations.filter(o=>o.lane!=='acceptance');
    f.input.observations.push({outcome_id:'demo',lane:'acceptance',status,source:f.ref('decision.txt','User authorizes non-launch demo delivery; live search excluded; visual acceptance not required for this delivery.'),targets:f.targets});
    f.seal();const r=f.run();assert.equal(r.delivery,'incomplete');assert.equal(r.outcomes[0].lanes.implementation,'PASS');
  }
  f.input.observations.pop();f.seal();assert.equal(f.run().delivery,'undetermined');
});
test('technical pass cannot replace visual FAIL or PARTIAL',t=>{
  const f=fixture(t);f.input.required_outcomes[0].required_lanes.push('visual');
  f.input.observations.push({outcome_id:'demo',lane:'visual',status:'FAIL',source:f.ref('TASK.md','Implementation and technical check passed for demo output.'),targets:f.targets});
  f.seal();assert.equal(f.run().delivery,'incomplete');f.input.observations.at(-1).status='PARTIAL';f.seal();assert.equal(f.run().delivery,'incomplete');
});
test('stale or wrong-target evidence is unknown, never accepted on a PASS label',t=>{
  const f=fixture(t);f.input.observations[1].targets=[];f.seal();assert.notEqual(f.run().delivery,'complete');
  f.input.observations[1].targets=[{path:'other.html',sha256:'a'.repeat(64)}];f.seal();assert.ok(kinds(f.run()).includes('unknown'));
  f.input.observations[1].targets=f.targets;f.seal();f.put('target.html','new output');assert.ok(kinds(f.run()).includes('unknown'));
});
test('required and excluded overlap or contradictory observations are conflicts',t=>{
  const f=fixture(t);f.input.excluded_outcomes[0].id='demo';f.seal();assert.ok(kinds(f.run()).includes('conflict'));
  f.input.excluded_outcomes[0].id='search';f.input.observations.push({...f.input.observations[0],status:'FAIL'});f.seal();assert.ok(kinds(f.run()).includes('conflict'));
});
test('missing exclusion authority cannot be treated as approved out-of-scope',t=>{
  const f=fixture(t);delete f.input.excluded_outcomes[0].authorization;f.seal();const r=f.run();assert.notEqual(r.delivery,'complete');assert.ok(kinds(r).includes('invalid'));
});
test('malformed status, duplicate outcome and empty criterion lanes are invalid',t=>{
  for(const mutate of [f=>f.input.observations[0].status='ACCEPTED',f=>f.input.required_outcomes.push(f.input.required_outcomes[0]),f=>f.input.required_outcomes[0].required_lanes=[]]){
    const f=fixture(t);mutate(f);f.seal();assert.ok(kinds(f.run()).includes('invalid'));
  }
});
test('path traversal, absolute paths, inherited pointer and outside symlink are rejected',t=>{
  const f=fixture(t);for(const p of ['../outside','C:/outside','constructor']){
    f.input.scope_source=p==='constructor'?f.ptr('scope.json','/constructor','x'):{path:p,sha256:'a'.repeat(64),quote:'x'};
    f.seal();assert.notEqual(f.run().delivery,'complete');
  }
  const outside=mkdtempSync(join(tmpdir(),'joeness-roadmap-outside-'));t.after(()=>rmSync(outside,{recursive:true,force:true}));
  writeFileSync(join(outside,'proof.txt'),'hidden');symlinkSync(outside,join(f.root,'link'),'junction');
  f.input.scope_source={path:'link/proof.txt',sha256:sha('hidden'),quote:'hidden'};f.seal();assert.ok(kinds(f.run()).includes('invalid'));
});
test('CLI rejects duplicate/unknown options and wrong pinned input',t=>{
  const f=fixture(t);for(const args of [['--input','input.json'],['--constructor','x'],['--input-sha256','0'.repeat(64)]])assert.equal(f.run(args).exit,2);
});
test('read-only run leaves all source bytes intact and renders bounded human summary',t=>{
  const f=fixture(t),snapshot=()=>readdirSync(f.root).map(p=>[p,f.hash(p)]);const before=snapshot();assert.equal(f.run().exit,0);assert.deepEqual(snapshot(),before);
  const r=spawnSync(process.execPath,[cli,'--root',f.root,'--input','input.json','--input-sha256',f.hash('input.json'),'--format','text'],{encoding:'utf8'});
  assert.equal(r.status,0);assert.match(r.stdout,/이번 납품: 완료/);assert.match(r.stdout,/필수 잔여: 없음/);assert.match(r.stdout,/범위 밖: 실제 검색 성과/);assert.match(r.stdout,/참고 한계: 전체 기획 승인은 별도/);assert.deepEqual(snapshot(),before);
});
test('raw structured FAIL cannot be mapped to PASS even with fresh mapping review',t=>{
  const f=fixture(t);const raw={outcome_id:'demo',lane:'technical',status:'FAIL',targets:f.targets};
  f.put('raw.json',raw);f.input.observations[1].source=f.ptr('raw.json','',raw);f.seal();
  const r=f.run();assert.ok(r.findings.some(x=>x.code==='OBSERVATION_VALUE'));assert.notEqual(r.delivery,'complete');
});
test('source required criterion cannot be removed by a freshly sealed extraction',t=>{
  const f=fixture(t),raw={scope_id:'demo',required:[{...f.input.required_outcomes[0],id:'mandatory'}],excluded:[]};
  f.put('canonical.json',raw);f.input.scope_source=f.ptr('canonical.json','',raw);f.seal();
  assert.ok(f.run().findings.some(x=>x.code==='SCOPE_COVERAGE'));
});
test('roadmap complete claim conflicts with current TASK failure',t=>{
  const f=fixture(t);f.put('ROADMAP.md','## Current\ntechnical: PASS\n');
  f.input.views=[{id:'now',kind:'current',source:f.ref('ROADMAP.md','## Current\ntechnical: PASS'),claims:[{key:'outcome:demo:technical',value:'PASS',source:f.ref('ROADMAP.md','technical: PASS')}]}];
  f.input.observations[1].status='FAIL';f.seal();assert.ok(f.run().findings.some(x=>x.code==='ROADMAP_RESULT_CONFLICT'));
});
test('optional acceptance does not hide an explicit current rejection',t=>{
  const f=fixture(t);f.input.observations.push({outcome_id:'demo',lane:'acceptance',status:'REJECTED',source:f.ref('TASK.md','Implementation and technical check passed for demo output.'),targets:f.targets});f.seal();
  const r=f.run();assert.notEqual(r.delivery,'complete');assert.equal(r.outcomes[0].lanes.acceptance,'REJECTED');assert.ok(kinds(r).includes('conflict'));
});
test('manager regression: source-required acceptance and lanes cannot be downgraded',t=>{
  for(const field of ['acceptance','lanes']){
    const f=fixture(t),raw={...f.input.required_outcomes[0]};delete raw.source;
    if(field==='acceptance')raw.acceptance_required=true;else raw.required_lanes=['implementation','technical','visual'];
    f.put('required.json',raw);f.input.required_outcomes[0].source=f.ptr('required.json','',raw);f.seal();
    const r=f.run();assert.equal(r.exit,2);assert.ok(r.findings.some(x=>x.code==='OUTCOME_VALUE'));
  }
});
test('manager regression: history pointer cannot be classified inside current source',t=>{
  const f=fixture(t),raw={current:{next:'none'},history:{next:'resume closed work'}};f.put('view.json',raw);
  f.input.views=[{id:'now',kind:'current',source:f.ptr('view.json','/current',raw.current),claims:[{key:'next',value:raw.history.next,source:f.ptr('view.json','/history/next',raw.history.next)}]}];
  f.seal();const r=f.run();assert.equal(r.exit,2);assert.ok(r.findings.some(x=>x.code==='CLAIM_LOCATION'));
});
test('authorization for another scope and mixed current/history selector tricks do not pass',t=>{
  const f=fixture(t);const auth={scope_id:'different',decision:'approved'};f.put('auth.json',auth);f.input.scope_authorization=f.ptr('auth.json','',auth);f.seal();assert.ok(f.run().findings.some(x=>x.code==='AUTHORIZATION_SCOPE'));
  f.input.scope_authorization=f.ref('decision.txt','User authorizes non-launch demo delivery; live search excluded; visual acceptance not required for this delivery.');
  f.put('view.json',{current:'done',history:'resume'});f.input.views=[{id:'now',kind:'current',source:f.ref('view.json','"current":"done"'),claims:[{key:'next',value:'resume',source:f.ptr('view.json','/history','resume')}]}];f.seal();
  assert.ok(f.run().findings.some(x=>x.code==='CLAIM_LOCATION'));
});
