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

## co3 / 2026-11-17 / 입력창 최소 높이 44px

Roadmap item: ROADMAP.md CO3 (CO1·CO2 Check도 DESIGN 규칙 표 행으로 갱신).
Result: DESIGN Rev 2에 C3 추가 (사용자 요청), scripts/design-check.mjs에 C3 검사 추가. 구현 코드 변경 없음 (style.css·tokens.json이 이미 44).
Changed files: DESIGN.md, ROADMAP.md, scripts/design-check.mjs, work/reports/2026-11-17-co3.md.
Check / target / result: node scripts/design-check.mjs exit 0 (C1 1/1, C2 3/3, C3 2/2, code); 렌더 측정 form 360·768·1280 x 기본·focus 4상태 (C1 48/48, C2 12/12, C3 16/16 @360·768). 줄별 결과는 보고서 참고.
Evidence: work/reports/2026-11-17-co3.md; Spot check는 DESIGN.md#rule-coverage 각 행.
Limits: Chromium 미리보기만, light만. 1280 input 40px는 C3 범위 밖. textarea 포함 여부 미확정 (DESIGN.md Open Decisions).
Report stamp: report-check: ok 1,746 chars 62457fc1 (`node <joedesign>/scripts/report-check.mjs --verify` exit 0, 2026-11-17).
Completion boundaries: implementation 해당 없음 / technical 완료 / visual 360·768 렌더 측정 / user acceptance 해당 없음.
Related issue / knowledge: none.
Record handoff gap: 변경 미커밋 (2026-11-17).
