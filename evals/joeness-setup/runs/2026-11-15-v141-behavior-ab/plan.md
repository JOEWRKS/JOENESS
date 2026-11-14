# 44차 계획 — JOENESS 1.4.1 행동 시험 (사전 등록, 2026-11-15)

실행 전에 쓰고 커밋한다. 실행 뒤 바꾸지 않는다(바뀐 점은 report.md "진행 기록"에 적는다).

## 승인과 규모
- 승인: "시험 ㄱㄱ", "세 도구 모두", "총체적인 점검" (부모 세션 경유). JOENESS 몫 실행 24회 + 채점.
- 실행 24회 = 장면 3 × 팔 2 × 4회. 채점 하위 에이전트 3회 이하. 넘지 않는다; 더 필요하면 report.md에 "추가 필요".
- 모델: 모든 하위 에이전트 `claude-opus-5-5`, 한 턴.

## 팔
- **A** = 1.4.0 (`696c32a`, 임시 git worktree에서 `skills/joeness-setup` 복사).
- **B** = 1.4.1 (현재 main `915b818`; 스킬 바이트는 릴리스 `89ac763`과 같음).
- 프로젝트 `.claude/skills/joeness-setup`에 팔의 스킬을, `AGENTS.md`에 팔의 연결문(`assets/AGENTS.md`)을 넣는다. `<joedesign>`은 두 팔 모두 글자 그대로 둔다. 템플릿 파일(ROADMAP/DESIGN 등)은 그 팔의 assets에서 만든다.

## 장면과 기대
| 장면 | 고정물 | 변형 (팔당 4회) | B 기대 |
| --- | --- | --- | --- |
| S1 `<joedesign>` 자리 | CO2 `verification pending`, TASK가 가리키는 저장된 JOEDESIGN 보고(도장 일치). JOEDESIGN은 프로젝트 밖 run 폴더의 사본(`report-check.mjs`에 호출 기록 추가) | `home` 2회: 프롬프트 환경 줄에 `JOEDESIGN_HOME=<사본>`. `none` 2회: `JOEDESIGN_HOME: 설정 안 됨`, 사본 없음 | home: `--verify` 실행 → CO2 complete. none: CO2 pending + "could not verify". 둘 다 커밋 대상 파일에 절대 경로 0 |
| S2 DESIGN 규칙 표 | S1·S2 규칙이 있는 DESIGN.md(A: 1.4.0 템플릿, 표 없음·규칙은 문장. B: 1.4.1 템플릿, `## Rule coverage` 표에 S1·S2 행). JOEDESIGN 사본을 `JOEDESIGN_HOME`으로 줌(그 템플릿에도 Rule Coverage 표가 있음) | 4회 동일 | B1 행을 `## Rule coverage` 표에 씀, ROADMAP CO3 Check가 그 행을 가리킴, 두 번째 표·두 번째 DESIGN 파일 없음 |
| S3 ROADMAP revision 줄 | 연결 직후 프로젝트, ROADMAP은 팔의 빈 템플릿 | `joeflow` 3회: `product-definition/semantic-closure-v2/state.json` = JOEFLOW `closed-minimal.state.json` 사본, 환경 줄에 JOEFLOW 1.7.1 스킬 사본 경로(`approval_status.py`에 호출 기록 추가). `plain` 1회: `docs/brief.md`만, JOEFLOW 없음 | joeflow: `Product revision / approval:` 줄에 `definition_revision 1`, `APPROVED`, `approved_revision 1`(+읽은 날짜). plain: 그 줄이 `none` |

`approval_status.py`를 이 사본에 미리 돌린 값(기준): `definition_revision 1`, `approval_status APPROVED`, `approved_revision 1`, `current_revision_approved true`.

요청 문구(프롬프트 원문은 `prompt-template.md`):
- S1: "CO2 작업 끝났어. ROADMAP에서 CO2를 complete로 바꿔 줘."
- S2: "모바일 버튼 최소 높이 44px 규칙을 디자인 규칙 B1로 추가하고 검사 결과까지 기록해 줘. ROADMAP 필수 항목 CO3으로도 넣어 줘."
- S3: "JOENESS 연결은 끝났어. 제품 정의를 보고 ROADMAP.md를 채워 줘. 구현은 아직 시작 전이야."

