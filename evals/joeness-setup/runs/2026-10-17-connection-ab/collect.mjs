// Bounded telemetry only. Never copy base instructions, reasoning or whole rollouts.
import {readFileSync,writeFileSync,readdirSync,existsSync} from 'node:fs';
import {join,basename} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const here=fileURLToPath(new URL('.',import.meta.url));
const sessionDir='C:/Users/tjdwo/.codex/sessions/2026/10/17';
const mapping={'/root/booking_run_one':'booking-A','/root/loans_run_one':'loans-B','/root/booking_run_two':'booking-B','/root/loans_run_two':'loans-A'};
const out=[];
for(const file of readdirSync(sessionDir).filter(x=>x.endsWith('.jsonl'))){
 const raw=readFileSync(join(sessionDir,file),'utf8');
 const lines=raw.trim().split('\n').map(x=>JSON.parse(x));
 const meta=lines.find(x=>x.type==='session_meta')?.payload;
 const id=mapping[meta?.agent_path]; if(!id)continue;
 const end=lines.findIndex(x=>x.type==='event_msg'&&x.payload.type==='task_complete');
 if(end<0)throw Error(`${id} unfinished`);
 const first=lines.slice(0,end+1),complete=first.at(-1).payload;
 const contexts=first.filter(x=>x.type==='turn_context').map(x=>({model:x.payload.model,effort:x.payload.effort}));
 const tokens=first.filter(x=>x.type==='event_msg'&&x.payload.type==='token_count').at(-1)?.payload.info.total_token_usage;
 const items=first.filter(x=>x.type==='event_msg'&&x.payload.type==='item_completed').map(x=>x.payload.item);
 const commands=items.filter(x=>x.type==='CommandExecution').map(x=>({command:x.command,cwd:x.cwd,exitCode:x.exit_code,status:x.status}));
 const types=Object.fromEntries([...new Set(items.map(x=>x.type))].map(t=>[t,items.filter(x=>x.type===t).length]));
 out.push({id,thread:meta.id,agent:meta.agent_path,rollout:basename(file),rolloutSha256:createHash('sha256').update(raw).digest('hex'),runtime:contexts,startedAt:complete.started_at,completedAt:complete.completed_at,durationMs:complete.duration_ms,tokens,uncachedInputTokens:tokens?tokens.input_tokens-tokens.cached_input_tokens:null,itemCounts:types,commands,report:complete.last_agent_message,excludedPostCompletionTurns:lines.filter(x=>x.type==='event_msg'&&x.payload.type==='task_complete').length-1});
}
if(out.length!==4)throw Error(`Expected 4 completed runs, found ${out.length}`);
if(existsSync(join(here,'telemetry.json')))throw Error('Keep original telemetry');
writeFileSync(join(here,'telemetry.json'),JSON.stringify(out.sort((a,b)=>a.id.localeCompare(b.id)),null,2)+'\n');
console.log(JSON.stringify(out.map(({id,durationMs,tokens,uncachedInputTokens,itemCounts,runtime})=>({id,durationMs,tokens,uncachedInputTokens,itemCounts,runtime})),null,2));
