승인된 필수 로컬 기능 R1·R2 구현과 검증을 완료했습니다.

- `addBook`: 저자 누락 수정, 중복 ID 거부, 입력 불변성 확인.
- `findBooks`: 대소문자를 무시하는 제목 부분 검색 구현, 입력 불변성 확인.
- 검증: 수정 전 신규 테스트 6개 실패를 재현했고, 수정 후 **8/8 통과**했습니다. `git diff --check`도 통과했습니다.

작업·검증은 [TASKS.md](/D:/JOEWRKS/JOENESS-Token-AB-20260927/projects/reading-shelf-v1-bare/TASKS.md), 문제 원인·해결은 [ISSUES.md](/D:/JOEWRKS/JOENESS-Token-AB-20260927/projects/reading-shelf-v1-bare/ISSUES.md), 요구사항 상태는 [ROADMAP.md](/D:/JOEWRKS/JOENESS-Token-AB-20260927/projects/reading-shelf-v1-bare/ROADMAP.md)에 기록했습니다.

필수 범위의 미구현 사항이나 실패 테스트는 없습니다. 실기기 확인은 수행하지 않았으며 **사용자 수락은 PENDING**입니다. 선택 기능인 CSV 내보내기는 구현하지 않았습니다.