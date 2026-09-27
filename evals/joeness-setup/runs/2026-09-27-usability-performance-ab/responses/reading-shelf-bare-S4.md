2026-09-27 현재 **M1은 기술적으로 완료됐고, 사용자 수락은 대기 중**입니다. 현재 코드와 테스트가 최신 HANDOFF의 완료 기록을 뒷받침합니다. 초기 기록의 ‘저자 누락’, ‘검색 미구현’은 이미 해결된 과거 상태입니다. 이번 확인에서는 파일을 수정하지 않았습니다.

Reading Shelf는 메모리 안에서 책 목록을 다루는 라이브러리 API입니다. 네트워크·저장 서비스·화면은 승인 범위에 없습니다.

기준 커밋 `5a3a685` (`Baseline fixture`) 이후 **아래 6개 파일이 변경됐으며, 모두 아직 미커밋 상태**입니다.

| 파일 | 수행된 작업 |
|---|---|
| [src/shelf.mjs](/D:/JOEWRKS/JOENESS-Usability-Performance-AB-20260927/projects/reading-shelf-bare/src/shelf.mjs) | `addBook`의 저자 보존·중복 ID 거부를 수정하고, `findBooks`의 대소문자 무시 제목 부분 검색을 구현 |
| [tests/shelf.test.mjs](/D:/JOEWRKS/JOENESS-Usability-Performance-AB-20260927/projects/reading-shelf-bare/tests/shelf.test.mjs) | 기존 2개 검사에 필드 보존·중복 거부·검색 회귀 테스트 6개 추가 |
| [AGENTS.md](/D:/JOEWRKS/JOENESS-Usability-Performance-AB-20260927/projects/reading-shelf-bare/AGENTS.md) | 문서 탐색 경로와 검증·기록 유지 지침 추가 |
| [HANDOFF.md](/D:/JOEWRKS/JOENESS-Usability-Performance-AB-20260927/projects/reading-shelf-bare/HANDOFF.md) | 기존 기록을 보존하면서 재현·수정·검증 결과를 날짜별로 추가 |
| [ISSUES.md](/D:/JOEWRKS/JOENESS-Usability-Performance-AB-20260927/projects/reading-shelf-bare/ISSUES.md) | RS-001~003에 원인·해결·재발 방지 근거를 기록하고 해결 상태 반영 |
| [ROADMAP.md](/D:/JOEWRKS/JOENESS-Usability-Performance-AB-20260927/projects/reading-shelf-bare/ROADMAP.md) | R1·R2 충족, M1 기술 완료, 사용자 수락 대기, CSV 보류를 반영 |

`PRODUCT.md`, `DESIGN.md`, `package.json`, 초기 실행 증거는 기준 커밋 대비 변경되지 않았습니다.

이번에 Node `v26.3.0`에서 **`npm test`를 직접 실행해 8/8 통과**, `git diff --check` 통과를 확인했습니다. 검증 전후 추적 파일의 내용 해시도 동일했습니다.

- **R1 — 책 추가:** `id/title/author` 보존, 빈 목록·기존 목록에 추가할 때 입력 보존을 검사합니다. 같은 책 재추가와 메타데이터가 다른 중복 ID도 거부하며, 목록 첫·마지막 위치와 거부 후 입력 보존을 확인합니다.
- **R2 — 책 검색:** 대소문자가 섞인 제목 부분 검색, 여러 결과와 순서, ID·저자만 일치하는 항목 제외, 결과 없음, 빈 목록, 입력 보존을 검사합니다.
- 기존 `listBooks`의 레코드 복사와 빈 제목 거부 검사도 통과합니다. 임의 입력 타입이나 언어별 특수 대소문자 규칙까지 검증한 것은 아닙니다.

재발 시에는 ISSUES의 다음 원인과 대응을 기준으로 확인하면 됩니다.

| 문제 | 확인된 원인·적용된 해결 | 재발 시 확인할 점 |
|---|---|---|
| **RS-001: 저자 누락·중복 ID 허용** | 반환 레코드에 `author`가 없었고, 추가 전 ID 검사도 없었습니다. 저자를 포함하고 전체 목록에서 `===`로 ID를 비교해 일치하면 `duplicate id` 오류를 내도록 수정했습니다. | 필드 구성과 추가 전 ID 검사를 확인하고 기존 회귀 테스트를 유지합니다. 중복 문제는 저자 수정으로 생긴 회귀가 아니라 당시 남아 있던 결함입니다. |
| **RS-002: 검색 시 예외** | `findBooks`가 미구현 예외만 던졌습니다. 검색어와 제목을 소문자로 바꾼 뒤 `includes`와 `filter`로 검색하도록 구현했습니다. | 양쪽 대소문자 변환, 제목만 검색하는지, 입력을 변경하는지 확인합니다. |
| **RS-003: 테스트 통과를 완료로 오판** | 필요한 동작을 검사하지 않아 결함이 있어도 테스트가 통과했습니다. R1·R2 검사를 추가하고 수정 전 실패·수정 후 통과를 기록했습니다. | 통과 개수뿐 아니라 각 요구사항을 실제로 검사하는지 대조합니다. |

**현재 확인된 필수 M1 구현 잔여 작업은 없습니다.** CSV 내보내기는 기록상 사용자의 명시적 결정으로 미래 후보에 보류됐으며, 구현 약속이나 M1 누락 항목이 아닙니다.

바로 다음 행동은 **완료된 책 추가·중복 거부·제목 검색 동작을 사용자에게 검토받고, 명시적 수락 또는 남은 불일치를 확인하는 것**입니다. 불일치가 보고되면 해당 입력으로 재현하고 기존 RS 항목과 테스트를 기준으로 이어가면 됩니다. 자동 테스트 통과만으로 사용자 수락을 완료 처리해서는 안 됩니다.