// Candidate packaging evidence only. No personal installs or project mutations.
import {readFileSync, writeFileSync, existsSync, mkdtempSync, readdirSync} from 'node:fs';
import {join, resolve, relative, dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const here=fileURLToPath(new URL('.',import.meta.url)), repo=resolve(here,'../../../..');
const sha=b=>createHash('sha256').update(b).digest('hex'), hash=p=>sha(readFileSync(p));
const out=join(here,'isolated-install.json'); assert.ok(!existsSync(out),'Do not overwrite evidence');
const manifest=JSON.parse(readFileSync(join(repo,'vendor/source-manifest.json')));
const baseline='c4902f72b728e36d558225157a10f740ed6abdc0';
const git=args=>{const r=spawnSync('git',args,{cwd:repo,maxBuffer:4*1024*1024});assert.ifError(r.error);assert.equal(r.status,0);return r.stdout;};
assert.equal(manifest.release.version,'1.0.0');
const old=JSON.parse(git(['show',baseline+':vendor/source-manifest.json']));
const expected=structuredClone(old); expected.release.version='1.0.0';
assert.deepEqual(manifest,expected,'Only marketing version changes in manifest');
for(const f of manifest.publicSkills[0].files) {
  const p='skills/joeness-setup/'+f.path;
  assert.equal(hash(join(repo,p)),sha(git(['show',baseline+':'+p])),p+' frozen bytes');
}
const docs=['README.md','docs/installation.md','docs/CHANGELOG.md'];
const links=[];
for(const file of docs) {
  const text=readFileSync(join(repo,file),'utf8');
  for(const m of text.matchAll(/\]\(([^)]+)\)/g)) {
    if(/^https?:/.test(m[1]))continue;
    const [path,anchor]=m[1].split('#');const target=resolve(repo,dirname(file),path);
    assert.ok(existsSync(target),file+' broken link '+m[1]);
    if(anchor) {
      const headings=readFileSync(target,'utf8').split(/\r?\n/).filter(l=>/^#+ /.test(l)).map(l=>l.replace(/^#+ /,'').toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu,'').replace(/\s/g,'-'));
      assert.ok(headings.includes(anchor),'Missing anchor '+m[1]);
    }
    links.push({from:file,target:m[1]});
  }
}
const personal='C:/Users/tjdwo/.codex';
const watched=[...manifest.publicSkills[0].files.map(f=>'skills/joeness-setup/'+f.path),'joeness-skills-state.json','AGENTS.md','config.toml'];
const snapshot=()=>Object.fromEntries(watched.map(p=>[p,existsSync(join(personal,p))?hash(join(personal,p)):'absent']));
const before=snapshot();const root=mkdtempSync(join(tmpdir(),'joeness-v100-candidate-'));
writeFileSync(join(root,'AGENTS.md'),'user rules unchanged\r\n');
writeFileSync(join(root,'config.toml'),'# isolated user configuration\n');
const protectedBefore=['AGENTS.md','config.toml'].map(p=>hash(join(root,p)));
const steps=[];
const invoke=(mode,status)=>{
 const command=['powershell.exe','-NoProfile','-ExecutionPolicy','Bypass','-File',join(repo,'JOENESS.ps1'),'-'+mode,'-CodexHome',root];
 const env={...process.env};for(const k of Object.keys(env))if(k.toLowerCase()==='psmodulepath')delete env[k];
 const r=spawnSync(command[0],command.slice(1),{cwd:repo,env,encoding:'utf8',timeout:60000,maxBuffer:1024*1024});
 const result={command,exit:r.status,stdout:r.stdout,stderr_sha256:sha(r.stderr??'')};steps.push(result);
 writeFileSync(out,JSON.stringify({status:'in-progress',root,steps},null,2)+'\n');
 assert.ifError(r.error);assert.equal(r.status,0);assert.equal(JSON.parse(r.stdout).status,status);
};
invoke('Check','ready');invoke('Apply','current');invoke('Check','current');invoke('Apply','current');
invoke('Remove','removed');invoke('Check','ready');
assert.ok(!existsSync(join(root,'joeness-skills-state.json')));
invoke('Apply','current');invoke('Check','current');
const skill=join(root,'skills/joeness-setup');
const inventory=readdirSync(skill,{recursive:true,withFileTypes:true}).filter(f=>f.isFile()).map(f=>relative(skill,join(f.parentPath,f.name)).replaceAll('\\','/')).sort();
assert.deepEqual(inventory,manifest.publicSkills[0].files.map(f=>f.path).sort());
const installed=manifest.publicSkills[0].files.map(f=>({...f,actual:hash(join(skill,f.path))}));
assert.ok(installed.every(f=>f.sha256===f.actual));
const state=JSON.parse(readFileSync(join(root,'joeness-skills-state.json')));
assert.equal(state.releaseVersion,'1.0.0');assert.equal(state.schemaVersion,1);
assert.equal(state.manifestSha256,hash(join(repo,'vendor/source-manifest.json')));
assert.deepEqual(state.files,manifest.publicSkills[0].files);
assert.deepEqual(['AGENTS.md','config.toml'].map(p=>hash(join(root,p))),protectedBefore);
const after=snapshot();assert.deepEqual(after,before);
const result={status:'PASS-isolated-candidate-not-personal-release',root,baseline,manifest_sha256:state.manifestSha256,steps,installed,state,links,skill_bytes_unchanged:true,personal_before:before,personal_after:after,personal_unchanged:true,protected_fixture_unchanged:true};
writeFileSync(out,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({status:result.status,root,steps:steps.length,files:installed.length,links:links.length,personal_unchanged:true}));