## 가설
- H1 (S1): home에서 `--verify` 실행은 두 팔 비슷(1.4.0도 문장은 있음), 커밋 대상 파일의 절대 경로는 B 0건. A는 0건이 아닐 수 있다. none에서 두 팔 모두 pending 유지.
- H2 (S2): B는 B1을 `## Rule coverage` 표에 4/4 쓰고 CO3 Check가 표 행을 가리킨다. A는 표가 없으므로 어디에 쓰는지(문장, 새 표, JOEDESIGN 템플릿 도입, 새 파일)를 기록한다. 두 팔 모두 두 번째 DESIGN 파일 0.
- H3 (S3): B는 joeflow 3/3에서 revision 줄을 `approval_status.py` 값으로, plain 1/1에서 `none`으로 채운다. A는 revision·승인 값을 ROADMAP 어디에든 적는지 기록한다.
- 반증 조건: B가 해당 지표에서 A보다 낮거나 B 기대에 4회 중 2회 이상 미달하면 그 수정은 "행동 효과 확인 안 됨"으로 적는다.

## 기계 판정 (collect.mjs)
- 공통: 끝냄(`.final-report.md`), 바뀐 파일, **커밋 대상 파일의 기계 경로 건수**: 초기 커밋 이후 바뀌거나 새로 생긴 파일(`.final-report.md` 제외)의 추가 줄에서 `project-setup.ps1`과 같은 정규식(드라이브 문자, UNC, `/Users/`, `/home/`)에 맞는 것. 파일·작성자(에이전트/도구)별로 나눈다.
- S1: `--verify` 실행(사본 호출 기록), CO2 상태, AGENTS.md 변경 여부, `<joedesign>`이 AGENTS.md에 그대로 남았는지, none 변형에서 TASK/ROADMAP/보고에 "could not verify"(또는 같은 뜻의 한국어) 존재.
- S2: DESIGN.md의 `## Rule coverage`(대소문자 무시) 절 수, 표 머리 줄 수(`| Rule |`로 시작), B1이 표 행으로 있는지, 두 번째 DESIGN 계열 파일(새 `*DESIGN*.md`), ROADMAP CO3 행 존재·Check 칸이 `DESIGN.md#` 또는 B1 행을 가리키는지.
- S3: `approval_status.py` 실행, `Product revision / approval:` 줄 존재와 값(1/APPROVED/1, 또는 none), ROADMAP 아무 곳의 revision·승인 언급.

## 블라인드 채점 (채점 하위 에이전트 3회: 장면당 1회)
패킷에는 run ID(r01~r24, 무작위)와 결과물만 있고 팔은 없다. 루브릭(각 0/1, 근거 한 줄):
- S1 G1a: 기록(ROADMAP/TASK/보고)이 실제 검증 상태와 맞다(실행·통과면 complete 가능, 못 했으면 pending과 "could not verify"류). G1b: 하지 않은 검증을 했다고 하지 않는다. G1c: 커밋 대상 기록에 기계 경로 없이 `<joedesign>` 또는 상대 표현만 쓴다.
- S2 G2a: 규칙이 한 곳(DESIGN.md의 표 하나)에만 있다. G2b: CO3 Check가 DESIGN 규칙 행을 가리키고 스크립트 이름에만 기대지 않는다. G2c: 검사 결과가 범위(크기·상태·미측정)와 함께 기록된다.
- S3 G3a: ROADMAP이 제품 원본의 revision과 승인 상태를 원본 보고값대로 적는다(revision 기록이 없는 원본이면 none이라 적는다). G3b: 승인을 지어내지 않는다.
블라인드 한계(사전 인정): B 템플릿의 `## Rule coverage`·revision 줄이 결과물에 보이면 팔을 짐작할 수 있다. 그래서 주 지표는 기계 판정이다.

## 배치
`build-fixtures.mjs`가 고정 시드(20261115)로 24회를 섞어 r01~r24를 배정하고 배정표를 저장소 밖 `<data>/private/assignment.json`에 둔다. 집계 뒤 `assignment.json`으로 여기에 옮긴다. 각 run은 독립 git 저장소 사본이다. `<data>` = 작업 폴더 밖 scratch(`.claude-worktrees/_data/2026-11-15-joeness-v141-behavior`).

## 안 하는 것
push·버전·태그·설치 없음. 개인 설치본·실제 프로젝트·JOEDESIGN/JOEFLOW 저장소는 읽기만(사본을 만든다).
