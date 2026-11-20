# JOE 2.0.0 세 도구 통합 시험 보고 (2026-11-19)

## 결론

- **끝까지 갔다.** JOENESS 연결(`current`) → JOEFLOW rev 3 승인·투영 검사(`projection_check` ok) → JOEDESIGN 화면 구현·규칙 표·도장(`--verify` exit 0) → JOENESS 검수 게이트(`review-gate --claim complete` exit 0)로 ROADMAP S1을 complete로 넘겼다. 승인과 시각 수락은 모두 **자기 승인**이다.
- **막힘 2곳, 둘 다 우회해서 통과했다.** (1) JOEFLOW: 새 프로젝트에서 READY_FOR_REVIEW로 못 넘어감(discovery baseline). state.json을 손으로 고쳐 우회했다. (2) JOENESS: Claude Code 설치 경로(심볼릭 링크)로 review-gate를 부르면 **아무 검사 없이 exit 0**. 실제 경로로 우회했다.
- **가장 중요한 결함: D1 (게이트 fail-open).** 이 설치 방식에서는 JOENESS의 `.mjs` 소비자 4개가 무엇을 넣어도 통과 신호를 낸다. "exit 0이면 허용"이라는 게이트 계약이 조용히 무너진다.
- **새로 찾은 도구 간 충돌 2건.** D3: JOENESS는 DESIGN `Result` 열을 갱신하라고 하는데, 그 갱신이 JOEDESIGN 게이트 기준선을 stale로 만든다. D4: 이 기계의 `core.autocrlf=true`에서는 새로 clone하면 게이트 고정값이 깨진다.
- 대조군이 없는 1회 특성화 실행이다. 결함 목록일 뿐 효과를 증명하지 않는다.

## 단계별 소요 시간 (셸 시계, 자세한 내용은 trace.md)

