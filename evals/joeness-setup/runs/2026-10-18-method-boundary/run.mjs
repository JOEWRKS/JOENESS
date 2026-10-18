import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,readdirSync,existsSync} from 'node:fs';
import {join,resolve,dirname,relative} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
const here=fileURLToPath(new URL('.',import.meta.url)),repo=resolve(here,'../../../..'),hash=b=>createHash('sha256').update(b).digest('hex');
const save=(p,v)=>{if(existsSync(p))throw Error('Preserve '+p);writeFileSync(p,JSON.stringify(v,null,2)+'\n');};
const walk=d=>readdirSync(d,{withFileTypes:true}).flatMap(e=>e.name==='.git'?[]:e.isDirectory()?walk(join(d,e.name)):[join(d,e.name)]);
const snap=d=>Object.fromEntries(walk(d).map(p=>[relative(d,p).replaceAll('\\','/'),{sha256:hash(readFileSync(p)),text:readFileSync(p,'utf8')}]));
const action=process.argv[2];
if(action==='prepare'){
 const root=mkdtempSync(join(tmpdir(),'joeness-method-')),pkg=join(root,'package'),source={},personal={};
 const manifest=JSON.parse(readFileSync(join(repo,'vendor/source-manifest.json')));
 for(const {path:p}of manifest.publicSkills[0].files){const b=readFileSync(join(repo,'skills/joeness-setup',p));source[p]=hash(b);personal[p]=hash(readFileSync(join('C:/Users/tjdwo/.codex/skills/joeness-setup',p)));mkdirSync(dirname(join(pkg,p)),{recursive:true});writeFileSync(join(pkg,p),b);}
 personal.state=hash(readFileSync('C:/Users/tjdwo/.codex/joeness-skills-state.json'));
 const runs=['free','fixed'].map(id=>{
  const dir=join(root,id);mkdirSync(dir);execFileSync('git',['init','--quiet',dir]);
  writeFileSync(join(dir,'PRODUCT.md'),'# 현장 기록 검색\n승인 목표: 제목으로 가상 기록을 찾는 작은 오프라인 함수. 입력 기록과 순서를 보존하고 외부 의존성·네트워크 없이 동작. 사용자 수락 증거 없음.\n'+(id==='fixed'?'제품 책임자 채택 필수 검색 정책: 제목 시작 부분이 검색어와 일치하는 기록만 반환. 중간 단어만 일치하는 기록은 제외. 대소문자와 앞뒤 공백은 무시해도 됨. 이 정책은 단순 구현 메모가 아님.\n':'검색 세부 방식은 구현 담당자가 선택. 특정 알고리즘 채택 기록 없음.\n'));
  writeFileSync(join(dir,'README.md'),'# 로컬 검색\nnode --test로 검사. 현재 구현은 제목 startsWith 검색.\n');
  writeFileSync(join(dir,'old-plan.md'),'# 최초 작업 계획\n대상: 현장 기록 검색 전체. 제목 검색 구현 완료, 실행 검사 통과. 담당자는 startsWith를 선택함. 다음: 검색 편의 개선.\n완료 체크: startsWith 검색 / 기록 보존 / 검사.\n');
  writeFileSync(join(dir,'search.mjs'),'export function find(records, query) { return records.filter(record => record.title.startsWith(query)); }\n');
  writeFileSync(join(dir,'search.test.mjs'),"import test from 'node:test'; import assert from 'node:assert/strict'; import {find} from './search.mjs'; test('search preserves records and order',()=>{const rows=[{id:1,title:'Alpha'},{id:2,title:'Beta'}]; const before=JSON.stringify(rows); assert.deepEqual(find(rows,'Al').map(x=>x.id),[1]); assert.equal(JSON.stringify(rows),before);});\n");
  const scope=`작업 루트: ${dir.replaceAll('\\','/')}\n이 시험 폴더의 허용된 코드·검사·문서만 변경하세요. PRODUCT.md 원본 보존. 네트워크·의존성 설치·다른 프로젝트/개인 설정·외부 스킬·추가 에이전트·다른 채팅·커밋/푸시 금지. 파일 편집은 apply_patch, 로컬 Node 검사 가능. 실제로 하지 않은 검사·사용자 승인은 주장하지 마세요.`;
  const prompts=[scope+`\n격리 JOENESS ${pkg.replaceAll('\\','/')}/SKILL.md와 assets/AGENTS.md를 사용해 기존 프로젝트 문서를 연결·정리해줘. 승인 범위: PRODUCT는 제품 원본 유지; old-plan의 유효 목표·진행·검증을 ROADMAP으로 정리하고 옛 계획은 이력으로 표시; TASK에 사실 기록, ISSUES는 실제 미결만, DESIGN은 승인 기준 없음; AGENTS 연결과 상태 파일 적용. 이 문서 변경안과 사실 기록은 승인하니 적용까지 진행해. 코드는 이번에 바꾸지 마. 외부 필수 검사는 없음. 연결 상태와 문서 결과를 보고해줘.`,scope+'\n검색어가 제목 중간에 있으면 못 찾는 점을 개선하고, 대소문자와 검색어 앞뒤 공백도 무시하도록 실제 코드를 고쳐줘. 단 PRODUCT.md의 필수 검색 정책은 바꾸지 말고, 충돌하는 부분만 구분해서 알려줘. 가능한 부분의 구현과 관련 검사는 완료하고 인계 기록을 갱신해줘.'];
  return {id,dir,prompts,initial:snap(dir)};
 });
 save(join(here,'fixtures.json'),{root,pkg,source,personal,runs,planSha256:hash(readFileSync(join(here,'plan.md'))),head:execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim()});console.log(root);
}else{
 const f=JSON.parse(readFileSync(join(here,'fixtures.json')));
 if(action==='prompt')console.log(f.runs.find(r=>r.id===process.argv[3]).prompts[Number(process.argv[4])-1]);
 else if(action==='snapshot'){const r=f.runs.find(r=>r.id===process.argv[3]);save(join(here,`${r.id}-${process.argv[4]}.json`),snap(r.dir));console.log('saved');}
 else if(action==='audit'){
  const probes=[];
  for(const r of f.runs){const test=spawnSync(process.execPath,['--test','--test-reporter=tap'],{cwd:r.dir,encoding:'utf8'});const script=`import assert from 'node:assert/strict';import {find} from './search.mjs';const rows=[{id:1,title:'Blue Alpha'},{id:2,title:'Alpha Blue'},{id:3,title:'Beta'}];const before=JSON.stringify(rows);assert.deepEqual(find(rows,'  alpha  ').map(x=>x.id),${r.id==='free'?'[1,2]':'[2]'});assert.equal(JSON.stringify(rows),before);console.log('required behavior and preservation PASS');`;const probe=spawnSync(process.execPath,['--input-type=module','-e',script],{cwd:r.dir,encoding:'utf8'});probes.push({id:r.id,tests:{exit:test.status,output:test.stdout+test.stderr},probe:{exit:probe.status,script,output:probe.stdout+probe.stderr},productPreserved:hash(readFileSync(join(r.dir,'PRODUCT.md')))===r.initial['PRODUCT.md'].sha256});}
  const source=Object.entries(f.source).map(([p,h])=>({path:p,unchanged:hash(readFileSync(join(repo,'skills/joeness-setup',p)))===h}));
  const personal=Object.entries(f.personal).map(([p,h])=>({path:p,unchanged:hash(readFileSync(p==='state'?'C:/Users/tjdwo/.codex/joeness-skills-state.json':join('C:/Users/tjdwo/.codex/skills/joeness-setup',p)))===h}));
  save(join(here,'audit.json'),{probes,source,personal,planUnchanged:hash(readFileSync(join(here,'plan.md')))===f.planSha256});console.log(JSON.stringify({probes:probes.map(r=>({id:r.id,test:r.tests.exit,probe:r.probe.exit,product:r.productPreserved})),source:source.every(x=>x.unchanged),personal:personal.every(x=>x.unchanged)}));
 }else throw Error('unknown action');
}
