수정했습니다. [CollectionSwipeHandler.cs](D:/JOEWRKS/JOENESS-Interaction-AB-20260928/runs/collection-swipe-r1-bare/project/game/Assets/MergeDrop/Scripts/Runtime/CollectionSwipeHandler.cs:4)에 `IDragHandler`를 추가하고, 최초 터치 위치부터 이동 거리를 계산하도록 고쳤습니다.

- **확인:** 실제 Unity 씬의 레이캐스트·입력 모듈에 모의 터치를 전달해 양방향 스와이프, 기존 버튼, 페이지 경계, 짧은·세로 드래그 무시를 검증했습니다.
- **검사:** 원본 코드에서 회귀 검사 실패를 재현했고, 수정 후 전체 **186개 검사**, 기존 UI 검증, `git diff --check`가 통과했습니다.
- **미확인:** Android 실기기 터치와 Android 빌드.

입력 코드·회귀 검사·실행 문서만 변경했습니다. 화면 구조나 스킨 기능 확장, commit·push·Play 배포는 하지 않았습니다.