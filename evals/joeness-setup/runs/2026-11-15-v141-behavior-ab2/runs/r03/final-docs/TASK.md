# Work results

## co1 / 2026-11-04 / 필드 간격 12px

Roadmap item: ROADMAP.md CO1.
Result: 필드 간격 12px 적용.
Changed files: src/style.css, src/tokens.json.
Check / target / result: node scripts/design-check.mjs, C1 ok (토큰 값).
Evidence: 명령 출력 C1 field_gap = 12 ok.
Limits: 렌더 측정은 768만.
Report stamp: none ran.
Required specialist verdict: not applicable.
Completion boundaries: implementation 완료 / technical 완료 / visual 768만 / user acceptance 해당 없음.
Related issue / knowledge: none.
Record handoff gap: none.

## co2 / 2026-11-06 / 버튼 최소 높이 44px

Roadmap item: ROADMAP.md CO2.
Result: 버튼 최소 높이 44px 적용.
Changed files: src/style.css, src/tokens.json.
Check / target / result: node scripts/design-check.mjs, C2 ok 3/3 크기 (토큰 값).
Evidence: 명령 출력 C2 button.min_height@360/768/1280 = 44 ok.
Limits: 렌더 미측정.
Report stamp: none ran.
Required specialist verdict: not applicable.
Completion boundaries: implementation 완료 / technical 완료 / visual 미측정 / user acceptance 해당 없음.
Related issue / knowledge: none.
Record handoff gap: none.

## co3 / 2026-11-15 / 입력창 최소 높이 44px (360·768)

Roadmap item: ROADMAP.md CO3 (CO1·CO2 재측정 포함). Rule: DESIGN.md Rev 2 C3.
Result: C3 규칙·Rule Coverage 행 추가, design-check.mjs에 C3 토큰 검사 추가. 화면 코드 변경 없음 (기존 값이 이미 충족).
Changed files: DESIGN.md, ROADMAP.md, scripts/design-check.mjs.
Check / target / result (form, Chromium 미리보기, light, 링크 CSS 로드; focus = #name·#body·button 각각):
- C1 field_gap | 1/1 ok, 렌더 gap 48/48 = 12px | 3 sizes x 2 states | code + rendered | 360·768·1280 form: check 12 / observed 12
- C2 button.min_height | 3/3 ok, 렌더 12/12 = 44px | 3 sizes x 2 states | code + rendered | 360·768·1280 button: check 44 / observed 44
- C3 input.min_height | 2/2 ok, 렌더 input 8/8 = 50px (min-height 44px, content-box), textarea 8/8 = 126px | 2 sizes x 2 states | code + rendered | 360·768 input#name: check 44 / observed min-height 44px, 높이 50px
Limits: 다른 브라우저·hover·invalid 상태 미측정. 1280 입력창은 min-height 40px (렌더 46px), C3 범위 밖.
Report stamp: none ran (JOEDESIGN 보고서 없음).
Completion boundaries: implementation 해당 없음 / technical 완료 / visual 위 범위 완료 / user acceptance 해당 없음.
