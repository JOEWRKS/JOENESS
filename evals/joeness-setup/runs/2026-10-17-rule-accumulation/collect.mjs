import {readFileSync,writeFileSync,readdirSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const here=fileURLToPath(new URL('.',import.meta.url)),hash=x=>createHash('sha256').update(x).digest('hex');
const review=process.argv[2]==='review';
const dest=join(here,review?'review-runtime.json':'execution.json');if(existsSync(dest))throw Error('Preserve first execution collection');
const directory='C:/Users/tjdwo/.codex/sessions/2026/10/17',agents=[];
for(const p of readdirSync(directory).filter(p=>p.endsWith('.jsonl'))){
 const raw=readFileSync(join(directory,p),'utf8'),rows=raw.trim().split('\n').map(JSON.parse),meta=rows.find(r=>r.type==='session_meta')?.payload;
 if(!(review?/^\/root\/growth_review$/:/^\/root\/growth_(g[1-4]|resume_g[1-4])$/).test(meta?.agent_path||''))continue;
 let start=0;const turns=[];
 for(let i=0;i<rows.length;i++)if(rows[i].payload?.type==='task_complete'){
  const r=rows.slice(start,i+1);start=i+1;
  turns.push({runtime:r.filter(x=>x.type==='turn_context').map(x=>({model:x.payload.model,effort:x.payload.effort})),report:rows[i].payload.last_agent_message,
   commands:r.filter(x=>x.payload?.item?.type==='CommandExecution').map(x=>{const v=x.payload.item,o=v.aggregated_output||'',cmd=v.command.join(' ');return {command:v.command,cwd:v.cwd,exit:v.exit_code,outputSha256:hash(o),outputCharacters:o.length,...(v.exit_code!==0||/npm.*test|node.*(?:--test|test\.)|project-setup\.ps1.*-(?:Check|Apply)/s.test(cmd)?{checkOutputTail:o.slice(-6000),outputTruncated:o.length>6000}:{})};}),
   writes:[...new Set(r.flatMap(x=>x.payload?.item?.type==='FileChange'?Object.keys(x.payload.item.changes):[]))],
   otherActions:r.filter(x=>x.payload?.type==='item_completed'&&!['Reasoning','AgentMessage','CommandExecution','FileChange'].includes(x.payload.item.type)).map(x=>x.payload.item.type)});
 }
 const instructions=rows.filter(r=>r.type==='response_item'&&r.payload?.type==='message'&&['user','developer','system'].includes(r.payload.role)).map(r=>{const v=JSON.stringify(r.payload.content);return {role:r.payload.role,characters:v.length,sha256:hash(v),rootRepositoryRules:v.includes('JOENESS Repository'),priorBareCoreResult:v.includes('materially equivalent in eight cases')};});
 agents.push({agent:meta.agent_path,thread:meta.id,rollout:p,rolloutSha256:hash(raw),initialCwd:meta.cwd,instructions,turns});
}
if(agents.length!==(review?1:8)||agents.some(a=>a.turns.length!==((review||a.agent.includes('resume_'))?1:3)))throw Error('Unexpected agent/turn count; preserve incomplete evidence');
writeFileSync(dest,JSON.stringify({agents},null,2)+'\n');
console.log(JSON.stringify(agents.map(a=>({agent:a.agent,thread:a.thread,turns:a.turns.length,runtime:a.turns.map(t=>t.runtime)})),null,2));
