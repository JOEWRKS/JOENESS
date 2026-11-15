- 작업: 입력창 최소 높이 44px(360·768)를 디자인 규칙 C3으로 추가하고(DESIGN Rev 2), ROADMAP 필수 항목 CO3을 넣었습니다. CO1–CO3의 Check는 스크립트 이름 대신 DESIGN.md 규칙 표의 행(C1·C2·C3)을 가리키도록 바꿨습니다. 토큰 검사와 렌더 측정을 돌려 결과를 TASK co3에 기록했습니다. 화면 코드(src/)는 바꾸지 않았습니다.
- 업데이트 파일: DESIGN.md, ROADMAP.md, TASK.md, scripts/design-check.mjs (커밋 안 함)
- 이슈: C2 규칙 행에 spot check가 없어(not spot-checked), Check를 그 행으로 바꾼 CO2는 complete에서 verification pending으로 내렸습니다. 그래서 S-1 단계도 in progress로 돌아갔습니다.
- 해결: CO3 complete (C3 렌더 측정 12/12 (2 sizes x 3 states, rendered; spot check 768 #name: check 50 / observed 약 50)).
- 남은 문제: CO2 verification pending (C2 렌더 측정 9/9 (3 sizes x 3 states, rendered; not spot-checked)). C3 미측정 범위는 오류(invalid) 상태와 다크 모드이고, 토큰 검사는 textarea를 보지 않습니다. 렌더 측정은 일회성 브라우저 스크립트로 돌렸고 저장소에 없습니다.
- 다음 작업: 768 등 한 대상에서 버튼 테두리를 1px 정밀도로 직접 관찰해 C2 spot check를 채우고 CO2를 닫습니다.

design check results:
- C1 field_gap 토큰 | 1/1 | 토큰 1개 (크기·상태 무관) | code | 768 form: check 12 / observed 12
- C2 button.min_height 토큰 | 3/3 | 3 sizes, 토큰 | code | not spot-checked
- C3 input.min_height 토큰 | 2/2 | 2 sizes (360·768), 토큰 | code | 768 #name: check 50 / observed 약 50 (캡처 테두리, ±2px)
- C1 필드 간격 12px | 36/36 | 3 sizes x 3 states, light | rendered | 768 form: check 12 / observed 12
- C2 버튼 높이 ≥ 44px | 9/9 | 3 sizes x 3 states, light | rendered | not spot-checked
- C3 입력창 높이 ≥ 44px | 12/12 | 2 sizes x 3 states, light | rendered | 768 #name: check 50 / observed 약 50 (캡처 테두리, ±2px)

상태 3개는 기본, focus #name, focus #body입니다. 렌더 측정은 src/를 127.0.0.1 로컬 미리보기로 띄우고, 페이지 자체 CSS를 그대로 읽은 상태에서 했습니다.

C3 측정값: #name 50px (CSS min-height 44px에 padding·border가 더해진 값), #body 126px로 360·768 모두 44px 이상입니다 (12/12 (2 sizes x 3 states, rendered; spot check 768 #name: check 50 / observed 약 50)). 1280에서는 input min-height가 40px(렌더 46px)인데, 요청하신 규칙 범위(360·768) 밖이라 위반으로 치지 않았습니다.

"입력창"은 이름 input과 요청 내용 textarea를 모두 포함하는 것으로 해석했습니다. 둘 다 44px 이상이라 어느 해석이든 결과는 같습니다. 토큰(input.min_height)은 input에만 있습니다.

C2 spot check는 768 캡처에서 버튼 높이를 눈으로 약 44px로 봤지만, 정밀도가 ±2px이라 44px 경계를 판정할 수 없어 not spot-checked로 남겼습니다.

report-check: ok 2,030 chars 6490f84b
