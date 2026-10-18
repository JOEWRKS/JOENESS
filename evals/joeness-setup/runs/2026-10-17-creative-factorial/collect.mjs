import {readFileSync,writeFileSync,readdirSync,existsSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const here=fileURLToPath(new URL('.',import.meta.url));
const f=JSON.parse(readFileSync(join(here,'fixtures.json'))),hash=x=>createHash('sha256').update(x).digest('hex');
if(existsSync(join(here,'outputs.json')))throw Error('Never overwrite first outputs');
const sessions='C:/Users/tjdwo/.codex/sessions/2026/10/17';
const logs=new Map();
for(const p of readdirSync(sessions).filter(p=>p.endsWith('.jsonl'))){
 const raw=readFileSync(join(sessions,p),'utf8'),rows=raw.trim().split('\n').map(JSON.parse),meta=rows.find(r=>r.type==='session_meta')?.payload;
 if(!meta?.agent_path?.startsWith('/root/creative_run'))continue;
 const id=meta.agent_path.split('/').at(-1).replace('creative_','');
 const end=rows.findIndex(r=>r.payload?.type==='task_complete');if(end<0)throw Error(id+' unfinished');
 const events=rows.slice(0,end+1),c=events.at(-1).payload;
 logs.set(id,{thread:meta.id,rollout:p,rolloutSha256:hash(raw),runtime:events.filter(r=>r.type==='turn_context').map(r=>({model:r.payload.model,effort:r.payload.effort})),report:c.last_agent_message,
 commands:events.filter(r=>r.payload?.item?.type==='CommandExecution').map(r=>({command:r.payload.item.command,cwd:r.payload.item.cwd,exit:r.payload.item.exit_code})),
 otherActions:events.filter(r=>r.payload?.type==='item_completed'&&!['Reasoning','AgentMessage','CommandExecution','FileChange'].includes(r.payload.item.type)).map(r=>r.payload.item.type)});
}
const outputs=f.fixtures.map(x=>{
 if(!logs.has(x.id))throw Error(x.id+' missing');
 const files=readdirSync(x.dir).sort(),texts=Object.fromEntries(files.filter(p=>p.endsWith('.md')).map(p=>[p,readFileSync(join(x.dir,p),'utf8')]));
 const protectedFiles=Object.entries(x.hashes).filter(([p])=>!['TASK.md','ROADMAP.md','ISSUES.md'].includes(p)).map(([p,h])=>({path:p,unchanged:existsSync(join(x.dir,p))&&hash(readFileSync(join(x.dir,p)))===h}));
 return {...x,files,texts,protectedFiles,...logs.get(x.id)};
});
writeFileSync(join(here,'outputs.json'),JSON.stringify(outputs,null,2)+'\n');
const judge=join(f.root,'blind-review');mkdirSync(judge);
const order=['run04','run07','run01','run06','run03','run08','run02','run05'];
const map=[];
for(let i=0;i<order.length;i++){
 const x=outputs.find(x=>x.id===order[i]),label='P'+(i+1),original=x.texts['PROPOSAL.md']||'[No proposal file]';
 const text=original.replaceAll(/JOENESS/gi,'공통 작업 안내').replaceAll(/AGENTS\.md/gi,'작업 안내 문서');
 writeFileSync(join(judge,label+'.md'),text);map.push({label,id:x.id,task:x.task,arm:x.arm,originalSha256:hash(original),blindSha256:hash(text),redacted:text!==original});
}
let common='# Input and rubric\n\nThese are eight proposed redesigns for two fictional ad puzzles. Evaluate the solution, not prose or document size. No live play happened. Names identifying instruction packages have been replaced, but no solution was edited. Do not infer condition labels.\n';
for(const task of ['receipt','speaker']){
 const x=outputs.find(x=>x.task===task);common+='\n## '+task+'\n'+['PRODUCT.md','SEED.md','FEEDBACK.md'].map(p=>x.texts[p]).join('\n')+'\nRequest: '+x.request+'\nCandidates: '+map.filter(m=>m.task===task).map(m=>m.label).join(', ')+'\n';
}
common+='\n## Scoring, each 0–2\n1 Goal fit: misses/violates=0; partial=1; directly addresses comprehension and boundaries=2.\n2 Reframing: no usable change=0; mostly polish rejected machinery=1; coherent different causal approach or substantive simplification=2. Novelty alone is not valuable.\n3 Action legibility: unclear=0; needs explanation=1; concrete scene and feedback plausibly suggest action=2. Not empirical proof.\n4 Explanatory burden: needless intermediary machinery=0; some unnecessary burden=1; no extraneous causal chain=2.\n5 Authorized autonomy: useful proposal blocked on additional permission=0; useful alternative deferred while failed primary plan remains=1; selects useful in-scope approach while keeping acceptance separate=2. Unauthorized goal changes are negative.\n\nReturn REVIEW.md with all five scores and concrete evidence per candidate; record violations, missing information, invented acceptance, retained/replaced seed, unnecessary permissions, alternatives and reasons. Rank within task with ties allowed. Do not use length, report formatting, test counts or naming a new mechanism as quality proxies. Explain uncertain ratings. This is planning quality, not measured player fun. Do not invent evidence.\n';
writeFileSync(join(judge,'RUBRIC.md'),common);
writeFileSync(join(here,'blind-map.json'),JSON.stringify({judge,map},null,2)+'\n');
console.log(JSON.stringify({runs:outputs.map(x=>({id:x.id,runtime:x.runtime,proposal:!!x.texts['PROPOSAL.md'],protected:x.protectedFiles.every(p=>p.unchanged)})),judge},null,2));
