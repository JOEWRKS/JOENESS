import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,symlinkSync,readFileSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {revisionLine,localDate} from '../skills/joeness-setup/scripts/revision-line.mjs';
// 2.0.2 (bundle J): print the ROADMAP "Product revision / approval:" line from approval_status.py JSON.
const skill=fileURLToPath(new URL('../skills/joeness-setup',import.meta.url));
const cli=join(skill,'scripts','revision-line.mjs');
const fixture=name=>fileURLToPath(new URL('../fixtures/joeness-setup/approval-status/'+name,import.meta.url));
const load=name=>JSON.parse(readFileSync(fixture(name),'utf8'));
const run=(args,input)=>spawnSync(process.execPath,[cli,...args],{encoding:'utf8',input});
// ATELIER ROADMAP.md line 5 as of 2026-11-26 (read-only copy; the fixture is approval_status.py output for the same state).
const ATELIER_LINE='Product revision / approval: definition_revision 23, approval_status APPROVED, approved_revision 23, definition_status CLOSED (`approval_status.py`, read 2026-11-26).';

test('ATELIER fixture prints the exact ROADMAP line 5 (file argument and stdin agree)',()=>{
  assert.equal(revisionLine(load('atelier-rev23.json'),'2026-11-26'),ATELIER_LINE);
  const byFile=run(['--input',fixture('atelier-rev23.json'),'--date','2026-11-26']);
  assert.equal(byFile.status,0,byFile.stderr);assert.equal(byFile.stdout,ATELIER_LINE+'\n');assert.equal(byFile.stderr,'');
  const byStdin=run(['--date','2026-11-26'],readFileSync(fixture('atelier-rev23.json')));
  assert.equal(byStdin.status,0,byStdin.stderr);assert.equal(byStdin.stdout,byFile.stdout);
});
test('pending revisions are named inside the parenthesis',()=>{
  assert.equal(revisionLine(load('atelier-pending-rev25.json'),'2026-11-27'),
    'Product revision / approval: definition_revision 25, approval_status UNAPPROVED, approved_revision 23, definition_status OPEN (`approval_status.py`, pending_revisions 24-25, read 2026-11-27).');
  const one={...load('atelier-pending-rev25.json'),definition_revision:24,pending_revisions:[24]};
  assert.match(revisionLine(one,'2026-11-27'),/, pending_revisions 24, read 2026-11-27\)\.$/);
  const gap={...one,pending_revisions:[24,26]};
  assert.match(revisionLine(gap,'2026-11-27'),/pending_revisions 24\/26, read/);
});
test('no revision record prints none; null fields print none',()=>{
  const base={definition_revision:null,approval_status:null,approved_revision:null,definition_status:null,pending_revisions:[]};
  assert.equal(revisionLine(base,'2026-11-26'),'Product revision / approval: none (`approval_status.py`, read 2026-11-26).');
  assert.equal(revisionLine({...base,definition_revision:1,definition_status:'OPEN',pending_revisions:[1]},'2026-11-26'),
    'Product revision / approval: definition_revision 1, approval_status none, approved_revision none, definition_status OPEN (`approval_status.py`, pending_revisions 1, read 2026-11-26).');
});
test('the date defaults to the local date and is validated',()=>{
  const r=run(['--input',fixture('atelier-rev23.json')]);
  assert.equal(r.status,0,r.stderr);
  assert.ok(r.stdout.endsWith('read '+localDate()+').\n'),r.stdout);
  assert.equal(localDate(new Date(2026,10,26,23,59)),'2026-11-26');
  for(const bad of ['2026-1-26','26-11-2026','2026-13-40'])assert.throws(()=>revisionLine(load('atelier-rev23.json'),bad),/date/);
});
test('wrong input fails closed: stderr, exit 2, no line on stdout',t=>{
  const dir=mkdtempSync(join(tmpdir(),'joeness-revline-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));
  const cases={
    'not json':'nope',
    'script error':JSON.stringify({error:'usage: approval_status.py STATE_JSON'}),
    'missing field':JSON.stringify({definition_revision:3,approval_status:'APPROVED',approved_revision:3,definition_status:'CLOSED'}),
    'array':'[]',
    'bad pending':JSON.stringify({definition_revision:3,approval_status:'APPROVED',approved_revision:3,definition_status:'CLOSED',pending_revisions:'none'}),
    'odd value':JSON.stringify({definition_revision:3,approval_status:'APPROVED, approved_revision 9',approved_revision:3,definition_status:'CLOSED',pending_revisions:[]}),
  };
  for(const [name,body] of Object.entries(cases)){
    const r=run(['--date','2026-11-26'],body);
    assert.equal(r.status,2,name);assert.equal(r.stdout,'',name);assert.match(r.stderr,/revision-line/,name);
  }
  for(const args of [['--edit','ROADMAP.md'],['--date'],['--input',join(dir,'missing.json')]]){
    const r=run(args,'{}');
    assert.equal(r.status,2,args.join(' '));assert.equal(r.stdout,'');
  }
});
test('the script never writes a file: the input and its folder are unchanged',t=>{
  const dir=mkdtempSync(join(tmpdir(),'joeness-revline-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));
  const roadmap=join(dir,'ROADMAP.md'),input=join(dir,'status.json'),before='Product revision / approval: old line.\n';
  writeFileSync(roadmap,before);writeFileSync(input,readFileSync(fixture('atelier-rev23.json')));
  const r=spawnSync(process.execPath,[cli,'--input',input,'--date','2026-11-26'],{encoding:'utf8',cwd:dir});
  assert.equal(r.status,0,r.stderr);
  assert.equal(readFileSync(roadmap,'utf8'),before);
  assert.deepEqual(readFileSync(input),readFileSync(fixture('atelier-rev23.json')));
});
test('a junction/symlink install path prints the same line as the real path',t=>{
  const dir=mkdtempSync(join(tmpdir(),'joeness-revline-link-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));
  const link=join(dir,'joeness-setup');
  symlinkSync(skill,link,process.platform==='win32'?'junction':'dir');
  const via=spawnSync(process.execPath,[join(link,'scripts','revision-line.mjs'),'--input',fixture('atelier-rev23.json'),'--date','2026-11-26'],{encoding:'utf8'});
  assert.equal(via.status,0,via.stderr);assert.equal(via.stdout,ATELIER_LINE+'\n');
});
