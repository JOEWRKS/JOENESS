작업: 랭킹 인증·랭킹 창 수리 상태를 읽기 전용으로 인수인계.  
업데이트 파일: 이번 턴 없음. 기존 변경은 아래 구분.  
이슈: 관련 집중 검사는 통과했지만 전체 검사에는 기존 실패 14건이 남음.  
해결: 없음. 파일 수정·재구현·검사 재실행 없이 기존 증거만 확인.  
남은 문제: 현재 변경본의 Android 빌드·실기기 검증과 사용자 수락 없음.  
다음 작업: 현재 변경본으로 Android 검증을 진행하고 기존 실패 14건은 별도 대응.

- **인증 수리 — 커밋 `72abb8d`에 포함.** `Awake()`의 자동 인증 호출과 `AuthenticateOnce()`를 제거했다. 명시적인 랭킹 열기·재시도의 `Load()`에서 수동 인증하며, 인증된 세션 재사용과 저장 점수 제출·조회는 유지한다. 변경 파일은 [GameController.cs](D:/JOEWRKS/JOENESS-Handoff-Continuation-AB-20260928/joeness/project/game/Assets/MergeDrop/Scripts/Runtime/GameController.cs), [PlayGamesLeaderboard.cs](D:/JOEWRKS/JOENESS-Handoff-Continuation-AB-20260928/joeness/project/game/Assets/MergeDrop/Scripts/Platform/PlayGamesLeaderboard.cs), [GameControllerStateTests.cs](D:/JOEWRKS/JOENESS-Handoff-Continuation-AB-20260928/joeness/project/game/Assets/MergeDrop/Tests/EditMode/GameControllerStateTests.cs), [PlayGamesLeaderboardTests.cs](D:/JOEWRKS/JOENESS-Handoff-Continuation-AB-20260928/joeness/project/game/Assets/MergeDrop/Tests/EditMode/PlayGamesLeaderboardTests.cs), `TASK.md`.

- **랭킹 창 수리 — 미커밋.** 다섯째 행 일부가 보이던 높이 약 430.92를 **388 = 88×4 + 12×3**으로 고정했다. 내 순위 행은 스크롤 밖 하단에 유지한다. 저장된 씬과 마이그레이션 재적용 양쪽에서 25개 행의 처음·마지막 네 행 및 내 순위 고정을 검사한다. 변경 파일은 [Game.unity](D:/JOEWRKS/JOENESS-Handoff-Continuation-AB-20260928/joeness/project/game/Assets/MergeDrop/Scenes/Game.unity), [SkinLeaderboardUiMigration.cs](D:/JOEWRKS/JOENESS-Handoff-Continuation-AB-20260928/joeness/project/game/Assets/MergeDrop/Editor/SkinLeaderboardUiMigration.cs), [SkinLeaderboardUiTests.cs](D:/JOEWRKS/JOENESS-Handoff-Continuation-AB-20260928/joeness/project/game/Assets/MergeDrop/Tests/EditMode/SkinLeaderboardUiTests.cs), [TASK.md](D:/JOEWRKS/JOENESS-Handoff-Continuation-AB-20260928/joeness/project/TASK.md:687). 인증 구현은 다시 변경하지 않았다.

- **Git 구분:** 현재 `M` 표시는 6개지만 내용 diff는 위 랭킹 창 관련 4개다. 나머지 `game/Assets/MergeDrop/Art/UI/SettingsIcon.png.meta`, `game/ProjectSettings/TimeManager.asset`는 기록상 기존 변경이며 이번 수리 성과에 포함하지 않는다.

저장된 `TestResults/*.xml`과 로그에서 확인한 결과:

| 작업 | 수정 전 | 수정 후 집중 검사 | 수정 후 전체 검사 |
|---|---|---|---|
| 인증 (`deferred-ranking-*`) | 214/230 통과, 16 실패 | 40/40 통과 | 216/230 통과, 14 실패 |
| 랭킹 창 (`ranking-layout-*`) | 새 회귀 검사 2/2 실패 | 54/54 통과 | 218/232 통과, 14 실패 |

남은 14건은 세 전체 결과에서 **실패 이름·메시지가 동일**하다. `VisualSetControllerTests` 12건은 기본 비주얼 세트 누락·불완전 예외, `VisualSetUiTests` 2건은 `False` 기대에 `True`가 나온 실패다. 초기 `-noUpm` 실행은 UI 참조 오류로 검사를 시작하지 못했으며 이후 정상 패키지 해석으로 실행됐다. `git diff --check` 통과는 TASK의 기존 기록이며 이번에 재실행하지 않았다.

EditMode 통과는 Android SDK 인증 증거가 아니다. **시작 시 로그인 미발생, 랭킹 진입 인증·취소·오프라인·실제 점수 제출/조회, 네 행 렌더링·터치 스크롤·내 순위 고정**을 현재 변경본의 실기기에서 확인해야 한다. 과거 출시·기기 완료 기록을 이번 변경의 수락 증거로 승계하지 않는다.