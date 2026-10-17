import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const sha=b=>createHash('sha256').update(b).digest('hex');
const roots=process.argv.slice(2);
if(!roots.length)throw new Error('Explicit isolated fixture roots required');
const evidence=roots.map(root=>{
 const git=(...args)=>execFileSync('git',['-c','core.autocrlf=false',...args],{cwd:root,encoding:'utf8'}).trim();
 const tracked=git('ls-files').split('\n');
 const writable=['ROADMAP.md','TASK.md','ISSUES.md'];
 const protectedFiles=tracked.filter(p=>!writable.includes(p)).map(path=>{
   const baseline=execFileSync('git',['show','HEAD:'+path],{cwd:root});
   const current=readFileSync(join(root,path));
   return {path,before:sha(baseline),after:sha(current),unchanged:baseline.equals(current)};
 });
 return {root,baseline:git('rev-parse','HEAD'),status:git('status','--porcelain'),
   connection:readFileSync(join(root,'AGENTS.md'),'utf8'),protectedFiles,
   documents:Object.fromEntries(writable.map(p=>[p,{sha256:sha(readFileSync(join(root,p))),text:readFileSync(join(root,p),'utf8')}])),
   diff:git('diff','--no-ext-diff','--',...writable)};
});
console.log(JSON.stringify(evidence,null,2));
