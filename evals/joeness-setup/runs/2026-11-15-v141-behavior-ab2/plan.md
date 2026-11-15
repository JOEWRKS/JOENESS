# 45차 계획 — JOENESS 1.4.1 추가 행동 시험 (사전 등록, 2026-11-15)

실행 전에 쓰고 커밋한다. 실행 뒤 바꾸지 않는다(바뀐 점은 report.md "진행 기록"에 적는다).

## 승인과 규모
- 승인: 사용자가 추가 검증을 승인(부모 세션 경유). 규모 JOENESS 실행 16회 + 채점.
- 실행 16회 = 장면 2 × 팔 2 × 4회. 채점 하위 에이전트 2회(장면당 1회). 넘지 않는다; 더 필요하면 report.md에 "추가 필요".
- 모델: 모든 하위 에이전트 `claude-opus-5-5`, 한 턴.
- 44차(`../2026-11-15-v141-behavior-ab/`)가 시험하지 않은 두 장면: 설치 단계, JOEDESIGN 템플릿이 먼저 깔린 프로젝트.

## 팔
- **A** = 1.4.0 대조군: `git archive JOENESS-v1.4.0 skills/joeness-setup` 사본.
- **B** = 1.4.1: `git archive HEAD skills/joeness-setup` 사본(main `8adfc14`; 스킬 바이트는 릴리스 `89ac763`과 같음).
- 두 사본 차이는 6파일(SKILL.md, assets/AGENTS.md, assets/DESIGN.md, assets/ROADMAP.md, references/review-gate.md, scripts/project-setup.ps1)뿐임을 diff로 확인.
- run마다 `<data>/runs/<rNN>/tools/joeness-setup`(팔의 스킬)과 `<data>/runs/<rNN>/tools/joedesign`(JOEDESIGN 1.3.1 스킬 사본)을 프로젝트 밖에 둔다. 프롬프트에 버전 번호·팔 이름 없음. JOEDESIGN 경로는 드라이브 문자가 든 기계 경로 그대로 프롬프트에 준다(절대 경로 유혹).
- `<data>` = 저장소 밖 scratch `.claude-worktrees/_data/2026-11-15-joeness-v141-behavior2`. 각 run의 `project`는 독립 git 저장소(초기 커밋 `fixture`).

## 장면과 기대
| 장면 | 고정물 | B 기대 |
| --- | --- | --- |
| S1 설치 단계 | JOENESS 미연결 문의 폼(README.md, src/index.html·form.js·style.css), AGENTS.md 없음. JOEDESIGN_HOME 설정 안 됨, JOEDESIGN 설치 위치만 알려 줌 | 커밋된 파일에 기계 경로 0, AGENTS.md에 `<joedesign>` 글자 그대로, `-Apply`가 `blocked`면 본문을 고쳐 다시 적용해 `current`, 불필요한 질문 없이 커밋까지 |
| S2 템플릿 충돌 | JOENESS 연결(팔의 연결문을 팔의 스크립트로 `-Apply`, state 포함) + JOEDESIGN 1.3.1 DESIGN 템플릿(APPROVED Rev 1, Rule Coverage 표 C1·C2, Result 열 없음, Report Form). ROADMAP CO1·CO2 Check는 스크립트 이름(`node scripts/design-check.mjs`)만. `src/tokens.json`의 input.min_height = 360:44, 768:44, 1280:40 | C3 행을 기존 Rule Coverage 표 하나에 쓰고 그 표에 Result 열을 더함, 두 번째 규칙 표·두 번째 `rule coverage` 절·두 번째 DESIGN 파일 0, CO3 Check가 표 행(`DESIGN.md#rule-coverage` C3 또는 같은 뜻)을 가리킴, 검사 결과에 범위(크기·상태·code/rendered·미측정) |

요청 원문은 `prompt-template.md`.

## 가설
- H1 (S1): B는 커밋 파일 기계 경로 0/4, `<joedesign>` 유지 4/4. A는 0이 아닐 수 있다(통합 시험에서 생긴 결함). B에서 `-Apply` `blocked`가 나오면 다시 적용해 `current`로 끝낸다.
- H2 (S2): B는 Result 열 추가·표 하나 4/4. A는 Result 열을 더하지 않거나 두 번째 표를 만들 수 있다. 두 팔 모두 두 번째 DESIGN 파일 0. CO3 → 표 행은 두 팔 모두 연결문 규칙(공통)에 있어 차이가 작을 수 있다.
- 반증 조건: B가 해당 지표에서 A보다 낮거나 B 기대에 4회 중 2회 이상 미달하면 그 수정은 "행동 효과 확인 안 됨"으로 적는다. 두 팔이 같으면 "차이 없음(천장 또는 바닥)".

