import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,chmodSync,rmSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {createFixture,git,issueDetail,newerDetail,activeDetail} from '../fixtures/joeness-setup/create-fixture.mjs';
test('fresh cases keep expectations outside user requests',()=>{
 const {cases}=JSON.parse(readFileSync(new URL('../fixtures/joeness-setup/behavior-cases.json',import.meta.url)));
 assert.equal(cases.length,21);
 assert.equal(new Set(cases.map(c=>c.id)).size,21);
 for(const c of cases)for(const key of ['fixture','userRequest','allowedChanges','forbiddenChanges','evidence','expectedOutcome'])assert.ok(c[key],c.id+':'+key);
});
test('routing fixtures distinguish a single reading burden from conflicting authority',()=>{
 const single=createFixture('simple-routing');const scattered=createFixture('scattered');
 try{
  const singleAgents=readFileSync(join(single.root,'AGENTS.md'),'utf8');
  const singleTask=readFileSync(join(single.root,'TASK.md'),'utf8');
  const singleRoadmap=readFileSync(join(single.root,'ROADMAP.md'),'utf8');
  assert.match(singleAgents,/read EXTRA\.md for every task/i);
  assert.match(readFileSync(join(single.root,'EXTRA.md'),'utf8'),/unrelated background/i);
  assert.doesNotMatch(singleTask,/CSV export/);
  assert.match(singleRoadmap,/JSON export/);
  const scatteredAgents=readFileSync(join(scattered.root,'AGENTS.md'),'utf8');
  const scatteredTask=readFileSync(join(scattered.root,'TASK.md'),'utf8');
  const scatteredRoadmap=readFileSync(join(scattered.root,'ROADMAP.md'),'utf8');
  assert.match(scatteredAgents,/read EXTRA\.md for every task/i);
  assert.match(scatteredTask,/approved direction: CSV export/i);
  assert.match(scatteredRoadmap,/Next release: JSON export/);
 }finally{rmSync(single.root,{recursive:true,force:true});rmSync(scattered.root,{recursive:true,force:true});}
});
test('recording fixture locates task checks in TASK and reusable causes in ISSUES',()=>{
 const f=createFixture('normal');
 try{
  const agents=readFileSync(join(f.root,'AGENTS.md'),'utf8');
  assert.match(agents,/execution and verification in TASK\.md/i);
  assert.match(agents,/reusable cause\/fix\/workaround in ISSUES\.md/i);
  assert.match(agents,/link TASK evidence/i);
 }finally{rmSync(f.root,{recursive:true,force:true});}
});
test('locked fixture makes TASK record writes fail without hiding its current text',()=>{
 const f=createFixture('locked');const task=join(f.root,'TASK.md');
 try{
  const current=readFileSync(task);
  assert.match(current.toString(),/Clamp negatives to zero/);
  assert.throws(()=>writeFileSync(task,current),e=>['EPERM','EACCES'].includes(e.code));
 }finally{chmodSync(task,0o666);rmSync(f.root,{recursive:true,force:true});}
});
test('actual Git archive predates the latest uncommitted detail',()=>{
 const f=createFixture('new-detail');
 try{
  const archived=git(f.root,'show',f.archive+':ISSUES.md');
  assert.ok(archived.includes(issueDetail.trim()));assert.ok(!archived.includes(newerDetail.trim()));
  const current=readFileSync(join(f.root,'ISSUES.md'),'utf8');
  assert.ok(current.includes(newerDetail));assert.ok(current.includes(activeDetail));
 }finally{rmSync(f.root,{recursive:true,force:true});}
});
test('ZIP has no Git history and actual Detach leaves no instruction block',()=>{
 const zip=createFixture('zip');const detached=createFixture('detached');
 try{assert.equal(existsSync(join(zip.root,'.git')),false);assert.ok(readFileSync(join(zip.root,'AGENTS.md'),'utf8').includes('Without history preserve full detail'));assert.equal(readFileSync(join(detached.root,'AGENTS.md'),'utf8'),'');}
 finally{rmSync(zip.root,{recursive:true,force:true});rmSync(detached.root,{recursive:true,force:true});}
});
