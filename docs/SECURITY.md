# JOENESS 보안 검토

결론: 현재 트리와 Git 이력 전체에서 진짜 비밀값은 찾지 못했다. 의존성 패키지도 없다. 남은 위험은 두 가지다. 하나는 옛 기록과 Git 이력, 커밋 메타데이터에 남은 개인 식별자다. 다른 하나는 `changes-hook.mjs`가 커밋 메시지를 에이전트 문맥에 넣는다는 점이다. 이력은 다시 쓰지 않는다.

기준: 2026-11-19, JOENESS 2.0.0 후보. 상세 근거는 [사전 조사](../evals/v2-survey-20261119/report.md) §3과 [2.0 기록](../evals/v2-release-20261119/report.md)에 있다.

## 확인한 것과 결과

| 대상 | 방법 | 결과 |
|---|---|---|
| 비밀값 (현재 트리) | 정규식 검색: private key 헤더, `AKIA`, `ghp_`/`github_pat_`, `sk-`, `xox`, `AIza`, password/secret/token 대입, Bearer | 진짜 비밀값 0건. 걸린 것은 작업 ID 안의 `sk-` 부분 일치 같은 오탐뿐이다. |
| 비밀값 (Git 이력 745커밋) | 같은 패턴으로 `git log --all -p` 검색 | 0.1 시절 수집기 테스트의 합성 canary(`sk-proj-SYNTHETIC_TEST_ONLY_…` 등)만 나왔다. 이 파일들은 지금 트리에 없다. |
| 비밀값 파일 | 이력에 나온 경로 전체에서 `.env`, `*.pem`, `*.key`, `*.pfx`, `id_rsa`, `credentials` 검색 | 0건 |
| 개인 식별자 (현재 트리) | Windows 사용자 이름, `C:/Users`, `C:\Users`, `AppData`, gmail 주소 검색 | 기록 밖 파일(스킬, 설치기, README, AGENTS, docs, tests)에는 0건이다. 2.0에서 가릴 수 있는 곳은 `~`로 가렸다. 남은 것은 아래 "남은 것"에 적었다. 본문에 gmail 주소는 0건이다. |
| 스크립트의 입력과 쓰기 위치 | 코드 읽기, `iex`·`eval`·다운로드·셸 문자열 보간 검색 | 아래 "스크립트 신뢰 경계" 참고. 기록 밖 추적 파일에서 `Invoke-Expression`, `iex`, `eval(`, `new Function`, `Invoke-WebRequest`, `curl`, `wget`은 0건이다. |
| CI (`.github/workflows/windows-ci.yml`) | 파일 읽기 | `permissions: contents: read`, secrets 사용 없음, `actions/checkout`은 commit SHA로 고정, `persist-credentials: false`, `pull_request_target` 없음, 이벤트 값은 `env:`로만 넘김. |
| 의존성 | `package.json`·lockfile 검색 | 실행 경로에는 `package.json`이 없다. evals 시험 fixture에 있는 4개는 dependencies가 비어 있다. 실행에 필요한 것은 Node 18+ 내장 모듈과 Windows PowerShell뿐이다. |

검색은 정규식 기반이다. 엔트로피 검사 도구(gitleaks 등)는 쓰지 않았다. png와 git bundle 바이너리 안은 보지 않았다.

## 남은 것

| 항목 | 규모 (2.0 후보 트리 기준) | 남기는 이유 |
|---|---|---|
| 옛 evals 기록 안의 홈 경로 | Windows 사용자 이름 207개 파일 2,305회, `C:/Users` 90개 파일 652회, `AppData` 157개 파일 1,342회 | 대부분 2026-11-03 이전 run의 측정 출력이다. 출력을 고치면 기록된 측정값이 바뀌므로 가리지 않았다. `evals/experiments`는 테스트가 내용을 고정한다. |
| Git 이력 안의 같은 경로 | 사용자 이름이 들어간 diff 줄 1만 회 이상, 약 90커밋 | 이력을 다시 쓰면 태그와 Release가 가리키는 커밋이 바뀐다. 저장소 규칙이 history purge를 금지한다. |
| 커밋 작성자 메타데이터 | gmail 주소 739커밋, 실명 96커밋 | 위와 같은 이유로 이력을 다시 쓰지 않는다. 이 저장소를 공개하면 작성자 정보도 함께 공개된다. |

## 스크립트 신뢰 경계

| 스크립트 | 읽는 것 | 쓰는 곳 | 주의 |
|---|---|---|---|
| `JOENESS.ps1` | 인자 | 직접 쓰지 않음. 인자를 모두 `scripts/sync-harness.ps1`에 넘긴다. | — |
| `scripts/sync-harness.ps1` | `-Check`/`-Apply`/`-Remove`, `-CodexHome`, `CODEX_HOME`, `vendor/source-manifest.json` | `-CodexHome` → `CODEX_HOME` → `~/.codex` 순서로 정한 폴더 아래의 `skills/joeness-setup/**`(manifest에 적힌 19개 경로만)와 `joeness-skills-state.json`만 쓴다. `AGENTS.md`는 읽기만 한다. | `-CodexHome`이나 `CODEX_HOME`을 주면 그 폴더에 쓴다(의도된 동작). reparse point를 막고, 쓰기 전후에 해시를 다시 검사하고, 실패하면 되돌린다. 버전이나 해시가 다른 설치본은 `blocked`로 멈춘다. |
| `skills/joeness-setup/scripts/project-setup.ps1` | `-ProjectPath`(`git rev-parse --show-toplevel`로 루트를 정함), 해시 인자, body | 그 Git 루트의 `AGENTS.md`와 `.joeness/setup-state.json`만 쓴다. | `AGENTS.override.md`가 있으면 멈춘다. body 안의 marker, NUL, 기계 경로를 거부한다. 쓰기 직전에 해시를 다시 대조한다. |
| `skills/joeness-setup/scripts/changes-hook.mjs` (선택, Claude Code hook) | 프로젝트의 Git 이력 | 프로젝트 `.git/joeness-last-head` 한 파일 | 다른 사람이나 다른 세션이 쓴 **커밋 메시지가 에이전트 문맥에 그대로 들어간다.** 신뢰하지 않는 사람이 커밋할 수 있는 저장소에서는 켜지 않는 것이 좋다. `git`은 셸을 거치지 않고 인자 배열로 호출한다. |
| `review-gate.mjs`, `impact-review.mjs`, `roadmap-review.mjs`, `operation-review.mjs` | 지정한 파일과 JSON | 쓰지 않음 | 읽는 도중 파일이 바뀌면 해시로 감지한다. |

## 문제 신고

보안 문제는 공개 이슈에 비밀값이나 개인 경로를 적지 말고, GitHub 저장소 `JOEWRKS/JOENESS`의 Security 탭(private vulnerability report)이 열려 있으면 그곳으로, 아니면 이슈에 "보안 문의"라고만 적어 연락 방법을 요청한다. 재현에 필요한 명령과 JOENESS 버전(`vendor/source-manifest.json`의 `release.version`)을 함께 적는다.
