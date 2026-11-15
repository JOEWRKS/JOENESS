- 작업: 입력창 최소 높이 44px(360·768) 규칙을 DESIGN Rev 2의 C3으로 추가하고, `scripts/design-check.mjs`에 C3 토큰 검사를 넣고, 브라우저 렌더 측정으로 C1·C2·C3을 다시 쟀습니다. ROADMAP에 필수 항목 CO3을 넣고 CO1·CO2·CO3의 Check를 DESIGN 규칙 표 행(`DESIGN.md#rule-coverage` C1·C2·C3)으로 바꿨습니다. CO3은 complete입니다.
- 업데이트 파일: DESIGN.md, ROADMAP.md, TASK.md, scripts/design-check.mjs (커밋하지 않음)
- 이슈: 없음
- 해결: 없음 (고친 결함 없음, 규칙 추가)
- 남은 문제: 규칙 상태 범위 안에서 C1 focus 상태의 렌더 간격은 측정하지 않았습니다 (토큰 검사만). 768·1280 캡처 관찰은 하지 못했습니다 (브라우저 창이 표시되지 않아 캡처 시간 초과). 1280 입력창은 C3 밖이라 판정하지 않았습니다 (토큰 40, 렌더 46px).
- 다음 작업: 없음 (S-1 완료, 다음 규칙 대기). 변경 커밋은 요청 시 진행합니다.

design check results:
- C1 design-check.mjs field_gap | 1/1 ok | 1 token x 2 states, light | code | 768 form: check 12 / observed 12
- C1 gap render | 12/12 | 3 sizes x 1 state, light | rendered | 768 form: check 12 / observed 12
- C2 design-check.mjs button.min_height | 3/3 ok | 3 sizes x 2 states, light | code | 360 button: check 44 / observed 약 44 (캡처, ±2px 정밀도)
- C2 button height render | 6/6 | 3 sizes x 2 states, light | rendered | 360 button: check 44 / observed 약 44 (캡처, ±2px 정밀도)
- C3 design-check.mjs input.min_height | 2/2 ok | 2 sizes x 2 states, light | code | not spot-checked
- C3 input height render | 8/8 | 2 sizes x 2 states, light | rendered | 360 #name: check 50 / observed 약 50 (캡처, ±2px 정밀도)

C3 렌더 측정은 #name(input)과 #body(textarea)를 함께 쟀습니다. input은 테두리 포함 50px, textarea는 126px로 둘 다 44px 이상입니다 (2 sizes x 2 states, rendered, spot check 360 #name: check 50 / observed 약 50). 토큰 검사는 CSS min-height 값(44)만 읽고 렌더 높이(50)와 다르므로, C3의 판정은 렌더 측정 줄을 기준으로 DESIGN 표에 적었습니다.

C2는 이전에 not spot-checked였는데 이번 렌더 측정과 캡처 관찰로 행을 갱신했습니다. 캡처 관찰의 정밀도가 ±2px라서 44px 경계값은 렌더 측정 줄이 판정 근거입니다.

렌더 측정은 로컬 정적 서버로 `src/index.html`을 열고 360·768·1280에서 getBoundingClientRect로 쟀습니다. 페이지는 자기 style.css를 읽었습니다. 측정용 서버와 임시 설정은 정리했고 저장소에 남기지 않았습니다.

report-check: ok 1,819 chars bf586008
