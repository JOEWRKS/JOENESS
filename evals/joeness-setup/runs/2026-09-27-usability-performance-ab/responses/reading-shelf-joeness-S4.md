- **작업:** 현재 코드·Git·기록을 대조하고 `npm test`를 재실행했습니다.
- **업데이트 파일:** 이번 작업에서는 수정 없음. 기존 미커밋 변경은 7개 파일입니다.
- **이슈:** 과거 저자 누락, 중복 ID 허용, 검색 미구현, 테스트 범위 부족이 있었습니다.
- **해결:** 현재 코드에 수정이 반영돼 있으며, 테스트 **10개 통과·실패 0개**를 직접 확인했습니다.
- **남은 문제:** 승인된 M1 필수 범위의 확인된 미해결 기술 문제는 없습니다. 사용자 수락은 **PENDING**입니다.
- **다음 작업:** 완료된 M1 결과를 사용자에게 제시하고 수락 판단을 받는 것입니다.

Reading Shelf는 **메모리 안에서 책 목록을 다루는 라이브러리 API**입니다. 네트워크·저장 서비스·UI는 범위 밖입니다. 현재 [ROADMAP.md](D:/JOEWRKS/JOENESS-Usability-Performance-AB-20260927/projects/reading-shelf-joeness/ROADMAP.md)의 필수 조건 R1·R2는 모두 VERIFIED이며, 실제 코드와 이번 테스트 결과도 이를 뒷받침합니다.

완료된 동작은 다음과 같습니다.

- `addBook`: `id`, `title`, `author`를 보존하고 새 배열을 반환합니다. 기존 ID는 `duplicate id` 오류로 거부하며, 입력 목록을 변경하지 않습니다. 기존 빈 제목 거부도 유지됩니다.
- `findBooks`: 대소문자를 무시하고 **제목의 부분 문자열**을 검색합니다. 저자나 ID만 일치하는 책은 제외합니다. 일치 없음·빈 목록은 빈 배열, 빈 검색어는 전체 목록을 반환하며, 문장부호는 문자 그대로 비교합니다.
- 기존 `listBooks`의 레코드 복사와 입력 보존 테스트도 통과합니다.

현재 Git 기준 커밋은 `e6524f5`(`Baseline fixture`)입니다. 아래 변경은 **모두 아직 커밋되지 않았습니다.**

| 파일 | 상태 | 기존 작업에서 바뀐 내용 |
|---|---|---|
| [src/shelf.mjs](D:/JOEWRKS/JOENESS-Usability-Performance-AB-20260927/projects/reading-shelf-joeness/src/shelf.mjs) | 수정 | 저자 보존·중복 ID 거부 추가, 제목 검색 구현 |
| [tests/shelf.test.mjs](D:/JOEWRKS/JOENESS-Usability-Performance-AB-20260927/projects/reading-shelf-joeness/tests/shelf.test.mjs) | 수정 | 기존 2개에 추가 동작 테스트 3개·검색 테스트 5개 보강 |
| [ROADMAP.md](D:/JOEWRKS/JOENESS-Usability-Performance-AB-20260927/projects/reading-shelf-joeness/ROADMAP.md) | 수정 | R1·R2 검증 완료, M1 기술 완료, 수락 대기, CSV 연기 반영 |
| [ISSUES.md](D:/JOEWRKS/JOENESS-Usability-Performance-AB-20260927/projects/reading-shelf-joeness/ISSUES.md) | 수정 | 결함 원인·해결·회귀 검증·재발 방지 기록 |
| [AGENTS.md](D:/JOEWRKS/JOENESS-Usability-Performance-AB-20260927/projects/reading-shelf-joeness/AGENTS.md) | 수정 | 문서 역할·기록 방식·완료 판단·보고 규칙 추가 |
| [TASK.md](D:/JOEWRKS/JOENESS-Usability-Performance-AB-20260927/projects/reading-shelf-joeness/TASK.md) | 신규·미추적 | 설정부터 결함 수정·검색 구현까지의 작업 기록과 다음 행동 |
| [.joeness/setup-state.json](D:/JOEWRKS/JOENESS-Usability-Performance-AB-20260927/projects/reading-shelf-joeness/.joeness/setup-state.json) | 신규·미추적 | 작업 지침 설정의 적용 상태 |

재발 방지를 위해 이어받아야 할 원인과 해결은 다음과 같습니다.

| 문제 | 원인 | 해결 및 유지할 검증 |
|---|---|---|
| 추가한 책의 저자가 사라짐 | 반환 객체에 `id`·`title`만 복사 | `author`도 복사하고 세 필드 보존 검사 |
| 같은 ID의 책이 중복 추가됨 | 기존 목록의 ID 검사 누락 | 전체 목록에서 ID를 검사한 뒤 거부. 동일 책 재추가뿐 아니라 제목·저자가 다른 중복, 목록의 두 번째 항목과 중복도 검사 |
| 제목 검색 불가 | 함수가 항상 미구현 오류를 던짐 | 제목·검색어 소문자 변환 후 부분 일치 검색. 경계 조건과 입력 보존 검사 |
| 테스트 통과를 완료로 오판할 가능성 | 초기 2개 테스트가 필수 동작을 검사하지 않음 | 테스트 개수뿐 아니라 R1·R2 요구사항과 실제 검증 내용을 대조 |

현재 우회책은 필요 없습니다. 중복 거부는 **새로 추가하는 책**에 적용되며, 이미 중복된 입력 목록을 정리하는 기능은 포함하지 않습니다.

`HANDOFF.md`와 `artifacts/attempt-00/local-check.md`는 구현 전 상태를 담은 과거 자료입니다. 그곳의 “저자 누락·검색 미구현·테스트 2개 통과”를 현재 상태로 해석하면 안 됩니다. 이번 확인에서는 프로젝트 루트의 `npm test`가 **10개 모두 통과**했습니다.

승인 범위 내 남은 구현 작업은 없습니다. 기록상 CSV 내보내기는 2026-09-27 사용자 결정으로 **DEFERRED**이며, 별도 범위 결정이 있어야 착수할 수 있습니다. 다음 담당자는 기존 미커밋 변경을 보존하고, **M1 기술 완료와 사용자 수락 대기를 구분해 수락 판단을 받으면 됩니다.**