- 작업: 입력창(`input`) 최소 높이 44px(360·768) 규칙을 DESIGN Rev 2의 C3으로 추가하고, `scripts/design-check.mjs`에 C3 검사(토큰 input.min_height, 360·768)를 넣었고(결과는 아래 목록), ROADMAP에 필수 항목 CO3과 그 Check(DESIGN rule-coverage C3 행)를 넣었습니다. style.css·tokens.json은 변경하지 않았습니다.
- 업데이트 파일: DESIGN.md(Revision 2, 승인 범위, C3 결정, 토큰 역할 행, rule-coverage C3 행), scripts/design-check.mjs(C3 두 줄), ROADMAP.md(CO3, 완료 조건, Goal, Scope decisions, current/next 줄), TASK.md(co3 항목).
- 이슈: 없음 (새 결함 없음).
- 해결: 없음 (수정한 결함 없음, 규칙 추가 작업).
- 남은 문제: C3에서 측정하지 않은 부분은 미검증입니다. hover·invalid·disabled 상태, 그리고 검사 스크립트가 tokens.json만 읽고 style.css와 대조하지 않는 점입니다. 1280은 요청 범위 밖이며 현재 입력창이 40px입니다(C3 위반 아님). 기존 C2 행은 여전히 not spot-checked입니다(이번 작업 범위 밖).
- 다음 작업: 1280에도 입력창 44px를 적용할지 결정해 주시면 별도 항목으로 진행하겠습니다. CO1·CO2의 Check도 rule-coverage 행 형식으로 바꿀지 알려 주세요(바꾸면 CO2는 spot check 전까지 다시 열립니다).

design check results:
- C1 field_gap | 1/1 ok | 3 sizes x 1 state, light (single token) | code | 768 form: check 12 / observed 12
- C2 button.min_height | 3/3 ok | 3 sizes x 1 state, light | code | not spot-checked
- C3 input.min_height | 2/2 ok | 2 sizes x 1 state, light | code | 360·768 form #name: check 44 / observed 44
- C3 rendered input | 4/4 ok | 2 sizes x 2 states, light | rendered | 360·768 form #name: check 44 / observed 44

렌더 측정은 로컬 미리보기(127.0.0.1, 페이지가 자기 style.css를 로드함, 규칙 5개 확인)에서 360·768 각각 기본·focus 상태로 #name의 computed min-height와 실제 높이를 읽었습니다. 실제 높이는 50px(content-box min-height 44 + padding 2 + border 4)로 44px 이상입니다(2 sizes x 2 states, rendered, spot check 360·768 #name: check 44 / observed 44). textarea는 C3 대상이 아니며 참고로 126px로 관측됐습니다.
검사 스크립트를 바꿨으므로 같은 스크립트를 쓰는 C1·C2도 다시 실행했고 모두 ok입니다(C1: 3 sizes x 1 state, code, spot check 768 check 12 / observed 12; C2: 3 sizes x 1 state, code, not spot-checked).
CO3은 Check(DESIGN rule-coverage C3 행)를 통과해 complete로 기록했습니다(2 sizes x 2 states, rendered, spot check 360·768 #name: check 44 / observed 44). 커밋은 하지 않았습니다.
report-check: ok 1,916 chars b08652d0
