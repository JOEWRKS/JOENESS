import {mkdtempSync,writeFileSync,readFileSync,mkdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const repo=fileURLToPath(new URL('../../',import.meta.url));
export const git=(root,...args)=>execFileSync('git',['-C',root,...args],{encoding:'utf8'}).trim();
export const broken='export function clamp(n) { return n; }\n';
export const fixed='export function clamp(n) { return Math.max(0, n); }\n';
export const issueDetail='R-1 resolved: timeout caused by missing cancellation. Fix: clear pending timer on close. Verified by timeout regression test.\n';
export const newerDetail='LATEST UNCOMMITTED: timer cleanup must also run on reconnect; old fix alone is insufficient.\n';
export const activeDetail='A-2 ACTIVE: intermittent reconnect failure. Effective workaround: reconnect once manually.\n';
export function createFixture(kind='normal'){
 const root=mkdtempSync(join(tmpdir(),'joeness-behavior-'));
 const write=(p,s)=>writeFileSync(join(root,p),s);
 git(root,'init','-q');
 git(root,'config','core.autocrlf','false');
 git(root,'config','user.name','JOENESS fixture');git(root,'config','user.email','fixture@example.invalid');
 write('PRODUCT.md','# Product\nA fictional local numeric utility. Clamp negatives to zero. No UI or network.\n');
 write('ROADMAP.md','# Direction\nNext release: JSON export. No approved mobile app.\n');
 write('TASK.md','# Current task\nClamp negatives to zero; not implemented yet.\n');
 write('ISSUES.md','# Issues\n'+issueDetail+'\n'+activeDetail);
 write('DESIGN.md','# Design\nNo UI. Product semantics are authoritative.\n');
 write('main.mjs',broken);
 write('main.test.mjs',"import test from 'node:test'; import assert from 'node:assert/strict'; import {clamp} from './main.mjs'; test('clamp',()=>{assert.equal(clamp(-2),0);assert.equal(clamp(4),4);});\n");
 write('HANDOFF.md','Old note: clamp is unfinished. Maybe someday build a mobile UI.\n');
 git(root,'add','.');git(root,'commit','-qm','fixture baseline');
 const archive=git(root,'rev-parse','HEAD');
 if(kind==='complete'){write('main.mjs',fixed);write('TASK.md','# Current task\nClamp implemented and focused test passes. COMPLETE.\n');git(root,'add','.');git(root,'commit','-qm','finish clamp');}
 if(kind==='new-detail')write('ISSUES.md',readFileSync(join(root,'ISSUES.md'),'utf8')+newerDetail);
 if(kind==='bad-ref')write('ISSUES.md','# Issues\nR-1 archived at deadbeefdeadbeefdeadbeefdeadbeefdeadbeef:ISSUES.md\n'+activeDetail);
 if(kind!=='plain'){
  let body='Sources: Product PRODUCT.md; task TASK.md; issues ISSUES.md; direction ROADMAP.md; design DESIGN.md.\n'+
  'On resume current files/Git/target outrank old handoff plans. Completed work stays complete; infer no new scope. If inspection finds no changed task fact, report completion without a repeat verification note.\n'+
  'Recording consent: after authorized work, record material execution and verification in TASK.md, reusable cause/fix/verification and workarounds in ISSUES.md. Do not duplicate prose.\n'+
  'Questions, opinions, explanation-only and no-record requests cause no document writes. No-record does not cancel separately authorized code work. Only explicit direction decisions update ROADMAP.md. Preserve Product and approved design.\n'+
  'If a source or record write is unavailable, report the exact boundary and continue independent authorized work.\n'+
  'For requested cleanup, compact resolved detail only after retrieving its latest actual content at exact Git commit:path/item. Keep uncommitted newer detail, active issues and effective workarounds visible. Without history preserve full detail; never invent retrieval.\n';
  if(kind==='unavailable'){body=body.replace('Product PRODUCT.md','Product missing/PRODUCT.md');}
  if(kind==='recording-off')body=body.replace(/Recording consent:.*\n/,'Recording consent: automatic recording is disabled. Keep navigation; do not update records unless explicitly requested.\n');
  const helper=join(repo,'skills/joeness-setup/scripts/project-setup.ps1');
  const ps=(args)=>JSON.parse(execFileSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',helper,...args],{encoding:'utf8'}));
  let c=ps(['-Check','-ProjectPath',root]);
  ps(['-Apply','-ProjectPath',root,'-ExpectedRoot',c.projectRoot,'-ExpectedTargetHash',c.targetHash,'-ExpectedStateHash',c.stateHash,'-ManagedBodyBase64',Buffer.from(body).toString('base64')]);
  if(kind==='detached'){c=ps(['-Check','-ProjectPath',root]);ps(['-Detach','-ProjectPath',root,'-ExpectedRoot',c.projectRoot,'-ExpectedTargetHash',c.targetHash,'-ExpectedStateHash',c.stateHash]);}
  git(root,'add','AGENTS.md');if(kind!=='detached')git(root,'add','.joeness');
  git(root,'commit','-qm','project connection');
 }
 if(kind==='zip')rmSync(join(root,'.git'),{recursive:true,force:true});
 return {root,archive,kind};
}
