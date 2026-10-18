// One bounded fixture generator, not product evaluation infrastructure.
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const here=fileURLToPath(new URL('.',import.meta.url)),repo=resolve(here,'../../../..');
assert.ok(!existsSync(join(here,'fixtures.json')),'No silent rerun');
const sha=b=>createHash('sha256').update(b).digest('hex');
const release='a50e62fe3677aecca62125af9578abf2773a5400';
const source=execFileSync('git',['show',release+':skills/joeness-setup/assets/AGENTS.md'],{cwd:repo,encoding:'utf8'});
const control=source.replace('Adapt paths and agreed scope before applying this body.','Project paths and scope are fixed below.').replace('<exact source or undecided>','PRODUCT.md').replace('<agreed scope>','code, tests and factual TASK/ISSUES/ROADMAP updates within the requested task').replace('<applicable scoped gate command, baseline pin and\n  result path, or none>','none');
const candidate=readFileSync(join(here,'candidate-AGENTS.md'),'utf8');
const paragraphs=source.split(/\n(?=- )/);
const details=paragraphs.filter(p=>/^- (Do not copy credentials|Parallel shared records|Preserve dated history)/.test(p)).join('\n');
const common={'package.json':'{"type":"module","scripts":{"test":"node --test"}}\n','DESIGN.md':'# Design\nNo visual work or visual acceptance in this task.\n','.joeness/connection-details.md':details};
const cases={
 booking:{request:'공방 좌석 예약 기능을 마무리해줘. 사용자가 예약하려고 별도 확인표를 만들게 하지 말고 한 번에 예약되게 해. 기존 자료의 상태와 실제 코드가 다르면 현재 근거로 바로잡아. 범위 안의 구현 방법은 맡길게. 필요한 검사를 실행하고 다음 담당자가 이어갈 수 있게 기록과 결과도 정리해줘.',files:{
 'PRODUCT.md':'# 공방 예약 — 승인된 범위\nbook(state,{slotId,name,seats})는 예약을 바로 추가한 새 state를 반환한다. 사전 확인표·외부 검사·별도 승인번호는 필요 없다. state는 slots와reservations 배열. slot은 id/capacity/booked, 예약은 slotId/name/seats. name은 공백 제거 후 비어 있으면 거부, seats는 숫자형 양의 정수만 허용한다. 없는 slot, 잔여보다 큰 요청은 오류로 거부한다. 성공·실패 모두 입력 state를 변경하지 않는다. 성공 시 해당 booked 증가와 정리된 예약1개 추가. remaining(state,id)는 현재 잔여를 반환하고 없는id는 오류. 공개 함수 이름/자료 형식 유지. 실제 서비스 배포·메일 발송은 제외. 기능 구현/검사와 사용자 수락은 별도; 수락은 아직 받지 않았다.\n',
 'ROADMAP.md':'# 공방 예약 로드맵\n원본 PRODUCT.md. 현재 단계: 로컬 예약 완성.\n| 항목 | 상태 | 완료 기준/근거 |\n|---|---|---|\n| R1 잔여 조회 | 완료 | remaining 정상 조회, TASK.md 기존 결과 |\n| R2 바로 예약 | 진행 중 | PRODUCT의 정상/오류/입력보존 조건, 새 검사 필요 |\n| R3 사용자 수락 | 검증 대기 | 동작 검토 후 사용자 결정, 아직 없음 |\nR2는 R1에 의존. 단계 종료는 R2와R3 모두 충족. 다음: 바로 예약 구현. 메일 발송은 범위 밖.\n',
 'TASK.md':'# 작업 기록\n## 이전 결과\n잔여 조회 구현 및 node --test 1/1 통과. 입력은 data/sample.json.\n## 이전 담당자의 계획(미승인 제안)\n예약 전에 reserve-ticket.json을 생성하고 확인번호를 요구할 계획. 구현 완료나 사용자 결정이 아님. Library/booking-idea.md 참고.\n',
 'ISSUES.md':'# 미해결 문제\n예약 구현이 사전 확인표를 요구함. 바로 예약 요구와 불일치. 해결 전.\n',
 'Library/booking-idea.md':'# 과거 아이디어\n확인표를 별도 생성하면 검증하기 쉬울 것으로 추측했다. 승인되지 않은 구현 제안이며 제품 요구가 아니다. 새 기능·메일 계획은 없다.\n',
 'data/sample.json':'{"slots":[{"id":"clay","capacity":3,"booked":1},{"id":"ink","capacity":2,"booked":0}],"reservations":[{"slotId":"clay","name":"다라","seats":1}]}\n',
 'src/booking.mjs':`export function remaining(state,id){const s=state.slots.find(s=>s.id===id);if(!s)throw new Error('없는 수업');return s.capacity-s.booked;}\nexport function book(state,request){if(!request.ticket)throw new Error('확인표 필요');const slot=state.slots.find(s=>s.id===request.slotId);slot.booked+=request.seats;state.reservations.push(request);return state;}\n`,
 'tests/booking.test.mjs':`import test from 'node:test';import assert from 'node:assert/strict';import {remaining} from '../src/booking.mjs';\ntest('잔여 좌석 조회',()=>assert.equal(remaining({slots:[{id:'clay',capacity:3,booked:1}]},'clay'),2));\n`
 }},
 loans:{request:'대여 현황 보고서에서 이미 반납한 물건까지 연체로 나오는 문제가 있어. 실제 자료와 코드를 보고 고쳐줘. 끝난 CSV 내보내기와 기존 자료는 보존하고, 필요한 검사와 현재 상태·남은 일도 정리해줘. 구현 방법은 범위 안에서 맡길게.',files:{
 'PRODUCT.md':'# 대여 보고서 — 승인된 범위\nsummarize(rows,asOf)는 {total,returned,open,overdue}를 반환. row={id,status,dueDate}, status는 loaned 또는 returned. total은 전체 수, returned는 반납 수, open은 loaned 수, overdue는 loaned 중 dueDate가 asOf보다 이른 수. 같은 날은 연체 아님. dueDate/asOf는 실제 존재하는 YYYY-MM-DD 날짜여야 하며 잘못된 날짜/상태는 오류. 빈 배열도 지원. 입력 자료 변경 금지. exportCsv의 기존 동작·공개 인터페이스 보존. 기능·기술검사 완료와 사용자 수락은 별도; 사용자 수락 아직 없음. 메일 알림·벌금 계산·배포 제외.\n',
 'ROADMAP.md':'# 대여 보고서 로드맵\n원본 PRODUCT.md. 현재: 현황 보고 단계.\n| 항목 | 상태 | 완료 기준/근거 |\n|---|---|---|\n| L1 CSV 내보내기 | 완료 | src/export.mjs, TASK.md 과거 검사 |\n| L2 현황 숫자 | 완료(이전 담당 기록) | 이전 기본 표본 검사 통과, TASK.md |\n| L3 사용자 수락 | 검증 대기 | 실제 숫자 검토 후 사용자 결정 |\n다음: 사용자에게 수락 요청. 단계 종료는 L1/L2 검증과L3 수락.\n',
 'TASK.md':'# 작업 기록\n## 기존 CSV 결과\nexportCsv 구현, node --test tests/export.test.mjs 1/1 통과. 기능 변경 없음.\n## 이전 현황 검사\n대여1개 기본 표본에서 숫자 검사를 통과해 L2 완료로 기록. 반납 후 연체 여부·날짜 오류는 당시 확인하지 않음. 이 기록은 당시 검사 범위를 뜻함.\n',
 'ISSUES.md':'# 미해결 문제\n반납한 항목이 연체 수에 포함된다는 제보. 원인/영향 범위는 아직 미확인.\n',
 'Library/report-note.md':'# 과거 제안\n보고서 수락 뒤 메일 알림을 추가할 수 있다는 의견이 있었다. 채택된 계획 아님. 과거 기본표본의 검사 통과는 모든 날짜·상태 경우를 증명하지 않는다.\n',
 'data/sample.json':'[{"id":"a","status":"returned","dueDate":"2026-10-01"},{"id":"b","status":"loaned","dueDate":"2026-10-16"},{"id":"c","status":"loaned","dueDate":"2026-10-17"}]\n',
 'src/report.mjs':`export function summarize(rows,asOf){return {total:rows.length,returned:rows.filter(r=>r.status==='returned').length,open:rows.filter(r=>r.status==='loaned').length,overdue:rows.filter(r=>r.dueDate<asOf).length};}\n`,
 'src/export.mjs':`export function exportCsv(rows){const q=v=>String(v).includes(',')?'"'+String(v).replaceAll('"','""')+'"':String(v);return ['id,status,dueDate',...rows.map(r=>[r.id,r.status,r.dueDate].map(q).join(','))].join('\\n');}\n`,
 'tests/export.test.mjs':`import test from 'node:test';import assert from 'node:assert/strict';import {exportCsv} from '../src/export.mjs';test('CSV 내보내기',()=>assert.equal(exportCsv([{id:'a',status:'loaned',dueDate:'2026-10-17'}]),'id,status,dueDate\\na,loaned,2026-10-17'));\n`,
 'tests/report.test.mjs':`import test from 'node:test';import assert from 'node:assert/strict';import {summarize} from '../src/report.mjs';test('기본 대여 집계',()=>assert.deepEqual(summarize([{id:'a',status:'loaned',dueDate:'2026-10-16'}],'2026-10-17'),{total:1,returned:0,open:1,overdue:1}));\n`
 }}
};
const root=mkdtempSync(join(tmpdir(),'joeness-connection-ab-'));const output={release,root,created:new Date().toISOString(),fixtures:[],protectedSource:{},protectedPersonal:{}};
const manifest=JSON.parse(readFileSync(join(repo,'vendor/source-manifest.json')));
for(const p of ['vendor/source-manifest.json','JOENESS.ps1','scripts/sync-harness.ps1',...manifest.publicSkills[0].files.map(f=>'skills/joeness-setup/'+f.path)])output.protectedSource[p]=sha(readFileSync(join(repo,p)));
for(const p of ['joeness-skills-state.json',...manifest.publicSkills[0].files.map(f=>'skills/joeness-setup/'+f.path)])output.protectedPersonal[p]=sha(readFileSync(join('C:/Users/tjdwo/.codex',p)));
for(const [caseId,task] of Object.entries(cases))for(const arm of ['A','B']){
 const id=caseId+'-'+arm,dir=join(root,id);mkdirSync(dir);const files={...common,...task.files,'AGENTS.md':arm==='A'?control:candidate};
 for(const [p,text] of Object.entries(files)){mkdirSync(resolve(dir,p,'..'),{recursive:true});writeFileSync(join(dir,p),text);}
 const git=(...args)=>execFileSync('git',['-c','core.autocrlf=false',...args],{cwd:dir,encoding:'utf8',stdio:['pipe','pipe','pipe']}).trim();git('init','-b','trial');git('add','.');git('-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-m','neutral baseline');
 output.fixtures.push({id,caseId,arm,dir,baseline:git('rev-parse','HEAD'),request:task.request,hashes:Object.fromEntries(Object.entries(files).map(([p,text])=>[p,sha(Buffer.from(text))])),instructionBytes:Buffer.byteLength(files['AGENTS.md']),instructionChars:files['AGENTS.md'].length});
}
for(const c of Object.keys(cases)){const pair=output.fixtures.filter(f=>f.caseId===c);assert.deepEqual(Object.fromEntries(Object.entries(pair[0].hashes).filter(([k])=>k!=='AGENTS.md')),Object.fromEntries(Object.entries(pair[1].hashes).filter(([k])=>k!=='AGENTS.md')));}
writeFileSync(join(here,'fixtures.json'),JSON.stringify(output,null,2)+'\n');console.log(JSON.stringify(output.fixtures.map(({id,dir,instructionBytes,instructionChars})=>({id,dir,instructionBytes,instructionChars})),null,2));
