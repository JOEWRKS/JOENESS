현재 상태에서 재현했고 수정했습니다.

- **원인:** `cancelSlot`이 `filter`로 취소 대상 예약을 결과 목록에서 제거했습니다.
- **수정:** 예약 필드를 보존하고 상태만 `cancelled`로 변경합니다. 원본 입력과 다른 예약은 그대로 유지합니다.
- **회귀 테스트:** 수정 전 예약 누락으로 실패했고, 수정 후 `npm.cmd test` **4/4 통과**했습니다. `git diff --check`도 통과했습니다.
- **기록:** [ISSUES.md의 I-002](D:/JOEWRKS/JOENESS-Usability-Performance-AB-20260927/projects/workshop-slots-bare/ISSUES.md:29)에 원인·해결·재검증 방법을, [TASKS.md의 T-003](D:/JOEWRKS/JOENESS-Usability-Performance-AB-20260927/projects/workshop-slots-bare/TASKS.md:88)에 실행 결과를 남겼습니다.

R2는 완료로 갱신했습니다. 실제 키오스크 검증 R3는 미실시여서 M1은 아직 미완료이며, 사용자 수락은 별도입니다.