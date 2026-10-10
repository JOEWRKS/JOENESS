import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,rmSync,existsSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
// Allows the install lifecycle test to exercise shipped bytes, not source bytes.
const cli=process.env.JOENESS_TEST_GATE_CLI||fileURLToPath(new URL('../skills/joeness-setup/scripts/review-gate.mjs',import.meta.url));
const hash=b=>createHash('sha256').update(b).digest('hex');
function fixture(t) {
  const root=mkdtempSync(join(tmpdir(),'joeness-review-'));
  t.after(()=>rmSync(root,{recursive:true,force:true}));
  const put=(p,data)=>writeFileSync(join(root,p),typeof data==='string'?data:JSON.stringify(data));
  const sha=p=>hash(readFileSync(join(root,p)));
  put('DESIGN.md','approved fixture: measured gaps'); put('mobile.css','mobile v1'); put('desktop.css','desktop v1');
  put('observed.json','{"gap":40,"method":"rendered"}');
  const checks=['mobile','desktop'].map(id=>({check_id:id,target_id:id+'-page/default',method:'edge-distance',criterion_sha256:hash('40px'),inputs:[id+'.css'],lane:'visual'}));
  const b={schema:'joeness.review-baseline.v1',scope_id:'spacing',authorization_ref:'fixture-user-approved-1',authority:[{path:'DESIGN.md',sha256:sha('DESIGN.md')}],required_checks:checks,required_acceptance:false};
  put('baseline.json',b); const pin=sha('baseline.json');
  const fingerprint=c=>hash(JSON.stringify([...c.inputs].sort().map(p=>[p,sha(p)])));
  const receipt=()=>({schema:'joedesign.conformance.v1',scope_id:'spacing',baseline_sha256:sha('baseline.json'),results:b.required_checks.map(c=>({...c,status:'PASS',input_fingerprint:fingerprint(c),evidence:[{path:'observed.json',sha256:sha('observed.json')}]})),unresolved:[],acceptance:'NOT_GRANTED'});
  put('receipt.json',receipt());
  const run=(extra=[],expectedPin=pin)=>{const claimAt=extra.indexOf('--claim');const claim=claimAt<0?'visual':extra[claimAt+1];const rest=claimAt<0?extra:extra.filter((_,i)=>i!==claimAt&&i!==claimAt+1);const r=spawnSync(process.execPath,[cli,'--root',root,'--baseline','baseline.json','--baseline-sha256',expectedPin,'--result','receipt.json','--claim',claim,...rest],{encoding:'utf8'}); assert.ifError(r.error); assert.ok(r.stdout.trim(),r.stderr);return {exit:r.status,...JSON.parse(r.stdout)};};
  return {root,put,sha,b,pin,receipt,run,fingerprint};
}
test('current full specialist coverage permits only visual claim, not user acceptance',t=>{
  const f=fixture(t),r=f.run(); assert.equal(r.exit,0);assert.equal(r.lanes.visual,'PASS');assert.equal(r.lanes.implementation,'UNVERIFIED');assert.equal(r.lanes.technical,'UNVERIFIED');assert.equal(r.lanes.user_acceptance,'NOT_GRANTED');assert.equal(r.project_complete,false);
});
test('missing check blocks and recovering the missing result passes',t=>{
  const f=fixture(t),r=f.receipt();r.results.pop();f.put('receipt.json',r); assert.equal(f.run().exit,2); f.put('receipt.json',f.receipt());assert.equal(f.run().exit,0);
});
test('sum-spacing failure and unresolved item cannot be overridden by top-level PASS',t=>{
  const f=fixture(t),r=f.receipt();r.status='PASS';r.results[0].status='FAIL';f.put('receipt.json',r);assert.equal(f.run().lanes.visual,'FAIL');r.results[0].status='PASS';r.unresolved=[{check_id:'mobile',reason:'sum spacing mismatch'}];f.put('receipt.json',r);assert.equal(f.run().exit,2);
});
test('technical pass cannot substitute for missing visual result',t=>{
  const f=fixture(t);f.put('receipt.json',{schema:'joeness.check-results.v1',scope_id:'spacing',baseline_sha256:f.pin,results:[],unresolved:[],acceptance:'NOT_GRANTED'});assert.equal(f.run().exit,2);
});
test('changed output invalidates only affected check; fresh evidence restores it',t=>{
  const f=fixture(t);f.put('mobile.css','v2');let r=f.run();assert.equal(r.exit,2);assert.equal(r.checks.find(c=>c.check_id==='mobile').status,'STALE');assert.equal(r.checks.find(c=>c.check_id==='desktop').status,'PASS');f.put('receipt.json',f.receipt());assert.equal(f.run().exit,0);
});
test('weakened baseline or deleted check fails against externally pinned expectation',t=>{
  const f=fixture(t);f.b.required_checks.pop();f.put('baseline.json',f.b);f.put('receipt.json',f.receipt());assert.equal(f.run().exit,2);
});
test('missing/corrupt result and damaged evidence fail closed',t=>{
  const f=fixture(t);rmSync(join(f.root,'receipt.json'));assert.equal(f.run().exit,2);f.put('receipt.json','{');assert.equal(f.run().exit,2);f.put('receipt.json',f.receipt());f.put('observed.json','damaged');assert.equal(f.run().exit,2);
});
test('changed criteria, wrong target, duplicate result and path escape fail closed',t=>{
  const f=fixture(t);for(const mutate of [r=>r.results[0].criterion_sha256=hash('80px'),r=>r.results[0].target_id='elsewhere',r=>r.results.push(r.results[0]),r=>r.results[0].evidence[0].path='../outside.json']){const r=f.receipt();mutate(r);f.put('receipt.json',r);assert.equal(f.run().exit,2);}
});
test('changed approved source is stale even when result says PASS',t=>{
  const f=fixture(t);f.put('DESIGN.md','weakened rule');assert.equal(f.run().exit,2);
});
test('approval remains separate and bound to exact current outputs',t=>{
  const f=fixture(t);f.b.required_acceptance=true;f.put('baseline.json',f.b);f.put('receipt.json',f.receipt());const pin=f.sha('baseline.json');assert.equal(f.run(['--claim','complete'],pin).exit,2);
  f.put('user.txt','fixture user accepted exact scope');f.put('acceptance.json',{schema:'joeness.user-acceptance.v1',scope_id:'spacing',baseline_sha256:pin,status:'ACCEPTED',source:{path:'user.txt',sha256:f.sha('user.txt')},input_fingerprints:Object.fromEntries(f.b.required_checks.map(c=>[c.check_id,f.fingerprint(c)]))});
  const args=['--claim','complete','--acceptance','acceptance.json','--acceptance-sha256',f.sha('acceptance.json')];assert.equal(f.run(args,pin).exit,0);f.put('mobile.css','next output');assert.equal(f.run(args,pin).exit,2);
});
test('new authorized baseline reuses unchanged checks only with explicit prior baseline pin',t=>{
  const f=fixture(t);f.put('previous.json',f.b);const old=f.receipt();f.b.required_checks[0].criterion_sha256=hash('32px');f.put('baseline.json',f.b);f.put('receipt.json',old);const pin=f.sha('baseline.json');const r=f.run(['--previous-baseline','previous.json','--previous-baseline-sha256',f.pin],pin);assert.equal(r.exit,2);assert.equal(r.checks.find(c=>c.check_id==='desktop').status,'PASS');assert.notEqual(r.checks.find(c=>c.check_id==='mobile').status,'PASS');
});
test('empty scope and forged visual acceptance cannot pass',t=>{
  const f=fixture(t),r=f.receipt();r.acceptance='ACCEPTED';f.put('receipt.json',r);assert.equal(f.run().exit,2);f.b.required_checks=[];f.put('baseline.json',f.b);assert.equal(f.run([],f.sha('baseline.json')).exit,2);
});
test('explicit consumer advances only after gate permits the requested scope',t=>{
  const f=fixture(t),r=f.receipt();r.results.pop();f.put('receipt.json',r);
  const consume=()=>{const result=f.run();if(result.exit===0&&result.allowed)f.put('consumer-state.json',{visual:'complete',acceptance:result.lanes.user_acceptance});};
  consume();assert.equal(existsSync(join(f.root,'consumer-state.json')),false);
  f.put('receipt.json',f.receipt());consume();assert.deepEqual(JSON.parse(readFileSync(join(f.root,'consumer-state.json'))),{visual:'complete',acceptance:'NOT_GRANTED'});
});
test('outside proof needs an explicitly allowed evidence root',t=>{
  const f=fixture(t),dir=mkdtempSync(join(tmpdir(),'joeness-proof-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));
  const p=join(dir,'render.json');writeFileSync(p,'actual fixture observation');const r=f.receipt();r.results[0].evidence=[{path:p,sha256:hash(readFileSync(p))}];f.put('receipt.json',r);
  assert.equal(f.run().exit,2);assert.equal(f.run(['--evidence-root',dir]).exit,0);
});
test('external producer receipt is read directly only within allowlisted evidence root',t=>{
  const f=fixture(t),dir=mkdtempSync(join(tmpdir(),'joeness-receipt-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));
  const p=join(dir,'receipt.json');writeFileSync(p,JSON.stringify(f.receipt()));
  const call=allow=>spawnSync(process.execPath,[cli,'--root',f.root,'--baseline','baseline.json','--baseline-sha256',f.pin,'--result',p,'--claim','visual',...(allow?['--evidence-root',dir]:[])],{encoding:'utf8'});
  assert.equal(call(false).status,2);assert.equal(call(true).status,0);
});
test('separate technical lane passes without falsely advancing visual or complete',t=>{
  const f=fixture(t);f.b.required_checks.push({check_id:'unit',target_id:'module',method:'test',criterion_sha256:hash('unit'),inputs:['desktop.css'],lane:'technical'});f.put('baseline.json',f.b);const pin=f.sha('baseline.json'),r=f.receipt();r.schema='joeness.check-results.v1';r.results=r.results.filter(c=>c.lane==='technical');f.put('receipt.json',r);
  const partial=f.run(['--claim','technical'],pin);assert.equal(partial.exit,0);assert.equal(partial.lanes.visual,'UNVERIFIED');assert.equal(f.run(['--claim','complete'],pin).exit,2);
});
test('authorized changed criterion recovers with fresh affected and reusable unaffected results',t=>{
  const f=fixture(t);f.put('previous.json',f.b);const old=f.receipt();old.results=old.results.filter(c=>c.check_id==='desktop');f.put('old-result.json',old);
  f.b.required_checks[0].criterion_sha256=hash('32px');f.put('baseline.json',f.b);const fresh=f.receipt();fresh.results=fresh.results.filter(c=>c.check_id==='mobile');f.put('receipt.json',fresh);
  assert.equal(f.run(['--previous-baseline','previous.json','--previous-baseline-sha256',f.pin,'--result','old-result.json'],f.sha('baseline.json')).exit,0);
});

test('prior evidence cannot cross changed target, rule, authority or opaque baseline context',t=>{
  const f=fixture(t);
  f.b.targets=[{id:'mobile-page/default',viewport:[390,844],state:'default'}];
  f.b.rules=[{id:'spacing',meaning:'current layout'}];
  f.put('baseline.json',f.b);f.put('previous.json',f.b);const oldPin=f.sha('baseline.json');
  const previous=structuredClone(f.b),old=f.receipt();
  const changes=[b=>b.targets[0].viewport=[1440,1000],b=>b.targets[0].state='expanded',b=>b.rules[0].meaning='different rule',b=>{f.put('DESIGN.md','new approved meaning');b.authority[0].sha256=f.sha('DESIGN.md');},b=>b.runtime_context={locale:'ko'}];
  for(const change of changes){
    Object.assign(f.b,structuredClone(previous));delete f.b.runtime_context;
    f.put('DESIGN.md','approved fixture: measured gaps');change(f.b);f.put('baseline.json',f.b);f.put('receipt.json',old);
    const args=['--previous-baseline','previous.json','--previous-baseline-sha256',oldPin];
    const r=f.run(args,f.sha('baseline.json'));assert.equal(r.exit,2,JSON.stringify(f.b));assert.equal(r.lanes.visual,'STALE');
    f.put('receipt.json',f.receipt());assert.equal(f.run(args,f.sha('baseline.json')).exit,0,'fresh evidence recovers');
  }
});

test('duplicate singleton CLI options cannot silently weaken requested claim or pin',t=>{
  const f=fixture(t);
  for(const extra of [['--claim','complete','--claim','visual'],['--baseline-sha256',f.pin],['--root',f.root]])assert.equal(f.run(extra).exit,2);
});

test('declared missing lane blocks complete but does not undo verified visual work',t=>{
  const f=fixture(t);f.b.required_lanes=['visual','technical'];f.put('baseline.json',f.b);f.put('receipt.json',f.receipt());const pin=f.sha('baseline.json');
  assert.equal(f.run([],pin).exit,0);const r=f.run(['--claim','complete'],pin);assert.equal(r.exit,2);assert.equal(r.lanes.visual,'PASS');assert.equal(r.lanes.technical,'UNVERIFIED');
});

test('unverified specialist result stays unverified despite intact evidence',t=>{
  const f=fixture(t),r=f.receipt();r.results[0].status='UNVERIFIED';f.put('receipt.json',r);const out=f.run();assert.equal(out.exit,2);assert.equal(out.lanes.visual,'UNVERIFIED');assert.equal(out.checks[1].status,'PASS');
});

test('junction outside root cannot smuggle evidence into allowed project',t=>{
  const f=fixture(t),outside=mkdtempSync(join(tmpdir(),'joeness-junction-proof-'));
  t.after(()=>rmSync(outside,{recursive:true,force:true}));
  writeFileSync(join(outside,'proof.json'),'outside evidence');symlinkSync(outside,join(f.root,'link'),'junction');
  const r=f.receipt();r.results[0].evidence=[{path:'link/proof.json',sha256:hash('outside evidence')}];f.put('receipt.json',r);
  assert.equal(f.run().exit,2);assert.equal(f.run(['--evidence-root',outside]).exit,0);
});

test('CLI rejects inherited property names as unknown options',t=>{
  const f=fixture(t);for(const key of ['constructor','toString','__proto__'])assert.equal(f.run([key,'ignored']).exit,2);
});
