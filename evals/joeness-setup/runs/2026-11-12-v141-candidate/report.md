# JOENESS 1.4.1 후보 — 통합 시험 결함 3건 (2026-11-12)

결론: 2026-11-12 JOEFLOW 1.7.0 통합 시험에서 나온 JOENESS 결함 3건을 각각 고쳐 커밋했고, 전체 테스트는 1.4.0 기준(104/104 통과)과 같이 실패 0(106/106)이다. 버전은 1.4.0 그대로이며 push·태그·Release·개인 설치는 하지 않았다.

원문: JOEFLOW `evals/2026-11-12-friction-170/report.md` "JOENESS 이슈 목록" 1~3.

## 결함별 전/후

| # | 결함 | 1.4.0 (전) | 1.4.1 후보 (후) | 커밋 |
| --- | --- | --- | --- | --- |
| 1 | 연결 본문 `<joedesign>` 자리 | `node <joedesign>/scripts/report-check.mjs` 만 있고 경로를 정하는 안내 없음. 시험자가 절대 경로로 바꿔 AGENTS.md에 커밋함. `-Apply`는 어떤 경로든 받음 | 연결 본문·SKILL.md·review-gate.md: `<joedesign>`은 커밋 파일에 글자 그대로 두고 실행할 때 `JOEDESIGN_HOME`(있으면), 아니면 설치된 joedesign 스킬 폴더로 푼다. `project-setup.ps1 -Apply`는 드라이브 문자·UNC·`/Users/`·`/home/` 경로가 든 본문을 막고(`blocked`, 아무 파일도 안 씀), `-Check`는 이미 적용된 블록의 그런 경로를 `warnings`에 적는다(상태는 `current` 유지) | `5083183` |
| 2 | DESIGN 템플릿 둘, 규칙 표 없음 | JOENESS `assets/DESIGN.md` 8줄, 표 없음. 연결 본문과 ROADMAP Check 예시는 `DESIGN.md#rule-coverage` 행을 요구함 | `## Rule coverage` 표 추가: JOEDESIGN Rule Coverage와 같은 앞 7열(Rule, Check, Spot check, Layouts, Sizes, States, Unmeasured) + `Result`(TASK 링크). DESIGN.md·SKILL.md에 "DESIGN.md 하나, 규칙 표 하나: JOEDESIGN 템플릿을 이미 쓰면 그 Rule Coverage 표에 Result 열을 더해 쓴다" | `ba846f3` |
| 3 | ROADMAP `Product authority`에 revision·승인 칸 없음 | `Product authority: <existing source/section, or undecided>.` 한 줄 | 바로 아래 `Product revision / approval:` 줄: 제품 원본이 보고하는 revision·승인 상태와 읽은 날짜(JOEFLOW면 `approval_status.py`의 `definition_revision`, `approval_status`, `approved_revision`), 원본에 revision 기록이 없으면 `none`. SKILL.md: JOENESS는 읽은 값을 적을 뿐, 승인은 제품 원본이 소유 | `1f30739` |

크기: 연결 본문(`assets/AGENTS.md`) 4,946바이트·793단어 → 5,148바이트·823단어(2줄). DESIGN 템플릿 8 → 19줄. ROADMAP 템플릿 +1줄.
매 커밋에서 `vendor/source-manifest.json`의 파일 해시를 다시 계산했다(버전 문자열 1.4.0 유지). 스킬 파일 목록(19개)은 그대로.

## 테스트 결과

| 대상 | 1.4.0 (`7daed3c`, 별도 worktree) | 1.4.1 후보 |
| --- | --- | --- |
| `joeness-release.tests.ps1` | exit 0 | exit 0 |
| `joeness-install.tests.ps1` | exit 0 | exit 0 |
| `joeness-project-setup.tests.ps1` (Windows PowerShell 5.1) | exit 0, 27 cases | exit 0, 28 cases (새 `MachinePathsStayOutOfCommittedConnection`) |
| `node --test tests/*.tests.mjs` | 104 통과 / 0 실패 | 106 통과 / 0 실패 (새 2건: 규칙 표, `<joedesign>` 자리; ROADMAP 템플릿 테스트에 revision 줄 검사 추가) |

