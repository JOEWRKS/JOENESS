import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
const here=fileURLToPath(new URL('.',import.meta.url)),repo=resolve(here,'../../../..');
const sha=b=>createHash('sha256').update(b).digest('hex');
const paths=['AGENTS.md','.github/workflows/windows-ci.yml','scripts/sync-harness.ps1','skills/joeness-setup/SKILL.md','skills/joeness-setup/assets/AGENTS.md','skills/joeness-setup/references/roadmap-review.md','skills/joeness-setup/scripts/roadmap-review.mjs','skills/joeness-setup/references/operation-review.md','skills/joeness-setup/scripts/operation-review.mjs','tests/joeness-roadmap-review.tests.mjs','tests/joeness-operation-review.tests.mjs','tests/joeness-setup-contract.tests.mjs','tests/joeness-release.tests.ps1','tests/joeness-install.tests.ps1','vendor/source-manifest.json'];
const git=args=>{const r=spawnSync('git',args,{cwd:repo,encoding:'utf8'});assert.ifError(r.error);return r;};
const base=git(['rev-parse','HEAD']).stdout.trim();
const tracked=git(['diff','--binary','--',...paths]);assert.equal(tracked.status,0);
let patch=tracked.stdout;
for(const path of paths)if(!git(['ls-files','--',path]).stdout.trim()){
 const r=git(['diff','--no-index','--','NUL',path]);assert.equal(r.status,1);patch+=r.stdout;
}
writeFileSync(join(here,'candidate-source.patch'),patch);
const manifest=JSON.parse(readFileSync(join(repo,'vendor/source-manifest.json')));
const info={stage:'AB-source-candidate-not-release',base_head:base,patch_sha256:sha(Buffer.from(patch)),files:paths.map(path=>({path,sha256:sha(readFileSync(join(repo,path)))})),skill_files:manifest.publicSkills[0].files,excluded:'Pre-existing docs/ROADMAP APP-001 and docs/ISSUES edits excluded. A frozen artifact preserved separately. This is cumulative A+B source/test/package patch, not a new release.'};
writeFileSync(join(here,'candidate-source.json'),JSON.stringify(info,null,2)+'\n');
console.log(JSON.stringify({base_head:base,patch_sha256:info.patch_sha256,files:info.files.length}));
