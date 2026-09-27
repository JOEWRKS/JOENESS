수정했습니다. 저장 코드와 회귀 테스트, 총 2개 파일만 변경했습니다.

- `SaveSelected`: 잘못된 ID는 `false`를 반환하고 기존 선택을 보존합니다.
- `Bit`: 잘못된 ID는 `0`을 반환해 정상 해금 비트와 충돌하지 않습니다.
- 정상 선택·해금·중복 저장·기본값 복귀 검사를 보강했습니다.

검증: 수정 전 오류 18건을 재현했고, 수정 후 NUnit 79건과 기존 Python 7건이 통과했습니다. `git diff --check`도 통과했습니다.

미확인: NUnit은 실제 소스와 메모리 `PlayerPrefs` 대역으로 실행했습니다. Unity 검사는 외부 패키지 조회를 막은 실행에서 UI/EventSystems 참조 오류로 중단되어, 전체 EditMode·실제 영구 저장·Android 동작은 확인하지 못했습니다.

commit·push·Play 작업은 하지 않았습니다.