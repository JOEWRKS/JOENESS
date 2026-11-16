- 작업: 디자인 규칙 C3 "입력창 최소 높이 44px (360·768)"를 DESIGN.md Rev 2로 추가하고, 검사 스크립트에 C3 줄을 넣어 C1–C3을 다시 돌렸으며 360·768에서 렌더 관찰도 했습니다. ROADMAP에 필수 항목 CO3를 넣고, CO1–CO3의 Check를 스크립트 이름 대신 DESIGN 규칙 표의 행으로 바꿨습니다.
- 업데이트 파일: DESIGN.md (Rev 2, C3 결정, 입력 높이 토큰 행, Rule Coverage C3 행 추가, 기존 표에 Result 열 추가), ROADMAP.md (CO3 추가, 완료 조건 CO1–CO3, Check 갱신), scripts/design-check.mjs (C3 input.min_height@360·768 줄), TASK.md (co3 항목).
- 이슈: 없음.
- 해결: 없음 (고친 결함 없음. 기존 값이 이미 규칙을 충족).
- 남은 문제: C3의 textarea는 스크립트가 재지 않습니다 (렌더 관찰 126px만 있음, 360·768 기본). 1280에서는 입력창이 40px인데, 규칙이 360·768만 다루므로 위반이 아니라 범위 밖입니다. C1·C2는 이번에 토큰 값만 다시 쟀고 렌더 측정 범위는 이전과 같습니다.
- 다음 작업: 없음 (S-1 단계 complete, 다음 규칙 대기).

design check results:
- C1 필드 간격 | 1/1 | 360·768·1280 x 기본·focus, light | code | 768 form: check 12 / observed 12
- C2 버튼 최소 높이 | 3/3 | 3 sizes x 기본, light | code | not spot-checked
- C3 입력창 최소 높이 (토큰) | 2/2 | 2 sizes (360·768) x 기본·focus, light | code | 768 form #name: check 44 / observed 50
- C3 입력창 최소 높이 (렌더) | 4/4 | 2 sizes (360·768) x 2 states (기본·focus), light | rendered | 768 form #name: check 44 / observed 50

C3 렌더 관찰은 로컬 정적 서버(127.0.0.1)로 src/index.html을 열어 페이지가 자기 style.css를 불러온 상태에서 쟀습니다 (2 sizes x 2 states, rendered, 768 spot check 44/50). #name 입력창의 화면 높이는 50px로, min-height 44px에 안쪽 여백과 테두리가 더해진 값입니다. C3 규칙 추가는 사용자 요청(2026-11-17)에 따른 것이고, 1280을 범위 밖으로 둔 것도 요청 문구 그대로입니다. 변경 사항은 커밋했고 이 보고 파일은 커밋하지 않았습니다.

report-check: ok 1,393 chars dd7d7f6f
