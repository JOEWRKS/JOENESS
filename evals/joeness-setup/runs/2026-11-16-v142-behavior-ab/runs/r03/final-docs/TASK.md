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

## co3 / 2026-11-16 / 입력창 최소 높이 44px

Roadmap item: ROADMAP.md CO3 (CO1·CO2 Check 형식 갱신 포함).
Result: DESIGN Rev 2에 C3 추가(사용자 요청), Rule Coverage에 Result 열 추가, scripts/design-check.mjs에 C3(input.min_height@360·768) 추가. src/ 변경 없음.
Changed files: DESIGN.md, ROADMAP.md, TASK.md, scripts/design-check.mjs, work/reports/2026-11-16-co3.md.
Check / target / result: 결과 줄은 work/reports/2026-11-16-co3.md 참조 (C1·C2·C3 code + rendered, DESIGN.md#rule-coverage 행 기준).
Limits: hover·active·disabled·오류 상태, 그 밖의 크기 미측정; rendered check는 수동(스크립트 없음); #body는 토큰 없음.
Report stamp: report-check: ok 1,730 chars d5129319 (work/reports/2026-11-16-co3.md, --verify exit 0).
Completion boundaries: implementation 해당 없음(기존 값 충족) / technical 완료 / visual 360·768·1280 x 기본·focus 측정 / user acceptance 해당 없음.
Related issue / knowledge: none.