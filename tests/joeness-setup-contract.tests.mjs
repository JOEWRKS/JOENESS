import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {relative,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const read = p => readFileSync(new URL('../'+p, import.meta.url));
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
  const expected=['SKILL.md','agents/openai.yaml','scripts/project-setup.ps1',...['AGENTS','TASK','ROADMAP','ISSUES','DESIGN'].map(n=>'assets/'+n+'.md')].sort();
  assert.equal(m.publicSkills[0].files.length,expected.length);
  assert.deepEqual(disk.sort(),expected);
  assert.deepEqual(m.publicSkills[0].files.map(f=>f.path).sort(),expected);
  for(const f of m.publicSkills[0].files)
    assert.equal(createHash('sha256').update(read('skills/joeness-setup/'+f.path)).digest('hex'),f.sha256);
  assert.equal(createHash('sha256').update(read(m.activeCommonCore.path)).digest('hex'),'f360b48be1b4143035f61fa20149a3249c60dea2e7f12cffa8bf1e8918f4f6a9');
  assert.deepEqual(m.defaultVendors,[]); assert.equal(m.pluginRouting,null);
  assert.deepEqual(m.managedRuntimeFiles,[]);
});
