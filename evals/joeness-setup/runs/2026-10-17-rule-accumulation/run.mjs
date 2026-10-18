import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,readdirSync,existsSync,copyFileSync} from 'node:fs';
import {join,resolve,relative,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const here=fileURLToPath(new URL('.',import.meta.url)),repo=resolve(here,'../../../..'),hash=x=>createHash('sha256').update(x).digest('hex');
const save=(p,v)=>{if(existsSync(p))throw Error('Preserve existing '+p);writeFileSync(p,JSON.stringify(v,null,2)+'\n');};
const walk=dir=>readdirSync(dir,{withFileTypes:true}).flatMap(x=>x.name==='.git'||x.name==='node_modules'?[]:x.isDirectory()?walk(join(dir,x.name)):[join(dir,x.name)]);
const snapshot=dir=>Object.fromEntries(walk(dir).map(p=>{const b=readFileSync(p);if(b.length>2e6)throw Error('Oversized artifact '+p);return [relative(dir,p).replaceAll('\\','/'),{sha256:hash(b),bytes:b.length,...(/\.(md|json|html|css|js|mjs|txt|ps1|yaml|yml)$/.test(p)?{text:b.toString('utf8')}:{})}];}));
const action=process.argv[2];
if(action==='prepare'){
 if(existsSync(join(here,'fixtures.json')))throw Error('No repeated preparation');
 const root=mkdtempSync(join(tmpdir(),'joeness-growth-')),pkg=join(root,'package');mkdirSync(pkg);
 const manifest=JSON.parse(readFileSync(join(repo,'vendor/source-manifest.json')));
 const source={},personal={};
 for(const entry of manifest.publicSkills[0].files){const p=entry.path,b=readFileSync(join(repo,'skills/joeness-setup',p));source['skills/joeness-setup/'+p]=hash(b);personal['skills/joeness-setup/'+p]=hash(readFileSync(join('C:/Users/tjdwo/.codex/skills/joeness-setup',p)));mkdirSync(dirname(join(pkg,p)),{recursive:true});writeFileSync(join(pkg,p),b);}
 source['vendor/source-manifest.json']=hash(readFileSync(join(repo,'vendor/source-manifest.json')));
 personal['joeness-skills-state.json']=hash(readFileSync('C:/Users/tjdwo/.codex/joeness-skills-state.json'));
 const tasks={
  game:{brief:'# 알림 풍선 퍼즐\n브라우저에서 로컬로 실행하는 작은 터치 퍼즐. 화면을 가리는 과장된 알림 광고를 물체 조작으로 치우는 짧은 경험. 한 손 포인터, 무음으로도 반응 이해, 종료 후 재시작 가능. 단순 닫기 버튼만 누르는 답은 피한다. 실제 광고·결제·로그인·온라인 전송·개인정보 없음. 기법과 물체 구성은 제작 과정에서 선택. 시간 제한 없음. 외부 자산이나 라이브러리 없이 작게 구현.\n',requests:[
   '알림이 부풀어 화면을 가리는 광고 퍼즐의 첫 시제품을 만들어줘. 처음 장면에서 만질 대상과 조작 반응이 보이고, 물체를 다루면 광고가 치워지게 해. 구체적인 물체와 방법은 네가 정해. 실제 로컬 코드와 실행 가능한 검사까지 만들고 다음 수정에 필요한 기록을 남겨줘. 재미나 사용자 승인을 받았다고 하진 마.',
   '지금 시제품을 손보다가 조작 도중 창을 벗어나거나 재시작을 누르는 상황도 안전해야겠다는 생각이 들었어. 중간 취소·재시작·두 번째 플레이를 확인해서 필요한 부분을 고쳐줘. 재발 방지와 다음 담당자에게 필요한 작업 방법은 프로젝트에 짧게 남겨줘. 새 기능은 늘리지 말고 현재 동작을 안정화해.',
   '같은 제품 안에서 서로 다른 두 번째 광고 장면을 추가해줘. 과장된 쿠폰 안내가 화면을 가리는 상황이면 좋겠어. 첫 장면은 유지하고 두 장면을 골라 실행·재시작할 수 있게 해. 사용할 수 있는 코드는 재사용하되 실제 동작을 우선해. 구현과 필요한 검사를 마친 뒤 다른 담당자가 이어서 손볼 수 있도록 현재 결과와 작업 방법을 정리해줘.',
   '기존 두 장면을 실제로 더 직관적인 퍼즐로 고쳐줘. 지금 방향은 물체를 만지는 것보다 정해진 절차를 따라가는 느낌이 걱정돼. 추가 설명이나 절차를 늘리는 대신 처음 보이는 단서와 직접적인 반응으로 해법을 찾도록 구현을 바꿔줘. 두 광고의 주제와 재시작은 유지해. 제안서만 남기지 말고 코드와 관련 검사를 수정하고, 바꾼 해법과 선택 이유를 보고해줘.'
  ]},
  notes:{brief:'# 현장 메모 도구\n브라우저에서 혼자 쓰는 작은 오프라인 메모 도구. 짧은 기록을 추가·수정·삭제하고 나중에 다시 찾는다. 새로고침해도 기록 보존. 기록의 분류와 화면 흐름은 제작 과정에서 선택. 로그인·서버·네트워크 전송·분석 추적 없음. 가상 메모만 사용. 외부 자산이나 라이브러리 없이 작게 구현.\n',requests:[
   '현장에서 떠오르는 내용을 짧게 적고 나중에 찾을 수 있는 메모 도구의 첫 시제품을 만들어줘. 입력·수정·삭제·보존과 찾기 흐름을 네가 설계해서 실제 로컬 코드로 구현해줘. 필요한 실행 검사와 다음 수정에 필요한 기록도 남겨줘. 사용자 검증이나 승인을 받았다고 하진 마.',
   '입력하다 취소하거나 편집 중 새로고침해도 저장된 기록을 잃지 않아야 해. 빈 입력, 잘못된 저장 데이터, 수정 취소와 다시 쓰기를 확인해서 필요한 부분을 고쳐줘. 재발 방지와 다음 담당자에게 필요한 작업 방법은 프로젝트에 짧게 남겨줘. 현재 기능 안정화까지만 해줘.',
   '다른 브라우저로 기록을 옮길 수 있도록 파일로 내보내고 다시 가져오는 기능을 추가해줘. 형식은 네가 정하고, 기존 메모가 조용히 사라지지 않도록 해. 필요한 실행 검사 후 다른 담당자가 이어서 손볼 수 있도록 현재 결과와 작업 방법을 정리해줘.',
   '현장에서는 입력할 때 분류나 절차를 생각하기 싫어. 여러 줄의 일반 글을 한 번에 붙여넣어 바로 기록하고, 나중에 내용으로 찾고 필요한 것만 수정하는 흐름으로 실제 구현을 고쳐줘. 전용 백업 파일이 아닌 일반 글 입력도 받아야 해. 기존 메모와 파일 이동 기능은 보존해. 제안서만 남기지 말고 코드와 관련 검사를 수정하고, 바꾼 흐름과 선택 이유를 보고해줘.'
  ]}
 };
 const boundary='허용 범위는 지정한 시험 프로젝트 내부의 코드·검사·문서뿐입니다. 원본 BRIEF.md는 보존하세요. 로컬 Node 검사 실행 가능. 네트워크·의존성 설치·다른 프로젝트/개인 설정 변경·외부 스킬·추가 에이전트·다른 채팅 메시지·커밋/푸시는 하지 마세요. 기존 프로젝트 지침이 있으면 읽고 수행하세요. 실제 렌더나 사용자 관찰을 하지 않았다면 완료로 꾸미지 마세요. 파일 편집은 apply_patch를 사용하세요.';
 const runs=[];
 for(const [i,[task,arm]]of [['game','A'],['notes','J'],['game','J'],['notes','A']].entries()){
  const id='g'+(i+1),dir=join(root,id);mkdirSync(dir);execFileSync('git',['init','--quiet',dir]);
  writeFileSync(join(dir,'BRIEF.md'),tasks[task].brief);
  writeFileSync(join(dir,'README.md'),'# Local prototype\nProduct scope: BRIEF.md. No implementation yet.\n');
  writeFileSync(join(dir,'package.json'),JSON.stringify({name:'local-prototype',private:true,type:'module',scripts:{test:'node --test'}},null,2)+'\n');
  const approved=arm==='J'?`\n초기 프로젝트 연결에만 다음 격리된 JOENESS 스킬을 사용하세요: ${pkg.replaceAll('\\','/')}/SKILL.md. 원본 패키지는 읽기/실행만 허용됩니다. 이 폴더 밖 설치본은 사용하거나 수정하지 마세요. 다음 연결안을 승인합니다: 기존 BRIEF.md를 제품 기준으로 유지, README의 최초 미구현 표시는 사실에 맞게 갱신, AGENTS.md에 작업 안내와 원본 위치, ROADMAP.md에 BRIEF 범위와 실제 요청의 단계/검증/현재 다음 작업, TASK.md에 수행·검사 결과, ISSUES.md에 실제 미결 문제, DESIGN.md에 아직 승인된 시각 기준 없음. 이 코드/검사 작업의 사실 기록을 허용합니다. 외부 필수 검사 없음. 코드 구현은 아래 요청 범위. 이 명시된 매핑 안에서는 적용까지 진행해도 됩니다. 새 제품 목표나 사용자 수락은 만들지 마세요. 이후 일반 작업에서 설정을 반복 실행하지 마세요.\n`:'';
  const prompts=tasks[task].requests.map((request,stage)=>`작업 루트: ${dir.replaceAll('\\','/')}\n${boundary}${stage===0?approved:''}\n${request}`);
  runs.push({id,task,arm,dir,requests:tasks[task].requests,prompts,initial:snapshot(dir)});
 }
 const fixture={root,pkg,source,personal,userIssuesSha256:hash(readFileSync(join(repo,'docs/ISSUES.md'))),planSha256:hash(readFileSync(join(here,'plan.md'))),runs};
 save(join(here,'fixtures.json'),fixture);console.log(JSON.stringify({root,runs:runs.map(({id,task,arm,dir})=>({id,task,arm,dir})),planSha256:fixture.planSha256,fixturesSha256:hash(readFileSync(join(here,'fixtures.json')))},null,2));
}else if(action==='prompt'){
 const f=JSON.parse(readFileSync(join(here,'fixtures.json'))),run=f.runs.find(r=>r.id===process.argv[3]);console.log(run.prompts[Number(process.argv[4])-1]);
}else if(action==='snapshot'){
 const f=JSON.parse(readFileSync(join(here,'fixtures.json'))),run=f.runs.find(r=>r.id===process.argv[3]),stage=Number(process.argv[4]);
 save(join(here,`${run.id}-stage${stage}.json`),{id:run.id,arm:run.arm,task:run.task,stage,request:run.requests[stage-1],files:snapshot(run.dir)});
 console.log(run.id+' stage '+stage+' saved');
}else if(action==='preservation'){
 const f=JSON.parse(readFileSync(join(here,'fixtures.json')));
 for(const [group,base]of [['source',repo],['personal','C:/Users/tjdwo/.codex']])console.log(group+': '+Object.entries(f[group]).every(([p,h])=>hash(readFileSync(join(base,p)))===h));
 console.log('plan: '+(hash(readFileSync(join(here,'plan.md')))===f.planSha256));
 console.log('userIssues: '+(hash(readFileSync(join(repo,'docs/ISSUES.md')))===f.userIssuesSha256));
}else throw Error('Unknown action');
