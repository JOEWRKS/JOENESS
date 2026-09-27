필수 로컬 기능 R1·R2를 구현하고 검증했습니다.

- 예약의 attendee 누락을 수정했습니다.
- 취소 시 예약을 유지하고 상태만 `cancelled`로 변경합니다.
- 필드 보존·입력 불변성 테스트를 추가했습니다. 수정 전 두 결함을 재현했고, 수정 후 `npm test` **4개 모두 통과**, `git diff --check`도 통과했습니다.

변경과 검증 결과는 [TASKS.md](D:/JOEWRKS/JOENESS-Token-AB-20260927/projects/workshop-slots-v1-bare/TASKS.md), 원인과 해결은 [ISSUES.md](D:/JOEWRKS/JOENESS-Token-AB-20260927/projects/workshop-slots-v1-bare/ISSUES.md)에 기록했습니다. ROADMAP에는 R1·R2만 완료 표시했습니다. 선택·아이디어 기능은 추가하지 않았습니다.

**남은 일은 R3 실제 현장 키오스크 검증과 결과 기록입니다.** 실기기 검증은 수행하지 않았으므로 M1은 미완료이며, 사용자 수락도 별도로 남아 있습니다.