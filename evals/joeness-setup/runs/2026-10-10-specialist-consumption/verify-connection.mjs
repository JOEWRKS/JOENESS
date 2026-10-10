// Replay only the consumer against independently produced JOEDESIGN artifacts.
// Mutations stay in a disposable copy; producer/project sources are never edited.
import {mkdtempSync,readFileSync,writeFileSync,copyFileSync,rmSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
const source=resolve(process.argv[2]);
const project=join(source,'project'),artifacts=join(source,'artifacts');
const cli=fileURLToPath(new URL('../../../../skills/joeness-setup/scripts/review-gate.mjs',import.meta.url));
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const protectedPaths=['project/baseline.json','project/DESIGN.md','project/index.html','artifacts/corrected-receipt.json','artifacts/stacked-receipt.json','results.json'];
const before=Object.fromEntries(protectedPaths.map(p=>[p,sha(join(source,p))]));
const pin=before['project/baseline.json'];
assert.equal(pin,'cc17b0d20246191ca7ee0622c78dcdae0945b9466cca2439fd71b8d6c632b4bc','independently supplied frozen fixture pin');
const root=mkdtempSync(join(tmpdir(),'joeness-producer-consumer-'));
const outcomes={};
const run=(name,receipt,expected,claim='visual',work=root)=>{
  const args=[cli,'--root',work,'--baseline','baseline.json','--baseline-sha256',pin,'--evidence-root',artifacts,'--claim',claim];if(receipt)args.push('--result',receipt);
  const r=spawnSync(process.execPath,args,{encoding:'utf8'});assert.ifError(r.error);assert.ok(r.stdout.trim(),r.stderr);const out=JSON.parse(r.stdout);assert.equal(r.status,expected,name);assert.equal(out.allowed,expected===0,name);
  outcomes[name]={exit:r.status,allowed:out.allowed,lanes:out.lanes,checks:out.checks?.map(c=>({check_id:c.check_id,status:c.status})),errors:out.errors};
};
try{
  for(const p of ['baseline.json','DESIGN.md','index.html'])copyFileSync(join(project,p),join(root,p));
  const receiptPath=join(artifacts,'corrected-receipt.json');
  run('actual-producer-current',receiptPath,0,'visual',project);
  run('actual-producer-not-acceptance',receiptPath,2,'complete',project);
  run('missing',null,2);
  const original=readFileSync(receiptPath,'utf8');
  let receipt=JSON.parse(original);receipt.results.pop();writeFileSync(join(root,'partial.json'),JSON.stringify(receipt));run('missing-one-check','partial.json',2);
  writeFileSync(join(root,'bad.json'),'{');run('damaged-result','bad.json',2);
  writeFileSync(join(root,'index.html'),readFileSync(join(project,'index.html'),'utf8')+'<!-- changed -->');run('changed-output',receiptPath,2);copyFileSync(join(project,'index.html'),join(root,'index.html'));
  const baseline=JSON.parse(readFileSync(join(root,'baseline.json')));baseline.required_checks.pop();writeFileSync(join(root,'baseline.json'),JSON.stringify(baseline));run('deleted-required-check',receiptPath,2);copyFileSync(join(project,'baseline.json'),join(root,'baseline.json'));
  receipt=JSON.parse(original);copyFileSync(receipt.results[0].evidence[0].path,join(root,'proof.json'));receipt.results[0].evidence[0].path='proof.json';writeFileSync(join(root,'damaged-proof.json'),JSON.stringify(receipt));writeFileSync(join(root,'proof.json'),'damaged');run('damaged-proof','damaged-proof.json',2);
  writeFileSync(join(root,'unrelated.txt'),'not a dependency');run('unrelated-work',receiptPath,0);
  run('recovered',receiptPath,0);
  const after=Object.fromEntries(protectedPaths.map(p=>[p,sha(join(source,p))]));assert.deepEqual(after,before,'producer artifacts unchanged');
  console.log(JSON.stringify({source,consumer_sha256:sha(cli),sources:before,producerArtifactsUnchanged:true,scope:'independent consumer replay; no browser recapture, production write, installation or user acceptance',outcomes},null,2));
}finally{rmSync(root,{recursive:true,force:true});}
