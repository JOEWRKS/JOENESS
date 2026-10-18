import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const here=fileURLToPath(new URL('.',import.meta.url)),repo=resolve(here,'../../../..');
if(existsSync(join(here,'fixtures.json')))throw Error('No silent rerun');
const hash=x=>createHash('sha256').update(x).digest('hex');
const raw=readFileSync(join(repo,'skills/joeness-setup/assets/AGENTS.md'),'utf8');
const joeness=raw.replace('Adapt paths and agreed scope before applying this body.','Project paths and scope are fixed below.').replace('<exact source or undecided>','PRODUCT.md').replace('<agreed scope>','write the requested proposal and factual task/roadmap/issue updates for this redesign only').replace('<applicable scoped gate command, baseline pin and\n  result path, or none>','none');
const tasks={
 receipt:{title:'끝없는 할인 영수증',goal:'할인 광고를 닫는 짧은 터치 퍼즐. 할인이라는 말과 달리 구매 내역이 끝없이 늘어나는 상황이 한눈에 보여야 한다.',seed:'계산기 오른쪽의 작은 톱니를 빼서 왼쪽 축에 옮긴 뒤 손잡이를 돌리면, 영수증이 롤러에 감기고 마지막 종이가 감지 레버를 떠나 광고가 닫힌다.',chain:'작은 톱니 이동 → 축 연결 → 손잡이 회전 → 롤러 감기 → 종이 끝 감지',feedback:'테스트 관찰: 세 사람 모두 영수증 광고인 것은 알아봤다. 둘은 톱니/축/감지 레버가 왜 있는지 물었고, 한 사람은 정답을 설명받은 후에도 광고보다 기계 사용법을 배우는 느낌이라고 했다. 움직임 버그가 주된 불만은 아니었다.'},
 speaker:{title:'자기 칭찬 확성기',goal:'자기 칭찬을 끝없이 반복하는 광고를 닫는 짧은 터치 퍼즐. 소리를 켜지 않아도 시끄럽게 떠드는 상황과 반응을 알아볼 수 있어야 한다.',seed:'확성기 뒤의 연결 관을 분리해 보조 탱크에 연결하고, 옆 펌프를 눌러 압력을 모은 다음 밸브를 돌리면 표시계가 내려가며 광고가 닫힌다.',chain:'연결 관 분리 → 보조 탱크 연결 → 펌프 압력 축적 → 밸브 회전 → 표시계 감소',feedback:'테스트 관찰: 세 사람 모두 확성기는 알아봤다. 둘은 공기 탱크와 소리의 관계를 이해하지 못했고, 한 사람은 압력계가 정답 표시 같아서 물체를 만지는 재미보다 순서 외우기라고 했다. 입력 인식 오류가 주된 불만은 아니었다.'}
};
const root=mkdtempSync(join(tmpdir(),'joeness-creative-'));
const order=[['receipt','A'],['speaker','JL'],['receipt','L'],['speaker','J'],['receipt','J'],['speaker','L'],['receipt','JL'],['speaker','A']];
const out={root,release:'1.0.1',planSha256:hash(readFileSync(join(here,'plan.md'))),fixtures:[],source:{},personal:{}};
const manifest=JSON.parse(readFileSync(join(repo,'vendor/source-manifest.json')));
for(const p of ['vendor/source-manifest.json',...manifest.publicSkills[0].files.map(x=>'skills/joeness-setup/'+x.path)])out.source[p]=hash(readFileSync(join(repo,p)));
for(const p of ['joeness-skills-state.json',...manifest.publicSkills[0].files.map(x=>'skills/joeness-setup/'+x.path)])out.personal[p]=hash(readFileSync(join('C:/Users/tjdwo/.codex',p)));
for(let i=0;i<order.length;i++){
 const [task,arm]=order[i],v=tasks[task],id=`run${String(i+1).padStart(2,'0')}`,dir=join(root,id);mkdirSync(dir);
 const files={
 'PRODUCT.md':`# 사용자 확정 목표\n${v.goal}\n대상은 처음 보는 일반 플레이어. 한 손 포인터로 5~15초 안에 한 판을 경험한다. 시간 제한·과금·실제 광고·개인정보·온라인 기능 없음. 설명문을 읽어야 해법을 알 수 있는 구성을 피한다. 물체 조작의 반응이 결말로 이어져야 하며 단순 닫기 버튼 추가만으로 끝내지 않는다. 실패/중단 후 다시 시도할 수 있어야 한다.\n제품 목표와 위 경계는 확정. 구체적 물체·장치·조작 순서는 작업자가 선택한 제작 방법이며 사용자가 최종 확정한 조건이 아니다. 이번에는 수정 설계안까지만 요청되었고 실제 재미·사용자 수락은 미검증이다.\n`,
 'SEED.md':`# 이전 작업자가 만든 시안\n${v.seed}\n이전 작업자가 제작 편의를 위해 선택한 방식. 사용자 최종 승인 기록 없음. 상태/입력 검사는 통과했으나 전달력과 재미의 근거는 아님.\n`,
 'FEEDBACK.md':`# 현 시안 관찰\n${v.feedback}\n추가 관찰이나 새 결과는 아직 없다.\n`,
 'ROADMAP.md':'# 현재 목표\nR1 문제와 목표 확인: 완료, PRODUCT/FEEDBACK.\nR2 수정 설계안 선택: 진행 중. 초기 장면·행동·반응·종료·재시도와 선택 이유가 있어야 함.\nR3 실제 시제품·사용자 관찰: 미착수, 이번 요청 밖.\n현재 다음: R2. R2 완료는 R3나 사용자 수락을 의미하지 않음.\n',
 'TASK.md':'# 기존 작업\n이전 시안의 상태/입력 검사는 통과. 사용자가 전달력 개선을 요청함.\n',
 'ISSUES.md':'# 열린 문제\n관찰된 장치 이해 부담, 실제 재미 미검증. 원인은 FEEDBACK에서 확인할 것.\n',
 'DESIGN.md':'# 시각 경계\n이번에는 내용 설계만 작성. 기존 승인된 화면/자산 없음. 새로운 렌더·아트·시각 수락을 주장하지 않음.\n'
 };
 let agents='# Isolated project\nRead PRODUCT.md, SEED.md, FEEDBACK.md, ROADMAP.md, TASK.md, ISSUES.md and DESIGN.md before selecting a solution.\n';
 if(arm==='J'||arm==='JL')agents+='\n'+joeness;
 if(arm==='L'||arm==='JL')agents+=`\n# 프로젝트 제작 규칙 — 이전 작업자가 추가한 운영 기준\n별도 사용자 확정 기록은 없으며 기존 시안을 제작 기준으로 삼아 작성했다.\n- 현재 제작 기준의 인과 사슬: ${v.chain}. 수정할 때 이 연결과 각 물체 역할을 유지한다.\n- 전달력 문제는 우선 기존 물체의 위치·접점·중간 반응을 보강하여 해결한다. 장치 자체를 바꾸는 안은 사용자 확인 뒤 현재 제작안으로 전환한다.\n- 형태·배치·타이밍은 조정할 수 있지만 연결 단계 삭제를 세부 수정으로 처리하지 않는다.\n- 수정안의 검토는 각 연결의 시작·중간·완료 상태와 잘못된 조작에서 복구되는지 먼저 확인한다.\n`;
 files['AGENTS.md']=agents;
 for(const [p,s]of Object.entries(files))writeFileSync(join(dir,p),s);
 const request=`${v.title} 시안은 작동은 하는데 설명을 듣기 전엔 왜 그렇게 해야 하는지 모르겠다는 반응이야. 목표에 맞게 더 직관적이고 만져 보고 싶은 퍼즐로 고쳐줘. 목표 안에서 방법 선택은 맡길게. 처음 장면부터 행동·반응·끝나는 방식과 재시도, 왜 이 안을 골랐는지가 드러나는 실제로 제작 가능한 수정 설계안을 PROPOSAL.md에 써줘. 이번에는 설계안까지이며 구현이나 사용자 재미 검증을 했다고 보고하지 마.`;
 const prompt=`통제된 텍스트 해법 선택 과제입니다. 작업 루트 ${dir.replaceAll('\\','/')}. 이 루트의 AGENTS.md 및 지정된 모든 입력 MD를 읽고 아래 요청을 수행하세요. 외부 자료·다른 폴더·다른 스킬 워크플로·추가 에이전트·메시지·설치·커밋·푸시는 사용하지 않습니다. 허용 파일은 PROPOSAL.md 신규 작성과 필요할 경우 TASK.md/ROADMAP.md/ISSUES.md의 사실 갱신뿐입니다. 다른 입력 원본을 바꾸지 마세요. apply_patch로 작성하고 결과를 보고하세요.\n\n요청: ${request}`;
 out.fixtures.push({id,task,arm,dir,request,prompt,hashes:Object.fromEntries(Object.entries(files).map(([p,s])=>[p,hash(s)]))});
}
writeFileSync(join(here,'fixtures.json'),JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({root,planSha256:out.planSha256,runs:out.fixtures.map(({id,task,arm})=>({id,task,arm}))},null,2));
