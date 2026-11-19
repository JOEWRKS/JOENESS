# JOENESS 2.0.0 후보 준비 기록 (2026-11-19)

기준: `main` @ `97a1a10`(1.4.2 + 사전 조사). 표기: 홈 경로 → `~`, Windows 사용자 이름 → `<user>`. 푸시·태그·Release·개인 설치는 하지 않았다(부모 세션이 사용자 승인 뒤 진행).

## 결론

- **게이트 통과.** 스킬 폴더 트리 해시는 전후 모두 `73af9e5e1e55def3e56cfaf11d2657d7ad7a944d`(= `JOENESS-v1.4.2:skills/joeness-setup`)다. manifest는 `release.version` 1.4.2 → 2.0.0 한 곳만 바뀌었다. 최종 작업 트리에서 Node 106/106, PowerShell 5.1 release·install·project-setup(28 cases) 모두 종료 0이다. PowerShell 7은 이 기계에 없어 돌리지 못했다.
- 커밋 3개: `e7f39d6`(정리·가림), `d332846`(SECURITY.md), 그리고 이 기록이 든 문서·버전 커밋.
- 1.4.2 개인 설치본은 2.0.0 패키지에서 `blocked`가 된다. 1.4.2 패키지로 `-Remove` → 2.0.0 `-Apply`가 필요하다([빠른 시작 6절](../../docs/QUICKSTART.md)). 연결된 프로젝트는 연결문이 같아서 갱신할 것이 없다.

## 게이트

| 항목 | 전 (`97a1a10`) | 후 (이 커밋) |
|---|---|---|
| `git rev-parse HEAD:skills/joeness-setup` | `73af9e5e…a7944d` | `73af9e5e…a7944d` (`JOENESS-v1.4.2`와 같음) |
| manifest | `release.version` 1.4.2 | 2.0.0. 나머지 JSON은 파싱 비교로 완전히 같음(파일 19개, 해시 불변) |
| 스킬 밖 실행 경로 diff (`JOENESS-v1.4.2` 대비) | — | `scripts/sync-harness.ps1` 1줄(`$script:JoenessRelease`), manifest 1줄. `JOENESS.ps1` 불변 |
| Node (`node --test tests/*.tests.mjs`) | 106/106 | 106/106 |
| PowerShell 5.1 release / install / project-setup | 종료 0 / 0 / 0 (28 cases) | 종료 0 / 0 / 0 (28 cases) |
| PowerShell 7 (`pwsh`) | 이 기계에 없음 | 돌리지 못함 |
| `git status` | 깨끗함 | 커밋 뒤 깨끗함 |

테스트 수정은 버전 문자열 두 곳뿐이다(`tests/joeness-setup-contract.tests.mjs:63`, `tests/joeness-release.tests.ps1:107`). README 문구를 고정한 테스트는 첫 줄 `# JOENESS <version>`뿐이라 README 축약으로 고칠 테스트는 없었다.

## 바꾼 것

### A. 정리

