import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {join,resolve,basename} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const here=fileURLToPath(new URL('.',import.meta.url)),repo=resolve(here,'../../../..');
const hash=x=>createHash('sha256').update(x).digest('hex');
const f=JSON.parse(readFileSync(join(here,'fixtures.json'))),out=JSON.parse(readFileSync(join(here,'outputs.json')));
const norm=p=>p.replace(/^file:\/\/\//,'').replaceAll('\\','/').toLowerCase();
const preservation=(root,entries)=>Object.entries(entries).map(([path,before])=>{
 const after=hash(readFileSync(join(root,path)));return {path,before,after,unchanged:before===after};
});
const commonInputs=['PRODUCT.md','SEED.md','FEEDBACK.md','ROADMAP.md','TASK.md','ISSUES.md','DESIGN.md'];
const common=f.fixtures.map(x=>({id:x.id,identicalWithinTask:commonInputs.every(p=>f.fixtures.filter(y=>y.task===x.task).every(y=>y.hashes[p]===x.hashes[p]))}));
const runs=out.map(x=>{
 const raw=readFileSync(join('C:/Users/tjdwo/.codex/sessions/2026/10/17',x.rollout),'utf8'),rows=raw.trim().split('\n').map(JSON.parse);
 const end=rows.findIndex(r=>r.payload?.type==='task_complete'),events=rows.slice(0,end+1);
 const writes=[...new Set(events.flatMap(r=>r.payload?.item?.type==='FileChange'?Object.keys(r.payload.item.changes):[]))];
 const allowed=['PROPOSAL.md','TASK.md','ROADMAP.md','ISSUES.md'];
 const writesInScope=writes.every(p=>norm(p).startsWith(norm(x.dir)+'/')&&allowed.includes(basename(p)));
 const shellRootsMatch=x.commands.every(c=>norm(c.cwd)===norm(x.dir));
 const inputReads=['AGENTS.md',...commonInputs].map(p=>({path:p,readCommandPresent:x.commands.some(c=>c.command.join(' ').includes(p))}));
 return {id:x.id,thread:x.thread,rollout:x.rollout,rolloutSha256Matches:hash(raw)===x.rolloutSha256,
  runtime:x.runtime,exactRuntime:x.runtime.length===1&&x.runtime[0].model==='gpt-6-astra'&&x.runtime[0].effort==='xhigh',
  inputReads,writes,writesInScope,shellRootsMatch,otherActionTypes:x.otherActions,
  protectedFiles:x.protectedFiles,outputSnapshotMatches:Object.entries(x.texts).every(([p,t])=>readFileSync(join(x.dir,p),'utf8')===t),
  proposalSha256:hash(x.texts['PROPOSAL.md'])};
});
const report={source:preservation(repo,f.source),personal:preservation('C:/Users/tjdwo/.codex',f.personal),
 planHashMatches:hash(readFileSync(join(here,'plan.md')))===f.planSha256,
 fixtureHashMatches:hash(readFileSync(join(here,'fixtures.json')))==='724780e62f41d6b406aa09817fc309593ec27b4da1a9193b5c88854a8cc0e97d',
 userIssuesUnchanged:hash(readFileSync(join(repo,'docs/ISSUES.md')))==='d3c87c8fa0e2e34600ae12ff0b1c9ea1d503ca5a7f6a30db17ca8e8ea9b529c7',common,runs};
const destination=join(here,process.argv[2]||'audit.json');if(existsSync(destination))throw Error('Preserve first audit; use separate follow-up evidence');
writeFileSync(destination,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({source:report.source.every(x=>x.unchanged),personal:report.personal.every(x=>x.unchanged),
 plan:report.planHashMatches,fixtures:report.fixtureHashMatches,userIssues:report.userIssuesUnchanged,
 common:common.every(x=>x.identicalWithinTask),runs:runs.map(x=>({id:x.id,runtime:x.exactRuntime,writes:x.writesInScope,roots:x.shellRootsMatch,reads:x.inputReads.every(x=>x.readCommandPresent),protected:x.protectedFiles.every(x=>x.unchanged),snapshot:x.outputSnapshotMatches,rollout:x.rolloutSha256Matches}))},null,2));
