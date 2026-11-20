# JOENESS 2.0.1 후보 준비 보고 (2026-11-20)

대상 저장소 main, 기준 `JOENESS-v2.0.0`(9b6dd25)과 main `f8e02ef`. 입력 자료: [QUICKSTART 시험](docs-joeness-report.md), [통합 시험](integration-report.md), [통합 trace](integration-trace.md). 두 보고는 참고 자료로 읽었고, 결함마다 이 세션에서 다시 재현한 뒤 고쳤다. push·태그·Release·개인 설치는 하지 않았다(부모 세션 몫).

## 결론

- 코드 결함 2건을 고쳤다: 검수 도구 4개의 fail-open(통합 D1)과 `-Remove`의 빈 폴더(문서 D8). 둘 다 고치기 전에 실패하는 것을 확인했다.
- CRLF(통합 D4)는 코드로 막지 않고 안내와 진단 문구로 처리했다. 게이트는 여전히 차단한다.
- 문서 결함 D1~D7, D9, D10과 통합 D5를 문서에 반영했다. D5(문서)는 `-Check` JSON에 `installedRelease`를 더해 도구로도 풀었다.
- 스킬 폴더에서 바뀐 파일은 `.mjs` 4개와 `references/review-gate.md`뿐이다. 매 턴 읽히는 `SKILL.md`와 연결문은 그대로다.

## 결함별 재현 → 수정 → 테스트

| 결함 | 재현 (2.0.0) | 수정 | 테스트 (2.0.1) |
|---|---|---|---|
| 통합 D1 게이트 fail-open | 새 `tests/joeness-entry-link.tests.mjs`: junction 경로로 네 스크립트 실행 → stdout `''`, exit 0. 실제 경로는 JSON, exit 2. 5/5 실패 | 진입 판정을 `isEntry()`로: 양쪽 `realpathSync.native`, Windows는 소문자 비교. 같은 파일 이름으로 직접 실행했는데도 어긋나면 stderr `entry guard mismatch` + exit 2. import 시 거짓은 의도(주석) | 5/5 통과: 링크 경로 stdout·exit가 실제 경로와 같음. 같은 이름의 래퍼(가드 불일치 강제)는 exit 2, stdout 빈 문자열 |
| 문서 D8 `-Remove` 빈 폴더 | 2.0.0 패키지로 임시 CodexHome에 `-Apply` → `-Remove`: `removed`인데 `skills`, `skills\joeness-setup`, `agents`, `assets`, `references`, `scripts` 6개 남음 | `sync-harness.ps1` `Remove-JoenessEmptySkillFolders`: 성공한 Remove 뒤 깊은 폴더부터 비었으면 지움(`[IO.Directory]::Delete(path,$false)`, 비어 있지 않으면 실패하므로 남의 파일을 지우지 않음). 남긴 폴더는 `warnings`. `skills`는 건드리지 않음 | 같은 절차에서 `skills`만 남음. `joeness-install.tests.ps1`: 폴더 트리 없음, `skills` 남음, Remove 중 `assets`에 들어온 사용자 파일은 보존되고 경고, 빈 `scripts`는 지움 |
| 통합 D4 CRLF | 2.0.0 gate로 새 CRLF 테스트를 돌리면 오류가 일반 문구뿐이라 실패(차단 자체는 됨) | `review-gate.mjs`: LF로 바꿔야 맞는 경우 원인을 덧붙임. `review-gate.md`에 `.gitattributes` 안내. `-Apply` 경고는 넣지 않음(아래 결정) | `joeness-review-gate.tests.mjs` 새 테스트: CRLF 변환 → exit 2 + 원인 문구, 다른 변경 → 일반 문구 |
| 통합 D5 실행 경로 표현 | `review-gate.md:20` "From the installed skill's absolute directory" | `node <joeness-setup>/scripts/review-gate.mjs`, 커밋 파일에는 글자 그대로 | 계약 테스트: 자리표시자 명령, "stays literal", "absolute directory" 없음, `.gitattributes` 언급 |
| 문서 D5 설치본 버전 | 2.0.0 `-Check` JSON에 버전 필드 없음 | `packageRelease`·`installedRelease` 추가(Apply 성공=이 패키지, Remove 성공=null, 그 밖에는 상태 파일 값) | 2.0.0 설치본에 2.0.1 `-Check` → `blocked`, exit 2, `installedRelease` `2.0.0`. install 테스트에 단언 |
| 문서 D6 blocked 메시지 | `Skill ownership does not match this package; existing files were preserved`만 | 같은 앞부분 뒤에 `(installed release X, this package 2.0.1; to change releases run -Remove with the package of the installed release first)` | install 테스트: 앞부분 유지, 버전 포함 |
| 문서 D1~D4, D7, D9, D10 | 문서와 실제 인자·출력 대조(`project-setup.ps1` param, `-Apply` stderr usage, SKILL.md Detach 문구) | QUICKSTART 갱신 | 문서 변경, 테스트 없음 |

