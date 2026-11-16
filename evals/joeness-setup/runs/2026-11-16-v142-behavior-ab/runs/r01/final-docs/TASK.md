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

## co3 / 2026-11-16 / 입력창 최소 높이 44px (360·768)

Roadmap item: ROADMAP.md CO3. Rule: DESIGN.md C3 (Rev 2, 사용자 요청 2026-11-16).
Result: 규칙·검사 추가; 코드 변경 없음 (현재 값이 규칙 충족). Changed: DESIGN.md, ROADMAP.md, scripts/design-check.mjs.
Check / target / result: 결과 줄은 work/reports/2026-11-16-co3.md. C3 토큰 2/2 ok (code); C3 렌더 `input` 높이 50px 4/4 ok (360·768 x 기본·focus, rendered, 로컬 정적 서버·자체 CSS); C1·C2 토큰 재실행 ok.
Spot check: C3 768 이름 input focus check 50 / observed 50 (캡처); C2 360 버튼 기본 check 44 / observed 44 (렌더 높이).
Limits: C3 토큰 검사는 CSS·렌더를 읽지 않음 (토큰 44 ≠ 렌더 50); 1280·textarea는 C3 범위 밖; C1·C2 렌더 측정 범위는 DESIGN 행 참조.
Report stamp: report-check: ok 1,506 chars bebbb2b5 (`node <joedesign>/scripts/report-check.mjs --verify work/reports/2026-11-16-co3.md` exit 0).
Completion boundaries: implementation 해당 없음 / technical 완료 / visual 360·768 기본·focus 렌더 측정 / user acceptance 해당 없음.
