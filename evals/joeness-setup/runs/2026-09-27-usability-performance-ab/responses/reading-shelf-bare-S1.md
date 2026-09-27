제보가 사실이었습니다. `addBook`이 반환 객체에서 `author`를 누락하고 있어, 해당 필드를 포함하도록 한 줄만 수정했습니다.

회귀 테스트는 수정 전 저자 누락으로 실패했고, 수정 후 `npm test` **3개 모두 통과**했습니다. 빈 목록과 기존 책이 있는 목록에서 필드 보존과 원본 목록 불변도 확인했습니다.

남은 일은 다음과 같습니다.

- 중복 ID 거부 구현과 테스트
- `findBooks` 구현과 R2 테스트

M1은 아직 미완료이며 사용자 수락도 대기 상태입니다. 결과와 검증 한계를 [HANDOFF.md](/D:/JOEWRKS/JOENESS-Usability-Performance-AB-20260927/projects/reading-shelf-bare/HANDOFF.md:30)에 남기고, ISSUES와 ROADMAP도 갱신했습니다.