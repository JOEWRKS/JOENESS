# 46차 계획 — JOENESS 1.4.2 S2 행동 시험 (사전 등록, 2026-11-16)

실행 전에 쓰고 커밋한다. 실행 뒤 바꾸지 않는다(바뀐 점은 report.md "진행 기록"에 적는다).

## 승인과 규모
- 승인: 사용자 "JOENESS S2 8회 ㄱ"(부모 세션 경유) = 실행 8회 + 블라인드 채점 1회.
- 실행 8회 = 장면 S2 × 팔 2 × 4회. 채점 하위 에이전트 1회. **상한 8 + 1, 재실행 없음, 추가 장면 없음.** 실패한 run도 그대로 집계한다.
- 모델: 모든 하위 에이전트 `claude-opus-5-5`, 한 턴(Agent 도구 일반 하위 에이전트, 45차와 같음).

## 가설
- H (1차): 1.4.2 연결문(`assets/AGENTS.md`)이면 에이전트가 JOEDESIGN DESIGN 템플릿의 기존 Rule Coverage 표에 Result 열을 더한다.
- 근거: 45차 S2(`../2026-11-15-v141-behavior-ab2/`)에서 1.4.1 팔은 0/4였다. 그 규칙이 SKILL.md와 assets/DESIGN.md에만 있고 매 턴 읽히는 연결문에는 없었다(S2에서 SKILL.md를 읽은 run은 2/4). 1.4.2는 연결문에 두 줄을 더했다.

## 팔
- **A** = `git archive JOENESS-v1.4.1 skills/joeness-setup` 사본(태그 커밋 `89ac763`).
- **B** = `git archive JOENESS-v1.4.2 skills/joeness-setup` 사본(태그 커밋 `593bd02`).
- 두 사본 차이는 `assets/AGENTS.md`의 두 줄뿐임을 `diff -r`로 확인했다(Rule Coverage 표 = DESIGN 규칙 표, Result 열이 없으면 더함, 두 번째 표 금지).
- JOEDESIGN: `git archive v1.3.1 skills/joedesign`(JOEDESIGN 저장소) 사본. 45차 run의 `tools/joedesign`과 바이트가 같음을 확인했다.
- 팔 사본은 세션 scratchpad에 꺼낸다. JOENESS 저장소 안에 worktree를 만들지 않는다.

## 장면 S2 (45차와 같음)
- `<data>` = 저장소 밖 `.claude-worktrees/_data/2026-11-16-joeness-v142-behavior`. run마다 `<data>/runs/<rNN>/project`(독립 git 저장소, 초기 커밋 `fixture`)와 `<data>/runs/<rNN>/tools/{joeness-setup,joedesign}`.
- 고정물: 45차 `build-fixtures.mjs`의 S2와 같다. 문의 폼(README.md, src/index.html·form.js·style.css), `src/tokens.json`(input.min_height 360:44, 768:44, 1280:40), `scripts/design-check.mjs`(C1·C2만), JOEDESIGN 1.3.1 DESIGN 템플릿(APPROVED Rev 1, Rule Coverage 표 C1·C2, **Result 열 없음**, Report Form), ROADMAP CO1·CO2(Check는 `node scripts/design-check.mjs`만), TASK co1·co2, ISSUES, 기존 AGENTS.md 한 줄 + 팔의 연결문을 팔의 `project-setup.ps1 -Apply`로 적용(state 포함).
- 45차와 다른 점 하나: ROADMAP의 `Product revision / approval:` 줄은 두 팔 모두 넣는다(45차에서는 1.4.1 팔에만 넣었다. 이번에는 두 팔이 모두 1.4.1 이상이라 1.4.1 ROADMAP 형식을 쓴다). 그래서 두 팔 고정물의 차이는 연결문 두 줄뿐이다.
- 과제문: 45차 `prompt-template.md`의 S2 그대로(이 폴더 `prompt-template.md`에 옮김). 프롬프트에 버전 번호·팔 이름·JOENESS 저장소 경로 없음.
- 요청: "입력창 최소 높이 44px(360·768) 규칙을 디자인 규칙 C3으로 추가하고 검사 결과까지 기록해 줘. ROADMAP에 필수 항목 CO3으로 넣고 Check도 갱신해 줘."

## 순서
- 실행 순서와 run ID는 A/B 교차: r01 A, r02 B, r03 A, r04 B, r05 A, r06 B, r07 A, r08 B. 한 번에 한 쌍(A·B)씩 동시에 띄운다(공용 브라우저 간섭을 45차보다 줄임).
- 블라인드 채점 묶음에서는 run ID를 시드 고정(20261116) 섞기로 `p1`~`p8`로 바꿔 홀짝으로 팔을 알 수 없게 한다. 대응표는 `<data>/private/`에 두고 채점 뒤 옮긴다.

## 지표
**1차 (기계, collect.mjs):** 기존 Rule Coverage 표 머리 줄에 `Result` 열이 있는가(`result_column`).

