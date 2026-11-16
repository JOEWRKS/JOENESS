- 작업: 입력창 최소 높이 44px(360·768)를 DESIGN 규칙 C3(Rev 2)로 추가하고, Rule Coverage 표에 C3 행과 Result 열(최신 TASK 링크)을 더했습니다. 새 표는 만들지 않았습니다. scripts/design-check.mjs에 C3 검사를 넣고 다시 돌렸습니다. ROADMAP에 필수 항목 CO3를 넣었고, CO1·CO2·CO3의 Check를 스크립트 이름 대신 DESIGN Rule Coverage의 C1·C2·C3 행으로 바꿨습니다. src는 이미 360·768에서 44px이라 고치지 않았습니다.
- 업데이트 파일: DESIGN.md, ROADMAP.md, TASK.md (co3 항목), scripts/design-check.mjs. 커밋하지 않았습니다.
- 이슈: 없음.
- 해결: 없음 (고친 결함 없음).
- 남은 문제: CO3는 verification pending입니다. C3 결과는 토큰 값(code)만 읽은 2/2 ok이고 not spot-checked입니다. 렌더 높이와 focus 상태는 측정하지 않았고(이 기계에 Playwright 없음), textarea는 C3 검사 대상이 아닙니다. CO3를 새 단계가 아닌 S-1에 넣은 것은 제가 고른 것이라 확인이 필요합니다. CO2(C2)도 여전히 not spot-checked에 렌더 미측정인데 ROADMAP에는 complete로 남아 있습니다. 상태를 바꿀지 결정해 주세요.
- 다음 작업: 360·768에서 input 렌더 높이를 측정하고 C3 spot check를 기록하면 CO3를 complete로 바꿀 수 있습니다. CO3를 둘 단계와 CO2 상태도 확인해 주세요.

design check results:
- C1 field_gap | 1/1 | 1 size(토큰, 크기 무관) x 기본, light | code | 768 form: check 12 / observed 12
- C2 button.min_height | 3/3 | 3 sizes x 1 state, light | code | not spot-checked
- C3 input.min_height | 2/2 | 2 sizes x 1 state, light | code | not spot-checked

참고: src/style.css를 읽어 보니 input은 1280 이상에서 min-height 40px입니다. C3 범위(360·768) 밖이라 위반은 아니지만 C2의 터치 높이 44px과는 다릅니다(코드를 읽은 결과이며 렌더 측정은 아님).

report-check: ok 1,252 chars 5b5d55e4
