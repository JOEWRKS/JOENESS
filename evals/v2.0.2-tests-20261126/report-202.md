# JOENESS 2.0.2 후보 준비 보고 (2026-11-26)

대상 브랜치 `v2.0.2`, 기준 `JOENESS-v2.0.1`. 입력: ATELIER 실사용 마찰 기록 19번(`TOOL-FRICTION.md`)과 검토 묶음 J(`Library/tool-friction-review.md`). 범위는 사용자 확정(2026-11-26) "2.0.2는 묶음 J만". ATELIER와 설치된 JOEFLOW 스킬은 읽기만 했다. push·태그·Release·개인 설치는 하지 않았다.

## 결론

- 새 스크립트 `skills/joeness-setup/scripts/revision-line.mjs`가 JOEFLOW `approval_status.py` JSON에서 ROADMAP `Product revision / approval:` 줄을 찍는다. 글만 내고 파일은 고치지 않는다.
- ATELIER fixture로 찍은 줄이 ATELIER `ROADMAP.md` 5행과 바이트 단위로 같다([비교](atelier-line-compare.txt)).
- 스킬 폴더에서 바뀐 파일은 새 스크립트, `SKILL.md` 로드맵 절(문장 둘), `assets/ROADMAP.md` 리비전 줄 자리 설명뿐이다. 연결문 `assets/AGENTS.md`, `project-setup.ps1`, 검수 도구 4개는 2.0.1과 바이트 단위로 같다.

## 마찰 → 수정 → 테스트

| 항목 | 2.0.1 | 2.0.2 | 테스트 |
|---|---|---|---|
| J 리비전 줄 수동 갱신 (19번) | 승인·재진입 때마다 `approval_status.py` JSON의 네 값과 날짜를 손으로 옮김(ATELIER 7회) | `node <joeness-setup>/scripts/revision-line.mjs`에 JSON을 stdin 또는 `--input`으로 주면 한 줄을 찍음. `--date` 없으면 그 기계의 오늘 | 새 `tests/joeness-revision-line.tests.mjs` 7개 |
| 미승인 리비전 표기 | SKILL.md·ROADMAP 템플릿에 형식 없음 | 괄호 안 `read` 앞에 `pending_revisions 24-25`(하나면 `24`, 연속이 아니면 `24/26`) | 미승인 fixture, 단일, 비연속 |
| 기록 필드 | SKILL.md는 세 필드(`definition_revision`·`approval_status`·`approved_revision`), ATELIER 줄은 `definition_status`도 씀 | SKILL.md·ROADMAP 템플릿에 `definition_status` 추가(ATELIER 줄과 맞춤) | 계약 테스트 1개 |
| 리비전 기록 없음 | SKILL.md "`none`" | `definition_revision` null이면 `Product revision / approval: none (...)`. 다른 null 값은 `none` | null 경우 |
| 잘못된 입력 | — | JSON 아님, `error` 필드(approval_status.py 오류 출력), 필드 누락, 배열, `pending_revisions` 형식 오류, 쉼표가 든 값 → stderr, exit 2, stdout 빈 문자열. 모르는 옵션(`--edit` 등)·값 없는 옵션·없는 파일도 exit 2 | 실패 9경우 |
| 파일 편집 없음 | — | 스크립트는 읽기만 함 | 임시 폴더의 ROADMAP·입력 바이트 불변 |
| 링크 설치 경로 | 2.0.1 검수 도구와 같은 진입 판정 | junction 경로 실행이 실제 경로와 같은 줄을 냄 | junction 1개 |

## fixture

