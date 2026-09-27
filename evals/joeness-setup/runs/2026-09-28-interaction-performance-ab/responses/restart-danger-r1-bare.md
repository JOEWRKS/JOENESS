수정했습니다. 새 판 시작 시 위험 누적 시간과 추적 과일 목록을 함께 초기화합니다. 위험이 새로 2초간 지속되면 정상적으로 게임오버됩니다. 다른 게임 규칙과 화면은 변경하지 않았습니다.

- **확인:** 로컬 캐시를 임시 연결한 오프라인 Unity 검사 **27개 통과**(기존 24개 + 회귀 3개). `git diff --check` 통과.
- **오류 재현:** 초기화 호출을 제거하면 재시작 검사 2개가 실패하는 것도 확인했습니다.
- **미확인:** Android 빌드·실기기 플레이·실시간 물리 트리거 검증.

[검사 조건과 결과 기록](/D:/JOEWRKS/JOENESS-Interaction-AB-20260928/runs/restart-danger-r1-bare/project/TestResults/restart-danger-verification.md)

임시 검사 파일은 게임 소스에서 분리했습니다. commit·push·Play 배포는 하지 않았습니다.