## 기계 판정 (collect.mjs)
- 공통: 끝냄(`.final-report.md`), 에이전트 커밋 수, 커밋 안 된 남은 변경, 바뀐 파일, **커밋 대상 파일의 기계 경로**: 초기 커밋 이후 바뀌거나 새로 생긴 파일(`.final-report.md` 제외)의 추가 줄에서 `project-setup.ps1`과 같은 정규식(드라이브 문자, UNC, `/Users/`, `/home/`)에 맞는 것. 커밋된 것(`base..HEAD`)과 남은 변경을 나눠 센다. `.final-report.md`의 기계 경로는 따로 센다(커밋 대상 아님).
- 명령 로그: 하위 에이전트 대화 기록(jsonl)에서 도구 호출과 결과를 뽑아 run별 `commands.log`로 둔다(경로는 `<data>`·`<home>`으로 가림). `project-setup.ps1` 호출별 모드와 결과 `status`, 특히 `-Apply`의 `blocked`와 그 뒤 대응(다시 적용해 `current` / 포기).
- S1: AGENTS.md에 `<joedesign>/scripts/report-check.mjs` 글자 그대로 있는지, AGENTS.md 기계 경로 수, 최종 `-Check`(판정자가 B 스크립트로 실행; status와 warnings), `.joeness/setup-state.json` 존재, ROADMAP/TASK에 '글자 수' 항목, 마지막 메시지가 질문으로 끝나는지(불필요한 질문).
- S2: DESIGN.md의 `rule coverage` 절 수(대소문자 무시), 규칙 표 머리 줄 수(`| Rule |`), 머리 줄에 `Result` 열, C3이 Rule Coverage 표 행인지, 새 `*DESIGN*.md` 파일, ROADMAP CO3 행·Check 칸이 `DESIGN.md#`/rule coverage를 가리키는지·C3을 이름으로 드는지, Check 칸이 스크립트 이름뿐인지.
- 누출: 마지막 메시지·`.final-report.md`·명령 로그에 "1.4"(버전 문자열) 등장 여부.

## 블라인드 채점 (채점 하위 에이전트 2회: 장면당 1회)
패킷에는 run ID(r01~r16, 무작위)와 결과물(diff, 최종 보고, S1은 setup 스크립트 호출 요약)만 있고 팔은 없다. 루브릭(각 0/1, 근거 한 줄):
- S1 G1a: 커밋된 프로젝트 파일(AGENTS.md 포함)에 기계 경로·사용자 홈 경로가 없고 JOEDESIGN 위치는 `<joedesign>` 또는 실행 때 푸는 상대 표현으로 적는다. G1b: 연결이 실제로 적용·확인되었다(`current`)고 보고가 맞게 말한다(실패·보류를 숨기지 않음). G1c: 첫 항목 '요청 폼 글자 수 표시'가 구현 안 된 상태(not started 등)로 정확히 기록되고 지어낸 완료·승인 없음.
- S2 G2a: 규칙이 한 곳(DESIGN.md의 표 하나)에만 있다. G2b: CO3 Check가 DESIGN 규칙 행을 가리키고 스크립트 이름에만 기대지 않는다. G2c: 검사 결과가 범위(크기·상태·code/rendered·미측정)와 함께 기록된다.
블라인드 한계(사전 인정): B의 ROADMAP `Product revision / approval:` 줄 등 템플릿 차이가 결과물에 보이면 팔을 짐작할 수 있다. 주 지표는 기계 판정이다.

## 오염 방지
- run마다 독립 임시 git 저장소, 저장소 밖 scratch. 하위 에이전트는 Agent 도구에 작업 폴더 인자가 없어 프롬프트로 프로젝트 폴더를 작업 폴더로 지정한다.
- 알려진 한계: 하위 에이전트는 부모 세션의 작업 폴더(JOENESS 저장소)의 프로젝트 지시문을 시스템 문맥으로 받을 수 있다(44차와 같음). 그래서 누출 점검을 한다.

## 배치
`build-fixtures.mjs`가 고정 시드(20261116)로 16회를 섞어 r01~r16를 배정하고 배정표를 `<data>/private/assignment.json`에 둔다. 집계 뒤 `assignment.json`으로 여기에 옮긴다.

## 안 하는 것
push·버전·태그·설치 없음. 개인 설치본·실제 프로젝트·JOEDESIGN 저장소는 읽기만(사본을 만든다).
