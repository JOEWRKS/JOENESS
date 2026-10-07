// Read-only scoped snapshot. No credentials, skill contents or product-state body exported.
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {join,resolve} from 'node:path';
const repo=process.cwd(),geo='D:/JOEWRKS/JOEWRKS-Product',home='C:/Users/tjdwo/.codex';
const sha=b=>createHash('sha256').update(b).digest('hex');
const h=p=>existsSync(p)?sha(readFileSync(p)):'absent';
const git=(...a)=>execFileSync('git',['-C',geo,...a]).toString('utf8').trim();
function inventory(root,exclude=''){
 const out=[];
 function walk(dir,rel='') {for(const e of readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){
   const name=rel?rel+'/'+e.name:e.name;if(name===exclude)continue;
   if(e.isSymbolicLink())throw Error('Unexpected symlink in scoped snapshot: '+name);
   if(e.isDirectory())walk(join(dir,e.name),name);else if(e.isFile())out.push([name,h(join(dir,e.name))]);
 }}walk(root);return {count:out.length,sha256:sha(JSON.stringify(out.sort()))};
}
const manifest=JSON.parse(readFileSync(join(repo,'vendor/source-manifest.json')));
const personal={managed:Object.fromEntries(manifest.publicSkills[0].files.map(f=>[f.path,h(join(home,'skills/joeness-setup',f.path))])),
 stateSha256:h(join(home,'joeness-skills-state.json')),globalAgentsSha256:h(join(home,'AGENTS.md')),
 otherSkills:inventory(join(home,'skills'),'joeness-setup')};
const names=['AGENTS.md','.joeness/setup-state.json','ROADMAP.md','TASK.md','ISSUES.md','DESIGN.md',
 'Library/geo-commerce-research.md','Library/geo-commerce-evaluation-method.md','product-definition/geo-fresh-market/state.json',
 'product-definition/client-feedback-portal-dogfood/state.json','docs/superpowers/plans/2026-09-03-post-m6-semantic-review-reliability-enablement.md'];
const tracked=execFileSync('git',['-C',geo,'ls-files','-z']).toString('utf8').split('\0').filter(Boolean).sort().map(p=>[p,h(join(geo,p))]);
const state=JSON.parse(readFileSync(join(geo,'product-definition/geo-fresh-market/state.json')));
console.log(JSON.stringify({personal,geo:{root:resolve(geo),head:git('rev-parse','HEAD'),gitStatus:git('status','--short'),
 files:Object.fromEntries(names.map(n=>[n,h(join(geo,n))])),tracked:{count:tracked.length,sha256:sha(JSON.stringify(tracked))},
 product:{schema:state.schema_version,revision:state.project.definition_revision,status:state.project.definition_status,
 approval:state.approval.status,approvalHistorySha256:sha(JSON.stringify(state.approval_history)),
 decisions:state.objects.decisions.map(x=>({id:x.id,status:x.status})),
 unknowns:state.objects.unknowns.map(x=>({id:x.id,status:x.status}))}}},null,2));
