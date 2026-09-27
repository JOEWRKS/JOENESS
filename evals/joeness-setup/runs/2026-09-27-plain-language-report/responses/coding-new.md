- 작업: 책 추가 기능을 수정하고 테스트했습니다.
- 업데이트 파일: 책 추가 코드, 테스트, 진행·문제·인계 기록, 실행 결과 기록.
- 이슈: 저자가 누락되고 같은 번호의 책이 중복 추가됐습니다.
- 해결: 저자 보존과 중복 거부를 수정하고, 기존 목록 유지도 확인했습니다.
- 남은 문제: 제목 검색은 아직 구현·검증되지 않았습니다.
- 다음 작업: 로드맵에 남은 제목 검색 구현과 테스트입니다.

**상세 보고**

테스트 3개를 추가했습니다. 수정 전에는 전체 5개 중 2개가 실패했고, 수정 후 `npm test`에서 **5개 모두 통과**했습니다.

코드와 테스트: [src/shelf.mjs](D:/JOEWRKS/JOENESS-PlainLanguage-Coding-20260927/new/src/shelf.mjs), [tests/shelf.test.mjs](D:/JOEWRKS/JOENESS-PlainLanguage-Coding-20260927/new/tests/shelf.test.mjs).

기록: `ROADMAP.md`, `ISSUES.md`, `HANDOFF.md`를 갱신하고 [실행 근거](D:/JOEWRKS/JOENESS-PlainLanguage-Coding-20260927/new/artifacts/attempt-01/local-check.md)를 추가했습니다.

R1만 완료했습니다. R2 검색과 선택 사항 CSV는 구현하지 않았습니다. M1 전체는 미완료이며, 사용자 승인은 별도로 대기 상태입니다.