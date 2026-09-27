수정했습니다. `Awake()`의 자동 인증 호출과 불필요해진 인증 메서드를 제거했습니다. 랭킹을 직접 열 때의 수동 인증 → 최고 점수 제출 → 조회 경로는 유지했습니다.

- 관련 검사: **20/20 통과**. 추가한 회귀 검사 2개는 수정 전 실패, 수정 후 통과했습니다.
- 전체 EditMode: **230개 중 216개 통과, 기존 14개 실패**. 실패 이름과 메시지가 수정 전과 정확히 같습니다.
- `git diff --check` 통과. 필요한 코드·검사 파일 4개만 변경했습니다.

실제 Android 기기의 인증 화면과 서버 통신은 미확인입니다. commit·push·Play 작업은 하지 않았습니다.

[전체 검사 결과](D:/JOEWRKS/JOENESS-Performance-AB-20260928/runs/deferred-ranking-auth-r1-bare/project/TestResults/deferred-auth-after.xml)