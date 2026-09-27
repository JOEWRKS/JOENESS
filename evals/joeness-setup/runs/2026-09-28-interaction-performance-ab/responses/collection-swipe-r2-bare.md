수정했습니다. [드래그 처리기](/D:/JOEWRKS/JOENESS-Interaction-AB-20260928/runs/collection-swipe-r2-bare/project/game/Assets/MergeDrop/Scripts/Runtime/CollectionSwipeHandler.cs:4)에 누락된 `IDragHandler`를 추가해 Unity UI가 드래그 대상으로 인식하도록 했습니다.

- 수정 전: 드래그 대상 탐색 검사 2건 실패로 원인 재현.
- 수정 후: 관련 검사 **25/25**, 전체 EditMode 검사 **190/190 통과**.
- 양방향 스와이프, 기존 화살표, 목록 양끝 제한, 짧거나 수직인 드래그 무시를 확인했습니다.
- 미확인: 실제 Android 터치와 렌더링 기반 레이캐스트. 자동 검사는 입력 표면을 지정한 뒤 Unity의 터치·드래그 처리 경로를 실행했습니다.

처리기와 테스트 파일만 변경했습니다. 화면 구조·스킨 기능 확장 및 commit·push·Play 배포는 하지 않았습니다.