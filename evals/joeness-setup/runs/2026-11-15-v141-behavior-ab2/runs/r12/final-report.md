- 작업: 디자인 규칙 C3(입력창 최소 높이 44px, 360·768) 추가, 검사 스크립트에 C3 추가, ROADMAP 필수 항목 CO3 추가와 CO1~CO3 Check를 규칙 표 행 기준으로 갱신
- 업데이트 파일: DESIGN.md (C3 규칙·토큰 역할·규칙 표 행, Rev 2), scripts/design-check.mjs (C3 검사), ROADMAP.md (CO3, Check 갱신), TASK.md (co3 기록), work/reports/2026-11-15-co3.md (이 보고)
- 이슈: C3의 "입력창"에 textarea(요청 내용)가 들어가는지 요청에서 정해지지 않음
- 해결: 없음
- 남은 문제: textarea를 C3에 넣을지 소유자 확인 필요 (지금은 input만 검사); C2 focus 상태 미측정
- 다음 작업: textarea 포함 여부 결정; 변경 커밋은 요청 시

design check results:
- C1 field_gap | 1/1 | 3 sizes x 2 states, light | code | 768 form: check 12 / observed 12
- C2 button.min_height | 3/3 | 3 sizes x 1 state, light | code | 360·768·1280 form button: check 44 / observed 44
- C3 input.min_height | 2/2 | 2 sizes x 2 states, light | code | 360·768 form #name: check 44 / observed 44
- C3 input rendered min-height | 4/4 | 2 sizes x 2 states, light | rendered | 360·768 form #name: check 44 / observed 44

C3 토큰 검사는 `node scripts/design-check.mjs`로 돌렸고 (2 sizes x 2 states, code, spot check 360·768 #name: check 44 / observed 44), 렌더 관찰은 로컬 서버로 페이지가 자기 CSS를 불러온 상태에서 #name의 computed min-height를 읽었다 (2 sizes x 2 states, rendered, spot check 360·768 #name: check 44 / observed 44). 렌더 박스 높이는 패딩·테두리 포함 50px.
1280은 요청대로 C3 범위 밖이다. 참고로 토큰 input.min_height@1280은 40, 렌더 박스 높이는 46.
검사 스크립트를 바꿨으므로 C1·C2 행도 다시 돌렸고, C2에는 이번에 렌더 spot check(360·768·1280 버튼 높이 44)를 기록했다. C2 focus 상태는 여전히 미측정이다.
DESIGN.md는 Rev 2로 올렸고, 승인 근거는 이번 사용자 요청 원문이다. CO1~CO3과 S-1은 complete로 두었다.

report-check: ok 1,465 chars 51342c9f
