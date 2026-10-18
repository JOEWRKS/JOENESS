import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
const here=fileURLToPath(new URL('.',import.meta.url));
const f=JSON.parse(readFileSync(join(here,'fixtures.json'))),e=JSON.parse(readFileSync(join(here,'execution.json')));
const dest=join(here,'document-history.md');if(existsSync(dest))throw Error('Preserve first review input');
function changes(a,b){
 const x=a.split(/\r?\n/),y=b.split(/\r?\n/),d=Array.from({length:x.length+1},()=>new Uint32Array(y.length+1));
 for(let i=x.length-1;i>=0;i--)for(let j=y.length-1;j>=0;j--)d[i][j]=x[i]===y[j]?d[i+1][j+1]+1:Math.max(d[i+1][j],d[i][j+1]);
 let i=0,j=0,r=[];while(i<x.length||j<y.length){
  if(i<x.length&&j<y.length&&x[i]===y[j]){i++;j++;}
  else if(j<y.length&&(i===x.length||d[i][j+1]>=d[i+1][j])){r.push('new '+(j+1)+' + '+y[j]);j++;}
  else{r.push('old '+(i+1)+' - '+x[i]);i++;}
 }
 return r.join('\n');
}
let s='# Document evolution for independent source audit\n\nExact stage snapshots include all code and documents in gN-stageM.json.\nBelow: full text for new documents; line-numbered additions/removals for later changes.\nThis is not a finding list. Inspect full snapshots when context matters.\n\n';
for(const run of f.runs){
 s+=`## ${run.id} / ${run.task} / ${run.arm}\n\nOriginal BRIEF:\n${run.initial['BRIEF.md'].text}\n`;
 let before=run.initial;
 for(let stage=1;stage<=4;stage++){
  const current=JSON.parse(readFileSync(join(here,`${run.id}-stage${stage}.json`))).files;
  const a=e.agents.find(x=>x.agent===`/root/growth_${stage===4?'resume_':''}${run.id}`),t=a.turns[stage===4?0:stage-1];
  s+=`### Stage ${stage}\n\nRequest: ${run.requests[stage-1]}\n\nWorker report:\n${t.report}\n\n`;
  for(const p of new Set([...Object.keys(before),...Object.keys(current)])){
   if(!p.endsWith('.md')||before[p]?.sha256===current[p]?.sha256)continue;
   s+=`#### ${p}\n\n`+(before[p]?changes(before[p].text,current[p]?.text||''):current[p].text)+'\n\n';
  }
  before=current;
 }
}
writeFileSync(dest,s);
console.log(JSON.stringify({path:dest,characters:s.length}));