## 게이트

- `node --test tests/*.tests.mjs`: 113/113 통과(2.0.0의 106 + 진입 링크 5, CRLF 1, 자리표시자 1).
- `powershell.exe -NoProfile -ExecutionPolicy Bypass -File tests/joeness-release.tests.ps1` exit 0, `joeness-install.tests.ps1` exit 0, `joeness-project-setup.tests.ps1` exit 0 (Windows PowerShell 5.1).
- `tests/joeness-release.tests.ps1`의 테스트 파일 목록과 `.github/workflows/windows-ci.yml` node 명령에 새 테스트 파일을 넣었다.
- 스테이징 diff에서 사용자 이름·메일·`C:\Users` 검색 0건.

## 고치지 않은 것과 이유

- 통합 D3(Result 열 갱신이 게이트 기준선을 stale로 만듦), D6(규칙 종류 표현), D8(DESIGN 머리줄 형식 차이): JOENESS와 JOEDESIGN 사이 규칙 문제다. 고치려면 매 턴 읽히는 연결문이나 SKILL.md, 또는 JOEDESIGN 쪽을 바꿔야 해서 이번 범위(행동 시험 없이 바꾸지 않음) 밖이다.
- `roadmap-review.md`·`operation-review.md`·`impact-review.md`의 `node scripts/...` 표기: 절대 경로를 요구하지 않아 결함 보고 대상이 아니었다. 그대로 둠.
- macOS·Linux: 테스트는 Windows가 아니면 심볼릭 링크를 쓰지만, 이 기계에서는 junction만 돌았다.

## 세션이 대신 내린 결정

- `-Apply`에서 `.gitattributes` 부재 경고를 넣지 않았다. 게이트는 필요한 프로젝트만 쓰는데 경고는 모든 연결에 뜬다. 연결 시점에는 아직 고정 파일이 없다. 파일이 있어도 고정 경로를 덮는지는 알 수 없다. `project-setup.ps1`(payload)을 바꾸지 않아도 된다. 대신 고정하는 자리(`review-gate.md`)의 안내와 실제로 어긋났을 때의 진단 문구로 처리했다.
- `<joeness-setup>` 자리표시자: 통합 시험 세션이 ROADMAP에 지어 쓴 이름을 그대로 채택했다. 환경 변수는 새로 정의하지 않았다.
- `-Remove`는 `skills` 폴더를 남긴다. 다른 스킬과 함께 쓰는 폴더이고 우리가 만들었는지 알 수 없다.
- 결과 JSON에 `installedRelease`와 함께 `packageRelease`도 넣었다(업그레이드 판단에 둘 다 필요).
- blocked 메시지는 앞부분을 그대로 두고 뒤에만 붙였다. 이 문구로 찾는 사용자나 기록이 있을 수 있다.

## 확인되지 않은 것

- PowerShell 7과 GitHub Windows CI(push 전이라 안 돌림).
- 실제 Claude Code 설치 폴더와 `~\.codex`에서의 실행(이 세션은 접근 금지).
- 에이전트 행동. 행동 시험은 하지 않았다.

## 쓴 곳

저장소 안 커밋 3개와, 세션 scratchpad의 2.0.0 worktree(`git worktree add --detach`)·임시 CodexHome. worktree는 끝에 지웠다.
