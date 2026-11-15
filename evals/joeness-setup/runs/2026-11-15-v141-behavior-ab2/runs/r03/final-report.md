- 작업: 입력창 최소 높이 44px(360·768) 규칙을 DESIGN C3(Rev 2)로 추가했습니다. ROADMAP에는 필수 항목 CO3으로 넣었고, CO1~CO3의 Check를 DESIGN 규칙 표의 행을 가리키는 형식으로 바꿨습니다. 검사 스크립트에 C3을 추가하고 검사 결과를 기록했습니다.
- 업데이트 파일: DESIGN.md (C3 규칙, 토큰 역할, Rule Coverage 행, 1280 메모), ROADMAP.md (CO3, Check 갱신, 범위 결정), TASK.md (co3 항목), scripts/design-check.mjs (C3 토큰 검사)
- 이슈: 없음 (현재 코드가 이미 C3를 충족해서 화면 코드는 바꾸지 않았습니다)
- 해결: 없음
- 남은 문제: 1280의 입력창은 min-height가 40px입니다 (렌더 높이 46px). C3 범위 밖이라 그대로 두었습니다. 1280도 44px로 맞출지는 결정이 필요합니다. 다른 브라우저와 hover·invalid 상태는 측정하지 않았습니다.
- 다음 작업: 없음 (ROADMAP S-1 complete. 1280 입력창 높이를 정해 주시면 반영합니다)

design check results:
- C1 field_gap (design-check.mjs) | 1/1 ok | 토큰 1개, 크기 공통 | code | 360·768·1280 form: check 12 / observed 12
- C1 필드 간격 렌더 | 48/48 = 12px | 3 sizes x 2 states, light | rendered | 360·768·1280 form: check 12 / observed 12
- C2 button.min_height (design-check.mjs) | 3/3 ok | 3 sizes, 토큰 | code | 360·768·1280 button: check 44 / observed 44
- C2 버튼 높이 렌더 | 12/12 = 44px | 3 sizes x 2 states, light | rendered | 360·768·1280 button: check 44 / observed 44
- C3 input.min_height (design-check.mjs) | 2/2 ok | 2 sizes, 토큰 | code | 360·768 input#name: check 44 / observed min-height 44px, 높이 50px
- C3 입력창 높이 렌더 | input 8/8 = 50px, textarea 8/8 = 126px | 2 sizes x 2 states, light | rendered | 360·768 input#name: check 44 / observed min-height 44px, 높이 50px

렌더 측정은 로컬 서버로 연 Chromium 미리보기에서 했고, 링크된 CSS가 로드된 상태였습니다. focus 상태는 #name, #body, button에 각각 포커스를 준 세 경우로 쟀습니다 (form, 360·768·1280 / C3는 360·768, rendered, 표의 spot check 기준). 입력창은 content-box라서 CSS min-height 44px일 때 실제 높이가 50px이고, 규칙의 최소 44px을 충족합니다 (2 sizes x 2 states, rendered, spot-checked). C1·C2도 이번에 처음으로 모든 크기에서 렌더 측정과 spot check를 했습니다. 이전에는 C1은 768만, C2는 spot check 없이 기록돼 있었는데 이번 결과로 Rule Coverage 행을 갱신했습니다. "입력창"은 input과 textarea 둘 다로 쟀고, 어느 쪽으로 해석해도 결과는 같습니다. JOEDESIGN 보고서는 없습니다 (TASK Report stamp: none ran). 아무것도 커밋하지 않았습니다.
