// Independent consumer replay of frozen GEO renders. Never writes to GEO/producer.
import {readFileSync,writeFileSync,mkdtempSync,mkdirSync,copyFileSync,rmSync} from 'node:fs';
import {join,resolve,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
const source=resolve(process.argv[2]);
const project=join(source,'project'),artifacts=join(source,'artifacts');
const cli=fileURLToPath(new URL('../../../../skills/joeness-setup/scripts/review-gate.mjs',import.meta.url));
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const pin='51ad469774bbe050001185c14a2cba32af11886c5796115e06e69be52285a713';
assert.equal(sha(join(project,'baseline.json')),pin);
const baseline=JSON.parse(readFileSync(join(project,'baseline.json')));
const paths=[...new Set(['baseline.json',...baseline.authority.map(a=>a.path),...baseline.required_checks.flatMap(c=>c.inputs)])];
for(const p of paths)assert.ok(!/[\\:]/.test(p)&&!p.startsWith('/')&&p.split('/').every(s=>s&&s!=='.'&&s!=='..'),'contained fixture input');
const originals=[...paths.map(p=>join(project,p)),...['observed-receipt.json','injected-gap-receipt.json'].map(p=>join(artifacts,p))];
const before=originals.map(p=>sha(p));
assert.equal(before.at(-2),'6b153aaf41510bef4874e2748fdd43deca93bd4bdc1a3d4e0b6c28cc173d2166');
assert.equal(before.at(-1),'857e0784bcbcdd8f6bfea01df9214a1e9807d74c6bec1c511c57659e3475b782');
const root=mkdtempSync(join(tmpdir(),'joeness-geo-consumer-'));
const outcomes={};
function run(name,receipt,expected,status,claim='visual',extra=[],expectedPin=pin){
  const r=spawnSync(process.execPath,[cli,'--root',root,'--baseline','baseline.json','--baseline-sha256',expectedPin,'--result',receipt,'--evidence-root',artifacts,'--claim',claim,...extra],{encoding:'utf8'});
  assert.ifError(r.error);assert.ok(r.stdout.trim(),r.stderr);const out=JSON.parse(r.stdout);
  assert.equal(r.status,expected,name);assert.equal(out.allowed,expected===0,name);assert.equal(out.lanes.visual,status,name);
  assert.equal(out.lanes.user_acceptance,'NOT_GRANTED');assert.equal(out.project_complete,false);
  const counts={};for(const c of out.checks)counts[c.status]=(counts[c.status]||0)+1;
  outcomes[name]={exit:r.status,allowed:out.allowed,lanes:out.lanes,counts,errors:out.errors};
}
try{
  for(const p of paths){mkdirSync(dirname(join(root,p)),{recursive:true});copyFileSync(join(project,p),join(root,p));}
  const good=join(artifacts,'observed-receipt.json'),bad=join(artifacts,'injected-gap-receipt.json');
  run('observed-current',good,0,'PASS');
  run('not-user-acceptance',good,2,'PASS','complete');
  run('injected-receipt-after-restoration',bad,2,'STALE');
  const css=join(root,'design/visual.css'),original=readFileSync(css);
  writeFileSync(css,Buffer.concat([original,Buffer.from('\nbody[data-visual=true] .card-content{gap:24px!important}\n')]));
  run('old-proof-after-mutation',good,2,'STALE');
  run('measured-failure-current-inputs',bad,2,'FAIL');
  assert.deepEqual(outcomes['measured-failure-current-inputs'].counts,{PASS:39,FAIL:12});
  writeFileSync(css,original);run('restored',good,0,'PASS');
  const partial=JSON.parse(readFileSync(good));partial.results.pop();writeFileSync(join(root,'partial.json'),JSON.stringify(partial));
  run('missing-required-check','partial.json',2,'UNVERIFIED');
  copyFileSync(join(root,'baseline.json'),join(root,'previous.json'));
  baseline.targets[0].viewport=[375,900];writeFileSync(join(root,'baseline.json'),JSON.stringify(baseline));
  run('same-id-changed-viewport',good,2,'STALE','visual',['--previous-baseline','previous.json','--previous-baseline-sha256',pin],sha(join(root,'baseline.json')));
  assert.deepEqual(originals.map(p=>sha(p)),before,'frozen producer input/receipt bytes unchanged');
  console.log(JSON.stringify({source,consumer_sha256:sha(cli),baseline_sha256:pin,observed_receipt_sha256:before.at(-2),injected_receipt_sha256:before.at(-1),protected_file_count:originals.length,producerFilesUnchanged:true,scope:'GEO frozen snapshot; independent receipt consumption, no new browser measurement or live project activation',outcomes},null,2));
}finally{rmSync(root,{recursive:true,force:true});}
