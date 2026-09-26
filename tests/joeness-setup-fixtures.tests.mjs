import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,rmSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {createFixture,git,issueDetail,newerDetail,activeDetail} from '../fixtures/joeness-setup/create-fixture.mjs';
test('fresh cases keep expectations outside user requests',()=>{
 const {cases}=JSON.parse(readFileSync(new URL('../fixtures/joeness-setup/behavior-cases.json',import.meta.url)));
 assert.equal(new Set(cases.map(c=>c.id)).size,17);
 for(const c of cases)for(const key of ['fixture','userRequest','allowedChanges','forbiddenChanges','evidence','expectedOutcome'])assert.ok(c[key],c.id+':'+key);
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
