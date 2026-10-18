import {readFileSync,writeFileSync,existsSync,readdirSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const here=fileURLToPath(new URL('.',import.meta.url)),repo=resolve(here,'../../../..'),hash=b=>createHash('sha256').update(b).digest('hex');
const f=JSON.parse(readFileSync(join(here,'fixtures.json'))),dest=join(here,'final-audit.json');
if(existsSync(dest))throw Error('Preserve original audit');
const checks={};
for(const [group,base]of [['source',repo],['personal','C:/Users/tjdwo/.codex']])checks[group]=Object.entries(f[group]).map(([p,h])=>({path:p,expected:h,actual:hash(readFileSync(join(base,p)))}));
checks.package=Object.entries(f.source).filter(([p])=>p.startsWith('skills/')).map(([p,h])=>({path:p,expected:h,actual:hash(readFileSync(join(f.pkg,p.replace('skills/joeness-setup/',''))))}));
checks.plan={expected:f.planSha256,actual:hash(readFileSync(join(here,'plan.md')))};
checks.fixtures={expected:'1b125490715670de6824c3a88c2dbd470e0aac864cafda66eb4e6e1c59a9dcb8',actual:hash(readFileSync(join(here,'fixtures.json')))};
checks.userIssues={expected:f.userIssuesSha256,actual:hash(readFileSync(join(repo,'docs/ISSUES.md')))};
const runs=[];
for(const r of f.runs){
 const s=JSON.parse(readFileSync(join(here,`${r.id}-stage4.json`)));
 const unchanged=Object.entries(s.files).every(([p,v])=>existsSync(join(r.dir,p))&&hash(readFileSync(join(r.dir,p)))===v.sha256);
 const briefs=[1,2,3,4].map(stage=>({stage,unchanged:JSON.parse(readFileSync(join(here,`${r.id}-stage${stage}.json`))).files['BRIEF.md'].sha256===r.initial['BRIEF.md'].sha256}));
 const result=spawnSync(process.execPath,['--test','--test-reporter=tap'],{cwd:r.dir,encoding:'utf8',timeout:120000});
 const output=(result.stdout||'')+(result.stderr||'');
 const walk=d=>readdirSync(d,{withFileTypes:true}).flatMap(v=>v.name==='.git'||v.name==='node_modules'?[]:v.isDirectory()?walk(join(d,v.name)):[join(d,v.name)]);
 const syntax=walk(r.dir).filter(p=>/\.m?js$/.test(p)).map(p=>{const c=spawnSync(process.execPath,['--check',p],{encoding:'utf8'});return {path:p,exit:c.status,output:(c.stdout||'')+(c.stderr||'')};});
 runs.push({id:r.id,stage4SnapshotMatches:unchanged,briefs,tests:{command:'node --test --test-reporter=tap',exit:result.status,error:result.error?.message,output},syntax});
}
const out={checks,runs};writeFileSync(dest,JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({preserved:Object.values(checks).flat().every(v=>v.expected===v.actual),runs:runs.map(r=>({id:r.id,snapshot:r.stage4SnapshotMatches,brief:r.briefs.every(x=>x.unchanged),exit:r.tests.exit,syntax:r.syntax.every(x=>x.exit===0),counts:r.tests.output.match(/# (?:tests|pass|fail) \d+/g)}))},null,2));