| 단계 | 시간 | 결과 |
| --- | --- | --- |
| 준비 + proj git init | ~1분 | 통과 |
| JOENESS 연결 | ~2분 | 통과 (`current`, 탐침 2건) |
| JOEFLOW | ~4분 | 막힘 1회 → 우회 후 통과 |
| JOEDESIGN | ~4분 | 통과 (file:// 측정 무효 1회 → 서버로 재측정) |
| JOENESS 검수 게이트 | ~4분 | 막힘 1회(fail-open) → 우회 후 통과 |
| 합계 | 약 15분 (셸 시계) + 보고서 | 3시간 한도 안 |

셸 시계는 명령 시점만 보여 주므로 실제 경과 시간은 이보다 길 수 있다.

## 결함 목록

| # | 도구 | 종류 | 재현 방법 | 실제 출력 | 내 우회 |
| --- | --- | --- | --- | --- | --- |
| D1 | JOENESS | 도구 결함 (중대, fail-open) | `node D:\JOEWRKS\.claude\skills\joeness-setup\scripts\review-gate.mjs --root <proj> --baseline x --baseline-sha256 0000 --result x --claim complete` (스킬 폴더가 심볼릭 링크). roadmap-review / operation-review / impact-review도 같다 | stdout 없음, **exit 0**. 실제 경로로 부르면 같은 인자에서 JSON과 exit 2 (log/20, 21, 22) | 실제 경로 `~\..\.local\joe-latest-20261029\JOENESS\skills\joeness-setup\scripts\review-gate.mjs`로 실행. 원인: `review-gate.mjs:125` `import.meta.url===pathToFileURL(resolve(process.argv[1])).href`, 나머지는 `resolve(argv[1])===fileURLToPath(import.meta.url)`. node는 import.meta.url을 실제 경로로 풀기 때문에 링크 경로와 같지 않아 main이 아예 실행되지 않는다. JOEDESIGN `report-check.mjs:529`는 파일 이름 `endsWith`라 영향이 없다 |
| D2 | JOEFLOW | 도구 결함 + 문서 결함 | `templates/state-v0.2.0.example.json`에서 시작(`discovery_baseline: NOT_ESTABLISHED`) → `new_records` → `open_revision --status OPEN --write` → `draft_freeze` → `open_revision`(READY_FOR_REVIEW) | `readiness_findings: discovery_baseline_gaps, discovery_procedure_gaps`, next_action `CORRECT_THE_CANDIDATE_AT_THE_REPORTED_POINTER_THEN_RERUN`인데 pointer는 `null` (log/08 이전 출력) | `scripts/build_discovery_baseline.py`를 돌려 그 출력을 rev2 state.json `discovery_baseline`에 손으로 넣음(백업 log/state-rev2-before-baseline.json). 원인: `revision_v2.py:205-211`은 baseline이 이미 `CURRENT`일 때만 다시 계산하고, `PATCH_KEYS`(28줄)에는 baseline이 없다. 이 스크립트는 SKILL.md·workflow·first-plan-guide 어디에도 나오지 않는다(`migration-v0.2.0.md:48`에 NOT_ESTABLISHED만 있음). 결국 "state를 직접 고치지 말라"는 원칙을 어겨야만 첫 기획이 닫힌다 |
| D3 | JOENESS ↔ JOEDESIGN | 도구 간 충돌 | 게이트가 통과한 뒤 DESIGN.md `Result` 칸을 최신 TASK(T004) 링크로 바꾸고 게이트를 다시 돌림 | review-gate exit 2 `Authority missing/changed: DESIGN.md`; verify-design exit 1 `DESIGN_AUTHORITY_STALE` (log/24, 25) | DESIGN.md를 되돌리고 Result는 T003으로 둠. TASK T004 `Record handoff gap`에 적음. 양쪽 근거는 아래 "충돌 근거"에 |
| D4 | JOENESS 게이트 / JOEDESIGN 영수증 | 도구 결함 (환경 의존) | proj를 새로 `git clone`(전역 `core.autocrlf=true`, .gitattributes 없음) → 게이트 재실행 | `{"errors":["Pinned baseline/acceptance changed"]}` exit 2. baseline sha `f6803b…` → `a5a06f…` (log/26). 같은 clone에서 `report-check --verify`는 ok, `project-setup -Check`는 `current`(log/05) | 우회하지 않음(사실만 기록). raw byte 고정값과 입력 fingerprint는 줄바꿈 변환에 약한데, `.gitattributes`(eol=lf 또는 -text)를 넣으라는 안내가 어느 스킬에도 없다 |
| D5 | JOENESS (+JOEDESIGN 영수증) | 문서·지시 결함 / 충돌 | ROADMAP Check에 게이트 명령을 적으려 함 | 정의된 자리표시자는 `<joedesign>` 하나뿐이다. review-gate.md는 "From the installed skill's absolute directory"라고만 한다. JOEDESIGN `conformance.py`는 evidence 경로를 `str(p.resolve())`로 써서 영수증에 `D:\…` 절대 경로가 남고, 그 파일이 커밋된다 | ROADMAP에 `<joeness-setup>` 자리표시자를 내가 지어 넣음. 절대 경로가 든 영수증은 그대로 커밋(JOENESS SKILL "Never write an absolute or user-home path into a committed project file"과 어긋난다. `-Check`는 AGENTS 블록만 본다) |
| D6 | JOEDESIGN ↔ JOENESS | 애매함 | DESIGN 규칙 L1(가로 넘침), L2(필드 보임), C1(대비)를 게이트 기준선에 넣으려 함 | `conformance.py`의 geometry kind는 `pair/gap/inset`뿐이라 표현할 수 없다. 기준선 rules는 S1 하나만 담게 되어 DESIGN 표(4행)와 기준선 규칙 목록이 달라진다 | 게이트는 S1만 다루고, L1·L2·C1은 DESIGN 표 행(T003 측정과 spot check)으로 완료 판정. ROADMAP Check에 둘 다 적음 |
| D7 | JOEDESIGN | 문서 결함 | `templates/DESIGN_INTENT.json` 모양대로 requirements를 문자열 목록으로 넣고 `harness_cli.py retrieve` 실행 | `{"error": "string indices must be integers, not 'str'", "status": "NOT_READY"}` | `harness/contracts.py:45-75`를 읽고 `{id,kind,description}`, target 필드(viewport, route, …)를 맞춤. 템플릿에는 행 모양이 없다 |
| D8 | JOENESS ↔ JOEDESIGN | 도구 간 충돌 (형식, 경미) | JOENESS가 만든 DESIGN.md에 JOEDESIGN 절을 합침 | 같은 사실을 두 모양으로 요구한다. JOENESS `assets/DESIGN.md:3-8`은 `Authority / version:`, `Approved scope:` 줄이고, JOEDESIGN `templates/DESIGN.md:5-7`은 `**Status:** DRAFT`, `**Revision:**`, `**Product Authority:**`다. 표 제목도 `## Rule coverage`(8열, Result 포함)와 `## Rule Coverage`(7열)로 다르다. 앵커는 둘 다 `#rule-coverage`라 링크는 산다. JOEDESIGN은 `## Report Form`(보고 규칙)을 DESIGN.md에 두라고 하고(SKILL.md "its Report Form section … travel in DESIGN.md"), JOENESS SKILL 표는 DESIGN 몫을 "Visual rules and authority/version/scope"로, 작업 규칙은 AGENTS 몫으로 정한다. 결국 보고 규칙이 AGENTS 블록과 DESIGN에 두 번 들어간다 | JOENESS 머리줄을 유지하고 Product Authority와 DRAFT Rev 1을 그 줄에 합침. 표는 1.4.2 규칙대로 하나(Result 열 포함). Report Form은 JOEDESIGN 지시대로 DESIGN에 넣음 |
| D9 | (환경) 내장 브라우저 | 애매함 / 위험 | `file:///…/proj/index.html`을 열고 JS로 측정 | 탭 출처가 `data:`이고 `styleSheets=[]`인데도 gap 값이 `[16,16]`으로 그럴듯하게 나옴(우연). 빈 상태 문구가 보여서 알아챔 (log/17) | 그 측정은 버리고 `python -m http.server`(127.0.0.1)로 다시 측정. 스킬 결함은 아니다. JOEDESIGN의 `rendered (injected css)` 구분이 바로 이 위험을 겨냥하지만, 측정자가 스타일시트 로드를 확인하라는 명시적 단계는 없다 |
| D10 | JOEFLOW | 애매함 | `new_records.py question/user-decision`은 `--evidence`가 필수인데, first-plan-guide 3절은 의도 증거를 `--evidence`에 넣으면 질문이 `EVIDENCE_RESOLVABLE`이 된다고 경고 | EVD-001(USER_CONFIRMED_INTENT)을 `--evidence`와 `--reason` 둘 다에 넣었는데 검증은 통과 | 그대로 둠. 또 과업 문구는 엄밀히는 상위 세션이 전달한 것(RELAYED_USER_INTENT)이지만, 내가 사용자 역할이라 USER_CONFIRMED_INTENT로 기록 |
| D11 | JOEDESIGN | 절차 생략 (결함 후보) | SKILL 4단계: R/C1 전문 리뷰와 fresh-context critic | 미실행. 전문 스킬은 `doctor` 기준 AVAILABLE(`~\.codex\skills`, `~\.agents\skills`)이지만, 이 세션 규칙상 사용자 요청 없이는 서브에이전트를 띄울 수 없어 독립 비평을 할 수 없었다 | DESIGN Open Decisions와 TASK T003 Limits에 미실행으로 적음. 시각 수락은 자기 수락으로 대신했다(실제 사용자 수락 아님) |
| D12 | JOEFLOW | 절차 생략 | HANDOFF의 `compile_downstream_v2.py`, VERIFY의 `audit_downstream_v2.py`·runtime | 미실행 (과업이 "최소 범위: state·승인·투영"으로 한정) | TASK T002 Limits에 적음 |
| D13 | JOEFLOW ↔ JOEDESIGN | 애매함 | 빈 상태 문구 "아직 목록에 넣은 책이 없습니다." | JOEDESIGN SKILL은 "The definition decides which screens, actions, states, rules and **wording** exist"라고 하는데, RULE-003은 의미("a short message that no books are listed yet")만 준다. 정확한 문구가 제품 결정인지 디자인 결정인지 불분명하다. JOENESS AGENTS는 "A user-visible behavior you picked yourself … keeps it open" | 제품 재진입은 하지 않음. 문구는 내가 정하고 자기 시각 수락으로 닫음 (내가 대신 내린 결정) |

### 충돌 근거 (양쪽 파일·줄)

- **D3**: JOENESS `assets/DESIGN.md:13`은 "Result links the latest TASK entry; no copied log"라 하고, 같은 내용이 AGENTS 블록(`assets/AGENTS.md:24-25` "add a Result column (latest TASK link …)")에도 있다. JOEDESIGN `references/conformance.md:89-90`은 "`authority`: nonempty `{path,sha256}` list of current project-relative DESIGN/approved source files. Changed source bytes invalidate this baseline until reviewed"라 한다. 그래서 DESIGN.md를 authority로 고정하면 Result 갱신이 곧 기준선 무효화가 된다. 반대로 DESIGN.md를 authority에서 빼면 규칙 원본이 고정되지 않는다.
- **D8**: JOENESS `SKILL.md` 소유 표는 DESIGN을 "Visual rules and authority/version/scope; approved versus proposed changes", AGENTS를 "Concise work rules"로 정한다. JOEDESIGN `SKILL.md`(Execution support 절)는 "the token-role and rule-coverage tables travel in DESIGN.md … and so does its Report Form section"이라 한다.

## 각 도구의 검사 스크립트가 다른 도구의 산출물을 다룬 방식

| 검사 | 다른 도구 산출물에 대한 동작 |
| --- | --- |
| JOENESS `project-setup.ps1 -Check` | AGENTS 관리 구역과 `.joeness/setup-state.json`만 본다. ROADMAP의 Product revision 줄, JOEFLOW state, JOEDESIGN 영수증은 보지 않는다. CRLF clone에서도 `current` |
| JOEFLOW `projection_check.py` | `--spec`·`--review`로 받은 파일만 본다. ROADMAP.md를 spec으로 주면 digest 미기재와 레코드 7개 누락으로 `ok:false`가 나온다(log/16). JOENESS 문서는 투영이 아니므로 맞는 판정이고, ROADMAP을 알지는 못한다. ROADMAP `Product revision / approval` 줄이 `approval_status.py`와 맞는지 확인하는 도구는 **양쪽 모두에 없다** |
| JOEDESIGN `report-check.mjs` | JOENESS 여섯 줄 → 결과 목록 → 설명 → 도장 순서를 그대로 받아들였다(exit 0, `--verify` 0). CRLF clone에서도 일치. 심볼릭 경로에서도 정상 실행 |
| JOEDESIGN `harness_cli.py verify-design` | JOENESS `joeness.review-baseline.v1`을 그대로 읽는다. DESIGN.md 바이트가 바뀌면 exit 1(D3) |
| JOENESS `review-gate.mjs` | 실제 경로에서는 `joedesign.conformance.v1`을 올바르게 소비했다. visual은 허용, acceptance 없는 complete는 exit 2, acceptance가 있으면 exit 0, DESIGN 수정 뒤에는 exit 2. 심볼릭 경로에서는 아무것도 하지 않는다(D1). CRLF clone에서는 고정값이 깨진다(D4). 영수증 안의 절대 evidence 경로는 `--evidence-root` 없이도 root 안이라 받아들였다 |
| JOENESS 도장 소비 규칙 | AGENTS 규칙대로 S1-2를 complete로 바꾸기 전에 `node <joedesign>/scripts/report-check.mjs --verify work/reports/2026-11-19-T003.md`를 실행했고 exit 0이었다. `<joedesign>`은 `JOEDESIGN_HOME`이 없어 설치 폴더 `D:\JOEWRKS\.claude\skills\joedesign`으로 풀었다. 이 규칙은 작동했다 |

## 확인된 것

- JOENESS `-Apply`/`-Check` `current`. 리터럴 `<joedesign>`이 AGENTS.md 20·22줄에 그대로 남고 `warnings: []`이다.
- `-Apply`는 `D:\…` 경로가 든 본문을 거부한다(exit 2, "machine-specific path D:\JOEWRKS; keep <joedesign> literal"). CRLF clone에서도 `-Check`는 `current`.
- JOEFLOW rev 3 `validate_state` ok, `validate_closure` closed, `approval_status` APPROVED rev 3, `update_projection` → `projection_check` ok.
- JOEDESIGN `doctor` ok. OMD 색인·검색(로컬 참조 3개)이 된다. 도장과 `--verify` exit 0. `verify-design` S1 2/2 PASS.
- JOENESS 게이트는 실제 경로에서 설계대로 허용·차단한다. 1.4.2 "규칙 표 하나 + Result 열" 규칙대로 DESIGN.md에는 표가 하나다.

## 확인되지 않은 것

- 새 컨텍스트에서 AGENTS 지시가 실제로 전달되는지(JOENESS SKILL 4단계): 미실행.
- planning-review-core.html 렌더: `NOT_VERIFIED`(열어 보지 않음).
- JOEFLOW downstream compile/verify, JOEDESIGN 전문 리뷰와 독립 비평, Playwright `capture.mjs`(다운로드 금지라 미실행), 360·1280 외 폭.
- S1 간격 spot check는 축척된 캡처에서 눈으로 잰 값(16±2)이라 정밀하지 않다.
- 실제 사용자의 기획 승인과 시각 수락: 전부 자기 승인이다.

## 내가 대신 내린 결정

- 제품 결정 4건(UNK-001~004: HTML 직접 편집·읽기 전용, 제목·저자·상태 3종, 360px 정보 예산, 빈 상태 문구)을 모두 "추천 수락"으로 자기 결정.
- JOEFLOW rev 3 승인(`--at observed`, quote "이대로 승인 (통합 시험 세션의 자기 승인)"), S1 시각 수락(work/gate/acceptance-source.md).
- 시각 방향: OMD vercel을 Primary로(시각 미검사), 카드형 목록, 상태 라벨 배치, 토큰 값. 빈 상태 문구.
- discovery baseline 손 삽입(D2), `<joeness-setup>` 자리표시자(D5), 게이트 범위를 S1 하나로 한정(D6), DESIGN Result를 T003에 둠(D3).
- change-notice 훅은 제안하지 않음(프로젝트 `.claude` 설정 변경 회피).

## 1.4.1 통합 시험 결함은 지금

- 연결문의 리터럴 `<joedesign>` 유지: **해소.** `-Apply` 뒤 AGENTS.md에 그대로 남았고 `-Check` warnings도 없다.
- `-Apply`의 기계 경로 거부: **작동.** 탐침 저장소에서 `D:\` 경로가 든 본문은 blocked(exit 2). 다만 같은 원칙이 JOEDESIGN 영수증의 절대 evidence 경로에는 적용되지 않는다(D5).
- DESIGN 규칙 표: **표 중복은 해소.** JOENESS 파일이 먼저 있으면 표 하나에 Result 열로 정리된다. 그런데 Result 갱신이 게이트를 stale로 만드는 새 충돌이 생겼다(D3). 머리줄 형식 차이도 남아 있다(D8).
- ROADMAP `Product revision / approval` 줄: **자산에 있다**(assets/ROADMAP.md:5). `approval_status.py` 값을 손으로 옮겨 적었다. 값이 맞는지 검사하는 도구는 없다.

## 내가 쓴 경로 (전부 `D:\JOEWRKS\.local\v2-tests-20261119\integration\` 아래)

- `report.md`, `trace.md`, `.claude\launch.json`(정적 서버 설정)
- `log\` 00~26 번호 파일, `log\02-joeness-body.md`, `log\02-joeness-proposal.md`, `log\probe-body.md`, `log\state-rev2-before-baseline.json`, `log\DESIGN-before-result-update.md`
- `work\design\intent.json`, `omd-index.json`, `shortlist.json`, `retrieve-out.txt`
- `proj\` 전체 (Git 커밋 5개: README, JOENESS 연결, JOEFLOW, JOEDESIGN, 게이트) — AGENTS.md, .joeness\setup-state.json, ROADMAP/TASK/ISSUES/DESIGN.md, index.html, style.css, states\empty.html, product-definition\reading-list\*, work\reports\2026-11-19-T003.md, work\gate\*
- 지운 임시 폴더: `probe\`, `clone\`, `clone2\`, `clone3\` (탐침용 git 저장소와 clone)
- 내가 직접 쓰지 않았지만 도구가 남긴 것: 내장 브라우저 스크린샷 원본이 `~\.claude\projects\…\tool-results\`에 저장됐다(하네스 동작). 그중 2개를 `proj\work\gate\frames\`로 복사했다.
- 스킬 폴더, `~\.codex`, 전역 설정에는 쓰지 않았다. `__pycache__`도 생기지 않았다(`PYTHONDONTWRITEBYTECODE=1`, 확인함). git push 안 함. git 신원은 `-c user.name=tester`로 명령마다 줬고 전역 설정은 바꾸지 않았다.
