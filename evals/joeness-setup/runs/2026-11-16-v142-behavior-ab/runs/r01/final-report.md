- 작업: 디자인 규칙 C3(입력창 최소 높이 44px, 360·768)을 DESIGN Rev 2로 추가하고 검사(토큰 + 렌더 측정)를 돌려 결과를 기록함. ROADMAP에 필수 항목 CO3을 넣고 CO1~CO3의 Check를 DESIGN 규칙 표 행 기준으로 바꿈.
- 업데이트 파일: DESIGN.md(C3 규칙·토큰 역할·규칙 표 C3 행과 Result 열, C2 행 spot check), ROADMAP.md(CO3 추가, Check 갱신, 완료 조건), TASK.md(co3 기록), scripts/design-check.mjs(C3 토큰 검사 추가), work/reports/2026-11-16-co3.md(이 보고서).
- 이슈: C3 토큰 검사는 tokens.json의 min-height 값(44)만 읽고 CSS나 렌더 높이를 읽지 않음. 실제 렌더 높이는 50px(padding·border 포함)이라 두 값이 다름.
- 해결: 없음
- 남은 문제: C1 렌더 측정은 768만, C2 렌더 측정은 360 기본만이고 focus는 미측정. 1280 입력창(현재 40px)과 textarea는 C3 범위 밖이라 검사하지 않음. 커밋은 하지 않음.
- 다음 작업: 없음 (ROADMAP 다음 규칙 대기). 원하면 C1·C2의 남은 크기·focus 렌더 측정, 그리고 커밋.

design check results:
- C1 field_gap token | 1/1 ok | 1 token (all sizes) x 기본, light | code | 768 form: check 12 / observed 12 (기존 행)
- C2 button.min_height token | 3/3 ok | 3 sizes x 기본, light | code | 360 버튼 기본: check 44 / observed 44
- C3 input.min_height token | 2/2 ok | 2 sizes (360·768) x 기본, light | code | 768 이름 input: check 44 / observed 50 (토큰은 min-height 값, 렌더 높이 아님)
- C3 input rendered height ≥ 44 | 4/4 ok (50px) | 2 sizes (360·768) x 2 states (기본·focus), light | rendered | 768 이름 input focus: check 50 / observed 50 (캡처 테두리)

상세 보고: 코드(src/style.css, src/tokens.json)는 바꾸지 않음; 현재 값이 이미 규칙을 만족함 (C3 렌더 4/4, 2 sizes x 2 states, rendered, spot check 768 focus 50 / 50). "입력창"은 `input` 요소로 해석함; textarea는 360에서 렌더 126px로 44 이상이지만 이 규칙의 검사 대상이 아님. 렌더 측정은 로컬 정적 서버에서 페이지가 자체 CSS를 불러온 상태로 했음. 기존 규칙 표에 Result 열을 붙였고 표를 새로 만들지 않음.

report-check: ok 1,506 chars bebbb2b5
