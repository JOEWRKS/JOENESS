import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
const here=fileURLToPath(new URL('.',import.meta.url));
const cli=process.env.JOENESS_TEST_ROADMAP_CLI||resolve(here,'../../../../skills/joeness-setup/scripts/roadmap-review.mjs');
const expectationPath='D:/JOEWRKS/JOEDESIGN/evals/feedback-implementation-20261013/f02-expectations-v3.json';
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const snapshot=root=>Object.fromEntries(readdirSync(root,{recursive:true,withFileTypes:true}).filter(x=>x.isFile()).map(x=>{const p=join(x.parentPath,x.name);return[p,sha(p)];}));
const spec=JSON.parse(readFileSync(expectationPath)),sourceHash=sha(cli),results=[];
for(const c of spec.cases){
  const inputPath=resolve(dirname(expectationPath),c.input),root=dirname(inputPath),before=snapshot(root);
  assert.equal(sha(inputPath),c.input_sha256,'Producer expectation pin changed');
  const args=[cli,'--root',root,'--input','input.json','--input-sha256',c.input_sha256];
  const r=spawnSync(process.execPath,args,{encoding:'utf8'});assert.ifError(r.error);
  const output=JSON.parse(r.stdout),kinds=output.findings.map(f=>f.kind);
  const met=c.expected_class==='ready'?r.status===0&&output.delivery==='complete':c.expected_class==='blocked'?r.status===2&&output.delivery!=='complete':r.status===2&&c.expected_class.split('_or_').some(x=>kinds.includes(x));
  const after=snapshot(root);results.push({id:c.id,expected:c.expected_class,command:[process.execPath,...args],exit:r.status,met,source_unchanged:JSON.stringify(before)===JSON.stringify(after),fixture_sha256:after,output});
}
assert.equal(sha(cli),sourceHash,'Consumer changed during replay');
const summary={kind:'independent-producer-synthetic-fixtures-source-consumption',cli,cli_sha256:sourceHash,expectations:expectationPath,expectation_sha256:sha(expectationPath),passed:results.filter(r=>r.met&&r.source_unchanged).length,total:results.length,results};
writeFileSync(join(here,process.env.JOENESS_TEST_ROADMAP_CLI?'producer-fixtures-installed.json':'producer-fixtures-source.json'),JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify({passed:summary.passed,total:summary.total,cli_sha256:sourceHash}));assert.equal(summary.passed,summary.total);
