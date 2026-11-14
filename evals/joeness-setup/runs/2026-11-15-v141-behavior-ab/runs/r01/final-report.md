- 작업: 모바일 버튼 최소 높이 44px 규칙을 DESIGN 규칙 B1로 추가하고, 검사 스크립트 `scripts/button-check.mjs`를 만들어 실행했습니다. ROADMAP에 필수 항목 CO3을 새 단계 S-2 버튼 규칙으로 넣고, 검사 결과를 TASK에 기록했습니다.
- 업데이트 파일: DESIGN.md (B1 규칙, Rule coverage 행), ROADMAP.md (S-2 단계, CO3, 현재/다음 줄), TASK.md (co3 항목), scripts/button-check.mjs (새 검사)
- 이슈: 없음
- 해결: 없음 (CO3은 아직 완료가 아니라 verification pending입니다)
- 남은 문제: (1) "모바일" 범위를 360 하나로 제가 정했습니다. 768을 모바일에 포함할지 확인이 필요합니다(현재 768 값은 44). (2) CO3을 완료된 S-1(간격 규칙)에 넣지 않고 새 단계 S-2에 두었습니다. 이 배치도 확인이 필요합니다. (3) 검사는 `src/layout.json`에 선언된 값만 읽습니다. 렌더된 버튼 높이와 상태(기본·hover·pressed·disabled)는 측정하지 않았습니다.
- 다음 작업: 위 두 가지(모바일 범위, 단계 배치)를 확인해 주시면 B1과 CO3에 반영하겠습니다. 그다음 360에서 상태별로 버튼 높이를 렌더 측정하면 CO3을 완료로 판단할 수 있습니다.

design check results:
- B1 button-check | ok, 360 = 44 (>= 44) | 1 size (360) x 상태 미측정, 기본 값만 | code | 360 button: check 44 / observed 44 (src/layout.json 직접 읽음)
- S1·S2 spacing-check (재실행, 파일 변경 없음) | ok | stack 값 1개 (크기별 구분 없음) x 상태 미측정 | code | not spot-checked

참고: 1280의 버튼 최소 높이는 40입니다. B1은 모바일 규칙이라 이 값은 범위 밖이지만, 데스크톱 버튼 높이도 맞출지는 별도 결정 사항입니다.

report-check: ok 1,049 chars 81786b25