- `fixtures/joeness-setup/approval-status/atelier-rev23.json`: `PYTHONIOENCODING=utf-8 python -B <installed joewrks-product-definition>/scripts/approval_status.py ATELIER/product-definition/atelier/state.json`(stdin 닫음) 출력. `joeflow_version.project_file`의 절대 경로를 `product-definition/atelier/joeflow-project.json`으로 바꿨고 나머지는 그대로다(`sort_keys`, 들여쓰기 2). 읽은 state.json sha256 `698ed09d9ea36957a02b7be2da4e5f02baf95842554a7d0ffd6ecbc5e34cfc0f`, definition_revision 23, APPROVED.
- `fixtures/joeness-setup/approval-status/atelier-pending-rev25.json`: 같은 state.json을 세션 scratchpad에 복사해 `project.definition_revision` 25, `definition_status` OPEN, `approval.status` UNAPPROVED로 바꾼 뒤 같은 `approval_status.py`로 얻은 출력. `pending_revisions` `[24, 25]`. `project_file`은 위와 같이 상대 경로로 바꿈. 사본 옆에 `joeflow-project.json`이 없어 `joeflow_version.notice`가 채워져 있다(스크립트는 읽지 않는 필드).

## 게이트

- `node --test tests/*.tests.mjs`: 121/121 통과(2.0.1의 113 + revision-line 7 + 계약 1).
- `powershell.exe -NoProfile -ExecutionPolicy Bypass -File tests/joeness-release.tests.ps1` exit 0, `joeness-install.tests.ps1` exit 0, `joeness-project-setup.tests.ps1` exit 0 (Windows PowerShell 5.1).
- manifest: 파일 20개, `release.version` 2.0.2, 해시 재계산(새 스크립트·`SKILL.md`·`assets/ROADMAP.md`). 설치기 `$expectedFiles`·버전 핀, 테스트 버전 핀(release·contract), release 테스트의 tests 폴더 목록, CI node 명령에 새 테스트.
- 스테이징 diff에서 사용자 이름·메일·사용자 홈·드라이브 경로 검색 0건(이 문장 제외), `git diff --cached --check` 통과.

## 세션이 대신 내린 결정

- 미승인 표기: SKILL.md에 정해진 형식이 없어서 과업 지시대로 괄호 안 `pending_revisions N`. N은 목록 대신 범위(`24-25`)로 줄였다. `approval_status.py`는 `last_approved+1..revision`을 주므로 늘 연속이다. 연속이 아닌 목록은 `/`로 잇는다(쉼표는 줄의 필드 구분과 겹침).
- 위치: `read` 앞. "출처와 읽은 날짜"가 괄호 끝에 남아 기존 줄과 끝이 같다.
- 값 검사: 문자열 값은 영문·숫자·`_.-`만 받는다. 쉼표나 공백이 든 값은 줄 형식을 깨므로 exit 2.
- 날짜 기본값은 로컬 날짜(UTC 아님). ATELIER 줄의 "read" 날짜가 사용자 기준 날짜라서다.
- Node 스크립트(`.mjs`): 검수 도구와 같은 관례, 의존성 없음. PowerShell은 쓰지 않음.
- 연결문(`assets/AGENTS.md`)에는 넣지 않았다. 매 턴 읽히는 글이고, 리비전 줄은 로드맵 절에서만 쓴다.
- 기존 프로젝트(ATELIER 포함)의 ROADMAP·연결은 자동으로 바뀌지 않는다. 새 템플릿 문구는 새 연결에만 들어간다.

## 확인되지 않은 것

- PowerShell 7과 GitHub Windows CI(push 전이라 안 돌림).
- 실제 Claude Code·Codex 설치 폴더에서의 실행(이 세션은 접근 금지). macOS·Linux.
- 에이전트 행동: 에이전트가 승인 뒤 실제로 이 스크립트를 쓰는지는 시험하지 않았다.
- JOEFLOW가 `approval_status.py` 필드 이름을 바꾸면 이 스크립트는 exit 2로 멈춘다(조용히 틀린 줄을 내지는 않음).

## 쓴 곳

저장소 안 커밋 1개(브랜치 `v2.0.2`). 세션 scratchpad에 approval_status.py 원출력과 state 사본(미승인 fixture용). ATELIER·JOEFLOW 설치 폴더에는 쓰지 않았다.
