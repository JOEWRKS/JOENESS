import {readFileSync,writeFileSync,mkdtempSync,readdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {mappingHash} from '../../../../skills/joeness-setup/scripts/roadmap-review.mjs';
const here=fileURLToPath(new URL('.',import.meta.url));
const cli=resolve(here,'../../../../skills/joeness-setup/scripts/roadmap-review.mjs');
const root='D:/JOEWRKS/GEOTest/FnBShop';
const hash=b=>createHash('sha256').update(b).digest('hex');
const pins=[
  ['ROADMAP.md','0dd12461b5b516f8751ec2533c7c8e07f556f40b0a76fa624bed300033e9ddd6'],
  ['TASK.md','b93491bd5f9071ca509e09042a5f23cfb7cd1fd4a54653c265a3c463b838b6ec'],
  ['product-definition/geo-fresh-market/state.json','5cbb9d5a0bafc914dd4e6630f4f3ca6c30491d8f9fa43cf8647f86232c26d86f'],
  ['Library/evidence/service-design/final-self-audit-20261012/demo-closeout-checks.json','8dc18d0d5401195c95a4dde77b7ffc065a8b27ae7acaaba7ca40a4dad6cda424']
];
const protectedPaths=[...pins.map(x=>x[0]),'AGENTS.md','ISSUES.md','DESIGN.md'];
const snapshot=()=>Object.fromEntries(protectedPaths.map(p=>[p,hash(readFileSync(join(root,p)))]));
const before=snapshot();for(const [p,sha] of pins)assert.equal(before[p],sha,'Source changed since manual review: '+p);
const temp=mkdtempSync(join(tmpdir(),'joeness-geo-readonly-'));
const names=['ROADMAP.md','TASK.md','state.json','checks.json'];
for(let i=0;i<pins.length;i++)writeFileSync(join(temp,names[i]),readFileSync(join(root,pins[i][0])));
writeFileSync(join(temp,'mapping-review-note.md'),readFileSync(join(here,'geo-mapping-review.md')));
const text=p=>readFileSync(join(temp,p),'utf8'),sha=p=>hash(readFileSync(join(temp,p)));
const ref=(p,quote)=>({path:p,sha256:sha(p),quote});
const ptr=(p,pointer,value)=>({path:p,sha256:sha(p),pointer,value});
const roadmap=text('ROADMAP.md'),state=JSON.parse(text('state.json'));
const current=roadmap.slice(roadmap.indexOf('**현재 —'),roadmap.indexOf('**이전 기록 —')).trim();
const history=roadmap.slice(roadmap.indexOf('**이전 기록 —')).split(/\r?\n\r?\n/)[0];
const di=state.objects.decisions.findIndex(x=>x.id==='DEC-023');assert.ok(di>=0);
const ri=state.objects.rules.findIndex(x=>x.id==='RULE-055');assert.ok(ri>=0);
const decision=ptr('state.json','/objects/decisions/'+di+'/statement',state.objects.decisions[di].statement);
const rule=ptr('state.json','/objects/rules/'+ri+'/statement',state.objects.rules[ri].statement);
const targets=names.map(path=>({path,sha256:sha(path)}));
const input={schema:'joeness.roadmap-review.v1',scope_id:'GEO 비런칭 데모 마감 기록',scope_source:rule,scope_authorization:decision,mapping_review:null,
  views:[{id:'current',kind:'current',source:ref('ROADMAP.md',current),claims:[
    {key:'stage',value:'비런칭 데모 마감',source:ref('ROADMAP.md','**현재 — 비런칭 데모 제작 마감, 2026-10-13.**')},
    {key:'next',value:'없음',source:ref('ROADMAP.md','**다음 작업: 없음.**')}
  ]},{id:'prior-qa',kind:'history',source:ref('ROADMAP.md',history),claims:[]}],
  required_outcomes:[
    {id:'demo',label:'비런칭 데모 제작 마감',required_lanes:['implementation'],acceptance_required:false,source:rule,targets},
    {id:'records',label:'마감 문서·보관 정합 확인',required_lanes:['technical'],acceptance_required:false,source:ref('TASK.md','이 검사는 문서·보관 무결성이며 새 UI/검색/운영 검증이 아니다.'),targets}
  ],
  excluded_outcomes:[{id:'live',label:'실서비스 운영·실검색 성과',source:ref('ROADMAP.md','실서비스 운영·실검색 성과는 범위 밖이다.'),authorization:decision}],
  observations:[
    {outcome_id:'demo',lane:'implementation',status:'PASS',source:ref('ROADMAP.md','현재 범위의 추가 필수 구현 작업은 없다.'),targets},
    {outcome_id:'records',lane:'technical',status:'PASS',source:ref('TASK.md','state 유효·기획 연결 누락0·현재 Manifest 일치.'),targets}
  ],
  limitations:[
    {text:'전체 기획 UNAPPROVED 유지',source:ref('checks.json','"approval": "UNAPPROVED"')},
    {text:'실제 확대·음성·5인 조사·모델 안정성 미검증',source:ref('ROADMAP.md','실제 PC 200%·음성·5인 조사·다모델/질문변형 안정성은 미검증 한계로 보존하며 통과로 바꾸지 않는다.')},
    {text:'기존 기록 재사용; 새 화면·검색·운영 검사 아님',source:ref('checks.json','Documentation and recoverable file organization only; no new UI/search/production claim')},
    {text:'원본 해석 검토이며 실제 사용자 서명 인증 아님',source:ref('mapping-review-note.md','실제 사용자 서명이나 새 승인 증거가 아니다.')}
  ]};
const review={scope_id:input.scope_id,status:'CONFIRMED',mapping_sha256:mappingHash(input),review_note:{path:'mapping-review-note.md',sha256:sha('mapping-review-note.md')}};
writeFileSync(join(temp,'review.json'),JSON.stringify(review));input.mapping_review=ptr('review.json','',review);
writeFileSync(join(temp,'input.json'),JSON.stringify(input));
const command=[cli,'--root',temp,'--input','input.json','--input-sha256',sha('input.json')];
const fixtureBefore=Object.fromEntries(readdirSync(temp).map(p=>[p,sha(p)]));
const r=spawnSync(process.execPath,command,{encoding:'utf8'});assert.ifError(r.error);
const readable=spawnSync(process.execPath,[...command,'--format','text'],{encoding:'utf8'});assert.ifError(readable.error);
const after=snapshot(),fixtureAfter=Object.fromEntries(readdirSync(temp).map(p=>[p,sha(p)]));
const result={kind:'actual-record-readonly-copy-not-new-UI-test',source_root:root,temporary_root:temp,command:[process.execPath,...command],cli_sha256:hash(readFileSync(cli)),exit:r.status,text_exit:readable.status,output:JSON.parse(r.stdout),source_unchanged:JSON.stringify(before)===JSON.stringify(after),fixture_unchanged:JSON.stringify(fixtureBefore)===JSON.stringify(fixtureAfter),before,after,fixture_sha256:fixtureAfter,cost:{copied_sources:4,total_source_bytes:pins.reduce((n,[p])=>n+readFileSync(join(root,p)).length,0),additional_model_runs:0},limits:'Manual semantic review, declared scope only. No rendering/deployment/project writes. Temporary review copy retained for QA.'};
writeFileSync(join(here,'geo-readonly-result.json'),JSON.stringify(result,null,2)+'\n');
writeFileSync(join(here,'geo-readonly-report.txt'),readable.stdout);
writeFileSync(join(here,'geo-readonly-input.json'),JSON.stringify(input,null,2)+'\n');
assert.equal(r.status,0);assert.equal(readable.status,0);assert.ok(result.source_unchanged&&result.fixture_unchanged);
console.log(readable.stdout);console.log(JSON.stringify({exit:r.status,source_unchanged:result.source_unchanged,fixture_unchanged:result.fixture_unchanged,cost:result.cost,temporary_root:temp}));
