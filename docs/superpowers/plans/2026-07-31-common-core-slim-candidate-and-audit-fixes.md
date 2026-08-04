# Common Core 축약 후보와 감사 보강 구현 계획

**Goal:** 활성 증거 연결을 보존한 채 축약 Core 후보를 만들고 프로젝트 helper의
검사 오류·Windows casing 결함 및 stale plan 표시를 수정한다.

**Design:** `../specs/2026-07-31-common-core-slim-candidate-and-audit-fixes-design.md`

## Task 1: 비활성 축약 후보

- `evals/candidates/common-core-v2.md`를 추가한다.
- 기존 Core의 일곱 heading과 16개 frozen case 불변식 대응을 확인한다.
- 기존 validator, line/byte 비교와 독립 검토를 통과시킨다.
- 활성 `AGENTS.md`, v1 candidate, manifest Core hash는 바꾸지 않는다.

## Task 2: helper 회귀 테스트

- reparse `Get-Item` 검사 오류가 `blocked`와 무변경을 만드는 실패 테스트를
  먼저 추가한다.
- casing만 다른 `ProjectPath`와 `ExpectedRoot` 회귀 테스트를 먼저 추가한다.
- 테스트가 현재 구현에서 의도한 이유로 실패하는지 확인한다.

## Task 3: 최소 구현

- `Get-Item -ErrorAction Stop`과 `ItemNotFoundException` 한정 catch를 적용한다.
- 두 경로 동일성 비교를 `OrdinalIgnoreCase`로 바꾼다.
- focused project-helper test를 통과시킨다.

## Task 4: 사실 원장 동기화

- 완료된 V2 계획 상단에 역사적 완료 banner를 추가한다.
- helper의 새 bytes/SHA-256을 `vendor/source-manifest.json`과 integrity test에
  반영한다.

## Task 5: 검증과 리뷰

- 전체 PowerShell·Node·Python 검증과 `git diff --check`를 실행한다.
- 독립 reviewer가 요구사항과 diff를 검토한다.
- 검증된 결과만 commit·push한다.
