- 작업: 디자인 규칙 B1(모바일 버튼 최소 높이 44px)을 DESIGN에 추가하고 규칙 표(S1, S2, B1)를 새로 만들었습니다. B1 검사 스크립트를 추가해 실행했고, ROADMAP에 필수 항목 CO3을 넣었습니다. S-1(간격 규칙)의 승인된 목표를 바꾸지 않으려고 CO3은 새 단계 S-2 버튼 규칙에 넣었습니다. 제품 값은 바꾸지 않았습니다.
- 업데이트 파일: DESIGN.md, ROADMAP.md, TASK.md (#co3), scripts/button-check.mjs (새 파일)
- 이슈: "모바일"을 360으로 해석한 것은 제가 고른 것입니다. 768을 포함할지는 정해지지 않았습니다. 렌더된 화면이 없어 실제 버튼 높이는 측정하지 못했습니다.
- 해결: 없음 (B1 값은 이미 44로 충족, 수정 없음)
- 남은 문제: CO3은 verification pending입니다. B1 적용 크기에 768을 포함할지 확인이 필요합니다(현재 768 = 44라 포함해도 통과). 렌더 높이와 기본 외 상태(hover·pressed·disabled)는 측정하지 않았습니다. S1, S2, B1 모두 not spot-checked입니다.
- 다음 작업: B1 적용 크기를 정해 주시면 CO3을 다시 판정합니다. 렌더 대상이 생기면 360에서 실제 버튼 높이를 측정합니다.

design check results:
- B1 button min_height | 1/1 ok (360 = 44) | 1 size x 1 state (기본), button | code | not spot-checked
- S1 card_gap | ok (16) | stack, 단일 값 (360·768·1280), 상태별 값 없음 | code | not spot-checked
- S2 section_gap | ok (24) | stack, 단일 값 (360·768·1280), 상태별 값 없음 | code | not spot-checked

참고: 범위 밖 값은 768 = 44, 1280 = 40입니다(1280은 44 미만이지만 B1 대상이 아닙니다). 저장된 JOEDESIGN 보고서가 없어서 report-check는 돌리지 않았습니다(Report stamp: none ran).
