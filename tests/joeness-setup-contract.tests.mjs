import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync, mkdtempSync, rmSync, appendFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {relative,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const read = p => readFileSync(new URL('../'+p, import.meta.url));
test('CLI shows usable onboarding only after successful Apply while stdout stays JSON', () => {
  const root=mkdtempSync(join(tmpdir(),'joeness-onboarding-'));
  const entry=fileURLToPath(new URL('../JOENESS.ps1',import.meta.url));
  const run=mode=>{
    const r=spawnSync('powershell.exe',['-NoProfile','-File',entry,'-'+mode,'-CodexHome',root],{encoding:'utf8'});
    assert.ifError(r.error);
    return {...r,result:JSON.parse(r.stdout.trim())};
  };
  try {
    const check=run('Check');
    assert.equal(check.status,0); assert.equal(check.result.status,'ready');
    assert.equal(check.stderr,'');
    for (let i=0;i<2;i++) {
      const apply=run('Apply');
      assert.equal(apply.status,0); assert.equal(apply.result.status,'current');
      assert.ok(apply.stderr.includes('$joeness-setup'),'successful Apply displays the first invocation');
      for(const name of ['AGENTS','ROADMAP','TASK','ISSUES','DESIGN'])
        assert.ok(apply.stderr.includes(name+'.md'),name+' role appears in the guide');
      assert.ok(apply.stderr.includes('자동 생성하지'),'guide separates installation from project document creation');
      assert.ok(apply.stderr.includes('남은 문제: 없음'),'guide distinguishes unresolved problems from resolved issues');
      assert.ok(apply.stderr.includes('이번 작업은 문서에 기록하지 마'),'guide includes a no-record request');
      if(i===1) assert.deepEqual(apply.result.changes,[]);
    }
    assert.equal(run('Check').stderr,'');
    const guide=join(root,'skills/joeness-setup/references/usage.md');
    const before=readFileSync(guide);
    appendFileSync(guide,'USER');
    const blocked=run('Apply');
    assert.equal(blocked.status,2); assert.equal(blocked.result.status,'blocked');
    assert.equal(blocked.stderr,'');
    assert.ok(readFileSync(guide).equals(Buffer.concat([before,Buffer.from('USER')])));
  } finally { rmSync(root,{recursive:true,force:true}); }
  const clean=mkdtempSync(join(tmpdir(),'joeness-onboarding-remove-'));
  try {
    const removed=spawnSync('powershell.exe',['-NoProfile','-File',entry,'-Remove','-CodexHome',clean],{encoding:'utf8'});
    assert.equal(removed.status,0); assert.equal(JSON.parse(removed.stdout).status,'removed');
    assert.equal(removed.stderr,'');
  } finally { rmSync(clean,{recursive:true,force:true}); }
});
test('one self-contained setup skill with real supporting files', () => {
  assert.deepEqual(readdirSync(new URL('../skills/',import.meta.url)), ['joeness-setup']);
  const skill=read('skills/joeness-setup/SKILL.md').toString();
  assert.match(skill,/^---\r?\nname: joeness-setup\r?\ndescription: .+/);
  for(const path of ['agents/openai.yaml','scripts/project-setup.ps1',...['AGENTS','TASK','ROADMAP','ISSUES','DESIGN'].map(n=>'assets/'+n+'.md')])
    assert.ok(read('skills/joeness-setup/'+path).length>0,path);
  const yaml=read('skills/joeness-setup/agents/openai.yaml').toString();
  assert.match(yaml,/allow_implicit_invocation: true/);
  assert.ok(yaml.includes('$joeness-setup'));
});
test('manifest pins exact sole skill inventory and unchanged thin core',()=>{
  const m=JSON.parse(read('vendor/source-manifest.json'));
  assert.equal(m.release.version,'0.2');
  assert.equal(m.release.entrypoint,'JOENESS.ps1');
  assert.deepEqual(m.publicSkills.map(s=>s.name),['joeness-setup']);
  const skillRoot=fileURLToPath(new URL('../skills/joeness-setup/',import.meta.url));
  const disk=readdirSync(skillRoot,{recursive:true,withFileTypes:true})
    .filter(e=>e.isFile()).map(e=>relative(skillRoot,join(e.parentPath,e.name)).replaceAll('\\','/'));
  const expected=['SKILL.md','agents/openai.yaml','scripts/project-setup.ps1','references/usage.md',...['AGENTS','TASK','ROADMAP','ISSUES','DESIGN'].map(n=>'assets/'+n+'.md')].sort();
  assert.equal(m.publicSkills[0].files.length,expected.length);
  assert.deepEqual(disk.sort(),expected);
  assert.deepEqual(m.publicSkills[0].files.map(f=>f.path).sort(),expected);
  for(const f of m.publicSkills[0].files)
    assert.equal(createHash('sha256').update(read('skills/joeness-setup/'+f.path)).digest('hex'),f.sha256);
  assert.equal(createHash('sha256').update(read(m.activeCommonCore.path)).digest('hex'),'f360b48be1b4143035f61fa20149a3249c60dea2e7f12cffa8bf1e8918f4f6a9');
  assert.deepEqual(m.defaultVendors,[]); assert.equal(m.pluginRouting,null);
  assert.deepEqual(m.managedRuntimeFiles,[]);
});
