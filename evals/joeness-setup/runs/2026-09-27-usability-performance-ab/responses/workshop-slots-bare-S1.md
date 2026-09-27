제보가 맞았습니다. `reserveSlot`이 예약 항목을 만들 때 `attendee`를 누락하고 있어, 해당 필드를 복사하도록 수정했습니다.

- 회귀 테스트로 수정 전 실패를 확인했고, 수정 후 `npm.cmd test` **3/3 통과**했습니다.
- 예약 필드·상태, 기존 항목 보존, 입력 불변성을 검증했습니다. `git diff --check`도 통과했습니다.
- 결과를 [TASKS.md](D:/JOEWRKS/JOENESS-Usability-Performance-AB-20260927/projects/workshop-slots-bare/TASKS.md:49)에 기록하고 이슈·인계 문서를 갱신했습니다.

남은 일은 기존 `cancelSlot` 삭제 결함(R2)과 실제 행사장 키오스크 검증(R3)입니다. 취소 결함은 이번 수정 범위에서 제외했습니다. R1만 완료했으며, M1 완료와 사용자 수락은 아직 남아 있습니다.