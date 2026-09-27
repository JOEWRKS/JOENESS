승인된 필수 R1·R2를 구현·검증했고, M1 기술 완료 조건을 충족했습니다.

- [src/shelf.mjs](/D:/JOEWRKS/JOENESS-Token-AB-20260927/projects/reading-shelf-v1-joeness/src/shelf.mjs): 저자 누락과 중복 ID 허용 문제를 수정하고, 대소문자를 무시하는 제목 검색을 구현했습니다.
- [테스트](/D:/JOEWRKS/JOENESS-Token-AB-20260927/projects/reading-shelf-v1-joeness/tests/shelf.test.mjs): 추가한 6개가 수정 전 실패함을 확인했고, 수정 후 `npm test`는 **8개 통과, 실패·건너뜀 0개**였습니다. 입력 불변성도 검증했습니다.
- [ROADMAP.md](/D:/JOEWRKS/JOENESS-Token-AB-20260927/projects/reading-shelf-v1-joeness/ROADMAP.md), [TASKS.md](/D:/JOEWRKS/JOENESS-Token-AB-20260927/projects/reading-shelf-v1-joeness/TASKS.md), [ISSUES.md](/D:/JOEWRKS/JOENESS-Token-AB-20260927/projects/reading-shelf-v1-joeness/ISSUES.md)에 상태, 실제 검증 결과, 원인과 해결을 기록했습니다.

필수 범위에서 확인된 미해결 문제나 남은 구현은 없습니다. 선택 기능은 추가하지 않았습니다. **실기기 확인은 수행하지 않았고, 사용자 수락은 PENDING**입니다.