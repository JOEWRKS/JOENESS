- 작업: DESIGN을 Rev 2로 올려 디자인 규칙 C3(입력창 최소 높이 44px, 360·768)을 추가했습니다(규칙, 토큰 역할, Rule Coverage 행). `scripts/design-check.mjs`에 C3 검사를 넣었습니다. ROADMAP S-1에 필수 항목 CO3를 추가했고, CO1~CO3의 Check는 스크립트 이름 대신 DESIGN Rule Coverage 표의 행을 가리키게 고쳤습니다. 검사 결과는 TASK `co3` 항목에 남겼습니다. 기존 값이 이미 규칙을 충족해서 src는 바꾸지 않았습니다.
- 업데이트 파일: DESIGN.md, ROADMAP.md, TASK.md, scripts/design-check.mjs (커밋하지 않음)
- 이슈: 없음
- 해결: CO3 complete (C3 2/2 통과: 360·768, 기본·focus, code; spot check 768 form: check 44 / observed 50)
- 남은 문제: C3 검사는 tokens.json 값만 읽고 CSS나 렌더 결과는 읽지 않습니다. 렌더 관찰은 이번 1회뿐입니다. textarea는 토큰이 없어 검사 대상이 아니고, 렌더 126px만 관찰했습니다.
- 다음 작업: 없음 (변경 커밋은 요청하시면 진행합니다)

design check results:
- C1 필드 간격 | 1/1 ok | 360·768·1280 토큰 값, light | code | 768 form: check 12 / observed 12
- C2 버튼 최소 높이 | 3/3 ok | 360·768·1280 x 기본, light | code | 768 form: check 44 / observed 44
- C3 입력창 최소 높이 | 2/2 ok | 360·768 x 기본·focus, light | code | 768 form: check 44 / observed 50

렌더 관찰은 브라우저 미리보기에서 로컬 서버로 `src/index.html`을 열어 했습니다(링크된 CSS 로드 확인). 이름 input의 렌더 높이는 360·768에서 기본·focus 모두 50px입니다. min-height 44px에 padding과 border가 더해진 값이라 44px 이상을 만족합니다(360·768 x 기본·focus, rendered, spot check 768 form: check 44 / observed 50). C2는 이번에 768·1280에서 버튼 44px를 관찰해 Spot check 칸을 "not spot-checked"에서 관찰값으로 바꿨습니다. 360 렌더와 focus 상태는 여전히 측정하지 않았습니다.

1280에서는 input.min_height가 40(렌더 46px)입니다. 요청하신 대로 C3 범위가 360·768이라 위반은 아닙니다. 1280까지 넓히시려면 규칙과 코드를 함께 바꿔야 합니다.
