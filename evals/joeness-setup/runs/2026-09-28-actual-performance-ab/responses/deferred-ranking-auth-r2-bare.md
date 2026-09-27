수정했습니다. 게임 시작 시 인증 호출과 자동 인증 메서드를 제거했습니다. 랭킹을 명시적으로 열 때의 수동 인증·점수 제출·조회 경로는 유지했습니다.

- 새 회귀 검사 2개: 수정 전 실패 → 수정 후 통과.
- 랭킹 관련 검사: **34개 모두 통과**.
- 전체 EditMode: 수정 전 214/228, 수정 후 **216/230 통과**. 기존 실패 14개의 이름과 실패 메시지가 동일합니다.
- `git diff --check` 통과.

[전체 검사 결과](/D:/JOEWRKS/JOENESS-Performance-AB-20260928/runs/deferred-ranking-auth-r2-bare/project/TestResults/editmode-after.xml)

실기기 인증·오프라인 동작과 Android 빌드는 미확인입니다. commit·push·Play 작업은 하지 않았습니다.