- 삭제 4개(보관 이동 아님): `docs/superpowers/plans/2026-09-26-joeness-0.2-project-setup.md`, `docs/superpowers/specs/2026-09-26-joeness-0.2-project-setup-design.md`, `docs/superpowers/plans/2026-09-29-joeness-setup-only-distribution.md`, `docs/superpowers/specs/2026-09-29-joeness-setup-only-distribution-design.md`. 삭제 뒤 이 이름을 가리키는 파일은 사전 조사 보고서 말고 0개다. 이력에는 남는다.
- 가림 7개 파일 15곳: 1.1.0·1.1.1·1.2.0·1.3.0 release 폴더의 `install-and-check.mjs` 각 3곳(`C:/Users/<user>/` → `~/`), `2026-10-30-followup-hook-ab/cli-ab.py`·`cli-check.py`·`cli-selfcommit.py` 각 1곳(`C:\Users\<user>\` → `~\`). 이 파일들의 해시를 고정한 곳은 없고(전체 트리에서 sha256 검색 0건), 측정 출력이 아니라 구동 스크립트다. 가린 뒤에는 그대로 다시 실행할 수 없다(`~`는 Node·Python이 풀지 않으므로 경로 검사에서 멈춘다).
- 그 밖의 evals는 지우거나 옮기지 않았다.

식별자 수(트리, `git grep -c -i -F`, 파일 수 / 횟수):

| 문자열 | 전 | 후 |
|---|---|---|
| Windows 사용자 이름 | 216 / 2,324 | 207 / 2,305 |
| `C:/Users` | 94 / 664 | 90 / 652 |
| `C:\Users` (백슬래시 1개) | 15 / 22 | 10 / 15 |
| `AppData` | 157 / 1,342 | 157 / 1,342 |

사전 조사의 수(2,495회 등)와 다른 것은 세는 방법(대소문자, JSON escape 포함 여부)이 달라서다. 같은 방법으로 잰 전후 차이가 이번 변경분이다. `AppData`가 줄지 않은 것은 가린 경로가 `~\AppData\…`로 남기 때문이다(사용자 이름은 빠짐).

### B. 보안 문서

`docs/SECURITY.md`(41줄). 루트 이름 13개를 고정한 테스트 때문에 루트가 아니라 `docs/`에 두고 README에서 링크했다. 비밀값 재검사: 현재 트리에서 private key·AKIA·GitHub token·`sk-`(20자 이상)·`xox`·`AIza` 패턴 결과는 작업 ID 안의 `sk-5-phase-a-…` 오탐 10건과 사전 조사 보고서의 인용뿐이다. 커밋 메타데이터: gmail 주소 739커밋, 실명 작성자 96커밋, 이력 745커밋.

### C. 문서와 버전

- README: 233줄·1,315단어 → 139줄·719단어. 첫 줄 `# JOENESS 2.0.0`, 영어·한국어 유지. 버전 이력 단락 → CHANGELOG 링크, Key Features 표 → `usage.md#문서-구조와-책임` 링크, `review-gate.md` 링크·Limitations 유지, QUICKSTART·SECURITY 링크 추가. 설치 표는 Quickstart로 넘기고 `blocked`가 버전 업그레이드에서도 나온다고 적었다.
- `docs/QUICKSTART.md`(98줄): Codex 설치, Claude Code 클론 + junction, 프로젝트 연결, 첫 사용, 상태 확인(설치본 경로 포함), 업그레이드, 연결 해제, 제거.
- `docs/installation.md`: 첫 단락을 2.0.0 기준으로 바꾸고 낡은 문장("1.0.x 태그", "1.1.1 QA 배포 전")을 뺐다. 표의 현재 버전 2.0.0.
- 버전 2.0.0: manifest, `sync-harness.ps1:11`, 테스트 2개, README, installation.md, `AGENTS.md` 3행, CHANGELOG 새 항목 "2.0.0 — 후보 (미게시)". 태그는 만들지 않았다.

## Quickstart에 남은 공백

- Claude Code 설치는 수동이다(클론 + junction). 이를 해 주는 스크립트도, 설치 상태를 확인하는 `-Check`도 없다.
- 프로젝트 `-Check`는 패키지의 최신 연결문과 비교하지 않는다. 연결문이 바뀐 판이 나와도 `current`로 나온다. 2.0.0은 연결문이 같아서 이번에는 문제가 없다.
- 연결 해제는 해시 인자가 필요해서 사람이 직접 칠 명령이 없다(에이전트를 거침).
- 업그레이드 때 옛 패키지를 다시 받아야 한다(`git checkout JOENESS-v1.4.2`). 설치기가 이전 설치본을 스스로 제거하지 않는다.

## 확인된 것

- 스킬 폴더 트리 해시 불변, manifest는 버전 한 줄만 다름, 실행 경로 diff는 버전 문자열 2줄.
- 위 테스트 결과(PowerShell 5.1, Node). 중간 커밋 `d332846`(정리 + SECURITY.md, 버전 1.4.2)도 임시 worktree에서 같은 묶음을 돌려 Node 106/106, PowerShell 5.1 세 묶음 종료 0을 확인했다. `e7f39d6`은 `d332846`에서 문서 1개를 뺀 상태라 따로 돌리지 않았다.
- 삭제한 4개를 가리키는 파일 0개. 새 문서의 상대 링크는 모두 실제 파일을 가리킨다.
- 개발자의 Claude Code 연결: 작업 공간의 `.claude\skills\joeness-setup`이 깨끗한 main 클론의 `skills\joeness-setup`을 가리키는 junction이다(1.4.0~1.4.2 게시 기록과 실제 링크 확인). 개인 `~\.claude\skills`에는 JOENESS 링크가 없다.
- 각 커밋의 스테이징 diff에서 사용자 이름·gmail 주소 0건. `C:/Users`·`C:\Users`·`AppData` 일치는 SECURITY.md의 검색어 설명과 가린 `~\AppData\…` 경로뿐이다.

## 확인되지 않은 것

- PowerShell 7(`pwsh`) 테스트와 GitHub Windows CI. 이 기계에 `pwsh`가 없고, 푸시하지 않았다.

- 실제 1.4.2 → 2.0.0 업그레이드(`-Remove` → `-Apply`)는 돌리지 않았다(개인 설치는 이 세션의 범위가 아님). 절차는 1.4.x 게시 때 쓴 `install-and-check.mjs`의 순서와 같다.
- Quickstart의 `~\.claude\skills`(개인 범위) junction은 개발자가 쓰지 않는 방식이라 실제로 시험하지 않았다. Claude Code가 그 경로의 스킬을 읽는다는 것은 Claude Code의 일반 동작에 기댄다.
- GitHub private vulnerability reporting이 켜져 있는지는 보지 않았다(SECURITY.md는 조건부로 적음).
- 행동 A/B는 없다. 스킬 바이트가 같으므로 에이전트 행동 변화는 없다고 보지만, 이는 추론이다.

## 세션이 대신 내린 결정

- 초안 4개는 `evals/archive/`로 옮기지 않고 삭제했다. 아무도 링크하지 않고, 이력에 그대로 있으며, 그중 2개에는 개인 경로가 있어 옮기면 가림 작업이 더 늘기 때문이다.
- 가림 표기는 `~`로 했다(저장소의 기존 관례 `e70e9dc`와 같음). 스크립트를 `homedir()`로 바꾸는 식의 코드 수정은 하지 않았다. 기록된 스크립트의 동작을 바꾸지 않기 위해서다.
- `followup-hook-ab`의 `cli-*.py` 3개도 가림 대상에 넣었다. 브리프의 "release receipt 5개 폴더, 각 3회"는 release 폴더 4개 + 이 폴더(3개 파일 각 1회)로 읽었다.
- Quickstart의 Claude Code 절에는 개발자가 쓰는 작업 공간 범위와 개인 범위(`~\.claude\skills`)를 둘 다 적었다. 기계 경로는 적지 않았다.
- Quickstart의 junction 제거는 `Remove-Item` 대신 `cmd /c rmdir`로 적었다. Windows PowerShell 5.1에서 `Remove-Item -Recurse`가 junction 대상의 내용까지 지울 수 있어서다.
- AGENTS.md 3행은 "Source version: 2.0.0 candidate …" 문장을 앞에 붙이고 기존 1.4.2 이하 기록은 "Current published release"로 남겼다. 아래쪽의 낡은 `Source version: JOENESS 1.1.1` 줄은 브리프 범위 밖이라 두었다.
- README 영어 절의 "Supported environment"에 Claude Code(클론 수동 연결)를 더했다. 실제로 쓰는 환경이고 Quickstart와 맞추기 위해서다.
