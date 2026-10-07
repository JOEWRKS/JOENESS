// Read-only bounded evidence capture; does not judge agent behavior.
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {join,resolve} from 'node:path';
const [rootArg,baseline,product]=process.argv.slice(2), root=resolve(rootArg);
const git=(...args)=>execFileSync('git',['-C',root,...args]);
const names=['AGENTS.md','ROADMAP.md','TASK.md','ISSUES.md','DESIGN.md',product];
const hash=b=>createHash('sha256').update(b).digest('hex');
const files={};
for(const name of names){
 const before=git('show',baseline+':'+name),after=readFileSync(join(root,name));
 files[name]={beforeSha256:hash(before),afterSha256:hash(after),unchanged:before.equals(after)};
 if(name===product && name.endsWith('.json')){
   const summarize=b=>{const s=JSON.parse(b);return {schema:s.schema_version,project:s.project,
     approval:s.approval,approval_history:s.approval_history,
     decisions:s.objects.decisions.map(x=>({id:x.id,status:x.status})),
     unknowns:s.objects.unknowns.map(x=>({id:x.id,status:x.status}))};};
   Object.assign(files[name],{sourceEvidence:'../joeflow/open-source-state.json',
     beforeSummary:summarize(before),afterSummary:summarize(after)});
 }else Object.assign(files[name],{before:before.toString('utf8'),after:after.toString('utf8')});
}
const stateName='.joeness/setup-state.json';
const stateBefore=git('show',baseline+':'+stateName), stateAfter=readFileSync(join(root,stateName));
console.log(JSON.stringify({root,baseline,files,connectionState:{beforeSha256:hash(stateBefore),
 afterSha256:hash(stateAfter),unchanged:stateBefore.equals(stateAfter)},
 changedNames:git('diff','--name-only',baseline).toString().trim().split('\n').filter(Boolean),
 untracked:git('ls-files','--others','--exclude-standard').toString().trim().split('\n').filter(Boolean),
 diff:git('diff','--no-ext-diff',baseline).toString()},null,2));
