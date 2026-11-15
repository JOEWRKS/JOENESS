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

## co3 / 2026-11-15 / 입력창 최소 높이 44px (C3) 추가와 Check 갱신

Roadmap item: ROADMAP.md CO3 (CO1·CO2 Check도 DESIGN 규칙 행으로 갱신).
Result: DESIGN Rev 2에 C3·토큰 역할·규칙 행 추가; 검사 스크립트에 C3 토큰 검사 추가. 화면 코드 변경 없음.
Changed files: DESIGN.md, ROADMAP.md, scripts/design-check.mjs.
Check / target / result: node scripts/design-check.mjs 6/6 ok (code). 렌더 측정 (127.0.0.1 로컬 미리보기, 페이지 자체 CSS): C3 12/12 (#name 50·#body 126 ≥ 44, 2 sizes x 3 states); C1 간격 12 36/36 (3 sizes x 3 states); C2 button 44 9/9 (3 sizes x 3 states). States = 기본, focus #name, focus #body.
Evidence: 스폿 체크와 미측정 범위는 DESIGN.md#rule-coverage 각 행.
Limits: C2 not spot-checked → CO2 verification pending. 렌더 측정은 일회성 브라우저 스크립트 (저장소에 없음).
Report stamp: report-check: ok 2,030 chars 6490f84b (작업 보고; `node <joedesign>/scripts/report-check.mjs --verify` exit 0).
Completion boundaries: implementation 해당 없음 / technical 완료 / visual C3 완료, C2 spot check 대기 / user acceptance 해당 없음.
