현재 코드에서 재현했고, 수정과 로컬 검증을 완료했습니다.

- **원인:** `cancelSlot`이 `filter`로 취소 대상 예약을 제거했습니다.
- **수정:** 기록과 기존 필드를 유지하고 상태만 `cancelled`로 변경합니다. 입력과 다른 예약은 변경하지 않습니다.
- **검증:** 추가한 회귀 테스트로 수정 전 3개 실패를 확인했고, 수정 후 `npm test` 전체 **8개가 통과**했습니다.

원인·해결은 [ISSUES.md](/D:/JOEWRKS/JOENESS-Performance-Bare-20260927/ISSUES.md), 재현·검증 결과는 [검증 기록](/D:/JOEWRKS/JOENESS-Performance-Bare-20260927/evidence/cancel-run.md)에 남기고 [인계 문서](/D:/JOEWRKS/JOENESS-Performance-Bare-20260927/HANDOFF.md)도 갱신했습니다.

실제 현장 키오스크 검증은 미완료이므로 M1은 아직 완료되지 않았으며, 사용자 인수 승인도 별도로 남아 있습니다.