실패 목록: 기준·후보 모두 비어 있음. 새 실패 없음.

임시 git 저장소(작업 폴더 밖 scratch, 실제 프로젝트 아님)에서 확인한 실제 결과:
- [fix1-scratch.txt](fix1-scratch.txt): 연결 본문의 `<joedesign>`을 `E:\tools\skills\joedesign`으로 바꾼 본문 → `-Check ready` → `-Apply blocked`(경로 명시), AGENTS.md 생성 안 됨. 배포 본문 그대로 → `-Apply current`, 재 `-Check current warnings 0`, AGENTS.md 20~24행에 `<joedesign>` 글자 그대로.
- [fix23-scratch.txt](fix23-scratch.txt): 위 저장소에 DESIGN/ROADMAP 템플릿을 넣고 커밋 → `-Check current`, DESIGN에 `## Rule coverage`(10행)와 8열 표 머리, ROADMAP의 `DESIGN.md#rule-coverage` 참조가 그 제목과 맞음, ROADMAP 4~5행에 Product authority와 revision/approval 줄, 커밋된 파일에 기계 경로 없음.
- 실행 스크립트: [scratch-fix1.ps1](scratch-fix1.ps1), [scratch-fix23.sh](scratch-fix23.sh).

## 확인된 것 / 확인되지 않은 것

확인된 것
- 세 수정이 각각 별도 커밋이고, 각 커밋 뒤 전체 테스트가 실패 0.
- `-Apply`가 기계 경로가 든 본문을 막고 아무것도 쓰지 않음, 배포 본문은 그대로 적용됨, 옛 블록의 기계 경로는 `-Check`가 경고만 하고 `current`를 유지함(테스트·scratch).
- JOENESS DESIGN 표의 앞 7열이 JOEDESIGN `skills/joedesign/templates/DESIGN.md` Rule Coverage 표 머리와 같음(읽기만, 수정 안 함).
- `approval_status.py`가 `definition_revision`, `approval_status`, `approved_revision` 키를 내놓음(JOEFLOW 소스 코드에서 확인).

확인되지 않은 것
- 에이전트가 새 문구만 보고 실제로 `<joedesign>`을 풀어 쓰는지, JOEDESIGN 템플릿을 쓰는 프로젝트에서 표를 하나로 합치는지, ROADMAP에 revision을 채우는지(행동 A/B 없음, 유료 실행 0회).
- `approval_status.py`를 실제 state에 돌린 출력으로 ROADMAP 줄을 채워 보지 않음.
- `pwsh`(PowerShell 7)로 project-setup 테스트를 돌리지 않음(이 기계에 없음; CI는 두 셸 모두 실행).
- 기계 경로 탐지는 드라이브 문자·UNC·`/Users/`·`/home/`만 잡음. `~/...`·상대 경로·환경 변수 확장 결과는 잡지 않음.
- Windows CI, 개인 설치, 기존 프로젝트(예: AI 오목) 연결 갱신 — 모두 하지 않음. 기존 연결은 자동 갱신되지 않으며 `-Check`가 경고를 낼 수 있음.

## 사용자 대신 정한 것

- 경로 방식: 설정 파일(`.joeness.json`)을 새로 두지 않고 "자리 표시를 글자 그대로 두고 실행할 때 푼다"(후보 b의 변형). 새 파일·새 스키마 없이 막을 수 있고, `-Apply`가 절대 경로를 거부해 커밋을 막는다.
- `-Check`는 막지 않고 경고만: 기존 연결이 갑자기 `blocked`가 되지 않게.
- 규칙 표의 결과 열은 결과 자체가 아니라 TASK 링크(DESIGN은 실행 결과를 담지 않는다는 기존 소유 규칙 유지).
- JOEFLOW를 안 쓰면 칸을 빈칸이 아니라 `none`으로(다른 템플릿 칸과 같은 방식, 빠뜨림과 구별).

## 게시 전에 남은 일 (승인 필요)

버전 올리기(manifest·installer·README·테스트 pin 1.4.1), push, Windows CI, 태그 `JOENESS-v1.4.1`·Release, Codex 개인 설치·Claude Code 클론 갱신.
