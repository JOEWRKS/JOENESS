import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,symlinkSync,writeFileSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';
// 2.0.1: a junction/symlink install path (Claude Code skills folder) must run the same main as the real path.
// Before 2.0.1 the entry guard compared the real module URL with the link argv path, so main never ran and the gate exited 0.
const skill=fileURLToPath(new URL('../skills/joeness-setup',import.meta.url));
const scripts=['review-gate','roadmap-review','operation-review','impact-review'];
const args={
  'review-gate':['--baseline','x','--baseline-sha256','0000','--result','x','--claim','complete'],
  'roadmap-review':['--input','x','--input-sha256','0000'],
  'operation-review':['--request','x','--request-sha256','0000','--capture','x','--capture-sha256','0000'],
  'impact-review':['--impact','x','--impact-sha256','0000'],
};
function linked(t){
  const dir=mkdtempSync(join(tmpdir(),'joeness-link-'));
  t.after(()=>rmSync(dir,{recursive:true,force:true}));
  const link=join(dir,'joeness-setup');
  symlinkSync(skill,link,process.platform==='win32'?'junction':'dir');
  const root=join(dir,'empty');mkdirSync(root);
  return {dir,link,root};
}
const run=(file,root,extra)=>spawnSync(process.execPath,[file,'--root',root,...extra],{encoding:'utf8'});
for(const name of scripts){
  test(`${name}: link path runs main with the same stdout and exit as the real path`,t=>{
    const {link,root}=linked(t);
    const real=run(join(skill,'scripts',name+'.mjs'),root,args[name]);
    const via=run(join(link,'scripts',name+'.mjs'),root,args[name]);
    assert.ifError(real.error);assert.ifError(via.error);
    assert.ok(real.stdout.trim(),'real path printed nothing: '+real.stderr);
    assert.notEqual(real.status,0,'invalid input must not pass');
    assert.equal(via.stdout,real.stdout,'link stdout differs: '+via.stderr);
    assert.equal(via.status,real.status);
  });
}
test('a direct run whose guard does not match fails closed (stderr, exit 2), never a silent exit 0',t=>{
  const {dir,root}=linked(t);
  for(const name of scripts){
    const wrapper=join(dir,name+'.mjs');
    writeFileSync(wrapper,`import ${JSON.stringify(pathToFileURL(join(skill,'scripts',name+'.mjs')).href)};\n`);
    const r=run(wrapper,root,args[name]);
    assert.equal(r.status,2,name+': '+r.stdout+r.stderr);
    assert.match(r.stderr,/entry guard/,name);
    assert.equal(r.stdout,'',name);
  }
});
