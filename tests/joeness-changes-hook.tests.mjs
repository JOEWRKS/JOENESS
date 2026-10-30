import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync,execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
// Simulates the Claude Code event order: UserPromptSubmit (no flag) and Stop (--record).
const hook=fileURLToPath(new URL('../skills/joeness-setup/scripts/changes-hook.mjs',import.meta.url));
function repo(t) {
  const root=mkdtempSync(join(tmpdir(),'joeness-hook-'));
  t.after(()=>rmSync(root,{recursive:true,force:true}));
  const git=(...a)=>execFileSync('git',['-c','user.name=t','-c','user.email=t@local',...a],{cwd:root,encoding:'utf8'});
  git('init','-q'); writeFileSync(join(root,'a.css'),'a\n'); git('add','.'); git('commit','-q','-m','base');
  const commit=(file,msg)=>{writeFileSync(join(root,file),msg+'\n'); git('add','.'); git('commit','-q','-m',msg);};
  const run=(...flags)=>{const r=spawnSync(process.execPath,[hook,...flags],{cwd:root,encoding:'utf8',env:{...process.env,CLAUDE_PROJECT_DIR:root}}); assert.equal(r.status,0,r.stderr); return r.stdout;};
  return {root,commit,run};
}
test('first message and unmoved HEAD print nothing',t=>{
  const r=repo(t);
  assert.equal(r.run(),''); assert.equal(r.run('--record'),''); assert.equal(r.run(),'');
});
test('commit landing between turns is reported with its files',t=>{
  const r=repo(t);
  r.run(); r.run('--record');
  r.commit('a.css','teammate change');
  const out=r.run();
  assert.match(out,/Commits since your previous turn ended:\n[0-9a-f]+ teammate change\n/);
  assert.match(out,/Files they changed:\na\.css\n/);
  assert.match(out,/out of date; run it again/);
  assert.equal(r.run(),'','reported once');
});
test('agent own commit during its turn is not reported back',t=>{
  const r=repo(t);
  r.run();
  r.commit('b.css','agent commit');
  assert.equal(r.run('--record'),'','Stop prints nothing');
  assert.equal(r.run(),'');
});
test('own commit plus later teammate commit reports only the teammate commit',t=>{
  const r=repo(t);
  r.run(); r.commit('b.css','agent commit'); r.run('--record');
  r.commit('a.css','teammate change');
  const out=r.run();
  assert.match(out,/teammate change/); assert.doesNotMatch(out,/agent commit/);
});
test('outside a Git repository the hook stays silent',t=>{
  const root=mkdtempSync(join(tmpdir(),'joeness-hook-nogit-'));
  t.after(()=>rmSync(root,{recursive:true,force:true}));
  const r=spawnSync(process.execPath,[hook],{cwd:root,encoding:'utf8',env:{...process.env,CLAUDE_PROJECT_DIR:root,GIT_CEILING_DIRECTORIES:join(root,'..')}});
  assert.equal(r.status,0); assert.equal(r.stdout,'');
});