**부차 (45차 지표 그대로):** 규칙 표 하나(`| Rule |` 머리 줄 1), `rule coverage` 절 하나, C3이 Rule Coverage 표 행으로 한 번, 두 번째 `*DESIGN*.md` 파일 0, ROADMAP CO3 행 · Check가 `DESIGN.md#`/rule coverage를 가리킴 · C3을 이름으로 듦 · 스크립트 이름뿐 아님, CO3 상태, 검사 스크립트 변경, 커밋 여부. 보조 관찰: Result 열 칸의 내용이 TASK 링크인지(복사한 로그가 아닌지), 하위 에이전트가 SKILL.md를 읽었는지.

**누출 지표 (run별 건수):** 마지막 메시지·`.final-report.md`·에이전트 자신의 텍스트·도구 호출 입력에서 (1) 버전 문자열 `1.4`·`1.4.x`, (2) JOENESS 저장소 경로(`JOEWRKS/JOENESS`, `JOEWRKS\JOENESS`) 또는 `evals/joeness-setup`, (3) 부모 세션·팔·A/B 언급(`arm`, `parent session`, `부모 세션`, `팔`, `A/B`, `control`, `대조`). 프로젝트·스킬 폴더 밖 읽기(도구 호출 경로가 run 폴더 밖, 단 세션 scratchpad·브라우저는 따로 셈).

## 판정 기준 (1차 지표)
- **효과 있음**: B ≥ 3/4 그리고 A ≤ 1/4.
- **차이 없음**: 두 팔의 차이가 1 이하.
- **판정 불가**: 그 밖(예: B 2/4, 또는 A ≥ 2/4로 대조군이 오염·천장일 때), 또는 run이 끝나지 않아 팔당 3 미만만 판정될 때.
- 부차 지표는 결론을 바꾸지 않고 함께 적는다. B가 Result 열을 더하면서 두 번째 표·두 번째 DESIGN 파일을 만들면 그 수를 따로 적는다.

## 블라인드 채점 (1회)
묶음에는 `p1`~`p8`과 결과물(diff, 최종 보고)만 있고 팔·run ID·순서는 없다. run별 판정(각 0/1, 근거 한 줄):
- R1 기존 Rule Coverage 표에 Result 열(또는 같은 뜻의 결과 칸)을 더했다.
- G2a 규칙이 한 곳(DESIGN.md의 표 하나)에만 있다. G2b CO3 Check가 DESIGN 규칙 행을 가리키고 스크립트 이름에만 기대지 않는다. G2c 검사 결과가 범위(크기·상태·code/rendered·미측정)와 함께 기록된다.
- 보조: Result 칸이 최신 TASK 링크인지 복사한 로그인지, CO3 complete일 때 근거가 측정 범위와 맞는지.
기계 판정과 블라인드 판정을 둘 다 적고, 다르면 둘 다 보고한다. 블라인드 한계(사전 인정): 연결문 두 줄은 diff에 나오지 않지만, 결과물(Result 열) 자체가 가설과 같은 형태라 채점자가 무엇을 보는지는 숨길 수 없다. 주 지표는 기계 판정이다.

## 오염 방지와 알려진 한계
- run마다 독립 임시 git 저장소, 저장소 밖 scratch. 하위 에이전트에게 JOENESS 저장소 경로·버전·부모 문맥을 주지 않는다. 프롬프트로 프로젝트 폴더를 작업 폴더로 지정한다.
- **알려진 한계(사전 인정, 45차보다 큼):** 하위 에이전트는 부모 세션 작업 폴더(JOENESS 저장소)의 `AGENTS.md`를 시스템 문맥으로 받을 수 있다. 지금 그 파일은 1.4.2 규칙("add a Result column if absent, never a second table")을 그대로 적고 있다. 그래서 A가 Result 열을 더하면 스킬 효과와 문맥 오염을 가를 수 없고, 그 경우 "판정 불가(대조군 오염 가능)"로 적는다. 45차에서 이 경로로 팔 짐작 1건(r08)이 있었다. Claude CLI가 이 기계에 없어 다른 작업 폴더에서 띄우는 실행은 이번에 할 수 없다.

## 기록
`build-fixtures.mjs`, `collect.mjs`(45차 것을 S2·8회·누출 지표로 고친 것), `prompt-template.md`, `assignment.json`, `trials.json`, `summary.txt`, `runs/rNN/`(final-report.md, last-message.txt, commands.log, diff.patch, files.txt, final-docs/), `blind-grades/S2.md`, `report.md`. 경로는 `<data>`·`<home>`·`<temp>`·`<user>`로 가린다.

## 안 하는 것
push·버전·태그·설치 없음. 개인 설치본·`D:\JOEWRKS\.local`·실제 프로젝트·JOEDESIGN 저장소는 읽기만(사본을 만든다).
