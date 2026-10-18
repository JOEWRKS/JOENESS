import {readFileSync,writeFileSync,readdirSync,existsSync,copyFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const here=fileURLToPath(new URL('.',import.meta.url));
const map=JSON.parse(readFileSync(join(here,'blind-map.json'))),hash=x=>createHash('sha256').update(x).digest('hex');
const sessions='C:/Users/tjdwo/.codex/sessions/2026/10/17';
const matches=[];
for(const p of readdirSync(sessions).filter(p=>p.endsWith('.jsonl'))){
 const raw=readFileSync(join(sessions,p),'utf8'),rows=raw.trim().split('\n').map(JSON.parse);
 const meta=rows.find(r=>r.type==='session_meta')?.payload;
 if(meta?.agent_path!=='/root/creative_blind_review')continue;
 const end=rows.findIndex(r=>r.payload?.type==='task_complete');if(end<0)throw Error('Reviewer still working');
 const events=rows.slice(0,end+1);
 matches.push({thread:meta.id,rollout:p,rolloutSha256:hash(raw),runtime:events.filter(r=>r.type==='turn_context').map(r=>({model:r.payload.model,effort:r.payload.effort})),
  report:events.at(-1).payload.last_agent_message,
  commands:events.filter(r=>r.payload?.item?.type==='CommandExecution').map(r=>({command:r.payload.item.command,cwd:r.payload.item.cwd,exit:r.payload.item.exit_code})),
  writes:[...new Set(events.flatMap(r=>r.payload?.item?.type==='FileChange'?Object.keys(r.payload.item.changes):[]))]});
}
if(matches.length!==1)throw Error('Expected one reviewer context');
const review=readFileSync(join(map.judge,'REVIEW.md'));
const inputHashes=Object.fromEntries(['RUBRIC.md',...map.map.map(x=>x.label+'.md')].map(p=>[p,hash(readFileSync(join(map.judge,p)))]));
if(!map.map.every(x=>inputHashes[x.label+'.md']===x.blindSha256))throw Error('Blind input changed');
const result={...matches[0],inputHashes,reviewSha256:hash(review),blinding:'Condition mapping withheld. Explicit package names replaced; prose may reveal rule conflict. Not perfect blinding.'};
if(existsSync(join(here,'reviewer.json'))||existsSync(join(here,'blind-review.md')))throw Error('Preserve first review');
copyFileSync(join(map.judge,'REVIEW.md'),join(here,'blind-review.md'));
copyFileSync(join(map.judge,'RUBRIC.md'),join(here,'blind-rubric.md'));
writeFileSync(join(here,'reviewer.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({thread:result.thread,runtime:result.runtime,reviewSha256:result.reviewSha256,writes:result.writes},null,2));
