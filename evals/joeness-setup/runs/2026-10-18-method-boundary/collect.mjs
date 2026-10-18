import {readFileSync,writeFileSync,readdirSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const here=fileURLToPath(new URL('.',import.meta.url)),hash=x=>createHash('sha256').update(x).digest('hex'),dest=join(here,'execution.json');
if(existsSync(dest))throw Error('Preserve evidence');
const agents=[];
for(const day of ['17','18']){
 const dir=`C:/Users/tjdwo/.codex/sessions/2026/10/${day}`;if(!existsSync(dir))continue;
 for(const p of readdirSync(dir).filter(p=>p.endsWith('.jsonl'))){
  const raw=readFileSync(join(dir,p),'utf8'),rows=raw.trim().split('\n').map(JSON.parse),meta=rows.find(r=>r.type==='session_meta')?.payload;
  if(!/^\/root\/method_(setup|resume)_(free|fixed)$/.test(meta?.agent_path||''))continue;
  const completed=rows.filter(r=>r.payload?.type==='task_complete');
  const instructions=rows.filter(r=>r.type==='response_item'&&r.payload?.type==='message'&&['user','developer','system'].includes(r.payload.role)).map(r=>{const v=JSON.stringify(r.payload.content);return {role:r.payload.role,characters:v.length,sha256:hash(v),rootRepositoryRules:v.includes('JOENESS Repository')};});
  agents.push({agent:meta.agent_path,thread:meta.id,rollout:p,rolloutSha256:hash(raw),initialCwd:meta.cwd,instructions,
   runtime:rows.filter(r=>r.type==='turn_context').map(r=>({model:r.payload.model,effort:r.payload.effort})),
   reports:completed.map(r=>r.payload.last_agent_message),
   commands:rows.filter(x=>x.payload?.item?.type==='CommandExecution').map(x=>{const v=x.payload.item,o=v.aggregated_output||'';return {command:v.command,cwd:v.cwd,exit:v.exit_code,outputSha256:hash(o),outputCharacters:o.length,...(v.exit_code!==0?{failureOutput:o.slice(-5000)}:{})};}),
   writes:[...new Set(rows.flatMap(x=>x.payload?.item?.type==='FileChange'?Object.keys(x.payload.item.changes):[]))]});
 }
}
if(agents.length!==4||agents.some(a=>a.reports.length!==1))throw Error('Unexpected/incomplete count');
writeFileSync(dest,JSON.stringify({agents},null,2)+'\n');console.log(JSON.stringify(agents.map(a=>({agent:a.agent,thread:a.thread,runtime:a.runtime})),null,2));
